import type { ZodType } from "zod";

import { webApiPrefix, type WebApiHttpMethod } from "@/api/generated/contract";

// 网络层失败没有 HTTP 状态码，用 0 表示；其余 code 优先取后端错误信封
const NETWORK_ERROR_CODE = "NETWORK_ERROR";
const INTERNAL_ERROR_CODE = "INTERNAL_ERROR";
const INVALID_RESPONSE_CODE = "INVALID_RESPONSE";

export type WebApiQueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly (string | number | boolean)[];

export type WebApiPathParams = Readonly<Record<string, string | number>>;

export interface WebApiQuery {
  readonly [key: string]: WebApiQueryValue;
}

export interface WebApiRequestInit {
  readonly method: WebApiHttpMethod;
  readonly path: string;
  readonly params?: WebApiPathParams;
  readonly query?: WebApiQuery;
  readonly body?: unknown;
  readonly csrfToken?: string;
  readonly signal?: AbortSignal;
}

export interface WebApiErrorInit {
  readonly status: number;
  readonly code: string;
  readonly message: string;
  readonly cause?: unknown;
}

/**
 * 统一的接口错误：上层只需要判断 status / code，不必关心 fetch 与响应解析细节。
 */
export class WebApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(init: WebApiErrorInit) {
    super(init.message);
    this.name = "WebApiError";
    this.status = init.status;
    this.code = init.code;
    if (init.cause !== undefined) {
      this.cause = init.cause;
    }
  }
}

type WebApiEventHandler = () => void;

let unauthorizedHandler: WebApiEventHandler | undefined;
let forbiddenHandler: WebApiEventHandler | undefined;

/**
 * 注册全局 401 回调（例如清空查询缓存）；客户端本身不跳转路由。
 * 返回解除注册的函数，重复注册以最后一次为准。
 */
export function onUnauthorized(handler: WebApiEventHandler): () => void {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = undefined;
  };
}

/**
 * 注册全局 403 回调；用于把"已登录但无权限"交给上层决定展示方式。
 */
export function onForbidden(handler: WebApiEventHandler): () => void {
  forbiddenHandler = handler;
  return () => {
    if (forbiddenHandler === handler) forbiddenHandler = undefined;
  };
}

/**
 * 把契约里的路径解析为同源 URL：基址固定为契约 prefix，绝不指向后端域名。
 */
export function resolveWebApiUrl(path: string): string {
  if (path === "") {
    throw new Error("Web API 路径不能为空");
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith("//")) {
    throw new Error(
      "Web API 路径必须是相对契约 prefix 的路径，不能包含协议或主机名",
    );
  }
  if (path === webApiPrefix || path.startsWith(`${webApiPrefix}/`)) {
    return path;
  }
  return `${webApiPrefix}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * 替换路径模板中的 :param 占位符；缺参数属于调用方错误，直接抛出。
 */
export function buildPath(
  template: string,
  params: WebApiPathParams = {},
): string {
  return template.replace(/:([A-Za-z0-9_]+)/g, (_match, name: string) => {
    const value = params[name];
    if (value === undefined) {
      throw new Error(`缺少路径参数「${name}」（路径模板：${template}）`);
    }
    return encodeURIComponent(String(value));
  });
}

/**
 * 序列化 query：跳过 null/undefined，数组展开为重复键，顺序与对象键顺序一致。
 */
export function serializeQuery(query: WebApiQuery | undefined): string {
  if (query === undefined) return "";

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) search.append(key, String(item));
      continue;
    }
    search.append(key, String(value));
  }

  const text = search.toString();
  return text === "" ? "" : `?${text}`;
}

/**
 * fetch 包装：同源凭证、JSON 编解码、CSRF 头、统一错误与 401/403 钩子。
 * schema 存在时校验响应结构，避免把契约漂移带进业务层。
 */
export async function requestWebApi<T>(
  request: WebApiRequestInit,
  schema?: ZodType<T>,
): Promise<T> {
  const url = `${resolveWebApiUrl(buildPath(request.path, request.params))}${serializeQuery(
    request.query,
  )}`;

  const headers = new Headers();
  headers.set("accept", "application/json");
  if (request.body !== undefined) {
    headers.set("content-type", "application/json");
  }
  if (request.csrfToken !== undefined && request.method !== "GET") {
    headers.set("x-csrf-token", request.csrfToken);
  }

  const init: RequestInit = {
    method: request.method,
    credentials: "same-origin",
    cache: "no-store",
    headers,
  };
  if (request.body !== undefined) init.body = JSON.stringify(request.body);
  if (request.signal !== undefined) init.signal = request.signal;

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new WebApiError({
      status: 0,
      code: NETWORK_ERROR_CODE,
      message: "无法连接服务器，请检查网络后重试",
      cause: error,
    });
  }

  const payload = await readJsonBody(response);

  if (!response.ok) {
    if (response.status === 401) notify(unauthorizedHandler);
    if (response.status === 403) notify(forbiddenHandler);

    const envelope = extractErrorEnvelope(payload);
    throw new WebApiError({
      status: response.status,
      code: envelope?.code ?? INTERNAL_ERROR_CODE,
      message: envelope?.message ?? `请求失败（HTTP ${response.status}）`,
    });
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }
  if (payload === UNREADABLE_RESPONSE) {
    throw new WebApiError({
      status: response.status,
      code: INTERNAL_ERROR_CODE,
      message: "服务器返回了无法解析的响应",
    });
  }
  if (schema === undefined) {
    return payload as T;
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new WebApiError({
      status: response.status,
      code: INVALID_RESPONSE_CODE,
      message: "服务器响应与接口契约不一致",
      cause: parsed.error,
    });
  }
  return parsed.data;
}

const UNREADABLE_RESPONSE = Symbol("unreadable-response");

async function readJsonBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text === "") return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return UNREADABLE_RESPONSE;
  }
}

interface ErrorEnvelope {
  readonly code: string;
  readonly message: string;
}

function extractErrorEnvelope(payload: unknown): ErrorEnvelope | null {
  if (!isRecord(payload)) return null;
  const error = payload.error;
  if (!isRecord(error)) return null;

  const { code, message } = error;
  if (typeof code !== "string" || code === "") return null;

  return {
    code,
    message:
      typeof message === "string" && message !== "" ? message : "请求失败",
  };
}

function notify(handler: WebApiEventHandler | undefined): void {
  if (handler === undefined) return;
  try {
    handler();
  } catch {
    // 上层回调的异常不应覆盖原始接口错误
  }
}

function isAbortError(error: unknown): boolean {
  return isRecord(error) && error.name === "AbortError";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
