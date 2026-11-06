import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { requestWebApi, WebApiError } from "@/api/client";
import {
  sessionLoginResponseSchema,
  sessionLogoutResponseSchema,
  sessionReadResponseSchema,
  webApiRoutes,
  type SessionLoginResponse,
  type SessionLogoutResponse,
  type SessionReadResponse,
} from "@/api/generated/contract";

// 查询键只由模块定义，避免调用方各写一份导致失效不一致
export const sessionQueryKey = ["web-api", "session"] as const;

export type Session = SessionReadResponse;

export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
}

/** 读取当前会话；未登录是正常状态，不向页面抛错。 */
export async function read(): Promise<Session | null> {
  try {
    return await requestWebApi(
      { method: "GET", path: webApiRoutes["session.read"].path },
      sessionReadResponseSchema,
    );
  } catch (error) {
    if (error instanceof WebApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function login(
  email: string,
  password: string,
): Promise<SessionLoginResponse> {
  return requestWebApi(
    {
      method: "POST",
      path: webApiRoutes["session.login"].path,
      body: { email, password },
    },
    sessionLoginResponseSchema,
  );
}

/** CSRF 令牌来自登录/读取会话的响应，由调用方随请求传入，客户端不持久化。 */
export async function logout(
  csrfToken: string,
): Promise<SessionLogoutResponse> {
  return requestWebApi(
    {
      method: "DELETE",
      path: webApiRoutes["session.logout"].path,
      csrfToken,
    },
    sessionLogoutResponseSchema,
  );
}

export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: read,
    retry: false,
    staleTime: 30_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      login(credentials.email, credentials.password),
    onSuccess: (payload) => {
      // 先写入再失效：页面立刻拿到身份，同时让缓存与服务器重新对齐
      queryClient.setQueryData<Session | null>(sessionQueryKey, payload);
      void queryClient.invalidateQueries({ queryKey: sessionQueryKey });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (csrfToken: string) => logout(csrfToken),
    onSuccess: () => {
      queryClient.setQueryData<Session | null>(sessionQueryKey, null);
      void queryClient.invalidateQueries({ queryKey: sessionQueryKey });
    },
  });
}
