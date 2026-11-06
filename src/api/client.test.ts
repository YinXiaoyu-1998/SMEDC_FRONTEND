import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  buildPath,
  onForbidden,
  onUnauthorized,
  requestWebApi,
  resolveWebApiUrl,
  serializeQuery,
  WebApiError,
} from "@/api/client";

type FetchFunction = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const echoSchema = z.object({ ok: z.boolean() });

describe("requestWebApi", () => {
  const fetchMock = vi.fn<FetchFunction>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function lastRequest(): { url: string; init: RequestInit | undefined } {
    const call = fetchMock.mock.calls.at(-1);
    if (call === undefined) throw new Error("fetch 未被调用");
    return { url: String(call[0]), init: call[1] };
  }

  it("解析成功响应，并使用同源凭证与 no-store", async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ ok: true }));

    const result = await requestWebApi(
      { method: "GET", path: "/session" },
      echoSchema,
    );

    expect(result).toEqual({ ok: true });
    const { url, init } = lastRequest();
    expect(url).toBe("/api/web/v1/session");
    expect(init?.method).toBe("GET");
    expect(init?.credentials).toBe("same-origin");
    expect(init?.cache).toBe("no-store");
  });

  it("把后端错误信封转换为 WebApiError", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          error: {
            code: "BROWSER_INVALID_CREDENTIALS",
            message: "邮箱或密码错误",
          },
        },
        400,
      ),
    );

    const error = await requestWebApi({
      method: "POST",
      path: "/session",
    }).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(WebApiError);
    expect(error).toMatchObject({
      status: 400,
      code: "BROWSER_INVALID_CREDENTIALS",
      message: "邮箱或密码错误",
    });
  });

  it("网络失败使用稳定的 NETWORK_ERROR", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const error = await requestWebApi({
      method: "GET",
      path: "/session",
    }).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(WebApiError);
    expect(error).toMatchObject({ status: 0, code: "NETWORK_ERROR" });
  });

  it("非 JSON 错误响应使用稳定的 INTERNAL_ERROR", async () => {
    fetchMock.mockResolvedValue(new Response("bad gateway", { status: 502 }));

    const error = await requestWebApi({
      method: "GET",
      path: "/session",
    }).catch((reason: unknown) => reason);

    expect(error).toMatchObject({ status: 502, code: "INTERNAL_ERROR" });
  });

  it("非 JSON 成功响应同样使用 INTERNAL_ERROR", async () => {
    fetchMock.mockResolvedValue(
      new Response("<html>ok</html>", { status: 200 }),
    );

    await expect(
      requestWebApi({ method: "GET", path: "/session" }),
    ).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
    });
  });

  it("401 触发已注册回调，且不会自动跳转", async () => {
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);
    fetchMock.mockImplementation(async () =>
      jsonResponse(
        { error: { code: "BROWSER_SIGN_IN_REQUIRED", message: "请重新登录" } },
        401,
      ),
    );

    await expect(
      requestWebApi({ method: "GET", path: "/session" }),
    ).rejects.toMatchObject({
      status: 401,
    });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    await expect(
      requestWebApi({ method: "GET", path: "/session" }),
    ).rejects.toMatchObject({
      status: 401,
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("403 触发 forbidden 回调", async () => {
    const listener = vi.fn();
    const unsubscribe = onForbidden(listener);
    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: { code: "UPLOAD_ADMIN_REQUIRED", message: "需要管理员" } },
        403,
      ),
    );

    await expect(
      requestWebApi({ method: "POST", path: "/documents" }),
    ).rejects.toMatchObject({
      status: 403,
      code: "UPLOAD_ADMIN_REQUIRED",
    });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("响应不符合 schema 时抛出 INVALID_RESPONSE", async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ ok: "yes" }));

    await expect(
      requestWebApi({ method: "GET", path: "/session" }, echoSchema),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("POST 与 DELETE 自动带 x-csrf-token，GET 不带", async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ ok: true }));

    await requestWebApi({
      method: "POST",
      path: "/session",
      body: {},
      csrfToken: "token-1",
    });
    const postHeaders = new Headers(lastRequest().init?.headers);
    expect(postHeaders.get("x-csrf-token")).toBe("token-1");
    expect(postHeaders.get("content-type")).toBe("application/json");
    expect(lastRequest().init?.body).toBe("{}");

    await requestWebApi({
      method: "DELETE",
      path: "/session",
      csrfToken: "token-2",
    });
    expect(new Headers(lastRequest().init?.headers).get("x-csrf-token")).toBe(
      "token-2",
    );

    await requestWebApi({
      method: "GET",
      path: "/session",
      csrfToken: "token-3",
    });
    expect(
      new Headers(lastRequest().init?.headers).get("x-csrf-token"),
    ).toBeNull();
  });

  it("拼接 query 并替换路径参数", async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ ok: true }));

    await requestWebApi({
      method: "GET",
      path: "/orgs/:orgId/stores",
      params: { orgId: "org 1" },
      query: { page: 2, tag: ["a", "b"], empty: undefined },
    });

    expect(lastRequest().url).toBe(
      "/api/web/v1/orgs/org%201/stores?page=2&tag=a&tag=b",
    );
  });
});

describe("路径与 query 工具", () => {
  it("替换 :param 并做 URL 编码", () => {
    expect(
      buildPath("/orgs/:orgId/stores/:storeId", { orgId: "o 1", storeId: 42 }),
    ).toBe("/orgs/o%201/stores/42");
    expect(() => buildPath("/orgs/:orgId")).toThrow("orgId");
  });

  it("序列化 query 时跳过空值并展开数组", () => {
    expect(serializeQuery(undefined)).toBe("");
    expect(
      serializeQuery({
        q: "a b",
        page: 2,
        tag: ["x", "y"],
        skip: undefined,
        none: null,
      }),
    ).toBe("?q=a+b&page=2&tag=x&tag=y");
  });

  it("路径解析固定在契约 prefix 内", () => {
    expect(resolveWebApiUrl("session")).toBe("/api/web/v1/session");
    expect(resolveWebApiUrl("/session")).toBe("/api/web/v1/session");
    expect(resolveWebApiUrl("/api/web/v1/session")).toBe("/api/web/v1/session");
    expect(() =>
      resolveWebApiUrl("https://backend.example/api/web/v1/session"),
    ).toThrow();
    expect(() => resolveWebApiUrl("//backend.example/session")).toThrow();
  });
});
