// 固定业务类别由后端领域模型注册；前端只负责显示与校验，不自行命名。
// 顺序与 SME_DATA_CENTER packages/domain/src/business-authorization.ts 保持一致。
export const FIXED_BUSINESS_CATEGORY_KEYS = [
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "vip",
  "dish_catalog",
  "supplier_catalog",
  "cost_cards",
  "store_reviews",
  "delivery_ledger",
  "quarantine_certificate",
  "ledger_pdf",
] as const;

export type FixedBusinessCategoryKey =
  (typeof FIXED_BUSINESS_CATEGORY_KEYS)[number];

/** 原始配送台账只用于内部处理，管理页不展示其密级表单，也不允许在授权里新增。 */
export const INTERNAL_CATEGORY_KEY = "delivery_ledger";

const fixedCategoryKeySet: ReadonlySet<string> = new Set(
  FIXED_BUSINESS_CATEGORY_KEYS,
);

export function isFixedCategoryKey(
  value: string,
): value is FixedBusinessCategoryKey {
  return fixedCategoryKeySet.has(value);
}

export const sectionKeys = [
  "categories",
  "stores",
  "dimensions",
  "accounts",
  "documents",
  "readiness",
] as const;

export type SectionKey = (typeof sectionKeys)[number];
