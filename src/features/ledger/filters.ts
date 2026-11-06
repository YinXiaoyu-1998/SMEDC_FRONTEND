import type { LedgerCoverageBody } from "@/api/generated/contract";

import type { LedgerLimits } from "@/features/ledger/model";

export interface LedgerFilterDraft {
  readonly storeName: string;
  readonly startDate: string;
  readonly endDate: string;
}

export interface LedgerScope {
  readonly storeName: string;
  readonly startDate: string;
  readonly endDate: string;
}

export type LedgerScopeIssueCode =
  "LEDGER_SCOPE_INVALID" | "LEDGER_SCOPE_LIMIT_EXCEEDED";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
const STORE_NAME_MAX_LENGTH = 512;

/** 严格校验 YYYY-MM-DD：格式、年份范围、真实存在（拒绝 2 月 30 日）。 */
export function isValidDateText(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  if (value < "1000-01-01" || value > "9999-12-31") return false;
  const parsed = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed)) return false;
  return new Date(parsed).toISOString().slice(0, 10) === value;
}

/** 含首尾的日历天数。 */
export function daySpan(startDate: string, endDate: string): number {
  return (Date.parse(endDate) - Date.parse(startDate)) / DAY_MS + 1;
}

/** 北京时间的今天，避免跨时区时默认日期偏一天。 */
export function shanghaiToday(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: string): string =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function defaultFilter(now: Date = new Date()): LedgerFilterDraft {
  const today = shanghaiToday(now);
  const start = new Date(Date.parse(`${today}T00:00:00Z`) - 6 * DAY_MS)
    .toISOString()
    .slice(0, 10);
  return { storeName: "", startDate: start, endDate: today };
}

export type ScopeValidation =
  | { readonly ok: true; readonly scope: LedgerScope }
  | { readonly ok: false; readonly code: LedgerScopeIssueCode };

export function validateFilter(
  draft: LedgerFilterDraft,
  limits: LedgerLimits,
): ScopeValidation {
  const storeName = draft.storeName;
  if (!isValidDateText(draft.startDate) || !isValidDateText(draft.endDate)) {
    return { ok: false, code: "LEDGER_SCOPE_INVALID" };
  }
  if (draft.startDate > draft.endDate) {
    return { ok: false, code: "LEDGER_SCOPE_INVALID" };
  }
  // 保留门店名称里的空格，但全是空格等于没有填写有效名称
  if (storeName !== "" && storeName.trim() === "") {
    return { ok: false, code: "LEDGER_SCOPE_INVALID" };
  }
  if (storeName.length > STORE_NAME_MAX_LENGTH) {
    return { ok: false, code: "LEDGER_SCOPE_INVALID" };
  }
  if (daySpan(draft.startDate, draft.endDate) > limits.dates) {
    return { ok: false, code: "LEDGER_SCOPE_LIMIT_EXCEEDED" };
  }
  return {
    ok: true,
    scope: { storeName, startDate: draft.startDate, endDate: draft.endDate },
  };
}

export function scopeKey(scope: LedgerScope): string {
  return JSON.stringify([scope.storeName, scope.startDate, scope.endDate]);
}

export function scopeToBody(
  scope: LedgerScope,
): NonNullable<LedgerCoverageBody["scope"]> {
  return {
    startDate: scope.startDate,
    endDate: scope.endDate,
    ...(scope.storeName === "" ? {} : { storeNames: [scope.storeName] }),
  };
}

export function scopeToSearchParams(scope: LedgerScope): {
  readonly from: string;
  readonly to: string;
  readonly store?: string;
} {
  return {
    from: scope.startDate,
    to: scope.endDate,
    ...(scope.storeName === "" ? {} : { store: scope.storeName }),
  };
}

export interface ParsedScopeFilter {
  readonly draft: LedgerFilterDraft;
  readonly scope: LedgerScope | null;
}

/**
 * 深链与登录回跳都靠 URL 保存筛选条件；参数无效时退回默认日期且不自动查询，
 * 避免带着无法校验的范围发请求。
 */
export function parseScopeFilter(
  params: URLSearchParams,
  limits: LedgerLimits,
  fallback: LedgerFilterDraft = defaultFilter(),
): ParsedScopeFilter {
  const from = params.get("from");
  const to = params.get("to");
  const store = params.get("store");
  if (from === null || to === null) {
    return { draft: fallback, scope: null };
  }
  const candidate: LedgerFilterDraft = {
    storeName: store ?? "",
    startDate: from,
    endDate: to,
  };
  const validation = validateFilter(candidate, limits);
  if (!validation.ok) {
    return { draft: fallback, scope: null };
  }
  return { draft: candidate, scope: validation.scope };
}
