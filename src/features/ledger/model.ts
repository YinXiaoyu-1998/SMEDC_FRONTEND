import type {
  LedgerContextResponse,
  LedgerCoverageResponse,
} from "@/api/generated/contract";

export type LedgerPartition = LedgerCoverageResponse["partitions"][number];
export type LedgerStatus = LedgerPartition["status"];
export type LedgerLimits = LedgerContextResponse["limits"];

/** 浏览器本地的选择项：服务端只返回四种状态，reconcile 后可能出现 unverified。 */
export type SelectedPartition = Omit<LedgerPartition, "status"> & {
  readonly status: LedgerStatus | "unverified";
  readonly byteSize: number | null;
};

export type LedgerSelection = ReadonlyMap<string, SelectedPartition>;

export interface PartitionRef {
  readonly storeName: string;
  readonly purchaseDate: string;
}

export interface SelectionSummary {
  readonly files: number;
  readonly bytes: number;
  readonly unknown: number;
  readonly invalid: number;
  readonly stores: number;
  readonly dates: number;
  readonly overBytes: number;
  readonly remaining: number;
  readonly allowed: boolean;
}

export interface LimitIssue {
  readonly key: string;
  readonly values: Readonly<Record<string, string | number>>;
}

export function ledgerKey(ref: PartitionRef): string {
  return JSON.stringify([ref.storeName, ref.purchaseDate]);
}

export function toPartitionRef(item: PartitionRef): PartitionRef {
  return { storeName: item.storeName, purchaseDate: item.purchaseDate };
}

export function isReady(item: { status: string }): boolean {
  return item.status === "ready";
}

export function hasKnownSize(item: { byteSize: number | null }): boolean {
  return (
    item.byteSize !== null &&
    Number.isSafeInteger(item.byteSize) &&
    item.byteSize > 0
  );
}

/** 选中项按稳定键排序：提交顺序不依赖勾选先后与批次。 */
export function selectionOrder(
  selection: Iterable<SelectedPartition>,
): readonly SelectedPartition[] {
  return [...selection].sort((left, right) => {
    const a = ledgerKey(left);
    const b = ledgerKey(right);
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

/** 展示顺序：已知大小从大到小，同大小按稳定键排序。 */
export function displayOrder(
  selection: Iterable<SelectedPartition>,
): readonly SelectedPartition[] {
  return [...selection].sort((left, right) => {
    const leftSize = hasKnownSize(left) ? left.byteSize : -1;
    const rightSize = hasKnownSize(right) ? right.byteSize : -1;
    if (leftSize !== rightSize) {
      return (rightSize ?? -1) - (leftSize ?? -1);
    }
    return ledgerKey(left) < ledgerKey(right) ? -1 : 1;
  });
}

export function selectPartition(
  selection: LedgerSelection,
  item: LedgerPartition,
  checked: boolean,
): LedgerSelection {
  const key = ledgerKey(item);
  if (!checked) {
    if (!selection.has(key)) return selection;
    const next = new Map(selection);
    next.delete(key);
    return next;
  }
  if (!isReady(item)) return selection;
  const next = new Map(selection);
  next.set(key, item);
  return next;
}

export function selectPartitions(
  selection: LedgerSelection,
  items: readonly LedgerPartition[],
  checked: boolean,
): LedgerSelection {
  let next = selection;
  for (const item of items) next = selectPartition(next, item, checked);
  return next;
}

export function removeSelected(
  selection: LedgerSelection,
  key: string,
): LedgerSelection {
  if (!selection.has(key)) return selection;
  const next = new Map(selection);
  next.delete(key);
  return next;
}

/** 只刷新服务端仍有返回的已选项；未出现在本批结果里的项沿用旧值。 */
export function mergeCoverage(
  selection: LedgerSelection,
  partitions: readonly LedgerPartition[],
): LedgerSelection {
  if (selection.size === 0) return selection;
  let changed = false;
  const next = new Map(selection);
  for (const partition of partitions) {
    const key = ledgerKey(partition);
    const previous = next.get(key);
    if (previous === undefined) continue;
    if (
      previous.status === partition.status &&
      previous.byteSize === partition.byteSize
    ) {
      continue;
    }
    next.set(key, partition);
    changed = true;
  }
  return changed ? next : selection;
}

/**
 * 核验后收敛选择：服务端未返回的文件标记为不可核验并清空大小，
 * 绝不把无法确认的文件当成可下载（失败关闭）。
 */
export function reconcileSelection(
  selection: LedgerSelection,
  partitions: readonly LedgerPartition[],
): LedgerSelection {
  const verified = new Map(partitions.map((item) => [ledgerKey(item), item]));
  const next = new Map<string, SelectedPartition>();
  for (const [key, previous] of selection) {
    next.set(
      key,
      verified.get(key) ?? {
        ...previous,
        status: "unverified",
        byteSize: null,
      },
    );
  }
  return next;
}

export function summarize(
  selection: Iterable<SelectedPartition>,
  limits: LedgerLimits,
): SelectionSummary {
  let files = 0;
  let bytes = 0;
  let unknown = 0;
  let invalid = 0;
  const stores = new Set<string>();
  const dates = new Set<string>();
  for (const item of selection) {
    files += 1;
    stores.add(item.storeName);
    dates.add(item.purchaseDate);
    if (hasKnownSize(item)) bytes += item.byteSize ?? 0;
    else unknown += 1;
    if (!isReady(item)) invalid += 1;
  }
  const validBytes = Number.isSafeInteger(bytes) && bytes >= 0 ? bytes : 0;
  const overBytes = Math.max(0, validBytes - limits.bytes);
  const remaining = Math.max(0, limits.bytes - validBytes);
  const allowed =
    files > 0 &&
    files <= limits.files &&
    stores.size <= limits.stores &&
    dates.size <= limits.dates &&
    Number.isSafeInteger(bytes) &&
    validBytes <= limits.bytes &&
    unknown === 0 &&
    invalid === 0;
  return {
    files,
    bytes: validBytes,
    unknown,
    invalid,
    stores: stores.size,
    dates: dates.size,
    overBytes,
    remaining,
    allowed,
  };
}

/** 具体的超限说明；按数量、容量、门店、日期的固定顺序给出。 */
export function limitIssues(
  summary: SelectionSummary,
  limits: LedgerLimits,
): readonly LimitIssue[] {
  const issues: LimitIssue[] = [];
  if (summary.files > limits.files) {
    issues.push({
      key: "ledger.selection.overFiles",
      values: {
        files: summary.files,
        limit: limits.files,
        excess: summary.files - limits.files,
      },
    });
  }
  if (summary.overBytes > 0) {
    issues.push({
      key: "ledger.selection.overBytes",
      values: {
        bytes: formatBytes(summary.bytes),
        limit: formatBytes(limits.bytes),
        excess: formatBytes(summary.overBytes),
      },
    });
  }
  if (summary.stores > limits.stores) {
    issues.push({
      key: "ledger.selection.overStores",
      values: { stores: summary.stores, limit: limits.stores },
    });
  }
  if (summary.dates > limits.dates) {
    issues.push({
      key: "ledger.selection.overDates",
      values: { dates: summary.dates, limit: limits.dates },
    });
  }
  return issues;
}

const SIZE_UNITS: readonly { readonly unit: string; readonly size: number }[] =
  [
    { unit: "GiB", size: 1024 * 1024 * 1024 },
    { unit: "MiB", size: 1024 * 1024 },
    { unit: "KiB", size: 1024 },
    { unit: "B", size: 1 },
  ];

export function formatBytes(bytes: number): string {
  if (!Number.isSafeInteger(bytes) || bytes < 0) return "—";
  if (bytes === 0) return "0 B";
  const match =
    SIZE_UNITS.find((entry) => bytes >= entry.size) ?? SIZE_UNITS[3];
  if (match === undefined) return "—";
  const value = bytes / match.size;
  return `${match.size === 1 ? String(bytes) : value.toFixed(2)} ${match.unit}`;
}

export function isPendingTaskStatus(status: string): boolean {
  return status === "queued" || status === "running";
}
