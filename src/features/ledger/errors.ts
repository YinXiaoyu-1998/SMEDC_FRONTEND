import { WebApiError } from "@/api/client";
import { errorKeyFor, errorKeyForCode } from "@/ui/errors";

import { ledgerMessages } from "@/features/ledger/messages";

/** 页面自有的前置条件错误（不是服务端返回），沿用错误码 → 文案的映射。 */
export class LedgerIssue extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "LedgerIssue";
    this.code = code;
  }
}

export function errorCodeOf(error: unknown): string | null {
  if (error instanceof WebApiError) return error.code;
  if (error instanceof LedgerIssue) return error.code;
  if (typeof error === "string" && error !== "") return error;
  if (error !== null && typeof error === "object" && "code" in error) {
    const code = (error as { readonly code: unknown }).code;
    if (typeof code === "string" && code !== "") return code;
  }
  return null;
}

const CONFLICT_CODES: readonly string[] = [
  "LEDGER_IDEMPOTENCY_CONFLICT",
  "AUTHORIZATION_VERSION_CONFLICT",
  "VERSION_CONFLICT",
  "WORKFLOW_VERSION_CONFLICT",
];

export function isConflictError(error: unknown): boolean {
  if (error instanceof WebApiError) {
    return error.status === 409 || CONFLICT_CODES.includes(error.code);
  }
  const code = errorCodeOf(error);
  return code !== null && CONFLICT_CODES.includes(code);
}

export function ledgerErrorKey(error: unknown): string {
  const code = errorCodeOf(error);
  if (code === null) return errorKeyFor(error);
  const key = `ledger.errors.${code}`;
  if (Object.prototype.hasOwnProperty.call(ledgerMessages, key)) return key;
  return errorKeyForCode(code);
}
