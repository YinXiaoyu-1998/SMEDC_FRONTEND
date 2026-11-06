// 由 npm run contract:sync 生成，禁止手改
// 契约来源：YinXiaoyu-1998/SME_DATA_CENTER packages/web-api-contract/contract.json
// 同步 ref 与内容 hash 见 contract/ref.json；重新生成：npm run contract:sync -- --ref <sha>

import { z } from "zod";

export type WebApiHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface WebApiRouteMeta {
  readonly method: WebApiHttpMethod;
  readonly path: string;
  readonly auth: string;
  readonly errors: readonly string[];
  readonly summary: string;
}

export const webApiPrefix = "/api/web/v1";

export const contractVersion = 1;

export const sessionLoginBodySchema = z.strictObject({
  email: z.string().min(1).max(320),
  password: z.string().min(1),
});

export type SessionLoginBody = z.infer<typeof sessionLoginBodySchema>;

export const sessionLoginParamsSchema = z.strictObject({});

export type SessionLoginParams = z.infer<typeof sessionLoginParamsSchema>;

export const sessionLoginQuerySchema = z.strictObject({});

export type SessionLoginQuery = z.infer<typeof sessionLoginQuerySchema>;

export const sessionLoginResponseSchema = z.strictObject({
  identity: z.strictObject({
    employeeId: z.string().min(1),
    displayName: z.string().min(1),
    email: z.string().min(1),
    orgId: z.string().min(1),
    organizationName: z.string().min(1),
    role: z.enum(["admin", "employee"]),
    clearance: z.number().int().min(0).max(3),
  }),
  csrfToken: z.string().min(1),
  canManageSettings: z.boolean(),
});

export type SessionLoginResponse = z.infer<typeof sessionLoginResponseSchema>;

export const sessionLogoutBodySchema = z.strictObject({});

export type SessionLogoutBody = z.infer<typeof sessionLogoutBodySchema>;

export const sessionLogoutParamsSchema = z.strictObject({});

export type SessionLogoutParams = z.infer<typeof sessionLogoutParamsSchema>;

export const sessionLogoutQuerySchema = z.strictObject({});

export type SessionLogoutQuery = z.infer<typeof sessionLogoutQuerySchema>;

export const sessionLogoutResponseSchema = z.strictObject({
  signedOut: z.literal(true),
});

export type SessionLogoutResponse = z.infer<typeof sessionLogoutResponseSchema>;

export const sessionReadBodySchema = z.strictObject({});

export type SessionReadBody = z.infer<typeof sessionReadBodySchema>;

export const sessionReadParamsSchema = z.strictObject({});

export type SessionReadParams = z.infer<typeof sessionReadParamsSchema>;

export const sessionReadQuerySchema = z.strictObject({});

export type SessionReadQuery = z.infer<typeof sessionReadQuerySchema>;

export const sessionReadResponseSchema = z.strictObject({
  identity: z.strictObject({
    employeeId: z.string().min(1),
    displayName: z.string().min(1),
    email: z.string().min(1),
    orgId: z.string().min(1),
    organizationName: z.string().min(1),
    role: z.enum(["admin", "employee"]),
    clearance: z.number().int().min(0).max(3),
  }),
  csrfToken: z.string().min(1),
  canManageSettings: z.boolean(),
});

export type SessionReadResponse = z.infer<typeof sessionReadResponseSchema>;

// route id → 调用方需要的静态元数据；运行时校验以各自的 zod schema 为准

export const webApiRoutes = {
  "session.login": {
    method: "POST",
    path: "/api/web/v1/session",
    auth: "anonymous-write",
    errors: [
      "BROWSER_INVALID_CREDENTIALS",
      "BROWSER_SECURITY_CHECK_FAILED",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "用邮箱与密码登录网页，签发会话 Cookie 并返回身份与 CSRF 令牌",
  },
  "session.logout": {
    method: "DELETE",
    path: "/api/web/v1/session",
    auth: "session-write",
    errors: [
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
    ],
    summary: "注销当前网页会话并清除会话 Cookie",
  },
  "session.read": {
    method: "GET",
    path: "/api/web/v1/session",
    auth: "session",
    errors: ["BROWSER_SIGN_IN_REQUIRED", "INTERNAL_ERROR"],
    summary: "读取当前网页会话的身份、CSRF 令牌与管理设置权限",
  },
} as const satisfies Record<string, WebApiRouteMeta>;

export type WebApiRouteId = keyof typeof webApiRoutes;
