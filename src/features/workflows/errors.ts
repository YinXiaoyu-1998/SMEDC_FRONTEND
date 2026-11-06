import { WebApiError } from "@/api/client";
import { errorKeyFor } from "@/ui/errors";

/** 旧网页 workflow-client.ts 的错误码映射，逐条保留。 */
const workflowErrorKeys: Readonly<Record<string, string>> = {
  WORKFLOW_VERSION_CONFLICT: "conflict",
  BROWSER_SIGN_IN_REQUIRED: "expired",
  BROWSER_ACCESS_DENIED: "expired",
  WORKFLOW_ADMIN_REQUIRED: "expired",
  AUTHORIZATION_ADMIN_REQUIRED: "expired",
  WORKFLOW_PERMISSION_DENIED: "permission_denied",
  BROWSER_SECURITY_CHECK_FAILED: "security",
  WORKFLOW_SOURCE_MAPPING_CONFLICT: "sourceConflict",
  WORKFLOW_CONFIGURATION_REQUIRED: "configurationRequired",
  WORKFLOW_VERSION_INCOMPATIBLE: "versionIncompatible",
  WORKFLOW_BUSY: "busy",
  WORKFLOW_SOURCE_UNAVAILABLE: "unavailable",
  INVALID_WORKFLOW_INPUT: "invalid",
};

export interface LocalizedErrorKey {
  /** workflow = 本功能字典；base = src/i18n 的通用错误文案 */
  readonly source: "workflow" | "base";
  readonly key: string;
}

export function workflowErrorKeyFor(error: unknown): LocalizedErrorKey {
  if (error instanceof WebApiError) {
    const mapped = workflowErrorKeys[error.code];
    if (mapped !== undefined) return { source: "workflow", key: mapped };
  }
  return { source: "base", key: errorKeyFor(error) };
}
