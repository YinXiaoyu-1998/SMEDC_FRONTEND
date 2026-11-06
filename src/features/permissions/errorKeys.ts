import { WebApiError } from "@/api/client";
import { errorKeyFor, fallbackErrorKey } from "@/ui/errors";

const permissionErrorKeys: Readonly<Record<string, string>> = {
  AUTHORIZATION_VERSION_CONFLICT: "errors.action.versionConflict",
  ENTERPRISE_NAME_REQUIRED: "permissions.enterpriseNameRequired",
  ENTERPRISE_NAME_CONFLICT: "permissions.enterpriseNameConflict",
  INVALID_ENTERPRISE_NAME: "permissions.enterpriseNameInvalid",
  BROWSER_SIGN_IN_REQUIRED: "errors.action.sessionExpired",
  BROWSER_ACCESS_DENIED: "errors.forbidden.description",
  AUTHORIZATION_ADMIN_REQUIRED: "errors.forbidden.description",
  BROWSER_SECURITY_CHECK_FAILED: "errors.action.security",
  BROWSER_INVALID_CREDENTIALS: "errors.action.invalidCredentials",
  AUTHORIZATION_CUTOVER_NOT_READY: "permissions.error.notReady",
  AUTHORIZATION_SUSPENDED: "permissions.error.suspended",
  AUTHORIZATION_NOT_ENABLED: "permissions.error.notEnabled",
  INVALID_PERMISSION_CONFIGURATION: "permissions.error.invalid",
  WEB_API_INVALID_REQUEST: "errors.action.invalidRequest",
  RESOURCE_NOT_FOUND: "permissions.error.unavailable",
  AUTHORIZATION_ACCOUNT_NOT_FOUND: "permissions.error.unavailable",
  CATEGORY_NOT_FOUND: "permissions.error.unavailable",
  NETWORK_ERROR: "errors.action.network",
  INTERNAL_ERROR: "errors.action.internal",
  INVALID_RESPONSE: "errors.action.invalidResponse",
};

/**
 * 权限页专属错误码优先映射；未知 code 仍回退内核的稳定映射，
 * 保证服务端 message 不会直接进入界面。
 */
export function permissionsErrorKey(error: unknown): string {
  if (error instanceof WebApiError) {
    const mapped = permissionErrorKeys[error.code];
    if (mapped !== undefined) return mapped;
    if (error.code.startsWith("INVALID_")) return "permissions.error.invalid";
    return fallbackErrorKey;
  }
  return errorKeyFor(error);
}
