import type { PermissionSelection } from "@/api/permissions";

/**
 * 权限页的差异模型：确认弹窗、冲突面板与列表状态都基于同一份语义差异，
 * 保证「按钮是否可用」「弹窗显示什么」「实际提交什么」说的是同一件事。
 *
 * 集合类字段（类别、门店、取值）按值比较，排序变化不算修改；
 * 动态「全部」与「选中当前所有值」是两种不同设置，必须区分。
 */
export type DiffEntry =
  | { readonly kind: "added"; readonly label: string; readonly after: string }
  | {
      readonly kind: "removed";
      readonly label: string;
      readonly before: string;
    }
  | {
      readonly kind: "changed";
      readonly label: string;
      readonly before: string;
      readonly after: string;
    };

export interface Confirmation {
  /** 确认弹窗的副标题：本次提交的对象 */
  readonly subject: string;
  readonly diff: readonly DiffEntry[];
  /** 可以从当前操作确定的影响，不推断服务端实际可读范围 */
  readonly impact?: string;
  /** 完整前后配置，默认折叠 */
  readonly fullBefore?: string;
  readonly fullAfter?: string;
}

export const EMPTY_CONFIRMATION: Confirmation = { subject: "", diff: [] };

/** 版本冲突时，同一对象在两边都有改动，必须由用户逐项选择保留哪一侧。 */
export interface RebaseChoice {
  readonly key: string;
  readonly label: string;
  readonly serverValue: string;
  readonly draftValue: string;
}

export type RebaseDecision = "draft" | "server";

export type RebaseOutcome<Draft> =
  | {
      readonly kind: "merged";
      readonly draft: Draft;
      /** 合并时被保留或忽略的条目，会显示在重新确认的摘要里 */
      readonly notes: readonly string[];
    }
  | { readonly kind: "choice"; readonly choices: readonly RebaseChoice[] };

export interface RebaseInput<Draft> {
  /** 当前草稿（相对打开时快照的改动） */
  readonly draft: Draft;
  /** 打开编辑时冻结的服务端快照 */
  readonly baseline: Draft;
  /** 冲突后重新读取到的服务端最新快照 */
  readonly server: Draft;
  /** 用户对「两边都改」条目的显式选择 */
  readonly decisions: Readonly<Record<string, RebaseDecision>>;
}

export function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

export function sameSet(
  left: readonly string[],
  right: readonly string[],
): boolean {
  const a = sortedUnique(left);
  const b = sortedUnique(right);
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function sameSelection(
  left: PermissionSelection | undefined,
  right: PermissionSelection | undefined,
): boolean {
  if (left === undefined || right === undefined) return left === right;
  if (left.kind !== right.kind) return false;
  if (left.kind === "all" || right.kind === "all") return true;
  return sameSet(left.values, right.values);
}

/** 单值字段：只有文本不同才产生一条变更。 */
export function diffField(
  label: string,
  before: string,
  after: string,
): DiffEntry[] {
  if (before === after) return [];
  return [{ kind: "changed", label, before, after }];
}

/** 集合字段：排序与重复不产生变更，显示时用调用方给的可读文本。 */
export function diffSetField(
  label: string,
  before: readonly string[],
  after: readonly string[],
  format: (values: readonly string[]) => string,
): DiffEntry[] {
  if (sameSet(before, after)) return [];
  return [
    { kind: "changed", label, before: format(before), after: format(after) },
  ];
}

/**
 * 按稳定身份比较两组对象：新增、删除与逐字段变更。
 * 顺序变化不算修改；已有对象的字段差异交给调用方的 `fields` 生成。
 */
export function diffKeyedRows<Row extends { readonly id: string }>(
  rowsBefore: readonly Row[],
  rowsAfter: readonly Row[],
  titleOf: (row: Row) => string,
  shortTitleOf: (row: Row) => string,
  fields: (before: Row, after: Row) => readonly DiffEntry[],
  typeName: string,
): DiffEntry[] {
  const entries: DiffEntry[] = [];
  for (const before of rowsBefore) {
    const after = rowsAfter.find((row) => row.id === before.id);
    if (after === undefined) {
      entries.push({
        kind: "removed",
        label: typeName,
        before: titleOf(before),
      });
      continue;
    }
    for (const entry of fields(before, after)) {
      entries.push({
        ...entry,
        label: `${typeName}「${shortTitleOf(before)}」· ${entry.label}`,
      });
    }
  }
  for (const after of rowsAfter) {
    if (rowsBefore.some((row) => row.id === after.id)) continue;
    entries.push({ kind: "added", label: typeName, after: titleOf(after) });
  }
  return entries;
}

export function countDiff(confirmation: Confirmation): number {
  return confirmation.diff.length;
}
