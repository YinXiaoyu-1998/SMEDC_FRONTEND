import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  sessionQueryKey,
  useLogin,
  useLogout,
  useSession,
} from "@/api/session";

type FetchFunction = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

const identity = {
  userAccountId: "employee-1",
  displayName: "张三",
  email: "zhangsan@example.com",
  orgId: "org-1",
  organizationName: "示例企业",
  role: "admin",
  clearance: 2,
};

const sessionPayload = {
  identity,
  csrfToken: "csrf-token-1",
  canManageSettings: true,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("会话模块", () => {
  const fetchMock = vi.fn<FetchFunction>();
  let signedIn = false;

  beforeEach(() => {
    signedIn = false;
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url === "/api/web/v1/session" && method === "POST") {
        signedIn = true;
        return jsonResponse(sessionPayload);
      }
      if (url === "/api/web/v1/session" && method === "GET") {
        return signedIn
          ? jsonResponse(sessionPayload)
          : jsonResponse(
              {
                error: {
                  code: "BROWSER_SIGN_IN_REQUIRED",
                  message: "请先登录",
                },
              },
              401,
            );
      }
      if (url === "/api/web/v1/session" && method === "DELETE") {
        signedIn = false;
        return jsonResponse({ signedOut: true });
      }
      return jsonResponse(
        { error: { code: "INTERNAL_ERROR", message: "未预期的请求" } },
        500,
      );
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("登录后 useSession 拿到身份，登出后清除", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const { result } = renderHook(
      () => ({ session: useSession(), login: useLogin(), logout: useLogout() }),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.session.isSuccess).toBe(true));
    expect(result.current.session.data).toBeNull();

    await act(async () => {
      await result.current.login.mutateAsync({
        email: "zhangsan@example.com",
        password: "secret",
      });
    });

    await waitFor(() =>
      expect(result.current.session.data?.identity.email).toBe(
        "zhangsan@example.com",
      ),
    );
    expect(queryClient.getQueryData(sessionQueryKey)).toMatchObject({
      identity,
    });

    const csrfToken = result.current.session.data?.csrfToken ?? "";
    expect(csrfToken).toBe("csrf-token-1");

    await act(async () => {
      await result.current.logout.mutateAsync(csrfToken);
    });

    await waitFor(() => expect(result.current.session.data).toBeNull());
    expect(queryClient.getQueryData(sessionQueryKey)).toBeNull();
  });
});
