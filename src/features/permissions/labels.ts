import type {
  PermissionAccount,
  PermissionCategory,
  PermissionDimension,
  PermissionEnterprise,
  PermissionGrant,
  PermissionSelection,
  PermissionStore,
} from "@/api/permissions";

import { isFixedCategoryKey } from "./constants";
import type { GrantDraft } from "./grants";

export type Translate = (key: string) => string;

export interface LabelData {
  readonly categories: readonly PermissionCategory[];
  readonly dimensions: readonly PermissionDimension[];
  readonly stores: readonly PermissionStore[];
  readonly enterprises: readonly PermissionEnterprise[];
}

export function itemLabel(
  t: Translate,
  name: string,
  retired: boolean,
): string {
  return retired ? `${name}${t("permissions.retiredLabel")}` : name;
}

export function categoryLabel(
  t: Translate,
  category: PermissionCategory,
): string {
  const { key } = category;
  if (category.kind === "fixed" && key !== null && isFixedCategoryKey(key)) {
    return t(`permissions.category.${key}`);
  }
  return category.name;
}

export function categoryName(
  t: Translate,
  data: LabelData,
  id: string,
): string {
  const category = data.categories.find((item) => item.id === id);
  return category === undefined
    ? t("permissions.preserved")
    : categoryLabel(t, category);
}

export function dimensionName(
  t: Translate,
  data: LabelData,
  id: string,
): string {
  const dimension = data.dimensions.find((item) => item.id === id);
  return dimension === undefined ? t("permissions.preserved") : dimension.name;
}

export function dimensionValueName(
  t: Translate,
  data: LabelData,
  dimensionId: string,
  valueId: string,
): string {
  const dimension = data.dimensions.find((item) => item.id === dimensionId);
  const value = dimension?.values.find((item) => item.id === valueId);
  return value === undefined ? t("permissions.preserved") : value.name;
}

export function enterpriseName(
  _t: Translate,
  data: LabelData,
  enterpriseKey: string,
): string {
  const enterprise = data.enterprises.find(
    (item) => item.enterpriseKey === enterpriseKey,
  );
  return enterprise === undefined ? enterpriseKey : enterprise.enterpriseName;
}

export function selectionLabel(
  t: Translate,
  selection: PermissionSelection | undefined,
  allLabelKey: string,
): string {
  if (selection === undefined) return t("permissions.choose");
  if (selection.kind === "all") return t(allLabelKey);
  return selection.values.length === 0
    ? t("permissions.choose")
    : selection.values.join(", ");
}

export function grantDescription(
  t: Translate,
  data: LabelData,
  grant: PermissionGrant | GrantDraft,
): string {
  const stores =
    grant.ownership === "group"
      ? t("permissions.group")
      : grant.stores?.kind === "all"
        ? t("permissions.allStores")
        : (grant.stores?.values ?? []).length === 0
          ? t("permissions.noStoreRead")
          : (grant.stores?.values ?? []).join(", ");
  const dimensionsRecord: Readonly<Record<string, PermissionSelection>> =
    grant.dimensions;
  const dimensions = Object.entries(dimensionsRecord)
    .map(
      ([dimensionId, selection]) =>
        `${dimensionName(t, data, dimensionId)}: ${selectionLabel(t, selection, "permissions.allValues")}`,
    )
    .join("; ");
  const categories = grant.categoryIds
    .map((id) => categoryName(t, data, id))
    .join(", ");
  const business = enterpriseName(t, data, grant.enterpriseKey);
  return `${business} · ${categories} · ${stores}${dimensions === "" ? "" : ` · ${dimensions}`}`;
}

export function accountSummary(
  t: Translate,
  data: LabelData,
  account: {
    readonly displayName: string;
    readonly clearance: number;
    readonly grants: readonly (PermissionGrant | GrantDraft)[];
  },
): string {
  const grants =
    account.grants.length === 0
      ? t("permissions.noGrants")
      : account.grants
          .map((grant) => grantDescription(t, data, grant))
          .join("\n");
  return `${account.displayName} · ${t("permissions.clearance")}: ${account.clearance}\n${grants}`;
}

export function changeSummary(
  t: Translate,
  name: string,
  before: string,
  after: string,
): string {
  return `${name}\n${t("permissions.before")}: ${before}\n${t("permissions.after")}: ${after}`;
}

export function catalogStateLabel(t: Translate, retired: boolean): string {
  return t(retired ? "permissions.retired" : "permissions.active");
}

export function accountRoleLabel(
  t: Translate,
  role: PermissionAccount["role"],
): string {
  return t(role === "admin" ? "permissions.admin" : "permissions.employee");
}

export function documentStatusLabel(t: Translate, status: string): string {
  const key = `permissions.status.${status}`;
  const label = t(key);
  return label === key ? t("permissions.attributesNotReady") : label;
}
