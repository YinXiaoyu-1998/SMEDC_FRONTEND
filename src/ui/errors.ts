import { WebApiError } from "@/api/client";

export const fallbackErrorKey = "errors.action.generic";

/**
 * 稳定的 code → 文案键映射：服务端原始 message 不直接展示，
 * 未知 code 一律回退通用文案，避免把内部错误暴露给用户或造成文案漂移。
 */
export const webApiErrorKeys: Readonly<Record<string, string>> = {
  NETWORK_ERROR: "errors.action.network",
  INTERNAL_ERROR: "errors.action.internal",
  INVALID_RESPONSE: "errors.action.invalidResponse",
  WEB_API_INVALID_REQUEST: "errors.action.invalidRequest",
  BROWSER_INVALID_CREDENTIALS: "errors.action.invalidCredentials",
  BROWSER_SECURITY_CHECK_FAILED: "errors.action.security",
  BROWSER_SIGN_IN_REQUIRED: "errors.action.sessionExpired",
  VERSION_CONFLICT: "errors.action.versionConflict",
  WORKFLOW_VERSION_CONFLICT: "errors.action.versionConflict",
};

export function errorKeyForCode(code: string | null | undefined): string {
  if (code === null || code === undefined || code === "") {
    return fallbackErrorKey;
  }
  return webApiErrorKeys[code] ?? fallbackErrorKey;
}

export function errorKeyFor(error: unknown): string {
  if (error instanceof WebApiError) {
    return errorKeyForCode(error.code);
  }
  if (typeof error === "string") {
    return errorKeyForCode(error);
  }
  return fallbackErrorKey;
}
