import type {
  PermissionAccount,
  PermissionCategory,
  PermissionDimension,
  PermissionDimensionValue,
  PermissionEnterprise,
  PermissionGrant,
  PermissionSelection,
  PermissionStore,
} from "@/api/permissions";

import { isFixedCategoryKey } from "./constants";

export type Translate = (key: string) => string;

export interface LabelData {
  readonly categories: readonly PermissionCategory[];
  readonly dimensions: readonly PermissionDimension[];
  readonly stores: readonly PermissionStore[];
  readonly enterprises: readonly PermissionEnterprise[];
}

/** 授权与范围的共同形状：服务端条目和本地草稿都能用它显示。 */
interface GrantLike {
  readonly enterpriseKey: string;
  readonly categoryIds: readonly string[];
  readonly ownership: "group" | "store" | "";
  readonly stores?: PermissionSelection | undefined;
  readonly dimensions: Readonly<Record<string, PermissionSelection>>;
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

export function documentCategoryLabel(
  t: Translate,
  data: LabelData,
  id: string | null,
): string {
  return id === null ? t("permissions.unset") : categoryName(t, data, id);
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

export function valueLabel(
  t: Translate,
  value: PermissionDimensionValue,
): string {
  return itemLabel(t, value.name, value.retired);
}

export function enterpriseName(
  t: Translate,
  data: LabelData,
  enterpriseKey: string,
): string {
  const enterprise = data.enterprises.find(
    (item) => item.enterpriseKey === enterpriseKey,
  );
  return enterprise === undefined
    ? enterpriseKey === ""
      ? t("permissions.choose")
      : enterpriseKey
    : enterprise.enterpriseName;
}

export function storeDisplayName(
  t: Translate,
  data: LabelData,
  enterpriseKey: string,
  name: string,
): string {
  const store = data.stores.find(
    (item) => item.enterpriseKey === enterpriseKey && item.name === name,
  );
  if (store === undefined) return name;
  return itemLabel(t, store.officialName ?? store.name, store.retired);
}

export function enterpriseStores(
  data: LabelData,
  enterpriseKey: string,
): readonly PermissionStore[] {
  return data.stores.filter((store) => store.enterpriseKey === enterpriseKey);
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

export function dimensionSelectionLabel(
  t: Translate,
  data: LabelData,
  dimensionId: string,
  selection: PermissionSelection | undefined,
): string {
  if (selection === undefined) return t("permissions.choose");
  if (selection.kind === "all") return t("permissions.allValues");
  return selection.values.length === 0
    ? t("permissions.choose")
    : selection.values
        .map((valueId) => dimensionValueName(t, data, dimensionId, valueId))
        .join("、");
}

export function grantLocationLabel(
  t: Translate,
  data: LabelData,
  grant: GrantLike,
): string {
  if (grant.ownership === "group") return t("permissions.group");
  if (grant.ownership !== "store") return t("permissions.choose");
  if (grant.stores === undefined) return t("permissions.choose");
  if (grant.stores.kind === "all") return t("permissions.allStores");
  if (grant.stores.values.length === 0) return t("permissions.choose");
  // 授权里用精确门店名（企业已在同一行显示），避免正式店名重复企业前缀。
  return grant.stores.values
    .map((name) => {
      const store = data.stores.find(
        (item) =>
          item.enterpriseKey === grant.enterpriseKey && item.name === name,
      );
      return store === undefined
        ? name
        : itemLabel(t, store.name, store.retired);
    })
    .join("、");
}

export function grantCategoryLabels(
  t: Translate,
  data: LabelData,
  categoryIds: readonly string[],
): string {
  if (categoryIds.length === 0) return t("permissions.choose");
  return categoryIds.map((id) => categoryName(t, data, id)).join("、");
}

export function grantConditionLabels(
  t: Translate,
  data: LabelData,
  dimensions: Readonly<Record<string, PermissionSelection>>,
): string {
  const entries = Object.entries(dimensions);
  if (entries.length === 0) return "";
  return entries
    .map(
      ([dimensionId, selection]) =>
        `${dimensionName(t, data, dimensionId)}: ${dimensionSelectionLabel(
          t,
          data,
          dimensionId,
          selection,
        )}`,
    )
    .join(" / ");
}

/** 授权条目的短标题：面板列表里的一行。 */
export function grantTitle(
  t: Translate,
  data: LabelData,
  grant: GrantLike,
): string {
  return `${grantLocationLabel(t, data, grant)} · ${grantCategoryLabels(
    t,
    data,
    grant.categoryIds,
  )}`;
}

/** 授权条目的完整描述：确认摘要与冲突比较使用同一句话。 */
export function grantDescription(
  t: Translate,
  data: LabelData,
  grant: GrantLike,
): string {
  const parts = [
    enterpriseName(t, data, grant.enterpriseKey),
    grantLocationLabel(t, data, grant),
    grantCategoryLabels(t, data, grant.categoryIds),
  ];
  const conditions = grantConditionLabels(t, data, grant.dimensions);
  if (conditions !== "") parts.push(conditions);
  return parts.join(" · ");
}

export function accountSummary(
  t: Translate,
  data: LabelData,
  account: {
    readonly displayName: string;
    readonly clearance: number;
    readonly grants: readonly (PermissionGrant | GrantLike)[];
  },
): string {
  const grants =
    account.grants.length === 0
      ? t("permissions.noGrants")
      : account.grants
          .map((grant) => `• ${grantDescription(t, data, grant)}`)
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

export function levelLabel(t: Translate, value: number | null): string {
  return value === null ? t("permissions.unset") : String(value);
}
