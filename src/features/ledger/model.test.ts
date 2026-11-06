import { describe, expect, it } from "vitest";

import {
  displayOrder,
  formatBytes,
  ledgerKey,
  limitIssues,
  reconcileSelection,
  selectPartition,
  selectPartitions,
  selectionOrder,
  summarize,
  type LedgerLimits,
  type LedgerPartition,
  type LedgerSelection,
} from "@/features/ledger/model";

const limits: LedgerLimits = {
  files: 5000,
  bytes: 1073741824,
  stores: 50,
  dates: 366,
  pageSize: 200,
  deadlineMs: 600000,
  retentionMs: 86400000,
};

const item = (
  storeName: string,
  byteSize: number | null,
  purchaseDate = "2026-10-01",
  status: LedgerPartition["status"] = "ready",
): LedgerPartition => ({ storeName, purchaseDate, status, byteSize });

describe("台账选择模型", () => {
  it("只接受可下载分区，按稳定键排序，跨批次保留", () => {
    let selection: LedgerSelection = new Map();
    selection = selectPartitions(
      selection,
      [item("B", 10), item("A", 20)],
      true,
    );
    selection = selectPartition(
      selection,
      item("C", 30, "2026-10-01", "pending"),
      true,
    );
    expect(selection.size).toBe(2);
    expect(
      selectionOrder(selection.values()).map((entry) => entry.storeName),
    ).toEqual(["A", "B"]);

    const cleared = selectPartitions(selection, [item("A", 20)], false);
    expect(cleared.size).toBe(1);
    expect(cleared.has(ledgerKey(item("B", 10)))).toBe(true);
  });

  it("统计字节、门店、日期，并在数量/容量超限时失败关闭", () => {
    const selection = selectPartitions(
      new Map(),
      [
        item(" 店 ", 1073741800),
        item("店", 24),
        item("pending", null, "2026-10-01", "pending"),
      ],
      true,
    );

    const summary = summarize(selection.values(), limits);
    expect(selection.size).toBe(2);
    expect(summary).toMatchObject({
      files: 2,
      bytes: 1073741824,
      stores: 2,
      dates: 1,
      overBytes: 0,
      remaining: 0,
      unknown: 0,
      invalid: 0,
      allowed: true,
    });

    const unavailable = summarize(
      [item("pending", null, "2026-10-01", "pending")],
      limits,
    );
    expect(unavailable).toMatchObject({
      files: 1,
      unknown: 1,
      invalid: 1,
      allowed: false,
    });

    const single = summarize([item("x", 1)], { ...limits, files: 0 });
    expect(single.allowed).toBe(false);
    expect(limitIssues(single, { ...limits, files: 0 })[0]?.key).toBe(
      "ledger.selection.overFiles",
    );

    const overBytes = summarize([item("x", 2048)], { ...limits, bytes: 1024 });
    expect(overBytes.overBytes).toBe(1024);
    expect(
      limitIssues(overBytes, { ...limits, bytes: 1024 })[0]?.values,
    ).toMatchObject({
      bytes: "2.00 KiB",
      limit: "1.00 KiB",
      excess: "1.00 KiB",
    });
  });

  it("核验时未返回的分区标记为不可核验且清空大小", () => {
    const selection = selectPartitions(
      new Map(),
      [item("one", 12), item("two", 30)],
      true,
    );
    const reconciled = reconcileSelection(selection, [
      { ...item("one", null), status: "stale" },
    ]);

    expect(reconciled.size).toBe(2);
    expect(reconciled.get(ledgerKey(item("one", 12)))).toMatchObject({
      status: "stale",
      byteSize: null,
    });
    expect(reconciled.get(ledgerKey(item("two", 30)))).toMatchObject({
      status: "unverified",
      byteSize: null,
    });
    expect(summarize(reconciled.values(), limits)).toMatchObject({
      allowed: false,
      unknown: 2,
      invalid: 2,
    });
  });

  it("展示顺序按已知大小从大到小且大小无关的项稳定", () => {
    const selection = selectPartitions(
      new Map(),
      [item("A", 10), item("B", 30), item("C", null)],
      true,
    );
    const ordered = displayOrder(selection.values()).map(
      (entry) => entry.storeName,
    );
    expect(ordered).toEqual(["B", "A", "C"]);
  });

  it("字节格式化与未知值处理", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1024)).toBe("1.00 KiB");
    expect(formatBytes(1073741824)).toBe("1.00 GiB");
    expect(formatBytes(Number.NaN)).toBe("—");
    expect(formatBytes(-1)).toBe("—");
  });
});
