import type {
  PermissionCategory,
  PermissionEnterprise,
  PermissionGrant,
  PermissionSelection,
  PermissionStore,
  PermissionsAccountsUpdateBody,
} from "@/api/permissions";

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

export interface GrantData {
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

function copyGrantDraft(grant: GrantDraft): GrantDraft {
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

/**
 * 提交前把服务端已有、但当前草稿没有渲染/表现的授权条目并回来。
 * 账号保存是整组替换：不做这一步就会把表单没展示的既有授权静默删掉。
 */
export function mergeGrantDrafts(
  serverGrants: readonly (PermissionGrant | GrantLike)[],
  draftGrants: readonly GrantDraft[],
): readonly GrantDraft[] {
  const draftIds = new Set(draftGrants.map((grant) => grant.id));
  const preserved = serverGrants
    .filter((grant) => !draftIds.has(grant.id))
    .map((grant) => grantToDraft(grant));
  return [...draftGrants.map(copyGrantDraft), ...preserved];
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
  serverGrants: readonly (PermissionGrant | GrantLike)[],
  expectedVersion: string,
): PermissionsAccountsUpdateBody {
  const merged = mergeGrantDrafts(serverGrants, draft.grants);
  const grants: GrantInput[] = [];
  for (const grant of merged) {
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
