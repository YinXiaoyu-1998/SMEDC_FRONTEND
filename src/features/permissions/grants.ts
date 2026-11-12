import type {
  PermissionCategory,
  PermissionEnterprise,
  PermissionGrant,
  PermissionSelection,
  PermissionStore,
  PermissionsAccountsUpdateBody,
} from "@/api/permissions";

import {
  diffField,
  diffKeyedRows,
  diffSetField,
  sameSelection,
  sameSet,
  sortedUnique,
  type DiffEntry,
  type RebaseChoice,
  type RebaseDecision,
  type RebaseInput,
  type RebaseOutcome,
} from "./diff";
import {
  dimensionName,
  dimensionSelectionLabel,
  enterpriseName,
  grantCategoryLabels,
  grantDescription,
  grantLocationLabel,
  grantTitle,
  levelLabel,
  type LabelData,
  type Translate,
} from "./labels";

export type GrantInput = PermissionsAccountsUpdateBody["grants"][number];

export type GrantOwnership = "group" | "store";

export interface GrantDraft {
  readonly id: string;
  readonly orgId: string;
  readonly enterpriseKey: string;
  readonly categoryIds: readonly string[];
  readonly ownership: GrantOwnership | "";
  readonly stores?: PermissionSelection;
  readonly dimensions: Readonly<Record<string, PermissionSelection>>;
}

export interface AccountDraft {
  readonly clearance: number | null;
  readonly grants: readonly GrantDraft[];
}

export interface GrantData extends LabelData {
  readonly categories: readonly PermissionCategory[];
  readonly stores: readonly PermissionStore[];
  readonly enterprises: readonly PermissionEnterprise[];
}

interface GrantLike {
  readonly id: string;
  readonly orgId: string;
  readonly enterpriseKey: string;
  readonly categoryIds: readonly string[];
  readonly ownership: GrantOwnership;
  readonly stores?: PermissionSelection;
  readonly dimensions: Readonly<Record<string, PermissionSelection>>;
}

function copySelection(selection: PermissionSelection): PermissionSelection {
  return selection.kind === "all"
    ? { kind: "all" }
    : { kind: "fixed", values: [...selection.values] };
}

/** 服务端记录 → 表单草稿；未知的多余字段不会进入草稿，也就不会被误提交。 */
export function grantToDraft(grant: GrantLike | PermissionGrant): GrantDraft {
  const dimensions: Readonly<Record<string, PermissionSelection>> =
    grant.dimensions;
  return {
    id: grant.id,
    orgId: grant.orgId,
    enterpriseKey: grant.enterpriseKey,
    categoryIds: [...grant.categoryIds],
    ownership: grant.ownership,
    ...(grant.stores === undefined
      ? {}
      : { stores: copySelection(grant.stores) }),
    dimensions: Object.fromEntries(
      Object.entries(dimensions).map(([id, selection]) => [
        id,
        copySelection(selection),
      ]),
    ),
  };
}

export function accountToDraft(account: {
  readonly clearance: number;
  readonly grants: readonly (PermissionGrant | GrantLike)[];
}): AccountDraft {
  return {
    clearance: account.clearance,
    grants: account.grants.map((grant) => grantToDraft(grant)),
  };
}

export function validSelection(
  selection: PermissionSelection | undefined,
): boolean {
  if (selection === undefined) return false;
  return (
    selection.kind === "all" ||
    (selection.kind === "fixed" && selection.values.length > 0)
  );
}

function toSelection(
  selection: PermissionSelection,
): GrantInput["dimensions"][string] {
  return selection.kind === "all"
    ? { kind: "all" }
    : { kind: "fixed", values: [...selection.values] };
}

function toDimensions(
  dimensions: Readonly<Record<string, PermissionSelection>>,
): GrantInput["dimensions"] {
  return Object.fromEntries(
    Object.entries(dimensions).map(([id, selection]) => [
      id,
      toSelection(selection),
    ]),
  );
}

/** 只在 validateGrant 通过后调用；ownership 未选时返回 null，由调用方过滤。 */
export function draftToGrant(grant: GrantDraft): GrantInput | null {
  const base = {
    id: grant.id,
    orgId: grant.orgId,
    enterpriseKey: grant.enterpriseKey,
    categoryIds: [...grant.categoryIds],
    dimensions: toDimensions(grant.dimensions),
  };
  if (grant.ownership === "store") {
    return {
      ...base,
      ownership: "store",
      stores:
        grant.stores === undefined
          ? { kind: "fixed", values: [] }
          : toSelection(grant.stores),
    };
  }
  if (grant.ownership === "group") {
    return { ...base, ownership: "group" };
  }
  return null;
}

/** 逐条复刻旧管理页的授权校验顺序与错误文案键。 */
export function validateGrant(
  grant: GrantDraft,
  data: GrantData,
): string | null {
  if (
    grant.enterpriseKey === "" ||
    (grant.ownership !== "group" && grant.ownership !== "store") ||
    grant.categoryIds.length === 0
  ) {
    return "permissions.invalidGrant";
  }
  if (grant.ownership === "store" && !validSelection(grant.stores)) {
    return "permissions.invalidGrant";
  }
  if (
    grant.ownership === "store" &&
    grant.stores !== undefined &&
    grant.stores.kind === "fixed" &&
    grant.stores.values.some(
      (name) =>
        !data.stores.some(
          (store) =>
            store.enterpriseKey === grant.enterpriseKey && store.name === name,
        ),
    )
  ) {
    return "permissions.invalidGrant";
  }

  const requiredSets: string[] = [];
  for (const id of grant.categoryIds) {
    const category = data.categories.find((item) => item.id === id);
    if (category === undefined) return "permissions.invalidGrant";
    const allowed =
      grant.ownership === "store" ? category.allowStore : category.allowGroup;
    if (!allowed) return "permissions.invalidGrant";
    if (
      category.key === "store_reviews" &&
      !data.enterprises.some(
        (item) => item.enterpriseKey === grant.enterpriseKey,
      )
    ) {
      return "permissions.enterpriseNameRequired";
    }
    const required = category.dimensions.map((item) => item.dimensionId).sort();
    requiredSets.push(required.join("|"));
    const selected = Object.keys(grant.dimensions);
    if (
      selected.length !== required.length ||
      required.some(
        (dimensionId) => !validSelection(grant.dimensions[dimensionId]),
      )
    ) {
      return "permissions.invalidGrant";
    }
  }
  if (new Set(requiredSets).size > 1) {
    return "permissions.differentConditions";
  }
  return null;
}

export function validateAccountDraft(
  draft: AccountDraft,
  data: GrantData,
): string | null {
  if (draft.clearance === null) return "permissions.required";
  for (const grant of draft.grants) {
    const result = validateGrant(grant, data);
    if (result !== null) return result;
  }
  return null;
}

export function accountUpdateBody(
  draft: AccountDraft,
  expectedVersion: string,
): PermissionsAccountsUpdateBody {
  const grants: GrantInput[] = [];
  for (const grant of draft.grants) {
    const converted = draftToGrant(grant);
    if (converted !== null) grants.push(converted);
  }
  return {
    expectedVersion,
    clearance: draft.clearance ?? 0,
    grants,
  };
}

export const EMPTY_ACCOUNT_DRAFT: AccountDraft = {
  clearance: null,
  grants: [],
};

export function emptyGrant(orgId: string, id: string): GrantDraft {
  return {
    id,
    orgId,
    enterpriseKey: "",
    categoryIds: [],
    ownership: "",
    dimensions: {},
  };
}

/** 语义相同：身份、类别集合、门店选择与各条件选择都一致。 */
export function sameGrant(left: GrantDraft, right: GrantDraft): boolean {
  if (
    left.enterpriseKey !== right.enterpriseKey ||
    left.ownership !== right.ownership ||
    !sameSet(left.categoryIds, right.categoryIds) ||
    !sameSelection(left.stores, right.stores)
  ) {
    return false;
  }
  const dimensionIds = sortedUnique([
    ...Object.keys(left.dimensions),
    ...Object.keys(right.dimensions),
  ]);
  return dimensionIds.every((id) =>
    sameSelection(left.dimensions[id], right.dimensions[id]),
  );
}

function ownershipLabel(
  t: Translate,
  ownership: GrantDraft["ownership"],
): string {
  if (ownership === "store") return t("permissions.store");
  if (ownership === "group") return t("permissions.group");
  return t("permissions.choose");
}

/** 单条授权的字段级差异；只比较实际写接口里的字段。 */
export function grantDiffEntries(
  t: Translate,
  data: LabelData,
  before: GrantDraft,
  after: GrantDraft,
): DiffEntry[] {
  const entries: DiffEntry[] = [];
  entries.push(
    ...diffField(
      t("permissions.enterprise"),
      enterpriseName(t, data, before.enterpriseKey),
      enterpriseName(t, data, after.enterpriseKey),
    ),
  );
  entries.push(
    ...diffField(
      t("permissions.ownership"),
      ownershipLabel(t, before.ownership),
      ownershipLabel(t, after.ownership),
    ),
  );
  entries.push(
    ...diffSetField(
      t("permissions.categoriesLabel"),
      before.categoryIds,
      after.categoryIds,
      (ids) => grantCategoryLabels(t, data, ids),
    ),
  );
  if (before.ownership === "store" || after.ownership === "store") {
    if (!sameSelection(before.stores, after.stores)) {
      entries.push({
        kind: "changed",
        label: t("permissions.selectedStores"),
        before: grantLocationLabel(t, data, before),
        after: grantLocationLabel(t, data, after),
      });
    }
  }
  const dimensionIds = sortedUnique([
    ...Object.keys(before.dimensions),
    ...Object.keys(after.dimensions),
  ]);
  for (const dimensionId of dimensionIds) {
    const from = before.dimensions[dimensionId];
    const to = after.dimensions[dimensionId];
    if (sameSelection(from, to)) continue;
    entries.push({
      kind: "changed",
      label: dimensionName(t, data, dimensionId),
      before:
        from === undefined
          ? t("permissions.none")
          : dimensionSelectionLabel(t, data, dimensionId, from),
      after:
        to === undefined
          ? t("permissions.none")
          : dimensionSelectionLabel(t, data, dimensionId, to),
    });
  }
  return entries;
}

/**
 * 账号整体差异：账号密级单列，授权按持久 grant ID 匹配。
 * 新增与删除各显示一条摘要，改动过的条目只显示变动字段。
 */
export function accountDiff(
  t: Translate,
  data: LabelData,
  draft: AccountDraft,
  baseline: AccountDraft,
): DiffEntry[] {
  const entries = diffField(
    t("permissions.clearance"),
    levelLabel(t, baseline.clearance),
    levelLabel(t, draft.clearance),
  );
  entries.push(
    ...diffKeyedRows(
      baseline.grants,
      draft.grants,
      (grant) => grantDescription(t, data, grant),
      (grant) => grantTitle(t, data, grant),
      (before, after) => grantDiffEntries(t, data, before, after),
      t("permissions.grant"),
    ),
  );
  return entries;
}

function conflictChoice(
  key: string,
  label: string,
  serverValue: string,
  draftValue: string,
): RebaseChoice {
  return { key, label, serverValue, draftValue };
}

/**
 * 以最新账号快照为新基线，重新应用本地改动：
 * - 服务端新增或只被服务端改动的授权一律保留；
 * - 只被用户改动的授权按用户草稿保留；
 * - 两边都改或「用户删除、服务端改过」的同一条要求显式选择。
 */
export function rebaseAccount(
  t: Translate,
  data: LabelData,
  input: RebaseInput<AccountDraft>,
): RebaseOutcome<AccountDraft> {
  const { draft, baseline, server, decisions } = input;
  const choices: RebaseChoice[] = [];
  const notes: string[] = [];

  let clearance: number | null;
  const mineChanged = draft.clearance !== baseline.clearance;
  const theirsChanged = server.clearance !== baseline.clearance;
  if (mineChanged && theirsChanged && draft.clearance !== server.clearance) {
    const decision = decisions["clearance"];
    if (decision === undefined) {
      choices.push(
        conflictChoice(
          "clearance",
          t("permissions.clearance"),
          levelLabel(t, server.clearance),
          levelLabel(t, draft.clearance),
        ),
      );
    }
    clearance = decision === "draft" ? draft.clearance : server.clearance;
  } else if (mineChanged) {
    clearance = draft.clearance;
  } else {
    clearance = server.clearance;
  }

  const ids = sortedUnique([
    ...baseline.grants.map((grant) => grant.id),
    ...draft.grants.map((grant) => grant.id),
    ...server.grants.map((grant) => grant.id),
  ]);
  const grants: GrantDraft[] = [];

  for (const id of ids) {
    const base = baseline.grants.find((grant) => grant.id === id);
    const mine = draft.grants.find((grant) => grant.id === id);
    const theirs = server.grants.find((grant) => grant.id === id);
    const key = `grant:${id}`;

    // 打开编辑时尚不存在：服务端新增未编辑条目必须保留。
    if (base === undefined) {
      if (mine !== undefined && theirs !== undefined) {
        if (sameGrant(mine, theirs)) {
          grants.push(theirs);
          continue;
        }
        const decision = decisions[key];
        if (decision === undefined) {
          choices.push(
            conflictChoice(
              key,
              t("permissions.grant"),
              grantDescription(t, data, theirs),
              grantDescription(t, data, mine),
            ),
          );
        }
        grants.push(decision === "draft" ? mine : theirs);
        continue;
      }
      if (mine !== undefined) {
        grants.push(mine);
        continue;
      }
      if (theirs !== undefined) grants.push(theirs);
      continue;
    }

    if (theirs === undefined) {
      // 服务端删除了这条；用户的改动无法再应用，显示说明而不是静默恢复。
      if (mine !== undefined && !sameGrant(mine, base)) {
        notes.push(
          t("permissions.conflict.serverRemoved").replace(
            "{grant}",
            grantTitle(t, data, base),
          ),
        );
      }
      continue;
    }

    if (mine === undefined) {
      if (sameGrant(theirs, base)) continue;
      const decision = decisions[key];
      if (decision === undefined) {
        choices.push(
          conflictChoice(
            key,
            t("permissions.grant"),
            grantDescription(t, data, theirs),
            t("permissions.conflict.removed"),
          ),
        );
        grants.push(theirs);
        continue;
      }
      if (decision === "server") grants.push(theirs);
      continue;
    }

    if (!sameGrant(mine, base)) {
      if (sameGrant(theirs, base)) {
        grants.push(mine);
        continue;
      }
      if (sameGrant(mine, theirs)) {
        grants.push(theirs);
        continue;
      }
      const decision = decisions[key];
      if (decision === undefined) {
        choices.push(
          conflictChoice(
            key,
            t("permissions.grant"),
            grantDescription(t, data, theirs),
            grantDescription(t, data, mine),
          ),
        );
      }
      grants.push(decision === "draft" ? mine : theirs);
      continue;
    }

    grants.push(theirs);
    if (!sameGrant(theirs, base)) {
      notes.push(
        t("permissions.conflict.serverChanged").replace(
          "{grant}",
          grantTitle(t, data, theirs),
        ),
      );
    }
  }

  if (choices.length > 0) return { kind: "choice", choices };
  return { kind: "merged", draft: { clearance, grants }, notes };
}

/** 冲突面板的字段级对比：显示草稿与服务器最新值的全部差异。 */
export function accountConflictFields(
  t: Translate,
  data: LabelData,
  draft: AccountDraft,
  server: AccountDraft,
): readonly DiffEntry[] {
  return accountDiff(t, data, draft, server);
}

export function decisionsCover(
  choices: readonly RebaseChoice[],
  decisions: Readonly<Record<string, RebaseDecision>>,
): boolean {
  return choices.every((choice) => decisions[choice.key] !== undefined);
}
