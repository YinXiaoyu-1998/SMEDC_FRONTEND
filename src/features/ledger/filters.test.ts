import { describe, expect, it } from "vitest";

import {
  daySpan,
  isValidDateText,
  parseScopeFilter,
  validateFilter,
  type LedgerFilterDraft,
} from "@/features/ledger/filters";
import type { LedgerLimits } from "@/features/ledger/model";

const limits: LedgerLimits = {
  files: 5000,
  bytes: 1073741824,
  stores: 50,
  dates: 366,
  pageSize: 200,
  deadlineMs: 600000,
  retentionMs: 86400000,
};

const draft = (patch: Partial<LedgerFilterDraft> = {}): LedgerFilterDraft => ({
  storeName: "",
  startDate: "2026-10-01",
  endDate: "2026-10-07",
  ...patch,
});

describe("台账筛选校验", () => {
  it("严格校验日期并拒绝不存在的日期与倒置区间", () => {
    expect(isValidDateText("2026-10-01")).toBe(true);
    expect(isValidDateText("2026-02-30")).toBe(false);
    expect(isValidDateText("2026-13-01")).toBe(false);
    expect(isValidDateText("2026-1-01")).toBe(false);
    expect(isValidDateText("0999-01-01")).toBe(false);

    expect(validateFilter(draft({ startDate: "" }), limits)).toEqual({
      ok: false,
      code: "LEDGER_SCOPE_INVALID",
    });
    expect(
      validateFilter(
        draft({ startDate: "2026-10-08", endDate: "2026-10-07" }),
        limits,
      ),
    ).toEqual({ ok: false, code: "LEDGER_SCOPE_INVALID" });
  });

  it("门店名保留原有空格，但全空格视为无效", () => {
    expect(validateFilter(draft({ storeName: " 门店 甲 " }), limits)).toEqual({
      ok: true,
      scope: {
        storeName: " 门店 甲 ",
        startDate: "2026-10-01",
        endDate: "2026-10-07",
      },
    });
    expect(validateFilter(draft({ storeName: "   " }), limits)).toEqual({
      ok: false,
      code: "LEDGER_SCOPE_INVALID",
    });
    expect(
      validateFilter(draft({ storeName: "x".repeat(513) }), limits),
    ).toEqual({
      ok: false,
      code: "LEDGER_SCOPE_INVALID",
    });
  });

  it("查询跨度不能超过服务端日期上限", () => {
    expect(daySpan("2026-10-01", "2026-10-07")).toBe(7);
    expect(daySpan("2025-01-01", "2026-01-01")).toBe(366);
    expect(
      validateFilter(
        draft({ startDate: "2025-01-01", endDate: "2026-01-02" }),
        limits,
      ),
    ).toEqual({ ok: false, code: "LEDGER_SCOPE_LIMIT_EXCEEDED" });
    expect(
      validateFilter(
        draft({ startDate: "2025-01-01", endDate: "2026-01-01" }),
        limits,
      ).ok,
    ).toBe(true);
  });

  it("深链参数可用时还原筛选，参数无效时退回默认且不查询", () => {
    const fallback: LedgerFilterDraft = {
      storeName: "",
      startDate: "2026-10-01",
      endDate: "2026-10-07",
    };
    const parsed = parseScopeFilter(
      new URLSearchParams({
        from: "2026-01-01",
        to: "2026-01-02",
        store: " 店 ",
      }),
      limits,
      fallback,
    );
    expect(parsed.scope).toEqual({
      storeName: " 店 ",
      startDate: "2026-01-01",
      endDate: "2026-01-02",
    });
    expect(parsed.draft).toEqual({
      storeName: " 店 ",
      startDate: "2026-01-01",
      endDate: "2026-01-02",
    });

    const invalid = parseScopeFilter(
      new URLSearchParams({ from: "2026-01-02", to: "2026-01-01" }),
      limits,
      fallback,
    );
    expect(invalid.scope).toBeNull();
    expect(invalid.draft).toEqual(fallback);

    const missing = parseScopeFilter(new URLSearchParams(), limits, fallback);
    expect(missing.scope).toBeNull();
  });
});
