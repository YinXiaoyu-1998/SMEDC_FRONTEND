// 由 npm run contract:sync 生成，禁止手改
// 契约来源：YinXiaoyu-1998/SME_DATA_CENTER packages/web-api-contract/contract.json
// 同步 ref 与内容 hash 见 contract/ref.json；重新生成：npm run contract:sync -- --ref <sha>

import { z } from "zod";

export type WebApiHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface WebApiRouteMeta {
  readonly method: WebApiHttpMethod;
  readonly path: string;
  readonly auth: string;
  readonly errors: readonly string[];
  readonly summary: string;
}

export const webApiPrefix = "/api/web/v1";

export const contractVersion = 1;

export const bDirectoryCreateEmployeeSchema0Schema = z
  .string()
  .regex(
    new RegExp(
      "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
    ),
  );

export const rDirectoryGetEmployeeSchema0Schema = z
  .string()
  .regex(
    new RegExp(
      "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
    ),
  );

export const rDirectoryListDirectorySchema0Schema = z
  .string()
  .regex(
    new RegExp(
      "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
    ),
  );

export const rDirectoryListDirectorySchema1Schema = z
  .string()
  .regex(new RegExp("^(0|[1-9]\\d*)$"));

export const bDirectoryListEmployeesSchema0Schema = z
  .string()
  .regex(
    new RegExp(
      "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
    ),
  );

export const rDirectoryListEmployeesSchema0Schema = z
  .string()
  .regex(
    new RegExp(
      "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
    ),
  );

export const bDirectoryManageDepartmentSchema0Schema = z
  .string()
  .min(1)
  .max(255);

export const bDirectoryManageDepartmentSchema1Schema = z
  .string()
  .regex(
    new RegExp(
      "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
    ),
  );

export const bDirectoryManageDepartmentSchema2Schema = z
  .string()
  .regex(new RegExp("^(0|[1-9]\\d*)$"));

export const bDirectoryManageStoreSchema0Schema = z.string().min(1).max(255);

export const bDirectoryManageStoreSchema1Schema = z
  .string()
  .regex(
    new RegExp(
      "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
    ),
  );

export const bDirectoryManageStoreSchema2Schema = z
  .string()
  .regex(new RegExp("^(0|[1-9]\\d*)$"));

export const bDirectoryUpdateEmployeeSchema0Schema = z
  .string()
  .regex(
    new RegExp(
      "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
    ),
  );

export const bLedgerCoverageSchema0Schema = z.string().min(1).max(512);

export const bLedgerCoverageSchema1Schema = z
  .string()
  .regex(
    new RegExp(
      "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$",
    ),
  );

export const rPermissionsAccountsListSchema0Schema = z.enum(["group", "store"]);

export const rPermissionsAccountsListSchema2Schema = z.string().min(1);

export const rPermissionsAccountsListSchema1Schema = z.union([
  z.strictObject({
    kind: z.literal("all"),
  }),
  z.strictObject({
    kind: z.literal("fixed"),
    values: z.array(rPermissionsAccountsListSchema2Schema).min(1),
  }),
]);

export const rPermissionsAccountsReadSchema0Schema = z.enum(["group", "store"]);

export const rPermissionsAccountsReadSchema2Schema = z.string().min(1);

export const rPermissionsAccountsReadSchema1Schema = z.union([
  z.strictObject({
    kind: z.literal("all"),
  }),
  z.strictObject({
    kind: z.literal("fixed"),
    values: z.array(rPermissionsAccountsReadSchema2Schema).min(1),
  }),
]);

export const bPermissionsAccountsUpdateSchema1Schema = z
  .string()
  .min(1)
  .max(64);

export const bPermissionsAccountsUpdateSchema2Schema = z
  .string()
  .min(1)
  .max(64);

export const bPermissionsAccountsUpdateSchema3Schema = z
  .string()
  .min(1)
  .max(128);

export const bPermissionsAccountsUpdateSchema5Schema = z
  .string()
  .min(1)
  .max(64);

export const bPermissionsAccountsUpdateSchema4Schema = z
  .array(bPermissionsAccountsUpdateSchema5Schema)
  .min(1);

export const bPermissionsAccountsUpdateSchema8Schema = z.string().min(1);

export const bPermissionsAccountsUpdateSchema7Schema = z.union([
  z.strictObject({
    kind: z.literal("all"),
  }),
  z.strictObject({
    kind: z.literal("fixed"),
    values: z.array(bPermissionsAccountsUpdateSchema8Schema).min(1),
  }),
]);

export const bPermissionsAccountsUpdateSchema6Schema = z
  .object({})
  .catchall(bPermissionsAccountsUpdateSchema7Schema);

export const bPermissionsAccountsUpdateSchema0Schema = z.union([
  z.strictObject({
    id: bPermissionsAccountsUpdateSchema1Schema,
    orgId: bPermissionsAccountsUpdateSchema2Schema,
    enterpriseKey: bPermissionsAccountsUpdateSchema3Schema,
    categoryIds: bPermissionsAccountsUpdateSchema4Schema,
    dimensions: bPermissionsAccountsUpdateSchema6Schema,
    ownership: z.literal("group"),
  }),
  z.strictObject({
    id: bPermissionsAccountsUpdateSchema1Schema,
    orgId: bPermissionsAccountsUpdateSchema2Schema,
    enterpriseKey: bPermissionsAccountsUpdateSchema3Schema,
    categoryIds: bPermissionsAccountsUpdateSchema4Schema,
    dimensions: bPermissionsAccountsUpdateSchema6Schema,
    ownership: z.literal("store"),
    stores: bPermissionsAccountsUpdateSchema7Schema,
  }),
]);

export const rPermissionsAccountsUpdateSchema1Schema = z.string().min(1);

export const rPermissionsAccountsUpdateSchema0Schema = z.union([
  z.strictObject({
    kind: z.literal("all"),
  }),
  z.strictObject({
    kind: z.literal("fixed"),
    values: z.array(rPermissionsAccountsUpdateSchema1Schema).min(1),
  }),
]);

export const bPermissionsCategoriesCreateSchema0Schema = z.enum([
  "group",
  "store",
]);

export const bPermissionsCategoriesUpdateSchema0Schema = z
  .string()
  .regex(new RegExp("^(0|[1-9]\\d*)$"));

export const bPermissionsCategoriesUpdateSchema1Schema = z
  .string()
  .min(1)
  .max(255);

export const bPermissionsCategoriesUpdateSchema2Schema = z.enum([
  "group",
  "store",
]);

export const rPermissionsDocumentsListSchema0Schema = z.string().min(1);

export const bPermissionsDocumentsUpdateSchema1Schema = z.string().min(1);

export const bPermissionsDocumentsUpdateSchema0Schema = z.union([
  z.strictObject({
    enterpriseKey: z.string().min(1),
    ownership: z.literal("group"),
    dimensions: z.object({}).catchall(bPermissionsDocumentsUpdateSchema1Schema),
  }),
  z.strictObject({
    enterpriseKey: z.string().min(1),
    ownership: z.literal("store"),
    storeName: z.string().min(1).max(255),
    dimensions: z.object({}).catchall(bPermissionsDocumentsUpdateSchema1Schema),
  }),
]);

export const rPermissionsMeReadSchema0Schema = z.enum(["group", "store"]);

export const rPermissionsMeReadSchema2Schema = z.string().min(1);

export const rPermissionsMeReadSchema1Schema = z.union([
  z.strictObject({
    kind: z.literal("all"),
  }),
  z.strictObject({
    kind: z.literal("fixed"),
    values: z.array(rPermissionsMeReadSchema2Schema).min(1),
  }),
]);

export const rPermissionsMeReadSchema3Schema = z.strictObject({
  enterpriseKey: z.string(),
  enterpriseName: z.string(),
});

export const bPermissionsStoresUpsertSchema0Schema = z.string().min(1).max(255);

export const rWorkflowsGetEnterpriseWorkflowSchema0Schema = z
  .number()
  .int()
  .min(0)
  .max(4294967295);

export const rWorkflowsGetEnterpriseWorkflowSchema1Schema = z
  .string()
  .regex(
    new RegExp(
      "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
    ),
  );

export const rWorkflowsGetEnterpriseWorkflowSchema3Schema = z.literal(1);

export const rWorkflowsGetEnterpriseWorkflowSchema5Schema = z
  .string()
  .min(1)
  .max(255);

export const rWorkflowsGetEnterpriseWorkflowSchema4Schema = z
  .array(rWorkflowsGetEnterpriseWorkflowSchema5Schema)
  .min(1)
  .max(2000);

export const rWorkflowsGetEnterpriseWorkflowSchema6Schema =
  z.literal("action_required");

export const rWorkflowsGetEnterpriseWorkflowSchema7Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
]);

export const rWorkflowsGetEnterpriseWorkflowSchema2Schema = z.strictObject({
  schemaVersion: rWorkflowsGetEnterpriseWorkflowSchema3Schema,
  storeNames: rWorkflowsGetEnterpriseWorkflowSchema4Schema,
  notificationPolicy: rWorkflowsGetEnterpriseWorkflowSchema6Schema,
  type: z.literal("meituan-daily-ingestion"),
  datasets: z.array(rWorkflowsGetEnterpriseWorkflowSchema7Schema).min(1).max(5),
  orderScope: z.literal("settled_only"),
  cleanupPolicy: z.literal("confirmed_files_only"),
});

export const rWorkflowsGetEnterpriseWorkflowSchema10Schema = z.enum([
  "meituan_erp",
  "meituan_reviews",
]);

export const rWorkflowsGetEnterpriseWorkflowSchema11Schema = z.enum([
  "erp",
  "meituan",
  "dianping",
]);

export const rWorkflowsGetEnterpriseWorkflowSchema12Schema =
  rWorkflowsGetEnterpriseWorkflowSchema5Schema;

export const rWorkflowsGetEnterpriseWorkflowSchema13Schema = z.strictObject({
  product: rWorkflowsGetEnterpriseWorkflowSchema10Schema,
  channel: rWorkflowsGetEnterpriseWorkflowSchema11Schema,
  accountRef: rWorkflowsGetEnterpriseWorkflowSchema5Schema,
  sourceStoreId: rWorkflowsGetEnterpriseWorkflowSchema12Schema.optional(),
  sourceStoreName: rWorkflowsGetEnterpriseWorkflowSchema5Schema,
});

export const rWorkflowsGetEnterpriseWorkflowSchema9Schema = z.strictObject({
  source: rWorkflowsGetEnterpriseWorkflowSchema13Schema,
  feedbackId: rWorkflowsGetEnterpriseWorkflowSchema5Schema,
  reason: z.string().min(1).max(2000),
  purpose: z.literal("exclude_source_record"),
});

export const rWorkflowsGetEnterpriseWorkflowSchema14Schema = z.enum([
  "meituan",
  "dianping",
]);

export const rWorkflowsGetEnterpriseWorkflowSchema16Schema = z.boolean();

export const rWorkflowsGetEnterpriseWorkflowSchema18Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const rWorkflowsGetEnterpriseWorkflowSchema17Schema = z
  .array(rWorkflowsGetEnterpriseWorkflowSchema18Schema)
  .max(20);

export const rWorkflowsGetEnterpriseWorkflowSchema19Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const rWorkflowsGetEnterpriseWorkflowSchema15Schema = z.strictObject({
  enabled: rWorkflowsGetEnterpriseWorkflowSchema16Schema,
  recipients: rWorkflowsGetEnterpriseWorkflowSchema17Schema,
  allowedSender: rWorkflowsGetEnterpriseWorkflowSchema19Schema.optional(),
});

export const rWorkflowsGetEnterpriseWorkflowSchema8Schema = z.strictObject({
  schemaVersion: rWorkflowsGetEnterpriseWorkflowSchema3Schema,
  storeNames: rWorkflowsGetEnterpriseWorkflowSchema4Schema,
  notificationPolicy: rWorkflowsGetEnterpriseWorkflowSchema6Schema,
  type: z.literal("meituan-review-operations"),
  executionPolicy: z.strictObject({
    id: z.literal("verified-review-operations"),
    version: z.literal(1),
  }),
  ignoredReviewIdentities: z
    .array(rWorkflowsGetEnterpriseWorkflowSchema9Schema)
    .max(2000),
  channels: z
    .array(rWorkflowsGetEnterpriseWorkflowSchema14Schema)
    .min(1)
    .max(2),
  publication: z.strictObject({
    enabled: z.boolean(),
    storeNames: z.array(rWorkflowsGetEnterpriseWorkflowSchema5Schema).max(2000),
  }),
  brandFacts: z.string().max(20000),
  tone: z.string().max(2000),
  draftNotification: rWorkflowsGetEnterpriseWorkflowSchema15Schema,
  cleanupPolicy: z.literal("complete_run_only"),
});

export const rWorkflowsGetEnterpriseWorkflowSchema21Schema = z.strictObject({
  name: rWorkflowsGetEnterpriseWorkflowSchema5Schema,
  storeNames: rWorkflowsGetEnterpriseWorkflowSchema4Schema,
});

export const rWorkflowsGetEnterpriseWorkflowSchema20Schema = z.strictObject({
  schemaVersion: rWorkflowsGetEnterpriseWorkflowSchema3Schema,
  storeNames: rWorkflowsGetEnterpriseWorkflowSchema4Schema,
  notificationPolicy: rWorkflowsGetEnterpriseWorkflowSchema6Schema,
  type: z.literal("weekly-business-report"),
  groups: z.array(rWorkflowsGetEnterpriseWorkflowSchema21Schema).max(100),
  delivery: rWorkflowsGetEnterpriseWorkflowSchema15Schema,
  cleanupPolicy: z.literal("retain_final_report"),
});

export const rWorkflowsGetEnterpriseWorkflowSchema22Schema = z.literal(1);

export const rWorkflowsGetEnterpriseWorkflowSchema23Schema =
  z.literal("Asia/Shanghai");

export const rWorkflowsGetEnterpriseWorkflowSchema25Schema = z.strictObject({
  product: z.enum(["meituan_erp", "meituan_reviews"]),
  accountRef: rWorkflowsGetEnterpriseWorkflowSchema5Schema,
  displayName: rWorkflowsGetEnterpriseWorkflowSchema5Schema,
  sourceEnterpriseName: rWorkflowsGetEnterpriseWorkflowSchema5Schema,
  sourceGroupName: rWorkflowsGetEnterpriseWorkflowSchema5Schema.optional(),
});

export const rWorkflowsGetEnterpriseWorkflowSchema24Schema = z
  .array(rWorkflowsGetEnterpriseWorkflowSchema25Schema)
  .max(100);

export const rWorkflowsGetEnterpriseWorkflowSchema27Schema = z.strictObject({
  source: rWorkflowsGetEnterpriseWorkflowSchema13Schema,
  storeName: rWorkflowsGetEnterpriseWorkflowSchema5Schema,
});

export const rWorkflowsGetEnterpriseWorkflowSchema26Schema = z
  .array(rWorkflowsGetEnterpriseWorkflowSchema27Schema)
  .max(2000);

export const rWorkflowsGetEnterpriseWorkflowSchema29Schema = z.strictObject({
  source: rWorkflowsGetEnterpriseWorkflowSchema13Schema,
  reason: z.string().min(1).max(2000),
});

export const rWorkflowsGetEnterpriseWorkflowSchema28Schema = z
  .array(rWorkflowsGetEnterpriseWorkflowSchema29Schema)
  .max(2000);

export const rWorkflowsGetEnterpriseWorkflowSchema30Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
]);

export const rWorkflowsGetEnterpriseWorkflowSchema31Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
]);

export const rWorkflowsGetEnterpriseWorkflowSchema32Schema = z.enum([
  "meituan",
  "dianping",
]);

export const rWorkflowsGetEnterpriseWorkflowSchema33Schema = z.enum([
  "meituan",
  "dianping",
]);

export const bWorkflowsGetWorkflowStatusSchema0Schema = z
  .string()
  .min(1)
  .max(64)
  .regex(new RegExp("^[A-Za-z0-9_-]+$"));

export const rWorkflowsGetWorkflowStatusSchema0Schema = z
  .string()
  .min(1)
  .max(64)
  .regex(new RegExp("^[A-Za-z0-9_-]+$"));

export const rWorkflowsGetWorkflowStatusSchema1Schema = z.enum([
  "meituan-daily-ingestion",
  "meituan-review-operations",
  "weekly-business-report",
]);

export const rWorkflowsGetWorkflowStatusSchema2Schema = z
  .number()
  .int()
  .min(0)
  .max(4294967295);

export const rWorkflowsGetWorkflowStatusSchema3Schema = z
  .string()
  .regex(
    new RegExp(
      "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
    ),
  );

export const rWorkflowsGetWorkflowStatusSchema6Schema = z.literal(1);

export const rWorkflowsGetWorkflowStatusSchema8Schema = z
  .string()
  .min(1)
  .max(255);

export const rWorkflowsGetWorkflowStatusSchema7Schema = z
  .array(rWorkflowsGetWorkflowStatusSchema8Schema)
  .min(1)
  .max(2000);

export const rWorkflowsGetWorkflowStatusSchema9Schema =
  z.literal("action_required");

export const rWorkflowsGetWorkflowStatusSchema10Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
]);

export const rWorkflowsGetWorkflowStatusSchema5Schema = z.strictObject({
  schemaVersion: rWorkflowsGetWorkflowStatusSchema6Schema,
  storeNames: rWorkflowsGetWorkflowStatusSchema7Schema,
  notificationPolicy: rWorkflowsGetWorkflowStatusSchema9Schema,
  type: z.literal("meituan-daily-ingestion"),
  datasets: z.array(rWorkflowsGetWorkflowStatusSchema10Schema).min(1).max(5),
  orderScope: z.literal("settled_only"),
  cleanupPolicy: z.literal("confirmed_files_only"),
});

export const rWorkflowsGetWorkflowStatusSchema13Schema = z.enum([
  "meituan_erp",
  "meituan_reviews",
]);

export const rWorkflowsGetWorkflowStatusSchema14Schema = z.enum([
  "erp",
  "meituan",
  "dianping",
]);

export const rWorkflowsGetWorkflowStatusSchema15Schema =
  rWorkflowsGetWorkflowStatusSchema8Schema;

export const rWorkflowsGetWorkflowStatusSchema16Schema = z.strictObject({
  product: rWorkflowsGetWorkflowStatusSchema13Schema,
  channel: rWorkflowsGetWorkflowStatusSchema14Schema,
  accountRef: rWorkflowsGetWorkflowStatusSchema8Schema,
  sourceStoreId: rWorkflowsGetWorkflowStatusSchema15Schema.optional(),
  sourceStoreName: rWorkflowsGetWorkflowStatusSchema8Schema,
});

export const rWorkflowsGetWorkflowStatusSchema12Schema = z.strictObject({
  source: rWorkflowsGetWorkflowStatusSchema16Schema,
  feedbackId: rWorkflowsGetWorkflowStatusSchema8Schema,
  reason: z.string().min(1).max(2000),
  purpose: z.literal("exclude_source_record"),
});

export const rWorkflowsGetWorkflowStatusSchema17Schema = z.enum([
  "meituan",
  "dianping",
]);

export const rWorkflowsGetWorkflowStatusSchema19Schema = z.boolean();

export const rWorkflowsGetWorkflowStatusSchema21Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const rWorkflowsGetWorkflowStatusSchema20Schema = z
  .array(rWorkflowsGetWorkflowStatusSchema21Schema)
  .max(20);

export const rWorkflowsGetWorkflowStatusSchema22Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const rWorkflowsGetWorkflowStatusSchema18Schema = z.strictObject({
  enabled: rWorkflowsGetWorkflowStatusSchema19Schema,
  recipients: rWorkflowsGetWorkflowStatusSchema20Schema,
  allowedSender: rWorkflowsGetWorkflowStatusSchema22Schema.optional(),
});

export const rWorkflowsGetWorkflowStatusSchema11Schema = z.strictObject({
  schemaVersion: rWorkflowsGetWorkflowStatusSchema6Schema,
  storeNames: rWorkflowsGetWorkflowStatusSchema7Schema,
  notificationPolicy: rWorkflowsGetWorkflowStatusSchema9Schema,
  type: z.literal("meituan-review-operations"),
  executionPolicy: z.strictObject({
    id: z.literal("verified-review-operations"),
    version: z.literal(1),
  }),
  ignoredReviewIdentities: z
    .array(rWorkflowsGetWorkflowStatusSchema12Schema)
    .max(2000),
  channels: z.array(rWorkflowsGetWorkflowStatusSchema17Schema).min(1).max(2),
  publication: z.strictObject({
    enabled: z.boolean(),
    storeNames: z.array(rWorkflowsGetWorkflowStatusSchema8Schema).max(2000),
  }),
  brandFacts: z.string().max(20000),
  tone: z.string().max(2000),
  draftNotification: rWorkflowsGetWorkflowStatusSchema18Schema,
  cleanupPolicy: z.literal("complete_run_only"),
});

export const rWorkflowsGetWorkflowStatusSchema24Schema = z.strictObject({
  name: rWorkflowsGetWorkflowStatusSchema8Schema,
  storeNames: rWorkflowsGetWorkflowStatusSchema7Schema,
});

export const rWorkflowsGetWorkflowStatusSchema23Schema = z.strictObject({
  schemaVersion: rWorkflowsGetWorkflowStatusSchema6Schema,
  storeNames: rWorkflowsGetWorkflowStatusSchema7Schema,
  notificationPolicy: rWorkflowsGetWorkflowStatusSchema9Schema,
  type: z.literal("weekly-business-report"),
  groups: z.array(rWorkflowsGetWorkflowStatusSchema24Schema).max(100),
  delivery: rWorkflowsGetWorkflowStatusSchema18Schema,
  cleanupPolicy: z.literal("retain_final_report"),
});

export const rWorkflowsGetWorkflowStatusSchema4Schema = z.union([
  rWorkflowsGetWorkflowStatusSchema5Schema,
  rWorkflowsGetWorkflowStatusSchema11Schema,
  rWorkflowsGetWorkflowStatusSchema23Schema,
]);

export const rWorkflowsGetWorkflowStatusSchema26Schema = z.literal(1);

export const rWorkflowsGetWorkflowStatusSchema27Schema =
  z.literal("Asia/Shanghai");

export const rWorkflowsGetWorkflowStatusSchema29Schema = z.strictObject({
  product: z.enum(["meituan_erp", "meituan_reviews"]),
  accountRef: rWorkflowsGetWorkflowStatusSchema8Schema,
  displayName: rWorkflowsGetWorkflowStatusSchema8Schema,
  sourceEnterpriseName: rWorkflowsGetWorkflowStatusSchema8Schema,
  sourceGroupName: rWorkflowsGetWorkflowStatusSchema8Schema.optional(),
});

export const rWorkflowsGetWorkflowStatusSchema28Schema = z
  .array(rWorkflowsGetWorkflowStatusSchema29Schema)
  .max(100);

export const rWorkflowsGetWorkflowStatusSchema31Schema = z.strictObject({
  source: rWorkflowsGetWorkflowStatusSchema16Schema,
  storeName: rWorkflowsGetWorkflowStatusSchema8Schema,
});

export const rWorkflowsGetWorkflowStatusSchema30Schema = z
  .array(rWorkflowsGetWorkflowStatusSchema31Schema)
  .max(2000);

export const rWorkflowsGetWorkflowStatusSchema33Schema = z.strictObject({
  source: rWorkflowsGetWorkflowStatusSchema16Schema,
  reason: z.string().min(1).max(2000),
});

export const rWorkflowsGetWorkflowStatusSchema32Schema = z
  .array(rWorkflowsGetWorkflowStatusSchema33Schema)
  .max(2000);

export const rWorkflowsGetWorkflowStatusSchema25Schema = z.strictObject({
  schemaVersion: rWorkflowsGetWorkflowStatusSchema26Schema,
  timezone: rWorkflowsGetWorkflowStatusSchema27Schema,
  sourceAccounts: rWorkflowsGetWorkflowStatusSchema28Schema,
  storeMappings: rWorkflowsGetWorkflowStatusSchema30Schema,
  exclusions: rWorkflowsGetWorkflowStatusSchema32Schema,
});

export const rWorkflowsGetWorkflowStatusSchema34Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
]);

export const rWorkflowsGetWorkflowStatusSchema35Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
]);

export const rWorkflowsGetWorkflowStatusSchema36Schema = z.enum([
  "meituan",
  "dianping",
]);

export const rWorkflowsGetWorkflowStatusSchema37Schema = z.enum([
  "meituan",
  "dianping",
]);

export const rWorkflowsGetWorkflowStatusSchema39Schema = z
  .string()
  .regex(
    new RegExp(
      "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$",
    ),
  );

export const rWorkflowsGetWorkflowStatusSchema38Schema = z.strictObject({
  startDate: rWorkflowsGetWorkflowStatusSchema39Schema,
  endDate: rWorkflowsGetWorkflowStatusSchema39Schema,
});

export const rWorkflowsGetWorkflowStatusSchema40Schema = z.strictObject({
  actionId: z.string(),
  runId: z.string(),
  state: z.enum(["intent", "confirmed", "failed", "unknown"]),
  updatedAt: rWorkflowsGetWorkflowStatusSchema3Schema,
});

export const rWorkflowsGetWorkflowStatusSchema41Schema = z
  .string()
  .regex(new RegExp("^[a-f0-9]{64}$"));

export const rWorkflowsGetWorkflowStatusSchema42Schema = z
  .string()
  .regex(new RegExp("^\\d+\\.\\d+\\.\\d+$"));

export const rWorkflowsGetWorkflowStatusSchema43Schema = z.enum([
  "preparing",
  "collecting",
  "validating",
  "processing",
  "delivering",
  "verifying",
  "cleaning",
  "finished",
]);

export const rWorkflowsGetWorkflowStatusSchema44Schema = z.enum([
  "running",
  "succeeded",
  "partial",
  "needs_attention",
  "failed",
  "unknown",
]);

export const rWorkflowsGetWorkflowStatusSchema47Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
]);

export const rWorkflowsGetWorkflowStatusSchema48Schema = z.enum([
  "observed_zero",
  "no_source",
  "unreadable",
  "incomplete",
  "confirmed",
]);

export const rWorkflowsGetWorkflowStatusSchema49Schema =
  rWorkflowsGetWorkflowStatusSchema41Schema;

export const rWorkflowsGetWorkflowStatusSchema46Schema = z.strictObject({
  dataset: rWorkflowsGetWorkflowStatusSchema47Schema,
  storeName: rWorkflowsGetWorkflowStatusSchema8Schema,
  date: rWorkflowsGetWorkflowStatusSchema39Schema,
  status: rWorkflowsGetWorkflowStatusSchema48Schema,
  evidenceHash: rWorkflowsGetWorkflowStatusSchema49Schema.optional(),
});

export const rWorkflowsGetWorkflowStatusSchema45Schema = z
  .array(rWorkflowsGetWorkflowStatusSchema46Schema)
  .max(100);

export const rWorkflowsGetWorkflowStatusSchema51Schema = z.strictObject({
  code: z.enum([
    "WORKFLOW_CONFIGURATION_REQUIRED",
    "WORKFLOW_VERSION_INCOMPATIBLE",
    "WORKFLOW_SOURCE_MAPPING_CONFLICT",
    "WORKFLOW_ADMIN_REQUIRED",
    "WORKFLOW_PERMISSION_DENIED",
    "WORKFLOW_INSTALLATION_MISMATCH",
    "WORKFLOW_BUSY",
    "WORKFLOW_CONTROL_REVOKED",
    "WORKFLOW_ACTION_UNKNOWN",
    "WORKFLOW_VERSION_CONFLICT",
    "ORDER_SCOPE_CONFLICT",
    "ORDER_SCOPE_REQUIRED",
    "WORKFLOW_SOURCE_UNAVAILABLE",
  ]),
  actionId: rWorkflowsGetWorkflowStatusSchema0Schema.optional(),
  nextStep: z.string().max(2000),
});

export const rWorkflowsGetWorkflowStatusSchema50Schema = z
  .array(rWorkflowsGetWorkflowStatusSchema51Schema)
  .max(100);

export const rWorkflowsGetWorkflowStatusSchema52Schema = z.enum([
  "pending",
  "confirmed_files_cleaned",
  "retained",
  "blocked",
]);

export const rWorkflowsListEnterpriseWorkflowsSchema0Schema = z.strictObject({
  id: z.string(),
  version: z.string(),
  configurationSchemaVersion: z
    .number()
    .int()
    .min(-9007199254740991)
    .max(9007199254740991),
  minimumLauncherVersion: z.string(),
});

export const rWorkflowsListEnterpriseWorkflowsSchema1Schema = z
  .number()
  .int()
  .min(0)
  .max(4294967295);

export const rWorkflowsListEnterpriseWorkflowsSchema2Schema = z
  .string()
  .regex(
    new RegExp(
      "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
    ),
  );

export const rWorkflowsListEnterpriseWorkflowsSchema4Schema = z.literal(1);

export const rWorkflowsListEnterpriseWorkflowsSchema6Schema = z
  .string()
  .min(1)
  .max(255);

export const rWorkflowsListEnterpriseWorkflowsSchema5Schema = z
  .array(rWorkflowsListEnterpriseWorkflowsSchema6Schema)
  .min(1)
  .max(2000);

export const rWorkflowsListEnterpriseWorkflowsSchema7Schema =
  z.literal("action_required");

export const rWorkflowsListEnterpriseWorkflowsSchema8Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
]);

export const rWorkflowsListEnterpriseWorkflowsSchema3Schema = z.strictObject({
  schemaVersion: rWorkflowsListEnterpriseWorkflowsSchema4Schema,
  storeNames: rWorkflowsListEnterpriseWorkflowsSchema5Schema,
  notificationPolicy: rWorkflowsListEnterpriseWorkflowsSchema7Schema,
  type: z.literal("meituan-daily-ingestion"),
  datasets: z
    .array(rWorkflowsListEnterpriseWorkflowsSchema8Schema)
    .min(1)
    .max(5),
  orderScope: z.literal("settled_only"),
  cleanupPolicy: z.literal("confirmed_files_only"),
});

export const rWorkflowsListEnterpriseWorkflowsSchema11Schema = z.enum([
  "meituan_erp",
  "meituan_reviews",
]);

export const rWorkflowsListEnterpriseWorkflowsSchema12Schema = z.enum([
  "erp",
  "meituan",
  "dianping",
]);

export const rWorkflowsListEnterpriseWorkflowsSchema13Schema =
  rWorkflowsListEnterpriseWorkflowsSchema6Schema;

export const rWorkflowsListEnterpriseWorkflowsSchema14Schema = z.strictObject({
  product: rWorkflowsListEnterpriseWorkflowsSchema11Schema,
  channel: rWorkflowsListEnterpriseWorkflowsSchema12Schema,
  accountRef: rWorkflowsListEnterpriseWorkflowsSchema6Schema,
  sourceStoreId: rWorkflowsListEnterpriseWorkflowsSchema13Schema.optional(),
  sourceStoreName: rWorkflowsListEnterpriseWorkflowsSchema6Schema,
});

export const rWorkflowsListEnterpriseWorkflowsSchema10Schema = z.strictObject({
  source: rWorkflowsListEnterpriseWorkflowsSchema14Schema,
  feedbackId: rWorkflowsListEnterpriseWorkflowsSchema6Schema,
  reason: z.string().min(1).max(2000),
  purpose: z.literal("exclude_source_record"),
});

export const rWorkflowsListEnterpriseWorkflowsSchema15Schema = z.enum([
  "meituan",
  "dianping",
]);

export const rWorkflowsListEnterpriseWorkflowsSchema17Schema = z.boolean();

export const rWorkflowsListEnterpriseWorkflowsSchema19Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const rWorkflowsListEnterpriseWorkflowsSchema18Schema = z
  .array(rWorkflowsListEnterpriseWorkflowsSchema19Schema)
  .max(20);

export const rWorkflowsListEnterpriseWorkflowsSchema20Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const rWorkflowsListEnterpriseWorkflowsSchema16Schema = z.strictObject({
  enabled: rWorkflowsListEnterpriseWorkflowsSchema17Schema,
  recipients: rWorkflowsListEnterpriseWorkflowsSchema18Schema,
  allowedSender: rWorkflowsListEnterpriseWorkflowsSchema20Schema.optional(),
});

export const rWorkflowsListEnterpriseWorkflowsSchema9Schema = z.strictObject({
  schemaVersion: rWorkflowsListEnterpriseWorkflowsSchema4Schema,
  storeNames: rWorkflowsListEnterpriseWorkflowsSchema5Schema,
  notificationPolicy: rWorkflowsListEnterpriseWorkflowsSchema7Schema,
  type: z.literal("meituan-review-operations"),
  executionPolicy: z.strictObject({
    id: z.literal("verified-review-operations"),
    version: z.literal(1),
  }),
  ignoredReviewIdentities: z
    .array(rWorkflowsListEnterpriseWorkflowsSchema10Schema)
    .max(2000),
  channels: z
    .array(rWorkflowsListEnterpriseWorkflowsSchema15Schema)
    .min(1)
    .max(2),
  publication: z.strictObject({
    enabled: z.boolean(),
    storeNames: z
      .array(rWorkflowsListEnterpriseWorkflowsSchema6Schema)
      .max(2000),
  }),
  brandFacts: z.string().max(20000),
  tone: z.string().max(2000),
  draftNotification: rWorkflowsListEnterpriseWorkflowsSchema16Schema,
  cleanupPolicy: z.literal("complete_run_only"),
});

export const rWorkflowsListEnterpriseWorkflowsSchema22Schema = z.strictObject({
  name: rWorkflowsListEnterpriseWorkflowsSchema6Schema,
  storeNames: rWorkflowsListEnterpriseWorkflowsSchema5Schema,
});

export const rWorkflowsListEnterpriseWorkflowsSchema21Schema = z.strictObject({
  schemaVersion: rWorkflowsListEnterpriseWorkflowsSchema4Schema,
  storeNames: rWorkflowsListEnterpriseWorkflowsSchema5Schema,
  notificationPolicy: rWorkflowsListEnterpriseWorkflowsSchema7Schema,
  type: z.literal("weekly-business-report"),
  groups: z.array(rWorkflowsListEnterpriseWorkflowsSchema22Schema).max(100),
  delivery: rWorkflowsListEnterpriseWorkflowsSchema16Schema,
  cleanupPolicy: z.literal("retain_final_report"),
});

export const rWorkflowsListEnterpriseWorkflowsSchema23Schema = z.literal(1);

export const rWorkflowsListEnterpriseWorkflowsSchema24Schema =
  z.literal("Asia/Shanghai");

export const rWorkflowsListEnterpriseWorkflowsSchema26Schema = z.strictObject({
  product: z.enum(["meituan_erp", "meituan_reviews"]),
  accountRef: rWorkflowsListEnterpriseWorkflowsSchema6Schema,
  displayName: rWorkflowsListEnterpriseWorkflowsSchema6Schema,
  sourceEnterpriseName: rWorkflowsListEnterpriseWorkflowsSchema6Schema,
  sourceGroupName: rWorkflowsListEnterpriseWorkflowsSchema6Schema.optional(),
});

export const rWorkflowsListEnterpriseWorkflowsSchema25Schema = z
  .array(rWorkflowsListEnterpriseWorkflowsSchema26Schema)
  .max(100);

export const rWorkflowsListEnterpriseWorkflowsSchema28Schema = z.strictObject({
  source: rWorkflowsListEnterpriseWorkflowsSchema14Schema,
  storeName: rWorkflowsListEnterpriseWorkflowsSchema6Schema,
});

export const rWorkflowsListEnterpriseWorkflowsSchema27Schema = z
  .array(rWorkflowsListEnterpriseWorkflowsSchema28Schema)
  .max(2000);

export const rWorkflowsListEnterpriseWorkflowsSchema30Schema = z.strictObject({
  source: rWorkflowsListEnterpriseWorkflowsSchema14Schema,
  reason: z.string().min(1).max(2000),
});

export const rWorkflowsListEnterpriseWorkflowsSchema29Schema = z
  .array(rWorkflowsListEnterpriseWorkflowsSchema30Schema)
  .max(2000);

export const rWorkflowsListEnterpriseWorkflowsSchema31Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
]);

export const rWorkflowsListEnterpriseWorkflowsSchema32Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
]);

export const rWorkflowsListEnterpriseWorkflowsSchema33Schema = z.enum([
  "meituan",
  "dianping",
]);

export const rWorkflowsListEnterpriseWorkflowsSchema34Schema = z.enum([
  "meituan",
  "dianping",
]);

export const bWorkflowsManageWorkflowInstallationSchema0Schema = z
  .string()
  .min(1)
  .max(64)
  .regex(new RegExp("^[A-Za-z0-9_-]+$"));

export const bWorkflowsManageWorkflowInstallationSchema1Schema = z
  .number()
  .int()
  .min(0)
  .max(4294967295);

export const bWorkflowsManageWorkflowInstallationSchema5Schema = z
  .string()
  .regex(new RegExp("^[a-f0-9]{64}$"));

export const bWorkflowsManageWorkflowInstallationSchema9Schema = z
  .string()
  .min(1)
  .max(255);

export const bWorkflowsManageWorkflowInstallationSchema8Schema = z
  .array(bWorkflowsManageWorkflowInstallationSchema9Schema)
  .min(1)
  .max(2000);

export const bWorkflowsManageWorkflowInstallationSchema11Schema = z
  .string()
  .regex(
    new RegExp(
      "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$",
    ),
  );

export const bWorkflowsManageWorkflowInstallationSchema10Schema =
  z.strictObject({
    startDate: bWorkflowsManageWorkflowInstallationSchema11Schema,
    endDate: bWorkflowsManageWorkflowInstallationSchema11Schema,
  });

export const bWorkflowsManageWorkflowInstallationSchema12Schema =
  z.literal("upload");

export const bWorkflowsManageWorkflowInstallationSchema13Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
]);

export const bWorkflowsManageWorkflowInstallationSchema14Schema =
  z.literal("settled_only");

export const bWorkflowsManageWorkflowInstallationSchema16Schema = z.enum([
  "meituan_erp",
  "meituan_reviews",
]);

export const bWorkflowsManageWorkflowInstallationSchema17Schema = z.enum([
  "erp",
  "meituan",
  "dianping",
]);

export const bWorkflowsManageWorkflowInstallationSchema18Schema =
  bWorkflowsManageWorkflowInstallationSchema9Schema;

export const bWorkflowsManageWorkflowInstallationSchema19Schema =
  z.strictObject({
    product: bWorkflowsManageWorkflowInstallationSchema16Schema,
    channel: bWorkflowsManageWorkflowInstallationSchema17Schema,
    accountRef: bWorkflowsManageWorkflowInstallationSchema9Schema,
    sourceStoreId:
      bWorkflowsManageWorkflowInstallationSchema18Schema.optional(),
    sourceStoreName: bWorkflowsManageWorkflowInstallationSchema9Schema,
  });

export const bWorkflowsManageWorkflowInstallationSchema15Schema =
  bWorkflowsManageWorkflowInstallationSchema19Schema;

export const bWorkflowsManageWorkflowInstallationSchema20Schema =
  z.literal("email");

export const bWorkflowsManageWorkflowInstallationSchema21Schema = z.enum([
  "review_drafts",
  "weekly_report",
  "exception",
]);

export const bWorkflowsManageWorkflowInstallationSchema23Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const bWorkflowsManageWorkflowInstallationSchema24Schema = z
  .array(bWorkflowsManageWorkflowInstallationSchema23Schema)
  .max(20);

export const bWorkflowsManageWorkflowInstallationSchema22Schema =
  bWorkflowsManageWorkflowInstallationSchema24Schema;

export const bWorkflowsManageWorkflowInstallationSchema25Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const bWorkflowsManageWorkflowInstallationSchema27Schema =
  z.strictObject({
    source: bWorkflowsManageWorkflowInstallationSchema15Schema,
    feedbackId: bWorkflowsManageWorkflowInstallationSchema9Schema,
    recipient: z
      .string()
      .max(254)
      .regex(
        new RegExp(
          "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
        ),
      ),
  });

export const bWorkflowsManageWorkflowInstallationSchema26Schema = z
  .array(bWorkflowsManageWorkflowInstallationSchema27Schema)
  .max(100);

export const bWorkflowsManageWorkflowInstallationSchema7Schema = z.union([
  z.strictObject({
    storeNames: bWorkflowsManageWorkflowInstallationSchema8Schema,
    window: bWorkflowsManageWorkflowInstallationSchema10Schema,
    kind: bWorkflowsManageWorkflowInstallationSchema12Schema,
    dataset: bWorkflowsManageWorkflowInstallationSchema13Schema,
    orderScope: bWorkflowsManageWorkflowInstallationSchema14Schema.optional(),
    sourceHash: bWorkflowsManageWorkflowInstallationSchema5Schema,
    metadataHash: bWorkflowsManageWorkflowInstallationSchema5Schema,
  }),
  z.strictObject({
    storeNames: bWorkflowsManageWorkflowInstallationSchema8Schema,
    window: bWorkflowsManageWorkflowInstallationSchema10Schema,
    kind: z.literal("download"),
    dataset: z.enum([
      "business",
      "dishes",
      "in_store_orders",
      "takeaway_orders",
    ]),
    manifestHash: bWorkflowsManageWorkflowInstallationSchema5Schema.optional(),
  }),
  z.strictObject({
    storeNames: bWorkflowsManageWorkflowInstallationSchema8Schema,
    window: bWorkflowsManageWorkflowInstallationSchema10Schema,
    kind: z.literal("review_sync"),
    source: bWorkflowsManageWorkflowInstallationSchema15Schema,
    observedFactsHash: bWorkflowsManageWorkflowInstallationSchema5Schema,
  }),
  z.strictObject({
    kind: z.literal("review_publish"),
    storeName: bWorkflowsManageWorkflowInstallationSchema9Schema,
    source: bWorkflowsManageWorkflowInstallationSchema15Schema,
    feedbackId: bWorkflowsManageWorkflowInstallationSchema9Schema,
    purpose: z.literal("customer_reply"),
  }),
  z.strictObject({
    storeNames: bWorkflowsManageWorkflowInstallationSchema8Schema,
    window: bWorkflowsManageWorkflowInstallationSchema10Schema,
    kind: bWorkflowsManageWorkflowInstallationSchema20Schema,
    purpose: bWorkflowsManageWorkflowInstallationSchema21Schema,
    recipients: bWorkflowsManageWorkflowInstallationSchema22Schema,
    sender: bWorkflowsManageWorkflowInstallationSchema25Schema,
    deliveryVersion: bWorkflowsManageWorkflowInstallationSchema1Schema,
    reviewIdentities:
      bWorkflowsManageWorkflowInstallationSchema26Schema.optional(),
  }),
]);

export const bWorkflowsManageWorkflowInstallationSchema28Schema =
  bWorkflowsManageWorkflowInstallationSchema5Schema;

export const bWorkflowsManageWorkflowInstallationSchema29Schema =
  bWorkflowsManageWorkflowInstallationSchema0Schema;

export const bWorkflowsManageWorkflowInstallationSchema6Schema = z.strictObject(
  {
    actionId: bWorkflowsManageWorkflowInstallationSchema0Schema,
    identity: bWorkflowsManageWorkflowInstallationSchema7Schema,
    artifactHash: bWorkflowsManageWorkflowInstallationSchema28Schema.optional(),
    correlationMarker:
      bWorkflowsManageWorkflowInstallationSchema29Schema.optional(),
  },
);

export const bWorkflowsManageWorkflowInstallationSchema31Schema = z.enum([
  "confirmed",
  "failed",
  "unknown",
]);

export const bWorkflowsManageWorkflowInstallationSchema32Schema = z.enum([
  "service_status",
  "launcher_transfer",
  "provider_readback",
  "smedc_readback",
  "manual_resolution",
  "request_rejected",
  "transport_unknown",
]);

export const bWorkflowsManageWorkflowInstallationSchema33Schema =
  bWorkflowsManageWorkflowInstallationSchema9Schema;

export const bWorkflowsManageWorkflowInstallationSchema34Schema =
  bWorkflowsManageWorkflowInstallationSchema9Schema;

export const bWorkflowsManageWorkflowInstallationSchema35Schema =
  bWorkflowsManageWorkflowInstallationSchema5Schema;

export const bWorkflowsManageWorkflowInstallationSchema36Schema = z
  .string()
  .max(2000);

export const bWorkflowsManageWorkflowInstallationSchema37Schema = z
  .string()
  .regex(
    new RegExp(
      "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
    ),
  );

export const bWorkflowsManageWorkflowInstallationSchema38Schema =
  z.strictObject({
    identityHash: bWorkflowsManageWorkflowInstallationSchema5Schema,
    manifestHash: bWorkflowsManageWorkflowInstallationSchema5Schema,
    resultHash: bWorkflowsManageWorkflowInstallationSchema5Schema,
    launcherVersion: z.string().regex(new RegExp("^\\d+\\.\\d+\\.\\d+$")),
    verifiedAt: z
      .string()
      .regex(
        new RegExp(
          "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
        ),
      ),
    partitionCount: z.number().int().min(0).max(100000),
    fileCount: z.number().int().min(0).max(100000),
    totalByteSize: z.string().regex(new RegExp("^\\d{1,20}$")),
    totalRowCount: z.string().regex(new RegExp("^\\d{1,20}$")),
    requestId: bWorkflowsManageWorkflowInstallationSchema0Schema.optional(),
  });

export const bWorkflowsManageWorkflowInstallationSchema39Schema =
  z.strictObject({
    identityHash: bWorkflowsManageWorkflowInstallationSchema5Schema,
    observedFactsHash: bWorkflowsManageWorkflowInstallationSchema5Schema,
    resultHash: bWorkflowsManageWorkflowInstallationSchema5Schema,
    recordIds: z
      .array(bWorkflowsManageWorkflowInstallationSchema0Schema)
      .min(1)
      .max(1000),
    observedAt: z
      .string()
      .regex(
        new RegExp(
          "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
        ),
      ),
    outcome: z.literal("matched"),
    reviewCount: z.number().int().max(1000).gt(0),
    matchedCount: z.number().int().max(1000).gt(0),
  });

export const bWorkflowsManageWorkflowInstallationSchema40Schema =
  z.strictObject({
    identityHash: bWorkflowsManageWorkflowInstallationSchema5Schema,
    artifactHash: bWorkflowsManageWorkflowInstallationSchema5Schema,
    correlationMarker: bWorkflowsManageWorkflowInstallationSchema0Schema,
    providerReceiptId: bWorkflowsManageWorkflowInstallationSchema9Schema,
    observedAt: z
      .string()
      .regex(
        new RegExp(
          "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
        ),
      ),
    outcome: z.enum(["published", "sent", "not_executed"]),
  });

export const bWorkflowsManageWorkflowInstallationSchema30Schema =
  z.strictObject({
    actionId: bWorkflowsManageWorkflowInstallationSchema0Schema,
    state: bWorkflowsManageWorkflowInstallationSchema31Schema,
    evidence: bWorkflowsManageWorkflowInstallationSchema32Schema,
    receiptId: bWorkflowsManageWorkflowInstallationSchema33Schema.optional(),
    jobId: bWorkflowsManageWorkflowInstallationSchema34Schema.optional(),
    resultHash: bWorkflowsManageWorkflowInstallationSchema35Schema.optional(),
    reason: bWorkflowsManageWorkflowInstallationSchema36Schema.optional(),
    verifiedAt: bWorkflowsManageWorkflowInstallationSchema37Schema,
    launcherTransfer:
      bWorkflowsManageWorkflowInstallationSchema38Schema.optional(),
    smedcReadback:
      bWorkflowsManageWorkflowInstallationSchema39Schema.optional(),
    providerReadback:
      bWorkflowsManageWorkflowInstallationSchema40Schema.optional(),
  });

export const bWorkflowsManageWorkflowInstallationSchema4Schema = z.strictObject(
  {
    legacyKeyHash: bWorkflowsManageWorkflowInstallationSchema5Schema,
    intent: bWorkflowsManageWorkflowInstallationSchema6Schema,
    receipt: bWorkflowsManageWorkflowInstallationSchema30Schema,
  },
);

export const bWorkflowsManageWorkflowInstallationSchema3Schema = z
  .array(bWorkflowsManageWorkflowInstallationSchema4Schema)
  .max(100);

export const bWorkflowsManageWorkflowInstallationSchema43Schema = z.enum([
  "source_conflict",
  "missing_receipt",
  "unknown_action",
  "missing_local_evidence",
]);

export const bWorkflowsManageWorkflowInstallationSchema44Schema =
  bWorkflowsManageWorkflowInstallationSchema5Schema;

export const bWorkflowsManageWorkflowInstallationSchema45Schema =
  bWorkflowsManageWorkflowInstallationSchema6Schema;

export const bWorkflowsManageWorkflowInstallationSchema46Schema =
  bWorkflowsManageWorkflowInstallationSchema30Schema;

export const bWorkflowsManageWorkflowInstallationSchema42Schema =
  z.strictObject({
    code: bWorkflowsManageWorkflowInstallationSchema43Schema,
    sourceRef: bWorkflowsManageWorkflowInstallationSchema0Schema,
    evidenceHash: bWorkflowsManageWorkflowInstallationSchema44Schema.optional(),
    intent: bWorkflowsManageWorkflowInstallationSchema45Schema.optional(),
    receipt: bWorkflowsManageWorkflowInstallationSchema46Schema.optional(),
  });

export const bWorkflowsManageWorkflowInstallationSchema41Schema = z
  .array(bWorkflowsManageWorkflowInstallationSchema42Schema)
  .max(100);

export const bWorkflowsManageWorkflowInstallationSchema49Schema = z.enum([
  "business",
  "evidence",
]);

export const bWorkflowsManageWorkflowInstallationSchema50Schema = z.enum([
  "open",
  "waived",
  "resolved",
]);

export const bWorkflowsManageWorkflowInstallationSchema51Schema = z.enum([
  "preparing",
  "collecting",
  "validating",
  "processing",
  "delivering",
  "verifying",
  "cleaning",
  "finished",
]);

export const bWorkflowsManageWorkflowInstallationSchema52Schema = z.union([
  z.strictObject({
    kind: z.literal("dataset"),
    dataset: z.enum([
      "business",
      "dishes",
      "in_store_orders",
      "takeaway_orders",
      "delivery_ledger",
    ]),
    storeNames: bWorkflowsManageWorkflowInstallationSchema8Schema,
    window: bWorkflowsManageWorkflowInstallationSchema10Schema,
  }),
  z.strictObject({
    kind: z.literal("reviews"),
    source: bWorkflowsManageWorkflowInstallationSchema15Schema,
    storeName: bWorkflowsManageWorkflowInstallationSchema9Schema,
    window: bWorkflowsManageWorkflowInstallationSchema10Schema,
    feedbackId: bWorkflowsManageWorkflowInstallationSchema9Schema.optional(),
  }),
  z.strictObject({
    kind: z.literal("report"),
    storeNames: bWorkflowsManageWorkflowInstallationSchema8Schema,
    window: bWorkflowsManageWorkflowInstallationSchema10Schema,
  }),
  z.strictObject({
    kind: z.literal("unknown_scope"),
    reason: z.enum([
      "scope_not_preserved",
      "missing_local_evidence",
      "ambiguous_source_identity",
    ]),
  }),
]);

export const bWorkflowsManageWorkflowInstallationSchema53Schema =
  bWorkflowsManageWorkflowInstallationSchema0Schema;

export const bWorkflowsManageWorkflowInstallationSchema54Schema =
  bWorkflowsManageWorkflowInstallationSchema5Schema;

export const bWorkflowsManageWorkflowInstallationSchema55Schema = z
  .string()
  .min(1)
  .max(2000);

export const bWorkflowsManageWorkflowInstallationSchema48Schema =
  z.strictObject({
    itemId: bWorkflowsManageWorkflowInstallationSchema0Schema,
    kind: bWorkflowsManageWorkflowInstallationSchema49Schema,
    disposition: bWorkflowsManageWorkflowInstallationSchema50Schema,
    stage: bWorkflowsManageWorkflowInstallationSchema51Schema,
    scope: bWorkflowsManageWorkflowInstallationSchema52Schema,
    evidenceRef: bWorkflowsManageWorkflowInstallationSchema53Schema.optional(),
    evidenceHash: bWorkflowsManageWorkflowInstallationSchema54Schema.optional(),
    resolutionReason:
      bWorkflowsManageWorkflowInstallationSchema55Schema.optional(),
  });

export const bWorkflowsManageWorkflowInstallationSchema47Schema = z
  .array(bWorkflowsManageWorkflowInstallationSchema48Schema)
  .max(100);

export const bWorkflowsManageWorkflowInstallationSchema2Schema = z.strictObject(
  {
    workflowId: bWorkflowsManageWorkflowInstallationSchema0Schema,
    completedActions: bWorkflowsManageWorkflowInstallationSchema3Schema,
    unresolved: bWorkflowsManageWorkflowInstallationSchema41Schema,
    recoveryItems:
      bWorkflowsManageWorkflowInstallationSchema47Schema.optional(),
  },
);

export const bWorkflowsManageWorkflowInstallationSchema56Schema =
  z.strictObject({
    host: z.literal("codex"),
    platform: z.literal("macos"),
    taskId: bWorkflowsManageWorkflowInstallationSchema0Schema,
    projectRef: bWorkflowsManageWorkflowInstallationSchema0Schema,
    cron: z.string().min(1).max(255),
    timezone: z.literal("Asia/Shanghai"),
    model: bWorkflowsManageWorkflowInstallationSchema9Schema,
    reasoningEffort: z.enum([
      "minimal",
      "low",
      "medium",
      "high",
      "xhigh",
      "max",
      "ultra",
    ]),
    state: z.enum(["paused", "enabled"]),
    verifiedAt: z
      .string()
      .regex(
        new RegExp(
          "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
        ),
      ),
  });

export const bWorkflowsManageWorkflowInstallationSchema57Schema =
  z.strictObject({
    capability: z.enum([
      "configuration",
      "permissions",
      "meituan_erp",
      "meituan_reviews",
      "download",
      "workspace",
      "dependencies",
      "email_identity",
      "sent_mail_lookup",
      "host_schedule",
      "host_timezone",
      "host_model",
      "assignment",
      "file_format",
    ]),
    status: z.enum([
      "ready",
      "needs_configuration",
      "needs_login",
      "permission_denied",
      "unsupported",
      "unavailable",
    ]),
    nextStep: z.string().max(2000),
    checkedAt: z
      .string()
      .regex(
        new RegExp(
          "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
        ),
      ),
    sampleStatus: z.enum(["verified", "no_sample", "not_checked"]).optional(),
  });

export const bWorkflowsManageWorkflowInstallationSchema59Schema = z.literal(1);

export const bWorkflowsManageWorkflowInstallationSchema60Schema =
  z.literal("Asia/Shanghai");

export const bWorkflowsManageWorkflowInstallationSchema62Schema =
  z.strictObject({
    product: z.enum(["meituan_erp", "meituan_reviews"]),
    accountRef: bWorkflowsManageWorkflowInstallationSchema9Schema,
    displayName: bWorkflowsManageWorkflowInstallationSchema9Schema,
    sourceEnterpriseName: bWorkflowsManageWorkflowInstallationSchema9Schema,
    sourceGroupName:
      bWorkflowsManageWorkflowInstallationSchema9Schema.optional(),
  });

export const bWorkflowsManageWorkflowInstallationSchema61Schema = z
  .array(bWorkflowsManageWorkflowInstallationSchema62Schema)
  .max(100);

export const bWorkflowsManageWorkflowInstallationSchema64Schema =
  z.strictObject({
    source: bWorkflowsManageWorkflowInstallationSchema19Schema,
    storeName: bWorkflowsManageWorkflowInstallationSchema9Schema,
  });

export const bWorkflowsManageWorkflowInstallationSchema63Schema = z
  .array(bWorkflowsManageWorkflowInstallationSchema64Schema)
  .max(2000);

export const bWorkflowsManageWorkflowInstallationSchema66Schema =
  z.strictObject({
    source: bWorkflowsManageWorkflowInstallationSchema19Schema,
    reason: z.string().min(1).max(2000),
  });

export const bWorkflowsManageWorkflowInstallationSchema65Schema = z
  .array(bWorkflowsManageWorkflowInstallationSchema66Schema)
  .max(2000);

export const bWorkflowsManageWorkflowInstallationSchema58Schema =
  z.strictObject({
    schemaVersion: bWorkflowsManageWorkflowInstallationSchema59Schema,
    timezone: bWorkflowsManageWorkflowInstallationSchema60Schema,
    sourceAccounts: bWorkflowsManageWorkflowInstallationSchema61Schema,
    storeMappings: bWorkflowsManageWorkflowInstallationSchema63Schema,
    exclusions: bWorkflowsManageWorkflowInstallationSchema65Schema,
  });

export const bWorkflowsManageWorkflowInstallationSchema70Schema = z.literal(1);

export const bWorkflowsManageWorkflowInstallationSchema71Schema =
  z.literal("action_required");

export const bWorkflowsManageWorkflowInstallationSchema72Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
]);

export const bWorkflowsManageWorkflowInstallationSchema69Schema =
  z.strictObject({
    schemaVersion: bWorkflowsManageWorkflowInstallationSchema70Schema,
    storeNames: bWorkflowsManageWorkflowInstallationSchema8Schema,
    notificationPolicy: bWorkflowsManageWorkflowInstallationSchema71Schema,
    type: z.literal("meituan-daily-ingestion"),
    datasets: z
      .array(bWorkflowsManageWorkflowInstallationSchema72Schema)
      .min(1)
      .max(5),
    orderScope: z.literal("settled_only"),
    cleanupPolicy: z.literal("confirmed_files_only"),
  });

export const bWorkflowsManageWorkflowInstallationSchema74Schema =
  z.strictObject({
    source: bWorkflowsManageWorkflowInstallationSchema15Schema,
    feedbackId: bWorkflowsManageWorkflowInstallationSchema9Schema,
    reason: z.string().min(1).max(2000),
    purpose: z.literal("exclude_source_record"),
  });

export const bWorkflowsManageWorkflowInstallationSchema75Schema = z.enum([
  "meituan",
  "dianping",
]);

export const bWorkflowsManageWorkflowInstallationSchema77Schema = z.boolean();

export const bWorkflowsManageWorkflowInstallationSchema78Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const bWorkflowsManageWorkflowInstallationSchema76Schema =
  z.strictObject({
    enabled: bWorkflowsManageWorkflowInstallationSchema77Schema,
    recipients: bWorkflowsManageWorkflowInstallationSchema24Schema,
    allowedSender:
      bWorkflowsManageWorkflowInstallationSchema78Schema.optional(),
  });

export const bWorkflowsManageWorkflowInstallationSchema73Schema =
  z.strictObject({
    schemaVersion: bWorkflowsManageWorkflowInstallationSchema70Schema,
    storeNames: bWorkflowsManageWorkflowInstallationSchema8Schema,
    notificationPolicy: bWorkflowsManageWorkflowInstallationSchema71Schema,
    type: z.literal("meituan-review-operations"),
    executionPolicy: z.strictObject({
      id: z.literal("verified-review-operations"),
      version: z.literal(1),
    }),
    ignoredReviewIdentities: z
      .array(bWorkflowsManageWorkflowInstallationSchema74Schema)
      .max(2000),
    channels: z
      .array(bWorkflowsManageWorkflowInstallationSchema75Schema)
      .min(1)
      .max(2),
    publication: z.strictObject({
      enabled: z.boolean(),
      storeNames: z
        .array(bWorkflowsManageWorkflowInstallationSchema9Schema)
        .max(2000),
    }),
    brandFacts: z.string().max(20000),
    tone: z.string().max(2000),
    draftNotification: bWorkflowsManageWorkflowInstallationSchema76Schema,
    cleanupPolicy: z.literal("complete_run_only"),
  });

export const bWorkflowsManageWorkflowInstallationSchema80Schema =
  z.strictObject({
    name: bWorkflowsManageWorkflowInstallationSchema9Schema,
    storeNames: bWorkflowsManageWorkflowInstallationSchema8Schema,
  });

export const bWorkflowsManageWorkflowInstallationSchema79Schema =
  z.strictObject({
    schemaVersion: bWorkflowsManageWorkflowInstallationSchema70Schema,
    storeNames: bWorkflowsManageWorkflowInstallationSchema8Schema,
    notificationPolicy: bWorkflowsManageWorkflowInstallationSchema71Schema,
    type: z.literal("weekly-business-report"),
    groups: z
      .array(bWorkflowsManageWorkflowInstallationSchema80Schema)
      .max(100),
    delivery: bWorkflowsManageWorkflowInstallationSchema76Schema,
    cleanupPolicy: z.literal("retain_final_report"),
  });

export const bWorkflowsManageWorkflowInstallationSchema82Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
]);

export const bWorkflowsManageWorkflowInstallationSchema83Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
]);

export const bWorkflowsManageWorkflowInstallationSchema84Schema = z.enum([
  "meituan",
  "dianping",
]);

export const bWorkflowsManageWorkflowInstallationSchema85Schema = z.enum([
  "meituan",
  "dianping",
]);

export const bWorkflowsManageWorkflowInstallationSchema81Schema = z.union([
  z.strictObject({
    kind: z.literal("upload"),
    datasets: z
      .array(bWorkflowsManageWorkflowInstallationSchema82Schema)
      .min(1)
      .max(5),
    storeNames: bWorkflowsManageWorkflowInstallationSchema8Schema,
  }),
  z.strictObject({
    kind: z.literal("download"),
    datasets: z
      .array(bWorkflowsManageWorkflowInstallationSchema83Schema)
      .min(1)
      .max(4),
    storeNames: bWorkflowsManageWorkflowInstallationSchema8Schema,
  }),
  z.strictObject({
    kind: z.literal("review_sync"),
    channels: z
      .array(bWorkflowsManageWorkflowInstallationSchema84Schema)
      .min(1)
      .max(2),
    storeNames: bWorkflowsManageWorkflowInstallationSchema8Schema,
  }),
  z.strictObject({
    kind: z.literal("review_publish"),
    channels: z
      .array(bWorkflowsManageWorkflowInstallationSchema85Schema)
      .min(1)
      .max(2),
    storeNames: bWorkflowsManageWorkflowInstallationSchema8Schema,
  }),
  z.strictObject({
    kind: z.literal("email"),
    purpose: z.enum(["review_drafts", "weekly_report", "exception"]),
    storeNames: bWorkflowsManageWorkflowInstallationSchema8Schema,
    recipients: bWorkflowsManageWorkflowInstallationSchema24Schema,
    allowedSender: z
      .string()
      .max(254)
      .regex(
        new RegExp(
          "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
        ),
      ),
    deliveryVersion: bWorkflowsManageWorkflowInstallationSchema1Schema,
  }),
]);

export const bWorkflowsManageWorkflowInstallationSchema68Schema =
  z.strictObject({
    workflowId: bWorkflowsManageWorkflowInstallationSchema0Schema,
    configuration: z.union([
      bWorkflowsManageWorkflowInstallationSchema69Schema,
      bWorkflowsManageWorkflowInstallationSchema73Schema,
      bWorkflowsManageWorkflowInstallationSchema79Schema,
    ]),
    authorizations: z
      .array(bWorkflowsManageWorkflowInstallationSchema81Schema)
      .max(20),
    hostSnapshot: bWorkflowsManageWorkflowInstallationSchema56Schema,
    completedActions: bWorkflowsManageWorkflowInstallationSchema3Schema,
    recoveryItems:
      bWorkflowsManageWorkflowInstallationSchema47Schema.optional(),
    unresolved: bWorkflowsManageWorkflowInstallationSchema41Schema,
  });

export const bWorkflowsManageWorkflowInstallationSchema67Schema = z
  .array(bWorkflowsManageWorkflowInstallationSchema68Schema)
  .min(1)
  .max(3);

export const rWorkflowsManageWorkflowInstallationSchema0Schema = z.string();

export const rWorkflowsManageWorkflowInstallationSchema1Schema = z.string();

export const rWorkflowsManageWorkflowInstallationSchema2Schema = z.string();

export const rWorkflowsManageWorkflowInstallationSchema3Schema = z.string();

export const rWorkflowsManageWorkflowInstallationSchema4Schema = z
  .string()
  .regex(new RegExp("^[a-f0-9]{64}$"));

export const rWorkflowsManageWorkflowInstallationSchema5Schema = z
  .number()
  .int()
  .min(-9007199254740991)
  .max(9007199254740991);

export const rWorkflowsManageWorkflowInstallationSchema6Schema = z
  .number()
  .int()
  .min(-9007199254740991)
  .max(9007199254740991);

export const rWorkflowsManageWorkflowInstallationSchema7Schema = z.enum([
  "preview",
  "validated",
  "imported",
  "host_switched",
  "verified",
]);

export const rWorkflowsManageWorkflowInstallationSchema9Schema = z
  .number()
  .int()
  .min(0)
  .max(4294967295);

export const rWorkflowsManageWorkflowInstallationSchema11Schema = z.literal(1);

export const rWorkflowsManageWorkflowInstallationSchema12Schema =
  z.literal("Asia/Shanghai");

export const rWorkflowsManageWorkflowInstallationSchema15Schema = z
  .string()
  .min(1)
  .max(255);

export const rWorkflowsManageWorkflowInstallationSchema14Schema =
  z.strictObject({
    product: z.enum(["meituan_erp", "meituan_reviews"]),
    accountRef: rWorkflowsManageWorkflowInstallationSchema15Schema,
    displayName: rWorkflowsManageWorkflowInstallationSchema15Schema,
    sourceEnterpriseName: rWorkflowsManageWorkflowInstallationSchema15Schema,
    sourceGroupName:
      rWorkflowsManageWorkflowInstallationSchema15Schema.optional(),
  });

export const rWorkflowsManageWorkflowInstallationSchema13Schema = z
  .array(rWorkflowsManageWorkflowInstallationSchema14Schema)
  .max(100);

export const rWorkflowsManageWorkflowInstallationSchema19Schema = z.enum([
  "meituan_erp",
  "meituan_reviews",
]);

export const rWorkflowsManageWorkflowInstallationSchema20Schema = z.enum([
  "erp",
  "meituan",
  "dianping",
]);

export const rWorkflowsManageWorkflowInstallationSchema21Schema =
  rWorkflowsManageWorkflowInstallationSchema15Schema;

export const rWorkflowsManageWorkflowInstallationSchema18Schema =
  z.strictObject({
    product: rWorkflowsManageWorkflowInstallationSchema19Schema,
    channel: rWorkflowsManageWorkflowInstallationSchema20Schema,
    accountRef: rWorkflowsManageWorkflowInstallationSchema15Schema,
    sourceStoreId:
      rWorkflowsManageWorkflowInstallationSchema21Schema.optional(),
    sourceStoreName: rWorkflowsManageWorkflowInstallationSchema15Schema,
  });

export const rWorkflowsManageWorkflowInstallationSchema17Schema =
  z.strictObject({
    source: rWorkflowsManageWorkflowInstallationSchema18Schema,
    storeName: rWorkflowsManageWorkflowInstallationSchema15Schema,
  });

export const rWorkflowsManageWorkflowInstallationSchema16Schema = z
  .array(rWorkflowsManageWorkflowInstallationSchema17Schema)
  .max(2000);

export const rWorkflowsManageWorkflowInstallationSchema23Schema =
  z.strictObject({
    source: rWorkflowsManageWorkflowInstallationSchema18Schema,
    reason: z.string().min(1).max(2000),
  });

export const rWorkflowsManageWorkflowInstallationSchema22Schema = z
  .array(rWorkflowsManageWorkflowInstallationSchema23Schema)
  .max(2000);

export const rWorkflowsManageWorkflowInstallationSchema10Schema =
  z.strictObject({
    schemaVersion: rWorkflowsManageWorkflowInstallationSchema11Schema,
    timezone: rWorkflowsManageWorkflowInstallationSchema12Schema,
    sourceAccounts: rWorkflowsManageWorkflowInstallationSchema13Schema,
    storeMappings: rWorkflowsManageWorkflowInstallationSchema16Schema,
    exclusions: rWorkflowsManageWorkflowInstallationSchema22Schema,
  });

export const rWorkflowsManageWorkflowInstallationSchema26Schema = z
  .string()
  .min(1)
  .max(64)
  .regex(new RegExp("^[A-Za-z0-9_-]+$"));

export const rWorkflowsManageWorkflowInstallationSchema28Schema = z.literal(1);

export const rWorkflowsManageWorkflowInstallationSchema29Schema = z
  .array(rWorkflowsManageWorkflowInstallationSchema15Schema)
  .min(1)
  .max(2000);

export const rWorkflowsManageWorkflowInstallationSchema30Schema =
  z.literal("action_required");

export const rWorkflowsManageWorkflowInstallationSchema31Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
]);

export const rWorkflowsManageWorkflowInstallationSchema27Schema =
  z.strictObject({
    schemaVersion: rWorkflowsManageWorkflowInstallationSchema28Schema,
    storeNames: rWorkflowsManageWorkflowInstallationSchema29Schema,
    notificationPolicy: rWorkflowsManageWorkflowInstallationSchema30Schema,
    type: z.literal("meituan-daily-ingestion"),
    datasets: z
      .array(rWorkflowsManageWorkflowInstallationSchema31Schema)
      .min(1)
      .max(5),
    orderScope: z.literal("settled_only"),
    cleanupPolicy: z.literal("confirmed_files_only"),
  });

export const rWorkflowsManageWorkflowInstallationSchema34Schema =
  rWorkflowsManageWorkflowInstallationSchema18Schema;

export const rWorkflowsManageWorkflowInstallationSchema33Schema =
  z.strictObject({
    source: rWorkflowsManageWorkflowInstallationSchema34Schema,
    feedbackId: rWorkflowsManageWorkflowInstallationSchema15Schema,
    reason: z.string().min(1).max(2000),
    purpose: z.literal("exclude_source_record"),
  });

export const rWorkflowsManageWorkflowInstallationSchema35Schema = z.enum([
  "meituan",
  "dianping",
]);

export const rWorkflowsManageWorkflowInstallationSchema37Schema = z.boolean();

export const rWorkflowsManageWorkflowInstallationSchema39Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const rWorkflowsManageWorkflowInstallationSchema38Schema = z
  .array(rWorkflowsManageWorkflowInstallationSchema39Schema)
  .max(20);

export const rWorkflowsManageWorkflowInstallationSchema40Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const rWorkflowsManageWorkflowInstallationSchema36Schema =
  z.strictObject({
    enabled: rWorkflowsManageWorkflowInstallationSchema37Schema,
    recipients: rWorkflowsManageWorkflowInstallationSchema38Schema,
    allowedSender:
      rWorkflowsManageWorkflowInstallationSchema40Schema.optional(),
  });

export const rWorkflowsManageWorkflowInstallationSchema32Schema =
  z.strictObject({
    schemaVersion: rWorkflowsManageWorkflowInstallationSchema28Schema,
    storeNames: rWorkflowsManageWorkflowInstallationSchema29Schema,
    notificationPolicy: rWorkflowsManageWorkflowInstallationSchema30Schema,
    type: z.literal("meituan-review-operations"),
    executionPolicy: z.strictObject({
      id: z.literal("verified-review-operations"),
      version: z.literal(1),
    }),
    ignoredReviewIdentities: z
      .array(rWorkflowsManageWorkflowInstallationSchema33Schema)
      .max(2000),
    channels: z
      .array(rWorkflowsManageWorkflowInstallationSchema35Schema)
      .min(1)
      .max(2),
    publication: z.strictObject({
      enabled: z.boolean(),
      storeNames: z
        .array(rWorkflowsManageWorkflowInstallationSchema15Schema)
        .max(2000),
    }),
    brandFacts: z.string().max(20000),
    tone: z.string().max(2000),
    draftNotification: rWorkflowsManageWorkflowInstallationSchema36Schema,
    cleanupPolicy: z.literal("complete_run_only"),
  });

export const rWorkflowsManageWorkflowInstallationSchema42Schema =
  z.strictObject({
    name: rWorkflowsManageWorkflowInstallationSchema15Schema,
    storeNames: rWorkflowsManageWorkflowInstallationSchema29Schema,
  });

export const rWorkflowsManageWorkflowInstallationSchema41Schema =
  z.strictObject({
    schemaVersion: rWorkflowsManageWorkflowInstallationSchema28Schema,
    storeNames: rWorkflowsManageWorkflowInstallationSchema29Schema,
    notificationPolicy: rWorkflowsManageWorkflowInstallationSchema30Schema,
    type: z.literal("weekly-business-report"),
    groups: z
      .array(rWorkflowsManageWorkflowInstallationSchema42Schema)
      .max(100),
    delivery: rWorkflowsManageWorkflowInstallationSchema36Schema,
    cleanupPolicy: z.literal("retain_final_report"),
  });

export const rWorkflowsManageWorkflowInstallationSchema44Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
]);

export const rWorkflowsManageWorkflowInstallationSchema45Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
]);

export const rWorkflowsManageWorkflowInstallationSchema46Schema = z.enum([
  "meituan",
  "dianping",
]);

export const rWorkflowsManageWorkflowInstallationSchema47Schema = z.enum([
  "meituan",
  "dianping",
]);

export const rWorkflowsManageWorkflowInstallationSchema43Schema = z.union([
  z.strictObject({
    kind: z.literal("upload"),
    datasets: z
      .array(rWorkflowsManageWorkflowInstallationSchema44Schema)
      .min(1)
      .max(5),
    storeNames: rWorkflowsManageWorkflowInstallationSchema29Schema,
  }),
  z.strictObject({
    kind: z.literal("download"),
    datasets: z
      .array(rWorkflowsManageWorkflowInstallationSchema45Schema)
      .min(1)
      .max(4),
    storeNames: rWorkflowsManageWorkflowInstallationSchema29Schema,
  }),
  z.strictObject({
    kind: z.literal("review_sync"),
    channels: z
      .array(rWorkflowsManageWorkflowInstallationSchema46Schema)
      .min(1)
      .max(2),
    storeNames: rWorkflowsManageWorkflowInstallationSchema29Schema,
  }),
  z.strictObject({
    kind: z.literal("review_publish"),
    channels: z
      .array(rWorkflowsManageWorkflowInstallationSchema47Schema)
      .min(1)
      .max(2),
    storeNames: rWorkflowsManageWorkflowInstallationSchema29Schema,
  }),
  z.strictObject({
    kind: z.literal("email"),
    purpose: z.enum(["review_drafts", "weekly_report", "exception"]),
    storeNames: rWorkflowsManageWorkflowInstallationSchema29Schema,
    recipients: rWorkflowsManageWorkflowInstallationSchema38Schema,
    allowedSender: z
      .string()
      .max(254)
      .regex(
        new RegExp(
          "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
        ),
      ),
    deliveryVersion: rWorkflowsManageWorkflowInstallationSchema9Schema,
  }),
]);

export const rWorkflowsManageWorkflowInstallationSchema48Schema =
  z.strictObject({
    host: z.literal("codex"),
    platform: z.literal("macos"),
    taskId: rWorkflowsManageWorkflowInstallationSchema26Schema,
    projectRef: rWorkflowsManageWorkflowInstallationSchema26Schema,
    cron: z.string().min(1).max(255),
    timezone: z.literal("Asia/Shanghai"),
    model: rWorkflowsManageWorkflowInstallationSchema15Schema,
    reasoningEffort: z.enum([
      "minimal",
      "low",
      "medium",
      "high",
      "xhigh",
      "max",
      "ultra",
    ]),
    state: z.enum(["paused", "enabled"]),
    verifiedAt: z
      .string()
      .regex(
        new RegExp(
          "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
        ),
      ),
  });

export const rWorkflowsManageWorkflowInstallationSchema54Schema = z
  .string()
  .regex(
    new RegExp(
      "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$",
    ),
  );

export const rWorkflowsManageWorkflowInstallationSchema53Schema =
  z.strictObject({
    startDate: rWorkflowsManageWorkflowInstallationSchema54Schema,
    endDate: rWorkflowsManageWorkflowInstallationSchema54Schema,
  });

export const rWorkflowsManageWorkflowInstallationSchema55Schema =
  z.literal("upload");

export const rWorkflowsManageWorkflowInstallationSchema56Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
]);

export const rWorkflowsManageWorkflowInstallationSchema57Schema =
  z.literal("settled_only");

export const rWorkflowsManageWorkflowInstallationSchema58Schema =
  z.literal("email");

export const rWorkflowsManageWorkflowInstallationSchema59Schema = z.enum([
  "review_drafts",
  "weekly_report",
  "exception",
]);

export const rWorkflowsManageWorkflowInstallationSchema60Schema =
  rWorkflowsManageWorkflowInstallationSchema38Schema;

export const rWorkflowsManageWorkflowInstallationSchema61Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const rWorkflowsManageWorkflowInstallationSchema63Schema =
  z.strictObject({
    source: rWorkflowsManageWorkflowInstallationSchema34Schema,
    feedbackId: rWorkflowsManageWorkflowInstallationSchema15Schema,
    recipient: z
      .string()
      .max(254)
      .regex(
        new RegExp(
          "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
        ),
      ),
  });

export const rWorkflowsManageWorkflowInstallationSchema62Schema = z
  .array(rWorkflowsManageWorkflowInstallationSchema63Schema)
  .max(100);

export const rWorkflowsManageWorkflowInstallationSchema52Schema = z.union([
  z.strictObject({
    storeNames: rWorkflowsManageWorkflowInstallationSchema29Schema,
    window: rWorkflowsManageWorkflowInstallationSchema53Schema,
    kind: rWorkflowsManageWorkflowInstallationSchema55Schema,
    dataset: rWorkflowsManageWorkflowInstallationSchema56Schema,
    orderScope: rWorkflowsManageWorkflowInstallationSchema57Schema.optional(),
    sourceHash: rWorkflowsManageWorkflowInstallationSchema4Schema,
    metadataHash: rWorkflowsManageWorkflowInstallationSchema4Schema,
  }),
  z.strictObject({
    storeNames: rWorkflowsManageWorkflowInstallationSchema29Schema,
    window: rWorkflowsManageWorkflowInstallationSchema53Schema,
    kind: z.literal("download"),
    dataset: z.enum([
      "business",
      "dishes",
      "in_store_orders",
      "takeaway_orders",
    ]),
    manifestHash: rWorkflowsManageWorkflowInstallationSchema4Schema.optional(),
  }),
  z.strictObject({
    storeNames: rWorkflowsManageWorkflowInstallationSchema29Schema,
    window: rWorkflowsManageWorkflowInstallationSchema53Schema,
    kind: z.literal("review_sync"),
    source: rWorkflowsManageWorkflowInstallationSchema34Schema,
    observedFactsHash: rWorkflowsManageWorkflowInstallationSchema4Schema,
  }),
  z.strictObject({
    kind: z.literal("review_publish"),
    storeName: rWorkflowsManageWorkflowInstallationSchema15Schema,
    source: rWorkflowsManageWorkflowInstallationSchema34Schema,
    feedbackId: rWorkflowsManageWorkflowInstallationSchema15Schema,
    purpose: z.literal("customer_reply"),
  }),
  z.strictObject({
    storeNames: rWorkflowsManageWorkflowInstallationSchema29Schema,
    window: rWorkflowsManageWorkflowInstallationSchema53Schema,
    kind: rWorkflowsManageWorkflowInstallationSchema58Schema,
    purpose: rWorkflowsManageWorkflowInstallationSchema59Schema,
    recipients: rWorkflowsManageWorkflowInstallationSchema60Schema,
    sender: rWorkflowsManageWorkflowInstallationSchema61Schema,
    deliveryVersion: rWorkflowsManageWorkflowInstallationSchema9Schema,
    reviewIdentities:
      rWorkflowsManageWorkflowInstallationSchema62Schema.optional(),
  }),
]);

export const rWorkflowsManageWorkflowInstallationSchema64Schema =
  rWorkflowsManageWorkflowInstallationSchema4Schema;

export const rWorkflowsManageWorkflowInstallationSchema65Schema =
  rWorkflowsManageWorkflowInstallationSchema26Schema;

export const rWorkflowsManageWorkflowInstallationSchema51Schema =
  z.strictObject({
    actionId: rWorkflowsManageWorkflowInstallationSchema26Schema,
    identity: rWorkflowsManageWorkflowInstallationSchema52Schema,
    artifactHash: rWorkflowsManageWorkflowInstallationSchema64Schema.optional(),
    correlationMarker:
      rWorkflowsManageWorkflowInstallationSchema65Schema.optional(),
  });

export const rWorkflowsManageWorkflowInstallationSchema67Schema = z.enum([
  "confirmed",
  "failed",
  "unknown",
]);

export const rWorkflowsManageWorkflowInstallationSchema68Schema = z.enum([
  "service_status",
  "launcher_transfer",
  "provider_readback",
  "smedc_readback",
  "manual_resolution",
  "request_rejected",
  "transport_unknown",
]);

export const rWorkflowsManageWorkflowInstallationSchema69Schema =
  rWorkflowsManageWorkflowInstallationSchema15Schema;

export const rWorkflowsManageWorkflowInstallationSchema70Schema =
  rWorkflowsManageWorkflowInstallationSchema15Schema;

export const rWorkflowsManageWorkflowInstallationSchema71Schema =
  rWorkflowsManageWorkflowInstallationSchema4Schema;

export const rWorkflowsManageWorkflowInstallationSchema72Schema = z
  .string()
  .max(2000);

export const rWorkflowsManageWorkflowInstallationSchema73Schema = z
  .string()
  .regex(
    new RegExp(
      "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
    ),
  );

export const rWorkflowsManageWorkflowInstallationSchema74Schema =
  z.strictObject({
    identityHash: rWorkflowsManageWorkflowInstallationSchema4Schema,
    manifestHash: rWorkflowsManageWorkflowInstallationSchema4Schema,
    resultHash: rWorkflowsManageWorkflowInstallationSchema4Schema,
    launcherVersion: z.string().regex(new RegExp("^\\d+\\.\\d+\\.\\d+$")),
    verifiedAt: z
      .string()
      .regex(
        new RegExp(
          "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
        ),
      ),
    partitionCount: z.number().int().min(0).max(100000),
    fileCount: z.number().int().min(0).max(100000),
    totalByteSize: z.string().regex(new RegExp("^\\d{1,20}$")),
    totalRowCount: z.string().regex(new RegExp("^\\d{1,20}$")),
    requestId: rWorkflowsManageWorkflowInstallationSchema26Schema.optional(),
  });

export const rWorkflowsManageWorkflowInstallationSchema75Schema =
  z.strictObject({
    identityHash: rWorkflowsManageWorkflowInstallationSchema4Schema,
    observedFactsHash: rWorkflowsManageWorkflowInstallationSchema4Schema,
    resultHash: rWorkflowsManageWorkflowInstallationSchema4Schema,
    recordIds: z
      .array(rWorkflowsManageWorkflowInstallationSchema26Schema)
      .min(1)
      .max(1000),
    observedAt: z
      .string()
      .regex(
        new RegExp(
          "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
        ),
      ),
    outcome: z.literal("matched"),
    reviewCount: z.number().int().max(1000).gt(0),
    matchedCount: z.number().int().max(1000).gt(0),
  });

export const rWorkflowsManageWorkflowInstallationSchema76Schema =
  z.strictObject({
    identityHash: rWorkflowsManageWorkflowInstallationSchema4Schema,
    artifactHash: rWorkflowsManageWorkflowInstallationSchema4Schema,
    correlationMarker: rWorkflowsManageWorkflowInstallationSchema26Schema,
    providerReceiptId: rWorkflowsManageWorkflowInstallationSchema15Schema,
    observedAt: z
      .string()
      .regex(
        new RegExp(
          "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
        ),
      ),
    outcome: z.enum(["published", "sent", "not_executed"]),
  });

export const rWorkflowsManageWorkflowInstallationSchema66Schema =
  z.strictObject({
    actionId: rWorkflowsManageWorkflowInstallationSchema26Schema,
    state: rWorkflowsManageWorkflowInstallationSchema67Schema,
    evidence: rWorkflowsManageWorkflowInstallationSchema68Schema,
    receiptId: rWorkflowsManageWorkflowInstallationSchema69Schema.optional(),
    jobId: rWorkflowsManageWorkflowInstallationSchema70Schema.optional(),
    resultHash: rWorkflowsManageWorkflowInstallationSchema71Schema.optional(),
    reason: rWorkflowsManageWorkflowInstallationSchema72Schema.optional(),
    verifiedAt: rWorkflowsManageWorkflowInstallationSchema73Schema,
    launcherTransfer:
      rWorkflowsManageWorkflowInstallationSchema74Schema.optional(),
    smedcReadback:
      rWorkflowsManageWorkflowInstallationSchema75Schema.optional(),
    providerReadback:
      rWorkflowsManageWorkflowInstallationSchema76Schema.optional(),
  });

export const rWorkflowsManageWorkflowInstallationSchema50Schema =
  z.strictObject({
    legacyKeyHash: rWorkflowsManageWorkflowInstallationSchema4Schema,
    intent: rWorkflowsManageWorkflowInstallationSchema51Schema,
    receipt: rWorkflowsManageWorkflowInstallationSchema66Schema,
  });

export const rWorkflowsManageWorkflowInstallationSchema49Schema = z
  .array(rWorkflowsManageWorkflowInstallationSchema50Schema)
  .max(100);

export const rWorkflowsManageWorkflowInstallationSchema79Schema = z.enum([
  "business",
  "evidence",
]);

export const rWorkflowsManageWorkflowInstallationSchema80Schema = z.enum([
  "open",
  "waived",
  "resolved",
]);

export const rWorkflowsManageWorkflowInstallationSchema81Schema = z.enum([
  "preparing",
  "collecting",
  "validating",
  "processing",
  "delivering",
  "verifying",
  "cleaning",
  "finished",
]);

export const rWorkflowsManageWorkflowInstallationSchema82Schema = z.union([
  z.strictObject({
    kind: z.literal("dataset"),
    dataset: z.enum([
      "business",
      "dishes",
      "in_store_orders",
      "takeaway_orders",
      "delivery_ledger",
    ]),
    storeNames: rWorkflowsManageWorkflowInstallationSchema29Schema,
    window: rWorkflowsManageWorkflowInstallationSchema53Schema,
  }),
  z.strictObject({
    kind: z.literal("reviews"),
    source: rWorkflowsManageWorkflowInstallationSchema34Schema,
    storeName: rWorkflowsManageWorkflowInstallationSchema15Schema,
    window: rWorkflowsManageWorkflowInstallationSchema53Schema,
    feedbackId: rWorkflowsManageWorkflowInstallationSchema15Schema.optional(),
  }),
  z.strictObject({
    kind: z.literal("report"),
    storeNames: rWorkflowsManageWorkflowInstallationSchema29Schema,
    window: rWorkflowsManageWorkflowInstallationSchema53Schema,
  }),
  z.strictObject({
    kind: z.literal("unknown_scope"),
    reason: z.enum([
      "scope_not_preserved",
      "missing_local_evidence",
      "ambiguous_source_identity",
    ]),
  }),
]);

export const rWorkflowsManageWorkflowInstallationSchema83Schema =
  rWorkflowsManageWorkflowInstallationSchema26Schema;

export const rWorkflowsManageWorkflowInstallationSchema84Schema =
  rWorkflowsManageWorkflowInstallationSchema4Schema;

export const rWorkflowsManageWorkflowInstallationSchema85Schema = z
  .string()
  .min(1)
  .max(2000);

export const rWorkflowsManageWorkflowInstallationSchema78Schema =
  z.strictObject({
    itemId: rWorkflowsManageWorkflowInstallationSchema26Schema,
    kind: rWorkflowsManageWorkflowInstallationSchema79Schema,
    disposition: rWorkflowsManageWorkflowInstallationSchema80Schema,
    stage: rWorkflowsManageWorkflowInstallationSchema81Schema,
    scope: rWorkflowsManageWorkflowInstallationSchema82Schema,
    evidenceRef: rWorkflowsManageWorkflowInstallationSchema83Schema.optional(),
    evidenceHash: rWorkflowsManageWorkflowInstallationSchema84Schema.optional(),
    resolutionReason:
      rWorkflowsManageWorkflowInstallationSchema85Schema.optional(),
  });

export const rWorkflowsManageWorkflowInstallationSchema77Schema = z
  .array(rWorkflowsManageWorkflowInstallationSchema78Schema)
  .max(100);

export const rWorkflowsManageWorkflowInstallationSchema88Schema = z.enum([
  "source_conflict",
  "missing_receipt",
  "unknown_action",
  "missing_local_evidence",
]);

export const rWorkflowsManageWorkflowInstallationSchema89Schema =
  rWorkflowsManageWorkflowInstallationSchema4Schema;

export const rWorkflowsManageWorkflowInstallationSchema90Schema =
  rWorkflowsManageWorkflowInstallationSchema51Schema;

export const rWorkflowsManageWorkflowInstallationSchema91Schema =
  rWorkflowsManageWorkflowInstallationSchema66Schema;

export const rWorkflowsManageWorkflowInstallationSchema87Schema =
  z.strictObject({
    code: rWorkflowsManageWorkflowInstallationSchema88Schema,
    sourceRef: rWorkflowsManageWorkflowInstallationSchema26Schema,
    evidenceHash: rWorkflowsManageWorkflowInstallationSchema89Schema.optional(),
    intent: rWorkflowsManageWorkflowInstallationSchema90Schema.optional(),
    receipt: rWorkflowsManageWorkflowInstallationSchema91Schema.optional(),
  });

export const rWorkflowsManageWorkflowInstallationSchema86Schema = z
  .array(rWorkflowsManageWorkflowInstallationSchema87Schema)
  .max(100);

export const rWorkflowsManageWorkflowInstallationSchema25Schema =
  z.strictObject({
    workflowId: rWorkflowsManageWorkflowInstallationSchema26Schema,
    configuration: z.union([
      rWorkflowsManageWorkflowInstallationSchema27Schema,
      rWorkflowsManageWorkflowInstallationSchema32Schema,
      rWorkflowsManageWorkflowInstallationSchema41Schema,
    ]),
    authorizations: z
      .array(rWorkflowsManageWorkflowInstallationSchema43Schema)
      .max(20),
    hostSnapshot: rWorkflowsManageWorkflowInstallationSchema48Schema,
    completedActions: rWorkflowsManageWorkflowInstallationSchema49Schema,
    recoveryItems:
      rWorkflowsManageWorkflowInstallationSchema77Schema.optional(),
    unresolved: rWorkflowsManageWorkflowInstallationSchema86Schema,
  });

export const rWorkflowsManageWorkflowInstallationSchema24Schema = z
  .array(rWorkflowsManageWorkflowInstallationSchema25Schema)
  .min(1)
  .max(3);

export const rWorkflowsManageWorkflowInstallationSchema8Schema = z.strictObject(
  {
    sourceSnapshotHash: rWorkflowsManageWorkflowInstallationSchema4Schema,
    targetVersion: rWorkflowsManageWorkflowInstallationSchema9Schema,
    integration: rWorkflowsManageWorkflowInstallationSchema10Schema,
    workflows: rWorkflowsManageWorkflowInstallationSchema24Schema,
  },
);

export const rWorkflowsManageWorkflowInstallationSchema92Schema = z.string();

export const rWorkflowsManageWorkflowInstallationSchema93Schema = z
  .string()
  .regex(
    new RegExp(
      "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
    ),
  );

export const rWorkflowsManageWorkflowInstallationSchema94Schema = z.union([
  rWorkflowsManageWorkflowInstallationSchema93Schema,
  z.null(),
]);

export const rWorkflowsManageWorkflowInstallationSchema95Schema = z
  .number()
  .int()
  .min(-9007199254740991)
  .max(9007199254740991);

export const rWorkflowsManageWorkflowInstallationSchema96Schema = z
  .number()
  .int()
  .min(-9007199254740991)
  .max(9007199254740991);

export const rWorkflowsManageWorkflowInstallationSchema97Schema = z.union([
  rWorkflowsManageWorkflowInstallationSchema4Schema,
  z.null(),
]);

export const rWorkflowsManageWorkflowInstallationSchema98Schema = z
  .number()
  .int()
  .min(-9007199254740991)
  .max(9007199254740991);

export const rWorkflowsManageWorkflowInstallationSchema99Schema = z
  .number()
  .int()
  .min(-9007199254740991)
  .max(9007199254740991);

export const rWorkflowsManageWorkflowInstallationSchema100Schema = z.array(
  z.strictObject({
    workflowId: z.string(),
    version: z.number().int().min(-9007199254740991).max(9007199254740991),
    controlVersion: z
      .number()
      .int()
      .min(-9007199254740991)
      .max(9007199254740991),
    assignmentEpoch: z
      .number()
      .int()
      .min(-9007199254740991)
      .max(9007199254740991),
  }),
);

export const rWorkflowsManageWorkflowInstallationSchema101Schema =
  z.strictObject({
    workflowId: rWorkflowsManageWorkflowInstallationSchema26Schema,
    completedActions: rWorkflowsManageWorkflowInstallationSchema49Schema,
    unresolved: rWorkflowsManageWorkflowInstallationSchema86Schema,
    recoveryItems:
      rWorkflowsManageWorkflowInstallationSchema77Schema.optional(),
  });

export const bWorkflowsManageWorkflowRunSchema0Schema = z
  .string()
  .min(1)
  .max(64)
  .regex(new RegExp("^[A-Za-z0-9_-]+$"));

export const bWorkflowsManageWorkflowRunSchema1Schema = z
  .number()
  .int()
  .min(0)
  .max(4294967295);

export const bWorkflowsManageWorkflowRunSchema3Schema = z
  .string()
  .regex(
    new RegExp(
      "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$",
    ),
  );

export const bWorkflowsManageWorkflowRunSchema2Schema = z.strictObject({
  startDate: bWorkflowsManageWorkflowRunSchema3Schema,
  endDate: bWorkflowsManageWorkflowRunSchema3Schema,
});

export const bWorkflowsManageWorkflowRunSchema4Schema = z.literal("start");

export const bWorkflowsManageWorkflowRunSchema5Schema = z
  .string()
  .regex(new RegExp("^\\d+\\.\\d+\\.\\d+$"));

export const bWorkflowsManageWorkflowRunSchema6Schema = z.enum([
  "scheduled",
  "backfill",
]);

export const bWorkflowsManageWorkflowRunSchema8Schema = z
  .string()
  .regex(new RegExp("^[a-f0-9]{64}$"));

export const bWorkflowsManageWorkflowRunSchema7Schema =
  bWorkflowsManageWorkflowRunSchema8Schema;

export const bWorkflowsManageWorkflowRunSchema12Schema = z
  .string()
  .min(1)
  .max(255);

export const bWorkflowsManageWorkflowRunSchema11Schema = z
  .array(bWorkflowsManageWorkflowRunSchema12Schema)
  .min(1)
  .max(2000);

export const bWorkflowsManageWorkflowRunSchema13Schema = z.literal("upload");

export const bWorkflowsManageWorkflowRunSchema14Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
]);

export const bWorkflowsManageWorkflowRunSchema15Schema =
  z.literal("settled_only");

export const bWorkflowsManageWorkflowRunSchema17Schema = z.enum([
  "meituan_erp",
  "meituan_reviews",
]);

export const bWorkflowsManageWorkflowRunSchema18Schema = z.enum([
  "erp",
  "meituan",
  "dianping",
]);

export const bWorkflowsManageWorkflowRunSchema19Schema =
  bWorkflowsManageWorkflowRunSchema12Schema;

export const bWorkflowsManageWorkflowRunSchema16Schema = z.strictObject({
  product: bWorkflowsManageWorkflowRunSchema17Schema,
  channel: bWorkflowsManageWorkflowRunSchema18Schema,
  accountRef: bWorkflowsManageWorkflowRunSchema12Schema,
  sourceStoreId: bWorkflowsManageWorkflowRunSchema19Schema.optional(),
  sourceStoreName: bWorkflowsManageWorkflowRunSchema12Schema,
});

export const bWorkflowsManageWorkflowRunSchema20Schema = z.literal("email");

export const bWorkflowsManageWorkflowRunSchema21Schema = z.enum([
  "review_drafts",
  "weekly_report",
  "exception",
]);

export const bWorkflowsManageWorkflowRunSchema23Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const bWorkflowsManageWorkflowRunSchema22Schema = z
  .array(bWorkflowsManageWorkflowRunSchema23Schema)
  .max(20);

export const bWorkflowsManageWorkflowRunSchema24Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const bWorkflowsManageWorkflowRunSchema26Schema = z.strictObject({
  source: bWorkflowsManageWorkflowRunSchema16Schema,
  feedbackId: bWorkflowsManageWorkflowRunSchema12Schema,
  recipient: z
    .string()
    .max(254)
    .regex(
      new RegExp(
        "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
      ),
    ),
});

export const bWorkflowsManageWorkflowRunSchema25Schema = z
  .array(bWorkflowsManageWorkflowRunSchema26Schema)
  .max(100);

export const bWorkflowsManageWorkflowRunSchema10Schema = z.union([
  z.strictObject({
    storeNames: bWorkflowsManageWorkflowRunSchema11Schema,
    window: bWorkflowsManageWorkflowRunSchema2Schema,
    kind: bWorkflowsManageWorkflowRunSchema13Schema,
    dataset: bWorkflowsManageWorkflowRunSchema14Schema,
    orderScope: bWorkflowsManageWorkflowRunSchema15Schema.optional(),
    sourceHash: bWorkflowsManageWorkflowRunSchema8Schema,
    metadataHash: bWorkflowsManageWorkflowRunSchema8Schema,
  }),
  z.strictObject({
    storeNames: bWorkflowsManageWorkflowRunSchema11Schema,
    window: bWorkflowsManageWorkflowRunSchema2Schema,
    kind: z.literal("download"),
    dataset: z.enum([
      "business",
      "dishes",
      "in_store_orders",
      "takeaway_orders",
    ]),
    manifestHash: bWorkflowsManageWorkflowRunSchema8Schema.optional(),
  }),
  z.strictObject({
    storeNames: bWorkflowsManageWorkflowRunSchema11Schema,
    window: bWorkflowsManageWorkflowRunSchema2Schema,
    kind: z.literal("review_sync"),
    source: bWorkflowsManageWorkflowRunSchema16Schema,
    observedFactsHash: bWorkflowsManageWorkflowRunSchema8Schema,
  }),
  z.strictObject({
    kind: z.literal("review_publish"),
    storeName: bWorkflowsManageWorkflowRunSchema12Schema,
    source: bWorkflowsManageWorkflowRunSchema16Schema,
    feedbackId: bWorkflowsManageWorkflowRunSchema12Schema,
    purpose: z.literal("customer_reply"),
  }),
  z.strictObject({
    storeNames: bWorkflowsManageWorkflowRunSchema11Schema,
    window: bWorkflowsManageWorkflowRunSchema2Schema,
    kind: bWorkflowsManageWorkflowRunSchema20Schema,
    purpose: bWorkflowsManageWorkflowRunSchema21Schema,
    recipients: bWorkflowsManageWorkflowRunSchema22Schema,
    sender: bWorkflowsManageWorkflowRunSchema24Schema,
    deliveryVersion: bWorkflowsManageWorkflowRunSchema1Schema,
    reviewIdentities: bWorkflowsManageWorkflowRunSchema25Schema.optional(),
  }),
]);

export const bWorkflowsManageWorkflowRunSchema27Schema =
  bWorkflowsManageWorkflowRunSchema8Schema;

export const bWorkflowsManageWorkflowRunSchema28Schema =
  bWorkflowsManageWorkflowRunSchema0Schema;

export const bWorkflowsManageWorkflowRunSchema9Schema = z.strictObject({
  actionId: bWorkflowsManageWorkflowRunSchema0Schema,
  identity: bWorkflowsManageWorkflowRunSchema10Schema,
  artifactHash: bWorkflowsManageWorkflowRunSchema27Schema.optional(),
  correlationMarker: bWorkflowsManageWorkflowRunSchema28Schema.optional(),
});

export const bWorkflowsManageWorkflowRunSchema30Schema = z.enum([
  "preparing",
  "collecting",
  "validating",
  "processing",
  "delivering",
  "verifying",
  "cleaning",
  "finished",
]);

export const bWorkflowsManageWorkflowRunSchema31Schema = z.enum([
  "running",
  "succeeded",
  "partial",
  "needs_attention",
  "failed",
  "unknown",
]);

export const bWorkflowsManageWorkflowRunSchema34Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
]);

export const bWorkflowsManageWorkflowRunSchema35Schema = z.enum([
  "observed_zero",
  "no_source",
  "unreadable",
  "incomplete",
  "confirmed",
]);

export const bWorkflowsManageWorkflowRunSchema36Schema =
  bWorkflowsManageWorkflowRunSchema8Schema;

export const bWorkflowsManageWorkflowRunSchema33Schema = z.strictObject({
  dataset: bWorkflowsManageWorkflowRunSchema34Schema,
  storeName: bWorkflowsManageWorkflowRunSchema12Schema,
  date: bWorkflowsManageWorkflowRunSchema3Schema,
  status: bWorkflowsManageWorkflowRunSchema35Schema,
  evidenceHash: bWorkflowsManageWorkflowRunSchema36Schema.optional(),
});

export const bWorkflowsManageWorkflowRunSchema32Schema = z
  .array(bWorkflowsManageWorkflowRunSchema33Schema)
  .max(100);

export const bWorkflowsManageWorkflowRunSchema38Schema = z.strictObject({
  code: z.enum([
    "WORKFLOW_CONFIGURATION_REQUIRED",
    "WORKFLOW_VERSION_INCOMPATIBLE",
    "WORKFLOW_SOURCE_MAPPING_CONFLICT",
    "WORKFLOW_ADMIN_REQUIRED",
    "WORKFLOW_PERMISSION_DENIED",
    "WORKFLOW_INSTALLATION_MISMATCH",
    "WORKFLOW_BUSY",
    "WORKFLOW_CONTROL_REVOKED",
    "WORKFLOW_ACTION_UNKNOWN",
    "WORKFLOW_VERSION_CONFLICT",
    "ORDER_SCOPE_CONFLICT",
    "ORDER_SCOPE_REQUIRED",
    "WORKFLOW_SOURCE_UNAVAILABLE",
  ]),
  actionId: bWorkflowsManageWorkflowRunSchema0Schema.optional(),
  nextStep: z.string().max(2000),
});

export const bWorkflowsManageWorkflowRunSchema37Schema = z
  .array(bWorkflowsManageWorkflowRunSchema38Schema)
  .max(100);

export const bWorkflowsManageWorkflowRunSchema39Schema = z.enum([
  "pending",
  "confirmed_files_cleaned",
  "retained",
  "blocked",
]);

export const bWorkflowsManageWorkflowRunSchema29Schema = z.strictObject({
  phase: bWorkflowsManageWorkflowRunSchema30Schema,
  status: bWorkflowsManageWorkflowRunSchema31Schema,
  observations: bWorkflowsManageWorkflowRunSchema32Schema,
  unresolved: bWorkflowsManageWorkflowRunSchema37Schema,
  cleanup: bWorkflowsManageWorkflowRunSchema39Schema,
});

export const rWorkflowsManageWorkflowRunSchema0Schema = z
  .string()
  .min(1)
  .max(64)
  .regex(new RegExp("^[A-Za-z0-9_-]+$"));

export const rWorkflowsManageWorkflowRunSchema1Schema = z
  .string()
  .regex(new RegExp("^[a-f0-9]{64}$"));

export const rWorkflowsManageWorkflowRunSchema3Schema = z
  .string()
  .regex(
    new RegExp(
      "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$",
    ),
  );

export const rWorkflowsManageWorkflowRunSchema2Schema = z.strictObject({
  startDate: rWorkflowsManageWorkflowRunSchema3Schema,
  endDate: rWorkflowsManageWorkflowRunSchema3Schema,
});

export const rWorkflowsManageWorkflowRunSchema4Schema = z
  .string()
  .regex(
    new RegExp(
      "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
    ),
  );

export const rWorkflowsManageWorkflowRunSchema5Schema = z.string();

export const rWorkflowsManageWorkflowRunSchema6Schema = z.string();

export const rWorkflowsManageWorkflowRunSchema7Schema = z.string();

export const rWorkflowsManageWorkflowRunSchema8Schema = z.string();

export const rWorkflowsManageWorkflowRunSchema9Schema = z.string();

export const rWorkflowsManageWorkflowRunSchema10Schema = z
  .number()
  .int()
  .min(-9007199254740991)
  .max(9007199254740991);

export const rWorkflowsManageWorkflowRunSchema11Schema = z
  .number()
  .int()
  .min(-9007199254740991)
  .max(9007199254740991);

export const rWorkflowsManageWorkflowRunSchema12Schema = z
  .number()
  .int()
  .min(-9007199254740991)
  .max(9007199254740991);

export const rWorkflowsManageWorkflowRunSchema13Schema = z
  .number()
  .int()
  .min(-9007199254740991)
  .max(9007199254740991);

export const rWorkflowsManageWorkflowRunSchema14Schema = z.string();

export const rWorkflowsManageWorkflowRunSchema15Schema = z.string();

export const rWorkflowsManageWorkflowRunSchema16Schema = z.string();

export const rWorkflowsManageWorkflowRunSchema17Schema = z.enum([
  "running",
  "succeeded",
  "partial",
  "needs_attention",
  "failed",
  "unknown",
]);

export const rWorkflowsManageWorkflowRunSchema19Schema = z.enum([
  "meituan-daily-ingestion",
  "meituan-review-operations",
  "weekly-business-report",
]);

export const rWorkflowsManageWorkflowRunSchema20Schema = z
  .number()
  .int()
  .min(0)
  .max(4294967295);

export const rWorkflowsManageWorkflowRunSchema21Schema = z
  .string()
  .regex(new RegExp("^\\d+\\.\\d+\\.\\d+$"));

export const rWorkflowsManageWorkflowRunSchema23Schema = z.literal(1);

export const rWorkflowsManageWorkflowRunSchema24Schema =
  z.literal("Asia/Shanghai");

export const rWorkflowsManageWorkflowRunSchema27Schema = z
  .string()
  .min(1)
  .max(255);

export const rWorkflowsManageWorkflowRunSchema26Schema = z.strictObject({
  product: z.enum(["meituan_erp", "meituan_reviews"]),
  accountRef: rWorkflowsManageWorkflowRunSchema27Schema,
  displayName: rWorkflowsManageWorkflowRunSchema27Schema,
  sourceEnterpriseName: rWorkflowsManageWorkflowRunSchema27Schema,
  sourceGroupName: rWorkflowsManageWorkflowRunSchema27Schema.optional(),
});

export const rWorkflowsManageWorkflowRunSchema25Schema = z
  .array(rWorkflowsManageWorkflowRunSchema26Schema)
  .max(100);

export const rWorkflowsManageWorkflowRunSchema31Schema = z.enum([
  "meituan_erp",
  "meituan_reviews",
]);

export const rWorkflowsManageWorkflowRunSchema32Schema = z.enum([
  "erp",
  "meituan",
  "dianping",
]);

export const rWorkflowsManageWorkflowRunSchema33Schema =
  rWorkflowsManageWorkflowRunSchema27Schema;

export const rWorkflowsManageWorkflowRunSchema30Schema = z.strictObject({
  product: rWorkflowsManageWorkflowRunSchema31Schema,
  channel: rWorkflowsManageWorkflowRunSchema32Schema,
  accountRef: rWorkflowsManageWorkflowRunSchema27Schema,
  sourceStoreId: rWorkflowsManageWorkflowRunSchema33Schema.optional(),
  sourceStoreName: rWorkflowsManageWorkflowRunSchema27Schema,
});

export const rWorkflowsManageWorkflowRunSchema29Schema = z.strictObject({
  source: rWorkflowsManageWorkflowRunSchema30Schema,
  storeName: rWorkflowsManageWorkflowRunSchema27Schema,
});

export const rWorkflowsManageWorkflowRunSchema28Schema = z
  .array(rWorkflowsManageWorkflowRunSchema29Schema)
  .max(2000);

export const rWorkflowsManageWorkflowRunSchema35Schema = z.strictObject({
  source: rWorkflowsManageWorkflowRunSchema30Schema,
  reason: z.string().min(1).max(2000),
});

export const rWorkflowsManageWorkflowRunSchema34Schema = z
  .array(rWorkflowsManageWorkflowRunSchema35Schema)
  .max(2000);

export const rWorkflowsManageWorkflowRunSchema22Schema = z.strictObject({
  schemaVersion: rWorkflowsManageWorkflowRunSchema23Schema,
  timezone: rWorkflowsManageWorkflowRunSchema24Schema,
  sourceAccounts: rWorkflowsManageWorkflowRunSchema25Schema,
  storeMappings: rWorkflowsManageWorkflowRunSchema28Schema,
  exclusions: rWorkflowsManageWorkflowRunSchema34Schema,
});

export const rWorkflowsManageWorkflowRunSchema38Schema = z.literal(1);

export const rWorkflowsManageWorkflowRunSchema39Schema = z
  .array(rWorkflowsManageWorkflowRunSchema27Schema)
  .min(1)
  .max(2000);

export const rWorkflowsManageWorkflowRunSchema40Schema =
  z.literal("action_required");

export const rWorkflowsManageWorkflowRunSchema41Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
]);

export const rWorkflowsManageWorkflowRunSchema37Schema = z.strictObject({
  schemaVersion: rWorkflowsManageWorkflowRunSchema38Schema,
  storeNames: rWorkflowsManageWorkflowRunSchema39Schema,
  notificationPolicy: rWorkflowsManageWorkflowRunSchema40Schema,
  type: z.literal("meituan-daily-ingestion"),
  datasets: z.array(rWorkflowsManageWorkflowRunSchema41Schema).min(1).max(5),
  orderScope: z.literal("settled_only"),
  cleanupPolicy: z.literal("confirmed_files_only"),
});

export const rWorkflowsManageWorkflowRunSchema43Schema = z.strictObject({
  source: rWorkflowsManageWorkflowRunSchema30Schema,
  feedbackId: rWorkflowsManageWorkflowRunSchema27Schema,
  reason: z.string().min(1).max(2000),
  purpose: z.literal("exclude_source_record"),
});

export const rWorkflowsManageWorkflowRunSchema44Schema = z.enum([
  "meituan",
  "dianping",
]);

export const rWorkflowsManageWorkflowRunSchema46Schema = z.boolean();

export const rWorkflowsManageWorkflowRunSchema48Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const rWorkflowsManageWorkflowRunSchema47Schema = z
  .array(rWorkflowsManageWorkflowRunSchema48Schema)
  .max(20);

export const rWorkflowsManageWorkflowRunSchema49Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const rWorkflowsManageWorkflowRunSchema45Schema = z.strictObject({
  enabled: rWorkflowsManageWorkflowRunSchema46Schema,
  recipients: rWorkflowsManageWorkflowRunSchema47Schema,
  allowedSender: rWorkflowsManageWorkflowRunSchema49Schema.optional(),
});

export const rWorkflowsManageWorkflowRunSchema42Schema = z.strictObject({
  schemaVersion: rWorkflowsManageWorkflowRunSchema38Schema,
  storeNames: rWorkflowsManageWorkflowRunSchema39Schema,
  notificationPolicy: rWorkflowsManageWorkflowRunSchema40Schema,
  type: z.literal("meituan-review-operations"),
  executionPolicy: z.strictObject({
    id: z.literal("verified-review-operations"),
    version: z.literal(1),
  }),
  ignoredReviewIdentities: z
    .array(rWorkflowsManageWorkflowRunSchema43Schema)
    .max(2000),
  channels: z.array(rWorkflowsManageWorkflowRunSchema44Schema).min(1).max(2),
  publication: z.strictObject({
    enabled: z.boolean(),
    storeNames: z.array(rWorkflowsManageWorkflowRunSchema27Schema).max(2000),
  }),
  brandFacts: z.string().max(20000),
  tone: z.string().max(2000),
  draftNotification: rWorkflowsManageWorkflowRunSchema45Schema,
  cleanupPolicy: z.literal("complete_run_only"),
});

export const rWorkflowsManageWorkflowRunSchema51Schema = z.strictObject({
  name: rWorkflowsManageWorkflowRunSchema27Schema,
  storeNames: rWorkflowsManageWorkflowRunSchema39Schema,
});

export const rWorkflowsManageWorkflowRunSchema50Schema = z.strictObject({
  schemaVersion: rWorkflowsManageWorkflowRunSchema38Schema,
  storeNames: rWorkflowsManageWorkflowRunSchema39Schema,
  notificationPolicy: rWorkflowsManageWorkflowRunSchema40Schema,
  type: z.literal("weekly-business-report"),
  groups: z.array(rWorkflowsManageWorkflowRunSchema51Schema).max(100),
  delivery: rWorkflowsManageWorkflowRunSchema45Schema,
  cleanupPolicy: z.literal("retain_final_report"),
});

export const rWorkflowsManageWorkflowRunSchema36Schema = z.union([
  rWorkflowsManageWorkflowRunSchema37Schema,
  rWorkflowsManageWorkflowRunSchema42Schema,
  rWorkflowsManageWorkflowRunSchema50Schema,
]);

export const rWorkflowsManageWorkflowRunSchema18Schema = z.strictObject({
  workflowType: rWorkflowsManageWorkflowRunSchema19Schema,
  window: rWorkflowsManageWorkflowRunSchema2Schema,
  integrationVersion: rWorkflowsManageWorkflowRunSchema20Schema,
  configurationVersion: rWorkflowsManageWorkflowRunSchema20Schema,
  workflowPackageVersion: rWorkflowsManageWorkflowRunSchema21Schema,
  integration: rWorkflowsManageWorkflowRunSchema22Schema,
  configuration: rWorkflowsManageWorkflowRunSchema36Schema,
});

export const rWorkflowsManageWorkflowRunSchema53Schema = z.enum([
  "preparing",
  "collecting",
  "validating",
  "processing",
  "delivering",
  "verifying",
  "cleaning",
  "finished",
]);

export const rWorkflowsManageWorkflowRunSchema54Schema = z.enum([
  "running",
  "succeeded",
  "partial",
  "needs_attention",
  "failed",
  "unknown",
]);

export const rWorkflowsManageWorkflowRunSchema57Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
]);

export const rWorkflowsManageWorkflowRunSchema58Schema = z.enum([
  "observed_zero",
  "no_source",
  "unreadable",
  "incomplete",
  "confirmed",
]);

export const rWorkflowsManageWorkflowRunSchema59Schema =
  rWorkflowsManageWorkflowRunSchema1Schema;

export const rWorkflowsManageWorkflowRunSchema56Schema = z.strictObject({
  dataset: rWorkflowsManageWorkflowRunSchema57Schema,
  storeName: rWorkflowsManageWorkflowRunSchema27Schema,
  date: rWorkflowsManageWorkflowRunSchema3Schema,
  status: rWorkflowsManageWorkflowRunSchema58Schema,
  evidenceHash: rWorkflowsManageWorkflowRunSchema59Schema.optional(),
});

export const rWorkflowsManageWorkflowRunSchema55Schema = z
  .array(rWorkflowsManageWorkflowRunSchema56Schema)
  .max(100);

export const rWorkflowsManageWorkflowRunSchema61Schema = z.strictObject({
  code: z.enum([
    "WORKFLOW_CONFIGURATION_REQUIRED",
    "WORKFLOW_VERSION_INCOMPATIBLE",
    "WORKFLOW_SOURCE_MAPPING_CONFLICT",
    "WORKFLOW_ADMIN_REQUIRED",
    "WORKFLOW_PERMISSION_DENIED",
    "WORKFLOW_INSTALLATION_MISMATCH",
    "WORKFLOW_BUSY",
    "WORKFLOW_CONTROL_REVOKED",
    "WORKFLOW_ACTION_UNKNOWN",
    "WORKFLOW_VERSION_CONFLICT",
    "ORDER_SCOPE_CONFLICT",
    "ORDER_SCOPE_REQUIRED",
    "WORKFLOW_SOURCE_UNAVAILABLE",
  ]),
  actionId: rWorkflowsManageWorkflowRunSchema0Schema.optional(),
  nextStep: z.string().max(2000),
});

export const rWorkflowsManageWorkflowRunSchema60Schema = z
  .array(rWorkflowsManageWorkflowRunSchema61Schema)
  .max(100);

export const rWorkflowsManageWorkflowRunSchema62Schema = z.enum([
  "pending",
  "confirmed_files_cleaned",
  "retained",
  "blocked",
]);

export const rWorkflowsManageWorkflowRunSchema52Schema = z.union([
  z.strictObject({
    phase: rWorkflowsManageWorkflowRunSchema53Schema,
    status: rWorkflowsManageWorkflowRunSchema54Schema,
    observations: rWorkflowsManageWorkflowRunSchema55Schema,
    unresolved: rWorkflowsManageWorkflowRunSchema60Schema,
    cleanup: rWorkflowsManageWorkflowRunSchema62Schema,
  }),
  z.null(),
]);

export const rWorkflowsManageWorkflowRunSchema63Schema = z.union([
  rWorkflowsManageWorkflowRunSchema4Schema,
  z.null(),
]);

export const rWorkflowsManageWorkflowRunSchema64Schema = z.string();

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema0Schema = z
  .number()
  .int()
  .min(0)
  .max(4294967295);

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema1Schema =
  z.literal(1);

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema2Schema =
  z.literal("Asia/Shanghai");

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema = z
  .string()
  .min(1)
  .max(255);

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema4Schema =
  z.strictObject({
    product: z.enum(["meituan_erp", "meituan_reviews"]),
    accountRef: bWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema,
    displayName: bWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema,
    sourceEnterpriseName:
      bWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema,
    sourceGroupName:
      bWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema.optional(),
  });

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema3Schema = z
  .array(bWorkflowsPrepareEnterpriseWorkflowChangeSchema4Schema)
  .max(100);

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema9Schema = z.enum([
  "meituan_erp",
  "meituan_reviews",
]);

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema10Schema = z.enum([
  "erp",
  "meituan",
  "dianping",
]);

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema11Schema =
  bWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema;

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema8Schema =
  z.strictObject({
    product: bWorkflowsPrepareEnterpriseWorkflowChangeSchema9Schema,
    channel: bWorkflowsPrepareEnterpriseWorkflowChangeSchema10Schema,
    accountRef: bWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema,
    sourceStoreId:
      bWorkflowsPrepareEnterpriseWorkflowChangeSchema11Schema.optional(),
    sourceStoreName: bWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema,
  });

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema7Schema =
  z.strictObject({
    source: bWorkflowsPrepareEnterpriseWorkflowChangeSchema8Schema,
    storeName: bWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema,
  });

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema6Schema = z
  .array(bWorkflowsPrepareEnterpriseWorkflowChangeSchema7Schema)
  .max(2000);

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema13Schema =
  z.strictObject({
    source: bWorkflowsPrepareEnterpriseWorkflowChangeSchema8Schema,
    reason: z.string().min(1).max(2000),
  });

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema12Schema = z
  .array(bWorkflowsPrepareEnterpriseWorkflowChangeSchema13Schema)
  .max(2000);

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema15Schema =
  z.literal(1);

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema16Schema = z
  .array(bWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema)
  .min(1)
  .max(2000);

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema17Schema =
  z.literal("action_required");

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema18Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
]);

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema14Schema =
  z.strictObject({
    schemaVersion: bWorkflowsPrepareEnterpriseWorkflowChangeSchema15Schema,
    storeNames: bWorkflowsPrepareEnterpriseWorkflowChangeSchema16Schema,
    notificationPolicy: bWorkflowsPrepareEnterpriseWorkflowChangeSchema17Schema,
    type: z.literal("meituan-daily-ingestion"),
    datasets: z
      .array(bWorkflowsPrepareEnterpriseWorkflowChangeSchema18Schema)
      .min(1)
      .max(5),
    orderScope: z.literal("settled_only"),
    cleanupPolicy: z.literal("confirmed_files_only"),
  });

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema20Schema =
  z.strictObject({
    source: bWorkflowsPrepareEnterpriseWorkflowChangeSchema8Schema,
    feedbackId: bWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema,
    reason: z.string().min(1).max(2000),
    purpose: z.literal("exclude_source_record"),
  });

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema21Schema = z.enum([
  "meituan",
  "dianping",
]);

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema23Schema =
  z.boolean();

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema25Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema24Schema = z
  .array(bWorkflowsPrepareEnterpriseWorkflowChangeSchema25Schema)
  .max(20);

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema26Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema22Schema =
  z.strictObject({
    enabled: bWorkflowsPrepareEnterpriseWorkflowChangeSchema23Schema,
    recipients: bWorkflowsPrepareEnterpriseWorkflowChangeSchema24Schema,
    allowedSender:
      bWorkflowsPrepareEnterpriseWorkflowChangeSchema26Schema.optional(),
  });

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema19Schema =
  z.strictObject({
    schemaVersion: bWorkflowsPrepareEnterpriseWorkflowChangeSchema15Schema,
    storeNames: bWorkflowsPrepareEnterpriseWorkflowChangeSchema16Schema,
    notificationPolicy: bWorkflowsPrepareEnterpriseWorkflowChangeSchema17Schema,
    type: z.literal("meituan-review-operations"),
    executionPolicy: z.strictObject({
      id: z.literal("verified-review-operations"),
      version: z.literal(1),
    }),
    ignoredReviewIdentities: z
      .array(bWorkflowsPrepareEnterpriseWorkflowChangeSchema20Schema)
      .max(2000),
    channels: z
      .array(bWorkflowsPrepareEnterpriseWorkflowChangeSchema21Schema)
      .min(1)
      .max(2),
    publication: z.strictObject({
      enabled: z.boolean(),
      storeNames: z
        .array(bWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema)
        .max(2000),
    }),
    brandFacts: z.string().max(20000),
    tone: z.string().max(2000),
    draftNotification: bWorkflowsPrepareEnterpriseWorkflowChangeSchema22Schema,
    cleanupPolicy: z.literal("complete_run_only"),
  });

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema28Schema =
  z.strictObject({
    name: bWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema,
    storeNames: bWorkflowsPrepareEnterpriseWorkflowChangeSchema16Schema,
  });

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema27Schema =
  z.strictObject({
    schemaVersion: bWorkflowsPrepareEnterpriseWorkflowChangeSchema15Schema,
    storeNames: bWorkflowsPrepareEnterpriseWorkflowChangeSchema16Schema,
    notificationPolicy: bWorkflowsPrepareEnterpriseWorkflowChangeSchema17Schema,
    type: z.literal("weekly-business-report"),
    groups: z
      .array(bWorkflowsPrepareEnterpriseWorkflowChangeSchema28Schema)
      .max(100),
    delivery: bWorkflowsPrepareEnterpriseWorkflowChangeSchema22Schema,
    cleanupPolicy: z.literal("retain_final_report"),
  });

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema30Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
]);

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema31Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
]);

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema32Schema = z.enum([
  "meituan",
  "dianping",
]);

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema33Schema = z.enum([
  "meituan",
  "dianping",
]);

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema29Schema = z.union([
  z.strictObject({
    kind: z.literal("upload"),
    datasets: z
      .array(bWorkflowsPrepareEnterpriseWorkflowChangeSchema30Schema)
      .min(1)
      .max(5),
    storeNames: bWorkflowsPrepareEnterpriseWorkflowChangeSchema16Schema,
  }),
  z.strictObject({
    kind: z.literal("download"),
    datasets: z
      .array(bWorkflowsPrepareEnterpriseWorkflowChangeSchema31Schema)
      .min(1)
      .max(4),
    storeNames: bWorkflowsPrepareEnterpriseWorkflowChangeSchema16Schema,
  }),
  z.strictObject({
    kind: z.literal("review_sync"),
    channels: z
      .array(bWorkflowsPrepareEnterpriseWorkflowChangeSchema32Schema)
      .min(1)
      .max(2),
    storeNames: bWorkflowsPrepareEnterpriseWorkflowChangeSchema16Schema,
  }),
  z.strictObject({
    kind: z.literal("review_publish"),
    channels: z
      .array(bWorkflowsPrepareEnterpriseWorkflowChangeSchema33Schema)
      .min(1)
      .max(2),
    storeNames: bWorkflowsPrepareEnterpriseWorkflowChangeSchema16Schema,
  }),
  z.strictObject({
    kind: z.literal("email"),
    purpose: z.enum(["review_drafts", "weekly_report", "exception"]),
    storeNames: bWorkflowsPrepareEnterpriseWorkflowChangeSchema16Schema,
    recipients: bWorkflowsPrepareEnterpriseWorkflowChangeSchema24Schema,
    allowedSender: z
      .string()
      .max(254)
      .regex(
        new RegExp(
          "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
        ),
      ),
    deliveryVersion: bWorkflowsPrepareEnterpriseWorkflowChangeSchema0Schema,
  }),
]);

export const bWorkflowsPrepareEnterpriseWorkflowChangeSchema34Schema = z
  .string()
  .min(1)
  .max(64)
  .regex(new RegExp("^[A-Za-z0-9_-]+$"));

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema0Schema = z
  .number()
  .int()
  .min(0)
  .max(4294967295);

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema1Schema =
  z.literal(1);

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema2Schema =
  z.literal("Asia/Shanghai");

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema = z
  .string()
  .min(1)
  .max(255);

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema4Schema =
  z.strictObject({
    product: z.enum(["meituan_erp", "meituan_reviews"]),
    accountRef: rWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema,
    displayName: rWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema,
    sourceEnterpriseName:
      rWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema,
    sourceGroupName:
      rWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema.optional(),
  });

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema3Schema = z
  .array(rWorkflowsPrepareEnterpriseWorkflowChangeSchema4Schema)
  .max(100);

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema9Schema = z.enum([
  "meituan_erp",
  "meituan_reviews",
]);

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema10Schema = z.enum([
  "erp",
  "meituan",
  "dianping",
]);

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema11Schema =
  rWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema;

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema8Schema =
  z.strictObject({
    product: rWorkflowsPrepareEnterpriseWorkflowChangeSchema9Schema,
    channel: rWorkflowsPrepareEnterpriseWorkflowChangeSchema10Schema,
    accountRef: rWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema,
    sourceStoreId:
      rWorkflowsPrepareEnterpriseWorkflowChangeSchema11Schema.optional(),
    sourceStoreName: rWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema,
  });

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema7Schema =
  z.strictObject({
    source: rWorkflowsPrepareEnterpriseWorkflowChangeSchema8Schema,
    storeName: rWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema,
  });

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema6Schema = z
  .array(rWorkflowsPrepareEnterpriseWorkflowChangeSchema7Schema)
  .max(2000);

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema13Schema =
  z.strictObject({
    source: rWorkflowsPrepareEnterpriseWorkflowChangeSchema8Schema,
    reason: z.string().min(1).max(2000),
  });

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema12Schema = z
  .array(rWorkflowsPrepareEnterpriseWorkflowChangeSchema13Schema)
  .max(2000);

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema15Schema =
  z.literal(1);

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema16Schema = z
  .array(rWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema)
  .min(1)
  .max(2000);

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema17Schema =
  z.literal("action_required");

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema18Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
]);

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema14Schema =
  z.strictObject({
    schemaVersion: rWorkflowsPrepareEnterpriseWorkflowChangeSchema15Schema,
    storeNames: rWorkflowsPrepareEnterpriseWorkflowChangeSchema16Schema,
    notificationPolicy: rWorkflowsPrepareEnterpriseWorkflowChangeSchema17Schema,
    type: z.literal("meituan-daily-ingestion"),
    datasets: z
      .array(rWorkflowsPrepareEnterpriseWorkflowChangeSchema18Schema)
      .min(1)
      .max(5),
    orderScope: z.literal("settled_only"),
    cleanupPolicy: z.literal("confirmed_files_only"),
  });

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema20Schema =
  z.strictObject({
    source: rWorkflowsPrepareEnterpriseWorkflowChangeSchema8Schema,
    feedbackId: rWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema,
    reason: z.string().min(1).max(2000),
    purpose: z.literal("exclude_source_record"),
  });

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema21Schema = z.enum([
  "meituan",
  "dianping",
]);

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema23Schema =
  z.boolean();

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema25Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema24Schema = z
  .array(rWorkflowsPrepareEnterpriseWorkflowChangeSchema25Schema)
  .max(20);

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema26Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema22Schema =
  z.strictObject({
    enabled: rWorkflowsPrepareEnterpriseWorkflowChangeSchema23Schema,
    recipients: rWorkflowsPrepareEnterpriseWorkflowChangeSchema24Schema,
    allowedSender:
      rWorkflowsPrepareEnterpriseWorkflowChangeSchema26Schema.optional(),
  });

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema19Schema =
  z.strictObject({
    schemaVersion: rWorkflowsPrepareEnterpriseWorkflowChangeSchema15Schema,
    storeNames: rWorkflowsPrepareEnterpriseWorkflowChangeSchema16Schema,
    notificationPolicy: rWorkflowsPrepareEnterpriseWorkflowChangeSchema17Schema,
    type: z.literal("meituan-review-operations"),
    executionPolicy: z.strictObject({
      id: z.literal("verified-review-operations"),
      version: z.literal(1),
    }),
    ignoredReviewIdentities: z
      .array(rWorkflowsPrepareEnterpriseWorkflowChangeSchema20Schema)
      .max(2000),
    channels: z
      .array(rWorkflowsPrepareEnterpriseWorkflowChangeSchema21Schema)
      .min(1)
      .max(2),
    publication: z.strictObject({
      enabled: z.boolean(),
      storeNames: z
        .array(rWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema)
        .max(2000),
    }),
    brandFacts: z.string().max(20000),
    tone: z.string().max(2000),
    draftNotification: rWorkflowsPrepareEnterpriseWorkflowChangeSchema22Schema,
    cleanupPolicy: z.literal("complete_run_only"),
  });

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema28Schema =
  z.strictObject({
    name: rWorkflowsPrepareEnterpriseWorkflowChangeSchema5Schema,
    storeNames: rWorkflowsPrepareEnterpriseWorkflowChangeSchema16Schema,
  });

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema27Schema =
  z.strictObject({
    schemaVersion: rWorkflowsPrepareEnterpriseWorkflowChangeSchema15Schema,
    storeNames: rWorkflowsPrepareEnterpriseWorkflowChangeSchema16Schema,
    notificationPolicy: rWorkflowsPrepareEnterpriseWorkflowChangeSchema17Schema,
    type: z.literal("weekly-business-report"),
    groups: z
      .array(rWorkflowsPrepareEnterpriseWorkflowChangeSchema28Schema)
      .max(100),
    delivery: rWorkflowsPrepareEnterpriseWorkflowChangeSchema22Schema,
    cleanupPolicy: z.literal("retain_final_report"),
  });

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema30Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
]);

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema31Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
]);

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema32Schema = z.enum([
  "meituan",
  "dianping",
]);

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema33Schema = z.enum([
  "meituan",
  "dianping",
]);

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema29Schema = z.union([
  z.strictObject({
    kind: z.literal("upload"),
    datasets: z
      .array(rWorkflowsPrepareEnterpriseWorkflowChangeSchema30Schema)
      .min(1)
      .max(5),
    storeNames: rWorkflowsPrepareEnterpriseWorkflowChangeSchema16Schema,
  }),
  z.strictObject({
    kind: z.literal("download"),
    datasets: z
      .array(rWorkflowsPrepareEnterpriseWorkflowChangeSchema31Schema)
      .min(1)
      .max(4),
    storeNames: rWorkflowsPrepareEnterpriseWorkflowChangeSchema16Schema,
  }),
  z.strictObject({
    kind: z.literal("review_sync"),
    channels: z
      .array(rWorkflowsPrepareEnterpriseWorkflowChangeSchema32Schema)
      .min(1)
      .max(2),
    storeNames: rWorkflowsPrepareEnterpriseWorkflowChangeSchema16Schema,
  }),
  z.strictObject({
    kind: z.literal("review_publish"),
    channels: z
      .array(rWorkflowsPrepareEnterpriseWorkflowChangeSchema33Schema)
      .min(1)
      .max(2),
    storeNames: rWorkflowsPrepareEnterpriseWorkflowChangeSchema16Schema,
  }),
  z.strictObject({
    kind: z.literal("email"),
    purpose: z.enum(["review_drafts", "weekly_report", "exception"]),
    storeNames: rWorkflowsPrepareEnterpriseWorkflowChangeSchema16Schema,
    recipients: rWorkflowsPrepareEnterpriseWorkflowChangeSchema24Schema,
    allowedSender: z
      .string()
      .max(254)
      .regex(
        new RegExp(
          "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
        ),
      ),
    deliveryVersion: rWorkflowsPrepareEnterpriseWorkflowChangeSchema0Schema,
  }),
]);

export const rWorkflowsPrepareEnterpriseWorkflowChangeSchema34Schema = z
  .string()
  .min(1)
  .max(64)
  .regex(new RegExp("^[A-Za-z0-9_-]+$"));

export const bWorkflowsRecordWorkflowActionSchema0Schema = z
  .string()
  .min(1)
  .max(64)
  .regex(new RegExp("^[A-Za-z0-9_-]+$"));

export const bWorkflowsRecordWorkflowActionSchema1Schema = z
  .number()
  .int()
  .min(0)
  .max(4294967295);

export const bWorkflowsRecordWorkflowActionSchema5Schema = z
  .string()
  .min(1)
  .max(255);

export const bWorkflowsRecordWorkflowActionSchema4Schema = z
  .array(bWorkflowsRecordWorkflowActionSchema5Schema)
  .min(1)
  .max(2000);

export const bWorkflowsRecordWorkflowActionSchema7Schema = z
  .string()
  .regex(
    new RegExp(
      "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$",
    ),
  );

export const bWorkflowsRecordWorkflowActionSchema6Schema = z.strictObject({
  startDate: bWorkflowsRecordWorkflowActionSchema7Schema,
  endDate: bWorkflowsRecordWorkflowActionSchema7Schema,
});

export const bWorkflowsRecordWorkflowActionSchema8Schema = z.literal("upload");

export const bWorkflowsRecordWorkflowActionSchema9Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
]);

export const bWorkflowsRecordWorkflowActionSchema10Schema =
  z.literal("settled_only");

export const bWorkflowsRecordWorkflowActionSchema11Schema = z
  .string()
  .regex(new RegExp("^[a-f0-9]{64}$"));

export const bWorkflowsRecordWorkflowActionSchema13Schema = z.enum([
  "meituan_erp",
  "meituan_reviews",
]);

export const bWorkflowsRecordWorkflowActionSchema14Schema = z.enum([
  "erp",
  "meituan",
  "dianping",
]);

export const bWorkflowsRecordWorkflowActionSchema15Schema =
  bWorkflowsRecordWorkflowActionSchema5Schema;

export const bWorkflowsRecordWorkflowActionSchema12Schema = z.strictObject({
  product: bWorkflowsRecordWorkflowActionSchema13Schema,
  channel: bWorkflowsRecordWorkflowActionSchema14Schema,
  accountRef: bWorkflowsRecordWorkflowActionSchema5Schema,
  sourceStoreId: bWorkflowsRecordWorkflowActionSchema15Schema.optional(),
  sourceStoreName: bWorkflowsRecordWorkflowActionSchema5Schema,
});

export const bWorkflowsRecordWorkflowActionSchema16Schema = z.literal("email");

export const bWorkflowsRecordWorkflowActionSchema17Schema = z.enum([
  "review_drafts",
  "weekly_report",
  "exception",
]);

export const bWorkflowsRecordWorkflowActionSchema19Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const bWorkflowsRecordWorkflowActionSchema18Schema = z
  .array(bWorkflowsRecordWorkflowActionSchema19Schema)
  .max(20);

export const bWorkflowsRecordWorkflowActionSchema20Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const bWorkflowsRecordWorkflowActionSchema22Schema = z.strictObject({
  source: bWorkflowsRecordWorkflowActionSchema12Schema,
  feedbackId: bWorkflowsRecordWorkflowActionSchema5Schema,
  recipient: z
    .string()
    .max(254)
    .regex(
      new RegExp(
        "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
      ),
    ),
});

export const bWorkflowsRecordWorkflowActionSchema21Schema = z
  .array(bWorkflowsRecordWorkflowActionSchema22Schema)
  .max(100);

export const bWorkflowsRecordWorkflowActionSchema3Schema = z.union([
  z.strictObject({
    storeNames: bWorkflowsRecordWorkflowActionSchema4Schema,
    window: bWorkflowsRecordWorkflowActionSchema6Schema,
    kind: bWorkflowsRecordWorkflowActionSchema8Schema,
    dataset: bWorkflowsRecordWorkflowActionSchema9Schema,
    orderScope: bWorkflowsRecordWorkflowActionSchema10Schema.optional(),
    sourceHash: bWorkflowsRecordWorkflowActionSchema11Schema,
    metadataHash: bWorkflowsRecordWorkflowActionSchema11Schema,
  }),
  z.strictObject({
    storeNames: bWorkflowsRecordWorkflowActionSchema4Schema,
    window: bWorkflowsRecordWorkflowActionSchema6Schema,
    kind: z.literal("download"),
    dataset: z.enum([
      "business",
      "dishes",
      "in_store_orders",
      "takeaway_orders",
    ]),
    manifestHash: bWorkflowsRecordWorkflowActionSchema11Schema.optional(),
  }),
  z.strictObject({
    storeNames: bWorkflowsRecordWorkflowActionSchema4Schema,
    window: bWorkflowsRecordWorkflowActionSchema6Schema,
    kind: z.literal("review_sync"),
    source: bWorkflowsRecordWorkflowActionSchema12Schema,
    observedFactsHash: bWorkflowsRecordWorkflowActionSchema11Schema,
  }),
  z.strictObject({
    kind: z.literal("review_publish"),
    storeName: bWorkflowsRecordWorkflowActionSchema5Schema,
    source: bWorkflowsRecordWorkflowActionSchema12Schema,
    feedbackId: bWorkflowsRecordWorkflowActionSchema5Schema,
    purpose: z.literal("customer_reply"),
  }),
  z.strictObject({
    storeNames: bWorkflowsRecordWorkflowActionSchema4Schema,
    window: bWorkflowsRecordWorkflowActionSchema6Schema,
    kind: bWorkflowsRecordWorkflowActionSchema16Schema,
    purpose: bWorkflowsRecordWorkflowActionSchema17Schema,
    recipients: bWorkflowsRecordWorkflowActionSchema18Schema,
    sender: bWorkflowsRecordWorkflowActionSchema20Schema,
    deliveryVersion: bWorkflowsRecordWorkflowActionSchema1Schema,
    reviewIdentities: bWorkflowsRecordWorkflowActionSchema21Schema.optional(),
  }),
]);

export const bWorkflowsRecordWorkflowActionSchema23Schema =
  bWorkflowsRecordWorkflowActionSchema11Schema;

export const bWorkflowsRecordWorkflowActionSchema24Schema =
  bWorkflowsRecordWorkflowActionSchema0Schema;

export const bWorkflowsRecordWorkflowActionSchema2Schema = z.strictObject({
  actionId: bWorkflowsRecordWorkflowActionSchema0Schema,
  identity: bWorkflowsRecordWorkflowActionSchema3Schema,
  artifactHash: bWorkflowsRecordWorkflowActionSchema23Schema.optional(),
  correlationMarker: bWorkflowsRecordWorkflowActionSchema24Schema.optional(),
});

export const bWorkflowsRecordWorkflowActionSchema26Schema = z.enum([
  "confirmed",
  "failed",
  "unknown",
]);

export const bWorkflowsRecordWorkflowActionSchema27Schema = z.enum([
  "service_status",
  "launcher_transfer",
  "provider_readback",
  "smedc_readback",
  "manual_resolution",
  "request_rejected",
  "transport_unknown",
]);

export const bWorkflowsRecordWorkflowActionSchema28Schema =
  bWorkflowsRecordWorkflowActionSchema5Schema;

export const bWorkflowsRecordWorkflowActionSchema29Schema =
  bWorkflowsRecordWorkflowActionSchema5Schema;

export const bWorkflowsRecordWorkflowActionSchema30Schema =
  bWorkflowsRecordWorkflowActionSchema11Schema;

export const bWorkflowsRecordWorkflowActionSchema31Schema = z
  .string()
  .max(2000);

export const bWorkflowsRecordWorkflowActionSchema32Schema = z
  .string()
  .regex(
    new RegExp(
      "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
    ),
  );

export const bWorkflowsRecordWorkflowActionSchema33Schema = z.strictObject({
  identityHash: bWorkflowsRecordWorkflowActionSchema11Schema,
  manifestHash: bWorkflowsRecordWorkflowActionSchema11Schema,
  resultHash: bWorkflowsRecordWorkflowActionSchema11Schema,
  launcherVersion: z.string().regex(new RegExp("^\\d+\\.\\d+\\.\\d+$")),
  verifiedAt: z
    .string()
    .regex(
      new RegExp(
        "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
      ),
    ),
  partitionCount: z.number().int().min(0).max(100000),
  fileCount: z.number().int().min(0).max(100000),
  totalByteSize: z.string().regex(new RegExp("^\\d{1,20}$")),
  totalRowCount: z.string().regex(new RegExp("^\\d{1,20}$")),
  requestId: bWorkflowsRecordWorkflowActionSchema0Schema.optional(),
});

export const bWorkflowsRecordWorkflowActionSchema34Schema = z.strictObject({
  identityHash: bWorkflowsRecordWorkflowActionSchema11Schema,
  observedFactsHash: bWorkflowsRecordWorkflowActionSchema11Schema,
  resultHash: bWorkflowsRecordWorkflowActionSchema11Schema,
  recordIds: z
    .array(bWorkflowsRecordWorkflowActionSchema0Schema)
    .min(1)
    .max(1000),
  observedAt: z
    .string()
    .regex(
      new RegExp(
        "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
      ),
    ),
  outcome: z.literal("matched"),
  reviewCount: z.number().int().max(1000).gt(0),
  matchedCount: z.number().int().max(1000).gt(0),
});

export const bWorkflowsRecordWorkflowActionSchema35Schema = z.strictObject({
  identityHash: bWorkflowsRecordWorkflowActionSchema11Schema,
  artifactHash: bWorkflowsRecordWorkflowActionSchema11Schema,
  correlationMarker: bWorkflowsRecordWorkflowActionSchema0Schema,
  providerReceiptId: bWorkflowsRecordWorkflowActionSchema5Schema,
  observedAt: z
    .string()
    .regex(
      new RegExp(
        "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
      ),
    ),
  outcome: z.enum(["published", "sent", "not_executed"]),
});

export const bWorkflowsRecordWorkflowActionSchema25Schema = z.strictObject({
  actionId: bWorkflowsRecordWorkflowActionSchema0Schema,
  state: bWorkflowsRecordWorkflowActionSchema26Schema,
  evidence: bWorkflowsRecordWorkflowActionSchema27Schema,
  receiptId: bWorkflowsRecordWorkflowActionSchema28Schema.optional(),
  jobId: bWorkflowsRecordWorkflowActionSchema29Schema.optional(),
  resultHash: bWorkflowsRecordWorkflowActionSchema30Schema.optional(),
  reason: bWorkflowsRecordWorkflowActionSchema31Schema.optional(),
  verifiedAt: bWorkflowsRecordWorkflowActionSchema32Schema,
  launcherTransfer: bWorkflowsRecordWorkflowActionSchema33Schema.optional(),
  smedcReadback: bWorkflowsRecordWorkflowActionSchema34Schema.optional(),
  providerReadback: bWorkflowsRecordWorkflowActionSchema35Schema.optional(),
});

export const rWorkflowsRecordWorkflowActionSchema1Schema = z
  .string()
  .min(1)
  .max(255);

export const rWorkflowsRecordWorkflowActionSchema0Schema = z
  .array(rWorkflowsRecordWorkflowActionSchema1Schema)
  .min(1)
  .max(2000);

export const rWorkflowsRecordWorkflowActionSchema3Schema = z
  .string()
  .regex(
    new RegExp(
      "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$",
    ),
  );

export const rWorkflowsRecordWorkflowActionSchema2Schema = z.strictObject({
  startDate: rWorkflowsRecordWorkflowActionSchema3Schema,
  endDate: rWorkflowsRecordWorkflowActionSchema3Schema,
});

export const rWorkflowsRecordWorkflowActionSchema4Schema = z.literal("upload");

export const rWorkflowsRecordWorkflowActionSchema5Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
]);

export const rWorkflowsRecordWorkflowActionSchema6Schema =
  z.literal("settled_only");

export const rWorkflowsRecordWorkflowActionSchema7Schema = z
  .string()
  .regex(new RegExp("^[a-f0-9]{64}$"));

export const rWorkflowsRecordWorkflowActionSchema9Schema = z.enum([
  "meituan_erp",
  "meituan_reviews",
]);

export const rWorkflowsRecordWorkflowActionSchema10Schema = z.enum([
  "erp",
  "meituan",
  "dianping",
]);

export const rWorkflowsRecordWorkflowActionSchema11Schema =
  rWorkflowsRecordWorkflowActionSchema1Schema;

export const rWorkflowsRecordWorkflowActionSchema8Schema = z.strictObject({
  product: rWorkflowsRecordWorkflowActionSchema9Schema,
  channel: rWorkflowsRecordWorkflowActionSchema10Schema,
  accountRef: rWorkflowsRecordWorkflowActionSchema1Schema,
  sourceStoreId: rWorkflowsRecordWorkflowActionSchema11Schema.optional(),
  sourceStoreName: rWorkflowsRecordWorkflowActionSchema1Schema,
});

export const rWorkflowsRecordWorkflowActionSchema12Schema = z.literal("email");

export const rWorkflowsRecordWorkflowActionSchema13Schema = z.enum([
  "review_drafts",
  "weekly_report",
  "exception",
]);

export const rWorkflowsRecordWorkflowActionSchema15Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const rWorkflowsRecordWorkflowActionSchema14Schema = z
  .array(rWorkflowsRecordWorkflowActionSchema15Schema)
  .max(20);

export const rWorkflowsRecordWorkflowActionSchema16Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const rWorkflowsRecordWorkflowActionSchema17Schema = z
  .number()
  .int()
  .min(0)
  .max(4294967295);

export const rWorkflowsRecordWorkflowActionSchema19Schema = z.strictObject({
  source: rWorkflowsRecordWorkflowActionSchema8Schema,
  feedbackId: rWorkflowsRecordWorkflowActionSchema1Schema,
  recipient: z
    .string()
    .max(254)
    .regex(
      new RegExp(
        "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
      ),
    ),
});

export const rWorkflowsRecordWorkflowActionSchema18Schema = z
  .array(rWorkflowsRecordWorkflowActionSchema19Schema)
  .max(100);

export const rWorkflowsRecordWorkflowActionSchema21Schema = z
  .string()
  .min(1)
  .max(64)
  .regex(new RegExp("^[A-Za-z0-9_-]+$"));

export const rWorkflowsRecordWorkflowActionSchema22Schema = z.enum([
  "confirmed",
  "failed",
  "unknown",
]);

export const rWorkflowsRecordWorkflowActionSchema23Schema = z.enum([
  "service_status",
  "launcher_transfer",
  "provider_readback",
  "smedc_readback",
  "manual_resolution",
  "request_rejected",
  "transport_unknown",
]);

export const rWorkflowsRecordWorkflowActionSchema24Schema =
  rWorkflowsRecordWorkflowActionSchema1Schema;

export const rWorkflowsRecordWorkflowActionSchema25Schema =
  rWorkflowsRecordWorkflowActionSchema1Schema;

export const rWorkflowsRecordWorkflowActionSchema26Schema =
  rWorkflowsRecordWorkflowActionSchema7Schema;

export const rWorkflowsRecordWorkflowActionSchema27Schema = z
  .string()
  .max(2000);

export const rWorkflowsRecordWorkflowActionSchema28Schema = z
  .string()
  .regex(
    new RegExp(
      "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
    ),
  );

export const rWorkflowsRecordWorkflowActionSchema29Schema = z.strictObject({
  identityHash: rWorkflowsRecordWorkflowActionSchema7Schema,
  manifestHash: rWorkflowsRecordWorkflowActionSchema7Schema,
  resultHash: rWorkflowsRecordWorkflowActionSchema7Schema,
  launcherVersion: z.string().regex(new RegExp("^\\d+\\.\\d+\\.\\d+$")),
  verifiedAt: z
    .string()
    .regex(
      new RegExp(
        "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
      ),
    ),
  partitionCount: z.number().int().min(0).max(100000),
  fileCount: z.number().int().min(0).max(100000),
  totalByteSize: z.string().regex(new RegExp("^\\d{1,20}$")),
  totalRowCount: z.string().regex(new RegExp("^\\d{1,20}$")),
  requestId: rWorkflowsRecordWorkflowActionSchema21Schema.optional(),
});

export const rWorkflowsRecordWorkflowActionSchema30Schema = z.strictObject({
  identityHash: rWorkflowsRecordWorkflowActionSchema7Schema,
  observedFactsHash: rWorkflowsRecordWorkflowActionSchema7Schema,
  resultHash: rWorkflowsRecordWorkflowActionSchema7Schema,
  recordIds: z
    .array(rWorkflowsRecordWorkflowActionSchema21Schema)
    .min(1)
    .max(1000),
  observedAt: z
    .string()
    .regex(
      new RegExp(
        "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
      ),
    ),
  outcome: z.literal("matched"),
  reviewCount: z.number().int().max(1000).gt(0),
  matchedCount: z.number().int().max(1000).gt(0),
});

export const rWorkflowsRecordWorkflowActionSchema31Schema = z.strictObject({
  identityHash: rWorkflowsRecordWorkflowActionSchema7Schema,
  artifactHash: rWorkflowsRecordWorkflowActionSchema7Schema,
  correlationMarker: rWorkflowsRecordWorkflowActionSchema21Schema,
  providerReceiptId: rWorkflowsRecordWorkflowActionSchema1Schema,
  observedAt: z
    .string()
    .regex(
      new RegExp(
        "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
      ),
    ),
  outcome: z.enum(["published", "sent", "not_executed"]),
});

export const rWorkflowsRecordWorkflowActionSchema20Schema = z.strictObject({
  actionId: rWorkflowsRecordWorkflowActionSchema21Schema,
  state: rWorkflowsRecordWorkflowActionSchema22Schema,
  evidence: rWorkflowsRecordWorkflowActionSchema23Schema,
  receiptId: rWorkflowsRecordWorkflowActionSchema24Schema.optional(),
  jobId: rWorkflowsRecordWorkflowActionSchema25Schema.optional(),
  resultHash: rWorkflowsRecordWorkflowActionSchema26Schema.optional(),
  reason: rWorkflowsRecordWorkflowActionSchema27Schema.optional(),
  verifiedAt: rWorkflowsRecordWorkflowActionSchema28Schema,
  launcherTransfer: rWorkflowsRecordWorkflowActionSchema29Schema.optional(),
  smedcReadback: rWorkflowsRecordWorkflowActionSchema30Schema.optional(),
  providerReadback: rWorkflowsRecordWorkflowActionSchema31Schema.optional(),
});

export const bWorkflowsSaveEnterpriseWorkflowSchema0Schema = z
  .number()
  .int()
  .min(0)
  .max(4294967295);

export const rWorkflowsSaveEnterpriseWorkflowSchema0Schema = z
  .number()
  .int()
  .min(0)
  .max(4294967295);

export const rWorkflowsSaveEnterpriseWorkflowSchema1Schema = z
  .string()
  .regex(
    new RegExp(
      "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
    ),
  );

export const rWorkflowsSaveEnterpriseWorkflowSchema3Schema = z.literal(1);

export const rWorkflowsSaveEnterpriseWorkflowSchema5Schema = z
  .string()
  .min(1)
  .max(255);

export const rWorkflowsSaveEnterpriseWorkflowSchema4Schema = z
  .array(rWorkflowsSaveEnterpriseWorkflowSchema5Schema)
  .min(1)
  .max(2000);

export const rWorkflowsSaveEnterpriseWorkflowSchema6Schema =
  z.literal("action_required");

export const rWorkflowsSaveEnterpriseWorkflowSchema7Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
]);

export const rWorkflowsSaveEnterpriseWorkflowSchema2Schema = z.strictObject({
  schemaVersion: rWorkflowsSaveEnterpriseWorkflowSchema3Schema,
  storeNames: rWorkflowsSaveEnterpriseWorkflowSchema4Schema,
  notificationPolicy: rWorkflowsSaveEnterpriseWorkflowSchema6Schema,
  type: z.literal("meituan-daily-ingestion"),
  datasets: z
    .array(rWorkflowsSaveEnterpriseWorkflowSchema7Schema)
    .min(1)
    .max(5),
  orderScope: z.literal("settled_only"),
  cleanupPolicy: z.literal("confirmed_files_only"),
});

export const rWorkflowsSaveEnterpriseWorkflowSchema10Schema = z.enum([
  "meituan_erp",
  "meituan_reviews",
]);

export const rWorkflowsSaveEnterpriseWorkflowSchema11Schema = z.enum([
  "erp",
  "meituan",
  "dianping",
]);

export const rWorkflowsSaveEnterpriseWorkflowSchema12Schema =
  rWorkflowsSaveEnterpriseWorkflowSchema5Schema;

export const rWorkflowsSaveEnterpriseWorkflowSchema13Schema = z.strictObject({
  product: rWorkflowsSaveEnterpriseWorkflowSchema10Schema,
  channel: rWorkflowsSaveEnterpriseWorkflowSchema11Schema,
  accountRef: rWorkflowsSaveEnterpriseWorkflowSchema5Schema,
  sourceStoreId: rWorkflowsSaveEnterpriseWorkflowSchema12Schema.optional(),
  sourceStoreName: rWorkflowsSaveEnterpriseWorkflowSchema5Schema,
});

export const rWorkflowsSaveEnterpriseWorkflowSchema9Schema = z.strictObject({
  source: rWorkflowsSaveEnterpriseWorkflowSchema13Schema,
  feedbackId: rWorkflowsSaveEnterpriseWorkflowSchema5Schema,
  reason: z.string().min(1).max(2000),
  purpose: z.literal("exclude_source_record"),
});

export const rWorkflowsSaveEnterpriseWorkflowSchema14Schema = z.enum([
  "meituan",
  "dianping",
]);

export const rWorkflowsSaveEnterpriseWorkflowSchema16Schema = z.boolean();

export const rWorkflowsSaveEnterpriseWorkflowSchema18Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const rWorkflowsSaveEnterpriseWorkflowSchema17Schema = z
  .array(rWorkflowsSaveEnterpriseWorkflowSchema18Schema)
  .max(20);

export const rWorkflowsSaveEnterpriseWorkflowSchema19Schema = z
  .string()
  .max(254)
  .regex(
    new RegExp(
      "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
    ),
  );

export const rWorkflowsSaveEnterpriseWorkflowSchema15Schema = z.strictObject({
  enabled: rWorkflowsSaveEnterpriseWorkflowSchema16Schema,
  recipients: rWorkflowsSaveEnterpriseWorkflowSchema17Schema,
  allowedSender: rWorkflowsSaveEnterpriseWorkflowSchema19Schema.optional(),
});

export const rWorkflowsSaveEnterpriseWorkflowSchema8Schema = z.strictObject({
  schemaVersion: rWorkflowsSaveEnterpriseWorkflowSchema3Schema,
  storeNames: rWorkflowsSaveEnterpriseWorkflowSchema4Schema,
  notificationPolicy: rWorkflowsSaveEnterpriseWorkflowSchema6Schema,
  type: z.literal("meituan-review-operations"),
  executionPolicy: z.strictObject({
    id: z.literal("verified-review-operations"),
    version: z.literal(1),
  }),
  ignoredReviewIdentities: z
    .array(rWorkflowsSaveEnterpriseWorkflowSchema9Schema)
    .max(2000),
  channels: z
    .array(rWorkflowsSaveEnterpriseWorkflowSchema14Schema)
    .min(1)
    .max(2),
  publication: z.strictObject({
    enabled: z.boolean(),
    storeNames: z
      .array(rWorkflowsSaveEnterpriseWorkflowSchema5Schema)
      .max(2000),
  }),
  brandFacts: z.string().max(20000),
  tone: z.string().max(2000),
  draftNotification: rWorkflowsSaveEnterpriseWorkflowSchema15Schema,
  cleanupPolicy: z.literal("complete_run_only"),
});

export const rWorkflowsSaveEnterpriseWorkflowSchema21Schema = z.strictObject({
  name: rWorkflowsSaveEnterpriseWorkflowSchema5Schema,
  storeNames: rWorkflowsSaveEnterpriseWorkflowSchema4Schema,
});

export const rWorkflowsSaveEnterpriseWorkflowSchema20Schema = z.strictObject({
  schemaVersion: rWorkflowsSaveEnterpriseWorkflowSchema3Schema,
  storeNames: rWorkflowsSaveEnterpriseWorkflowSchema4Schema,
  notificationPolicy: rWorkflowsSaveEnterpriseWorkflowSchema6Schema,
  type: z.literal("weekly-business-report"),
  groups: z.array(rWorkflowsSaveEnterpriseWorkflowSchema21Schema).max(100),
  delivery: rWorkflowsSaveEnterpriseWorkflowSchema15Schema,
  cleanupPolicy: z.literal("retain_final_report"),
});

export const rWorkflowsSaveEnterpriseWorkflowSchema22Schema = z.literal(1);

export const rWorkflowsSaveEnterpriseWorkflowSchema23Schema =
  z.literal("Asia/Shanghai");

export const rWorkflowsSaveEnterpriseWorkflowSchema25Schema = z.strictObject({
  product: z.enum(["meituan_erp", "meituan_reviews"]),
  accountRef: rWorkflowsSaveEnterpriseWorkflowSchema5Schema,
  displayName: rWorkflowsSaveEnterpriseWorkflowSchema5Schema,
  sourceEnterpriseName: rWorkflowsSaveEnterpriseWorkflowSchema5Schema,
  sourceGroupName: rWorkflowsSaveEnterpriseWorkflowSchema5Schema.optional(),
});

export const rWorkflowsSaveEnterpriseWorkflowSchema24Schema = z
  .array(rWorkflowsSaveEnterpriseWorkflowSchema25Schema)
  .max(100);

export const rWorkflowsSaveEnterpriseWorkflowSchema27Schema = z.strictObject({
  source: rWorkflowsSaveEnterpriseWorkflowSchema13Schema,
  storeName: rWorkflowsSaveEnterpriseWorkflowSchema5Schema,
});

export const rWorkflowsSaveEnterpriseWorkflowSchema26Schema = z
  .array(rWorkflowsSaveEnterpriseWorkflowSchema27Schema)
  .max(2000);

export const rWorkflowsSaveEnterpriseWorkflowSchema29Schema = z.strictObject({
  source: rWorkflowsSaveEnterpriseWorkflowSchema13Schema,
  reason: z.string().min(1).max(2000),
});

export const rWorkflowsSaveEnterpriseWorkflowSchema28Schema = z
  .array(rWorkflowsSaveEnterpriseWorkflowSchema29Schema)
  .max(2000);

export const rWorkflowsSaveEnterpriseWorkflowSchema30Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
]);

export const rWorkflowsSaveEnterpriseWorkflowSchema31Schema = z.enum([
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
]);

export const rWorkflowsSaveEnterpriseWorkflowSchema32Schema = z.enum([
  "meituan",
  "dianping",
]);

export const rWorkflowsSaveEnterpriseWorkflowSchema33Schema = z.enum([
  "meituan",
  "dianping",
]);

export const directoryCreateEmployeeBodySchema = z.strictObject({
  enterpriseKey: z.string().min(1).max(128),
  name: z.string().min(1).max(255),
  departmentId: bDirectoryCreateEmployeeSchema0Schema,
  scope: z.union([
    z.strictObject({
      ownership: z.literal("group"),
      storeId: z.null(),
    }),
    z.strictObject({
      ownership: z.literal("store"),
      storeId: bDirectoryCreateEmployeeSchema0Schema,
    }),
  ]),
});

export type DirectoryCreateEmployeeBody = z.infer<
  typeof directoryCreateEmployeeBodySchema
>;

export const directoryCreateEmployeeParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type DirectoryCreateEmployeeParams = z.infer<
  typeof directoryCreateEmployeeParamsSchema
>;

export const directoryCreateEmployeeQuerySchema = z.strictObject({});

export type DirectoryCreateEmployeeQuery = z.infer<
  typeof directoryCreateEmployeeQuerySchema
>;

export const directoryCreateEmployeeResponseSchema = z.strictObject({
  employeeUid: z
    .string()
    .regex(
      new RegExp(
        "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
      ),
    ),
});

export type DirectoryCreateEmployeeResponse = z.infer<
  typeof directoryCreateEmployeeResponseSchema
>;

export const directoryGetEmployeeBodySchema = z.strictObject({
  enterpriseKey: z.string().min(1).max(128),
  employeeUid: z
    .string()
    .regex(
      new RegExp(
        "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
      ),
    ),
});

export type DirectoryGetEmployeeBody = z.infer<
  typeof directoryGetEmployeeBodySchema
>;

export const directoryGetEmployeeParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type DirectoryGetEmployeeParams = z.infer<
  typeof directoryGetEmployeeParamsSchema
>;

export const directoryGetEmployeeQuerySchema = z.strictObject({});

export type DirectoryGetEmployeeQuery = z.infer<
  typeof directoryGetEmployeeQuerySchema
>;

export const directoryGetEmployeeResponseSchema = z.strictObject({
  employee: z.strictObject({
    employeeUid: rDirectoryGetEmployeeSchema0Schema,
    name: z.string(),
    departmentId: rDirectoryGetEmployeeSchema0Schema,
    departmentName: z.string(),
    scope: z.union([
      z.strictObject({
        ownership: z.literal("group"),
        storeId: z.null(),
        storeName: z.null(),
      }),
      z.strictObject({
        ownership: z.literal("store"),
        storeId: rDirectoryGetEmployeeSchema0Schema,
        storeName: z.string(),
      }),
    ]),
    status: z.enum(["active", "departed"]),
    version: z.string().regex(new RegExp("^(0|[1-9]\\d*)$")),
  }),
});

export type DirectoryGetEmployeeResponse = z.infer<
  typeof directoryGetEmployeeResponseSchema
>;

export const directoryListDirectoryBodySchema = z.strictObject({
  enterpriseKey: z.string().min(1).max(128),
  management: z.boolean().optional(),
});

export type DirectoryListDirectoryBody = z.infer<
  typeof directoryListDirectoryBodySchema
>;

export const directoryListDirectoryParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type DirectoryListDirectoryParams = z.infer<
  typeof directoryListDirectoryParamsSchema
>;

export const directoryListDirectoryQuerySchema = z.strictObject({});

export type DirectoryListDirectoryQuery = z.infer<
  typeof directoryListDirectoryQuerySchema
>;

export const directoryListDirectoryResponseSchema = z.strictObject({
  enterpriseKey: z.string(),
  enterpriseName: z.string(),
  stores: z.array(
    z.strictObject({
      storeId: rDirectoryListDirectorySchema0Schema,
      storeKey: z.string().optional(),
      name: z.string(),
      status: z.enum(["confirmed", "pending", "historical", "retired"]),
      version: rDirectoryListDirectorySchema1Schema,
    }),
  ),
  departments: z.array(
    z.strictObject({
      departmentId: rDirectoryListDirectorySchema0Schema,
      name: z.string(),
      status: z.enum(["active", "retired"]),
      version: rDirectoryListDirectorySchema1Schema,
    }),
  ),
});

export type DirectoryListDirectoryResponse = z.infer<
  typeof directoryListDirectoryResponseSchema
>;

export const directoryListEmployeesBodySchema = z.strictObject({
  enterpriseKey: z.string().min(1).max(128),
  status: z.enum(["active", "departed"]).optional(),
  search: z.string().max(255).optional(),
  departmentId: bDirectoryListEmployeesSchema0Schema.optional(),
  storeId: bDirectoryListEmployeesSchema0Schema.optional(),
  cursor: bDirectoryListEmployeesSchema0Schema.optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export type DirectoryListEmployeesBody = z.infer<
  typeof directoryListEmployeesBodySchema
>;

export const directoryListEmployeesParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type DirectoryListEmployeesParams = z.infer<
  typeof directoryListEmployeesParamsSchema
>;

export const directoryListEmployeesQuerySchema = z.strictObject({});

export type DirectoryListEmployeesQuery = z.infer<
  typeof directoryListEmployeesQuerySchema
>;

export const directoryListEmployeesResponseSchema = z.strictObject({
  employees: z.array(
    z.strictObject({
      employeeUid: rDirectoryListEmployeesSchema0Schema,
      name: z.string(),
      departmentId: rDirectoryListEmployeesSchema0Schema,
      departmentName: z.string(),
      scope: z.union([
        z.strictObject({
          ownership: z.literal("group"),
          storeId: z.null(),
          storeName: z.null(),
        }),
        z.strictObject({
          ownership: z.literal("store"),
          storeId: rDirectoryListEmployeesSchema0Schema,
          storeName: z.string(),
        }),
      ]),
      status: z.enum(["active", "departed"]),
      version: z.string().regex(new RegExp("^(0|[1-9]\\d*)$")),
    }),
  ),
  access: z.enum(["none", "partial", "all"]),
  nextCursor: z.union([rDirectoryListEmployeesSchema0Schema, z.null()]),
});

export type DirectoryListEmployeesResponse = z.infer<
  typeof directoryListEmployeesResponseSchema
>;

export const directoryManageDepartmentBodySchema = z.strictObject({
  enterpriseKey: z.string().min(1).max(128),
  operation: z.union([
    z.strictObject({
      kind: z.literal("create"),
      name: bDirectoryManageDepartmentSchema0Schema,
    }),
    z.strictObject({
      kind: z.literal("rename"),
      departmentId: bDirectoryManageDepartmentSchema1Schema,
      expectedVersion: bDirectoryManageDepartmentSchema2Schema,
      name: bDirectoryManageDepartmentSchema0Schema,
    }),
    z.strictObject({
      kind: z.literal("retire"),
      departmentId: bDirectoryManageDepartmentSchema1Schema,
      expectedVersion: bDirectoryManageDepartmentSchema2Schema,
    }),
    z.strictObject({
      kind: z.literal("restore"),
      departmentId: bDirectoryManageDepartmentSchema1Schema,
      expectedVersion: bDirectoryManageDepartmentSchema2Schema,
    }),
  ]),
});

export type DirectoryManageDepartmentBody = z.infer<
  typeof directoryManageDepartmentBodySchema
>;

export const directoryManageDepartmentParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type DirectoryManageDepartmentParams = z.infer<
  typeof directoryManageDepartmentParamsSchema
>;

export const directoryManageDepartmentQuerySchema = z.strictObject({});

export type DirectoryManageDepartmentQuery = z.infer<
  typeof directoryManageDepartmentQuerySchema
>;

export const directoryManageDepartmentResponseSchema = z.strictObject({
  departmentId: z
    .string()
    .regex(
      new RegExp(
        "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
      ),
    ),
  version: z.string().regex(new RegExp("^(0|[1-9]\\d*)$")),
});

export type DirectoryManageDepartmentResponse = z.infer<
  typeof directoryManageDepartmentResponseSchema
>;

export const directoryManageStoreBodySchema = z.strictObject({
  enterpriseKey: z.string().min(1).max(128),
  operation: z.union([
    z.strictObject({
      kind: z.literal("create"),
      name: bDirectoryManageStoreSchema0Schema,
    }),
    z.strictObject({
      kind: z.literal("rename"),
      storeId: bDirectoryManageStoreSchema1Schema,
      expectedVersion: bDirectoryManageStoreSchema2Schema,
      name: bDirectoryManageStoreSchema0Schema,
    }),
    z.strictObject({
      kind: z.literal("confirm"),
      storeId: bDirectoryManageStoreSchema1Schema,
      expectedVersion: bDirectoryManageStoreSchema2Schema,
    }),
    z.strictObject({
      kind: z.literal("historical"),
      storeId: bDirectoryManageStoreSchema1Schema,
      expectedVersion: bDirectoryManageStoreSchema2Schema,
    }),
    z.strictObject({
      kind: z.literal("retire"),
      storeId: bDirectoryManageStoreSchema1Schema,
      expectedVersion: bDirectoryManageStoreSchema2Schema,
    }),
    z.strictObject({
      kind: z.literal("restore"),
      storeId: bDirectoryManageStoreSchema1Schema,
      expectedVersion: bDirectoryManageStoreSchema2Schema,
    }),
  ]),
});

export type DirectoryManageStoreBody = z.infer<
  typeof directoryManageStoreBodySchema
>;

export const directoryManageStoreParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type DirectoryManageStoreParams = z.infer<
  typeof directoryManageStoreParamsSchema
>;

export const directoryManageStoreQuerySchema = z.strictObject({});

export type DirectoryManageStoreQuery = z.infer<
  typeof directoryManageStoreQuerySchema
>;

export const directoryManageStoreResponseSchema = z.strictObject({
  storeId: z
    .string()
    .regex(
      new RegExp(
        "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
      ),
    ),
  version: z.string().regex(new RegExp("^(0|[1-9]\\d*)$")),
});

export type DirectoryManageStoreResponse = z.infer<
  typeof directoryManageStoreResponseSchema
>;

export const directoryUpdateEmployeeBodySchema = z.strictObject({
  enterpriseKey: z.string().min(1).max(128),
  employeeUid: bDirectoryUpdateEmployeeSchema0Schema,
  expectedVersion: z.string().regex(new RegExp("^(0|[1-9]\\d*)$")),
  name: z.string().min(1).max(255),
  departmentId: bDirectoryUpdateEmployeeSchema0Schema,
  scope: z.union([
    z.strictObject({
      ownership: z.literal("group"),
      storeId: z.null(),
    }),
    z.strictObject({
      ownership: z.literal("store"),
      storeId: bDirectoryUpdateEmployeeSchema0Schema,
    }),
  ]),
  status: z.enum(["active", "departed"]),
});

export type DirectoryUpdateEmployeeBody = z.infer<
  typeof directoryUpdateEmployeeBodySchema
>;

export const directoryUpdateEmployeeParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type DirectoryUpdateEmployeeParams = z.infer<
  typeof directoryUpdateEmployeeParamsSchema
>;

export const directoryUpdateEmployeeQuerySchema = z.strictObject({});

export type DirectoryUpdateEmployeeQuery = z.infer<
  typeof directoryUpdateEmployeeQuerySchema
>;

export const directoryUpdateEmployeeResponseSchema = z.strictObject({
  employeeUid: z
    .string()
    .regex(
      new RegExp(
        "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
      ),
    ),
  version: z.string().regex(new RegExp("^(0|[1-9]\\d*)$")),
});

export type DirectoryUpdateEmployeeResponse = z.infer<
  typeof directoryUpdateEmployeeResponseSchema
>;

export const ledgerContextBodySchema = z.strictObject({});

export type LedgerContextBody = z.infer<typeof ledgerContextBodySchema>;

export const ledgerContextParamsSchema = z.strictObject({});

export type LedgerContextParams = z.infer<typeof ledgerContextParamsSchema>;

export const ledgerContextQuerySchema = z.strictObject({});

export type LedgerContextQuery = z.infer<typeof ledgerContextQuerySchema>;

export const ledgerContextResponseSchema = z.strictObject({
  identity: z.strictObject({
    userAccountId: z.string().min(1),
    orgId: z.string().min(1),
    displayName: z.string().min(1),
    organizationName: z.string().min(1),
  }),
  csrfToken: z.string().min(1),
  limits: z.strictObject({
    files: z.number().int().min(0).max(9007199254740991),
    bytes: z.number().int().min(0).max(9007199254740991),
    stores: z.number().int().min(0).max(9007199254740991),
    dates: z.number().int().min(0).max(9007199254740991),
    pageSize: z.number().int().max(9007199254740991).gt(0),
    deadlineMs: z.number().int().min(0).max(9007199254740991),
    retentionMs: z.number().int().min(0).max(9007199254740991),
  }),
});

export type LedgerContextResponse = z.infer<typeof ledgerContextResponseSchema>;

export const ledgerCoverageBodySchema = z.strictObject({
  scope: z
    .strictObject({
      storeNames: z.array(bLedgerCoverageSchema0Schema).optional(),
      dates: z.array(bLedgerCoverageSchema1Schema).optional(),
      startDate: bLedgerCoverageSchema1Schema.optional(),
      endDate: bLedgerCoverageSchema1Schema.optional(),
    })
    .optional(),
  selection: z
    .array(
      z.strictObject({
        storeName: bLedgerCoverageSchema0Schema,
        purchaseDate: bLedgerCoverageSchema1Schema,
      }),
    )
    .optional(),
  cursor: z.string().optional(),
});

export type LedgerCoverageBody = z.infer<typeof ledgerCoverageBodySchema>;

export const ledgerCoverageParamsSchema = z.strictObject({});

export type LedgerCoverageParams = z.infer<typeof ledgerCoverageParamsSchema>;

export const ledgerCoverageQuerySchema = z.strictObject({});

export type LedgerCoverageQuery = z.infer<typeof ledgerCoverageQuerySchema>;

export const ledgerCoverageResponseSchema = z.strictObject({
  partitions: z.array(
    z.strictObject({
      storeName: z.string().min(1),
      purchaseDate: z.string().min(1),
      status: z.enum(["ready", "pending", "stale", "missing"]),
      byteSize: z.union([
        z.number().int().max(9007199254740991).gt(0),
        z.null(),
      ]),
    }),
  ),
  nextCursor: z.union([z.string(), z.null()]),
});

export type LedgerCoverageResponse = z.infer<
  typeof ledgerCoverageResponseSchema
>;

export const ledgerDownloadsBodySchema = z.strictObject({
  selection: z.array(
    z.strictObject({
      storeName: z.string().min(1).max(512),
      purchaseDate: z
        .string()
        .regex(
          new RegExp(
            "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$",
          ),
        ),
    }),
  ),
  idempotencyKey: z.string().min(1).max(255),
});

export type LedgerDownloadsBody = z.infer<typeof ledgerDownloadsBodySchema>;

export const ledgerDownloadsParamsSchema = z.strictObject({});

export type LedgerDownloadsParams = z.infer<typeof ledgerDownloadsParamsSchema>;

export const ledgerDownloadsQuerySchema = z.strictObject({});

export type LedgerDownloadsQuery = z.infer<typeof ledgerDownloadsQuerySchema>;

export const ledgerDownloadsResponseSchema = z.strictObject({
  requestId: z.string().min(1),
  status: z.string().min(1),
});

export type LedgerDownloadsResponse = z.infer<
  typeof ledgerDownloadsResponseSchema
>;

export const ledgerPdfBodySchema = z.strictObject({});

export type LedgerPdfBody = z.infer<typeof ledgerPdfBodySchema>;

export const ledgerPdfParamsSchema = z.strictObject({});

export type LedgerPdfParams = z.infer<typeof ledgerPdfParamsSchema>;

export const ledgerPdfQuerySchema = z.strictObject({
  storeName: z.string().min(1).max(512),
  purchaseDate: z
    .string()
    .regex(
      new RegExp(
        "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$",
      ),
    ),
  disposition: z.enum(["inline", "attachment"]),
});

export type LedgerPdfQuery = z.infer<typeof ledgerPdfQuerySchema>;

export const ledgerPdfResponseSchema = z.unknown();

export type LedgerPdfResponse = z.infer<typeof ledgerPdfResponseSchema>;

export const ledgerRequestsDownloadUrlBodySchema = z.strictObject({});

export type LedgerRequestsDownloadUrlBody = z.infer<
  typeof ledgerRequestsDownloadUrlBodySchema
>;

export const ledgerRequestsDownloadUrlParamsSchema = z.strictObject({
  requestId: z.string().min(1).max(128),
});

export type LedgerRequestsDownloadUrlParams = z.infer<
  typeof ledgerRequestsDownloadUrlParamsSchema
>;

export const ledgerRequestsDownloadUrlQuerySchema = z.strictObject({});

export type LedgerRequestsDownloadUrlQuery = z.infer<
  typeof ledgerRequestsDownloadUrlQuerySchema
>;

export const ledgerRequestsDownloadUrlResponseSchema = z.strictObject({
  requestId: z.string().min(1),
  downloadUrl: z.string(),
  expiresAt: z.string().min(1),
});

export type LedgerRequestsDownloadUrlResponse = z.infer<
  typeof ledgerRequestsDownloadUrlResponseSchema
>;

export const ledgerRequestsReadBodySchema = z.strictObject({});

export type LedgerRequestsReadBody = z.infer<
  typeof ledgerRequestsReadBodySchema
>;

export const ledgerRequestsReadParamsSchema = z.strictObject({
  requestId: z.string().min(1).max(128),
});

export type LedgerRequestsReadParams = z.infer<
  typeof ledgerRequestsReadParamsSchema
>;

export const ledgerRequestsReadQuerySchema = z.strictObject({
  cursor: z.string().optional(),
});

export type LedgerRequestsReadQuery = z.infer<
  typeof ledgerRequestsReadQuerySchema
>;

export const ledgerRequestsReadResponseSchema = z.strictObject({
  requestId: z.string().min(1),
  status: z.string().min(1),
  errorCode: z.string().min(1).optional(),
  partitions: z.array(
    z.strictObject({
      storeName: z.string().min(1),
      purchaseDate: z.string().min(1),
      status: z.string().min(1),
    }),
  ),
  nextCursor: z.union([z.string(), z.null()]),
});

export type LedgerRequestsReadResponse = z.infer<
  typeof ledgerRequestsReadResponseSchema
>;

export const permissionsAccountsListBodySchema = z.strictObject({});

export type PermissionsAccountsListBody = z.infer<
  typeof permissionsAccountsListBodySchema
>;

export const permissionsAccountsListParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type PermissionsAccountsListParams = z.infer<
  typeof permissionsAccountsListParamsSchema
>;

export const permissionsAccountsListQuerySchema = z.strictObject({});

export type PermissionsAccountsListQuery = z.infer<
  typeof permissionsAccountsListQuerySchema
>;

export const permissionsAccountsListResponseSchema = z.strictObject({
  accounts: z.array(
    z.strictObject({
      orgId: z.string(),
      userAccountId: z.string(),
      role: z.enum(["admin", "employee"]),
      disabled: z.boolean(),
      clearance: z.number().int().min(-9007199254740991).max(9007199254740991),
      mode: z.enum(["legacy", "preparing", "enabled", "suspended"]),
      authorizationVersion: z.string(),
      categories: z.array(
        z.strictObject({
          id: z.string(),
          key: z.string().optional(),
          kind: z.enum(["fixed", "evidence"]),
          confidentialityLevel: z.union([
            z.number().int().min(-9007199254740991).max(9007199254740991),
            z.null(),
          ]),
          ownerships: z.array(rPermissionsAccountsListSchema0Schema),
          requiredDimensionIds: z.array(z.string()),
        }),
      ),
      grants: z.array(
        z.strictObject({
          id: z.string(),
          orgId: z.string(),
          enterpriseKey: z.string(),
          categoryIds: z.array(z.string()),
          ownership: rPermissionsAccountsListSchema0Schema,
          stores: rPermissionsAccountsListSchema1Schema.optional(),
          dimensions: z
            .object({})
            .catchall(rPermissionsAccountsListSchema1Schema),
        }),
      ),
      displayName: z.string(),
      email: z.string(),
      id: z.string(),
    }),
  ),
});

export type PermissionsAccountsListResponse = z.infer<
  typeof permissionsAccountsListResponseSchema
>;

export const permissionsAccountsReadBodySchema = z.strictObject({});

export type PermissionsAccountsReadBody = z.infer<
  typeof permissionsAccountsReadBodySchema
>;

export const permissionsAccountsReadParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
  userAccountId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type PermissionsAccountsReadParams = z.infer<
  typeof permissionsAccountsReadParamsSchema
>;

export const permissionsAccountsReadQuerySchema = z.strictObject({});

export type PermissionsAccountsReadQuery = z.infer<
  typeof permissionsAccountsReadQuerySchema
>;

export const permissionsAccountsReadResponseSchema = z.strictObject({
  orgId: z.string(),
  userAccountId: z.string(),
  role: z.enum(["admin", "employee"]),
  disabled: z.boolean(),
  clearance: z.number().int().min(-9007199254740991).max(9007199254740991),
  mode: z.enum(["legacy", "preparing", "enabled", "suspended"]),
  authorizationVersion: z.string(),
  categories: z.array(
    z.strictObject({
      id: z.string(),
      key: z.string().optional(),
      kind: z.enum(["fixed", "evidence"]),
      confidentialityLevel: z.union([
        z.number().int().min(-9007199254740991).max(9007199254740991),
        z.null(),
      ]),
      ownerships: z.array(rPermissionsAccountsReadSchema0Schema),
      requiredDimensionIds: z.array(z.string()),
    }),
  ),
  grants: z.array(
    z.strictObject({
      id: z.string(),
      orgId: z.string(),
      enterpriseKey: z.string(),
      categoryIds: z.array(z.string()),
      ownership: rPermissionsAccountsReadSchema0Schema,
      stores: rPermissionsAccountsReadSchema1Schema.optional(),
      dimensions: z.object({}).catchall(rPermissionsAccountsReadSchema1Schema),
    }),
  ),
});

export type PermissionsAccountsReadResponse = z.infer<
  typeof permissionsAccountsReadResponseSchema
>;

export const permissionsAccountsUpdateBodySchema = z.strictObject({
  expectedVersion: z.string().regex(new RegExp("^(0|[1-9]\\d*)$")),
  clearance: z.number().int().min(0).max(3),
  grants: z.array(bPermissionsAccountsUpdateSchema0Schema).max(100),
});

export type PermissionsAccountsUpdateBody = z.infer<
  typeof permissionsAccountsUpdateBodySchema
>;

export const permissionsAccountsUpdateParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
  userAccountId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type PermissionsAccountsUpdateParams = z.infer<
  typeof permissionsAccountsUpdateParamsSchema
>;

export const permissionsAccountsUpdateQuerySchema = z.strictObject({});

export type PermissionsAccountsUpdateQuery = z.infer<
  typeof permissionsAccountsUpdateQuerySchema
>;

export const permissionsAccountsUpdateResponseSchema = z.strictObject({
  authorizationVersion: z.string(),
  value: z.strictObject({
    clearance: z.number().int().min(-9007199254740991).max(9007199254740991),
    grants: z.array(
      z.strictObject({
        id: z.string(),
        orgId: z.string(),
        enterpriseKey: z.string(),
        categoryIds: z.array(z.string()),
        ownership: z.enum(["group", "store"]),
        stores: rPermissionsAccountsUpdateSchema0Schema.optional(),
        dimensions: z
          .object({})
          .catchall(rPermissionsAccountsUpdateSchema0Schema),
      }),
    ),
  }),
});

export type PermissionsAccountsUpdateResponse = z.infer<
  typeof permissionsAccountsUpdateResponseSchema
>;

export const permissionsCategoriesCreateBodySchema = z.strictObject({
  expectedVersion: z.string().regex(new RegExp("^(0|[1-9]\\d*)$")),
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  kind: z.literal("evidence").optional(),
  ownerships: z.array(bPermissionsCategoriesCreateSchema0Schema).min(1),
  requiredDimensionIds: z.array(z.string().min(1).max(64)),
  retired: z.boolean().optional(),
});

export type PermissionsCategoriesCreateBody = z.infer<
  typeof permissionsCategoriesCreateBodySchema
>;

export const permissionsCategoriesCreateParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type PermissionsCategoriesCreateParams = z.infer<
  typeof permissionsCategoriesCreateParamsSchema
>;

export const permissionsCategoriesCreateQuerySchema = z.strictObject({});

export type PermissionsCategoriesCreateQuery = z.infer<
  typeof permissionsCategoriesCreateQuerySchema
>;

export const permissionsCategoriesCreateResponseSchema = z.strictObject({
  authorizationVersion: z.string(),
  value: z.strictObject({
    orgId: z.string(),
    id: z.string(),
    key: z.union([z.string(), z.null()]),
    name: z.string(),
    kind: z.enum(["fixed", "evidence"]),
    confidentialityLevel: z.union([
      z.number().int().min(-9007199254740991).max(9007199254740991),
      z.null(),
    ]),
    allowGroup: z.boolean(),
    allowStore: z.boolean(),
    retired: z.boolean(),
    dimensions: z.array(
      z.strictObject({
        orgId: z.string(),
        categoryId: z.string(),
        dimensionId: z.string(),
      }),
    ),
  }),
});

export type PermissionsCategoriesCreateResponse = z.infer<
  typeof permissionsCategoriesCreateResponseSchema
>;

export const permissionsCategoriesInitializeBodySchema = z.strictObject({
  expectedVersion: z.string().regex(new RegExp("^(0|[1-9]\\d*)$")),
});

export type PermissionsCategoriesInitializeBody = z.infer<
  typeof permissionsCategoriesInitializeBodySchema
>;

export const permissionsCategoriesInitializeParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type PermissionsCategoriesInitializeParams = z.infer<
  typeof permissionsCategoriesInitializeParamsSchema
>;

export const permissionsCategoriesInitializeQuerySchema = z.strictObject({});

export type PermissionsCategoriesInitializeQuery = z.infer<
  typeof permissionsCategoriesInitializeQuerySchema
>;

export const permissionsCategoriesInitializeResponseSchema = z.strictObject({
  authorizationVersion: z.string(),
  value: z.strictObject({
    createdCount: z.number().int().min(-9007199254740991).max(9007199254740991),
  }),
});

export type PermissionsCategoriesInitializeResponse = z.infer<
  typeof permissionsCategoriesInitializeResponseSchema
>;

export const permissionsCategoriesListBodySchema = z.strictObject({});

export type PermissionsCategoriesListBody = z.infer<
  typeof permissionsCategoriesListBodySchema
>;

export const permissionsCategoriesListParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type PermissionsCategoriesListParams = z.infer<
  typeof permissionsCategoriesListParamsSchema
>;

export const permissionsCategoriesListQuerySchema = z.strictObject({});

export type PermissionsCategoriesListQuery = z.infer<
  typeof permissionsCategoriesListQuerySchema
>;

export const permissionsCategoriesListResponseSchema = z.strictObject({
  authorizationVersion: z.string(),
  categories: z.array(
    z.strictObject({
      orgId: z.string(),
      id: z.string(),
      key: z.union([z.string(), z.null()]),
      name: z.string(),
      kind: z.enum(["fixed", "evidence"]),
      confidentialityLevel: z.union([
        z.number().int().min(-9007199254740991).max(9007199254740991),
        z.null(),
      ]),
      allowGroup: z.boolean(),
      allowStore: z.boolean(),
      retired: z.boolean(),
      dimensions: z.array(
        z.strictObject({
          orgId: z.string(),
          categoryId: z.string(),
          dimensionId: z.string(),
        }),
      ),
    }),
  ),
});

export type PermissionsCategoriesListResponse = z.infer<
  typeof permissionsCategoriesListResponseSchema
>;

export const permissionsCategoriesUpdateBodySchema = z.union([
  z.strictObject({
    expectedVersion: bPermissionsCategoriesUpdateSchema0Schema,
    name: bPermissionsCategoriesUpdateSchema1Schema,
    confidentialityLevel: z.number().int().min(0).max(3),
    retired: z.boolean().optional(),
  }),
  z.strictObject({
    expectedVersion: bPermissionsCategoriesUpdateSchema0Schema,
    name: bPermissionsCategoriesUpdateSchema1Schema,
    ownerships: z.array(bPermissionsCategoriesUpdateSchema2Schema).min(1),
    requiredDimensionIds: z.array(z.string().min(1).max(64)),
    retired: z.boolean().optional(),
  }),
]);

export type PermissionsCategoriesUpdateBody = z.infer<
  typeof permissionsCategoriesUpdateBodySchema
>;

export const permissionsCategoriesUpdateParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
  id: z.string().min(1).max(64),
});

export type PermissionsCategoriesUpdateParams = z.infer<
  typeof permissionsCategoriesUpdateParamsSchema
>;

export const permissionsCategoriesUpdateQuerySchema = z.strictObject({});

export type PermissionsCategoriesUpdateQuery = z.infer<
  typeof permissionsCategoriesUpdateQuerySchema
>;

export const permissionsCategoriesUpdateResponseSchema = z.strictObject({
  authorizationVersion: z.string(),
  value: z.strictObject({
    orgId: z.string(),
    id: z.string(),
    key: z.union([z.string(), z.null()]),
    name: z.string(),
    kind: z.enum(["fixed", "evidence"]),
    confidentialityLevel: z.union([
      z.number().int().min(-9007199254740991).max(9007199254740991),
      z.null(),
    ]),
    allowGroup: z.boolean(),
    allowStore: z.boolean(),
    retired: z.boolean(),
    dimensions: z.array(
      z.strictObject({
        orgId: z.string(),
        categoryId: z.string(),
        dimensionId: z.string(),
      }),
    ),
  }),
});

export type PermissionsCategoriesUpdateResponse = z.infer<
  typeof permissionsCategoriesUpdateResponseSchema
>;

export const permissionsCutoverActivateBodySchema = z.strictObject({
  expectedVersion: z.string().regex(new RegExp("^(0|[1-9]\\d*)$")),
  confirm: z.literal(true),
});

export type PermissionsCutoverActivateBody = z.infer<
  typeof permissionsCutoverActivateBodySchema
>;

export const permissionsCutoverActivateParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type PermissionsCutoverActivateParams = z.infer<
  typeof permissionsCutoverActivateParamsSchema
>;

export const permissionsCutoverActivateQuerySchema = z.strictObject({});

export type PermissionsCutoverActivateQuery = z.infer<
  typeof permissionsCutoverActivateQuerySchema
>;

export const permissionsCutoverActivateResponseSchema = z.strictObject({
  authorizationVersion: z.string(),
  value: z.strictObject({
    mode: z.enum(["legacy", "preparing", "enabled", "suspended"]),
  }),
});

export type PermissionsCutoverActivateResponse = z.infer<
  typeof permissionsCutoverActivateResponseSchema
>;

export const permissionsCutoverReadBodySchema = z.strictObject({});

export type PermissionsCutoverReadBody = z.infer<
  typeof permissionsCutoverReadBodySchema
>;

export const permissionsCutoverReadParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type PermissionsCutoverReadParams = z.infer<
  typeof permissionsCutoverReadParamsSchema
>;

export const permissionsCutoverReadQuerySchema = z.strictObject({});

export type PermissionsCutoverReadQuery = z.infer<
  typeof permissionsCutoverReadQuerySchema
>;

export const permissionsCutoverReadResponseSchema = z.strictObject({
  authorizationVersion: z.string(),
  mode: z.enum(["legacy", "preparing", "enabled", "suspended"]),
  ready: z.boolean(),
  missing: z.array(
    z.strictObject({
      code: z.string(),
      targetId: z.string(),
    }),
  ),
  accountsWithoutGrants: z.array(z.string()),
});

export type PermissionsCutoverReadResponse = z.infer<
  typeof permissionsCutoverReadResponseSchema
>;

export const permissionsCutoverSuspendBodySchema = z.strictObject({
  expectedVersion: z.string().regex(new RegExp("^(0|[1-9]\\d*)$")),
  confirm: z.literal(true),
});

export type PermissionsCutoverSuspendBody = z.infer<
  typeof permissionsCutoverSuspendBodySchema
>;

export const permissionsCutoverSuspendParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type PermissionsCutoverSuspendParams = z.infer<
  typeof permissionsCutoverSuspendParamsSchema
>;

export const permissionsCutoverSuspendQuerySchema = z.strictObject({});

export type PermissionsCutoverSuspendQuery = z.infer<
  typeof permissionsCutoverSuspendQuerySchema
>;

export const permissionsCutoverSuspendResponseSchema = z.strictObject({
  authorizationVersion: z.string(),
  value: z.strictObject({
    mode: z.enum(["legacy", "preparing", "enabled", "suspended"]),
  }),
});

export type PermissionsCutoverSuspendResponse = z.infer<
  typeof permissionsCutoverSuspendResponseSchema
>;

export const permissionsDimensionsCreateBodySchema = z.strictObject({
  expectedVersion: z.string().regex(new RegExp("^(0|[1-9]\\d*)$")),
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  retired: z.boolean().optional(),
});

export type PermissionsDimensionsCreateBody = z.infer<
  typeof permissionsDimensionsCreateBodySchema
>;

export const permissionsDimensionsCreateParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type PermissionsDimensionsCreateParams = z.infer<
  typeof permissionsDimensionsCreateParamsSchema
>;

export const permissionsDimensionsCreateQuerySchema = z.strictObject({});

export type PermissionsDimensionsCreateQuery = z.infer<
  typeof permissionsDimensionsCreateQuerySchema
>;

export const permissionsDimensionsCreateResponseSchema = z.strictObject({
  authorizationVersion: z.string(),
  value: z.strictObject({
    orgId: z.string(),
    id: z.string(),
    name: z.string(),
    retired: z.boolean(),
  }),
});

export type PermissionsDimensionsCreateResponse = z.infer<
  typeof permissionsDimensionsCreateResponseSchema
>;

export const permissionsDimensionsListBodySchema = z.strictObject({});

export type PermissionsDimensionsListBody = z.infer<
  typeof permissionsDimensionsListBodySchema
>;

export const permissionsDimensionsListParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type PermissionsDimensionsListParams = z.infer<
  typeof permissionsDimensionsListParamsSchema
>;

export const permissionsDimensionsListQuerySchema = z.strictObject({});

export type PermissionsDimensionsListQuery = z.infer<
  typeof permissionsDimensionsListQuerySchema
>;

export const permissionsDimensionsListResponseSchema = z.strictObject({
  authorizationVersion: z.string(),
  dimensions: z.array(
    z.strictObject({
      orgId: z.string(),
      id: z.string(),
      name: z.string(),
      retired: z.boolean(),
      values: z.array(
        z.strictObject({
          orgId: z.string(),
          dimensionId: z.string(),
          id: z.string(),
          name: z.string(),
          retired: z.boolean(),
        }),
      ),
    }),
  ),
});

export type PermissionsDimensionsListResponse = z.infer<
  typeof permissionsDimensionsListResponseSchema
>;

export const permissionsDimensionsUpdateBodySchema = z.strictObject({
  expectedVersion: z.string().regex(new RegExp("^(0|[1-9]\\d*)$")),
  name: z.string().min(1).max(255),
  retired: z.boolean().optional(),
});

export type PermissionsDimensionsUpdateBody = z.infer<
  typeof permissionsDimensionsUpdateBodySchema
>;

export const permissionsDimensionsUpdateParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
  id: z.string().min(1).max(64),
});

export type PermissionsDimensionsUpdateParams = z.infer<
  typeof permissionsDimensionsUpdateParamsSchema
>;

export const permissionsDimensionsUpdateQuerySchema = z.strictObject({});

export type PermissionsDimensionsUpdateQuery = z.infer<
  typeof permissionsDimensionsUpdateQuerySchema
>;

export const permissionsDimensionsUpdateResponseSchema = z.strictObject({
  authorizationVersion: z.string(),
  value: z.strictObject({
    orgId: z.string(),
    id: z.string(),
    name: z.string(),
    retired: z.boolean(),
  }),
});

export type PermissionsDimensionsUpdateResponse = z.infer<
  typeof permissionsDimensionsUpdateResponseSchema
>;

export const permissionsDimensionsValueCreateBodySchema = z.strictObject({
  expectedVersion: z.string().regex(new RegExp("^(0|[1-9]\\d*)$")),
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  retired: z.boolean().optional(),
});

export type PermissionsDimensionsValueCreateBody = z.infer<
  typeof permissionsDimensionsValueCreateBodySchema
>;

export const permissionsDimensionsValueCreateParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
  dimensionId: z.string().min(1).max(64),
});

export type PermissionsDimensionsValueCreateParams = z.infer<
  typeof permissionsDimensionsValueCreateParamsSchema
>;

export const permissionsDimensionsValueCreateQuerySchema = z.strictObject({});

export type PermissionsDimensionsValueCreateQuery = z.infer<
  typeof permissionsDimensionsValueCreateQuerySchema
>;

export const permissionsDimensionsValueCreateResponseSchema = z.strictObject({
  authorizationVersion: z.string(),
  value: z.strictObject({
    orgId: z.string(),
    dimensionId: z.string(),
    id: z.string(),
    name: z.string(),
    retired: z.boolean(),
  }),
});

export type PermissionsDimensionsValueCreateResponse = z.infer<
  typeof permissionsDimensionsValueCreateResponseSchema
>;

export const permissionsDimensionsValueUpdateBodySchema = z.strictObject({
  expectedVersion: z.string().regex(new RegExp("^(0|[1-9]\\d*)$")),
  name: z.string().min(1).max(255),
  retired: z.boolean().optional(),
});

export type PermissionsDimensionsValueUpdateBody = z.infer<
  typeof permissionsDimensionsValueUpdateBodySchema
>;

export const permissionsDimensionsValueUpdateParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
  dimensionId: z.string().min(1).max(64),
  id: z.string().min(1).max(64),
});

export type PermissionsDimensionsValueUpdateParams = z.infer<
  typeof permissionsDimensionsValueUpdateParamsSchema
>;

export const permissionsDimensionsValueUpdateQuerySchema = z.strictObject({});

export type PermissionsDimensionsValueUpdateQuery = z.infer<
  typeof permissionsDimensionsValueUpdateQuerySchema
>;

export const permissionsDimensionsValueUpdateResponseSchema = z.strictObject({
  authorizationVersion: z.string(),
  value: z.strictObject({
    orgId: z.string(),
    dimensionId: z.string(),
    id: z.string(),
    name: z.string(),
    retired: z.boolean(),
  }),
});

export type PermissionsDimensionsValueUpdateResponse = z.infer<
  typeof permissionsDimensionsValueUpdateResponseSchema
>;

export const permissionsDocumentsListBodySchema = z.strictObject({});

export type PermissionsDocumentsListBody = z.infer<
  typeof permissionsDocumentsListBodySchema
>;

export const permissionsDocumentsListParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type PermissionsDocumentsListParams = z.infer<
  typeof permissionsDocumentsListParamsSchema
>;

export const permissionsDocumentsListQuerySchema = z.strictObject({
  search: z.string().max(256).optional(),
  cursor: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,32}$")).optional(),
});

export type PermissionsDocumentsListQuery = z.infer<
  typeof permissionsDocumentsListQuerySchema
>;

export const permissionsDocumentsListResponseSchema = z.strictObject({
  authorizationVersion: z.string(),
  documents: z.array(
    z.strictObject({
      id: z.string(),
      title: z.string(),
      status: z.string(),
      categoryId: z.union([z.string(), z.null()]),
      fileConfidentialityLevel: z.union([
        z.number().int().min(-9007199254740991).max(9007199254740991),
        z.null(),
      ]),
      valid: z.boolean(),
      scopes: z.array(
        z.union([
          z.strictObject({
            enterpriseKey: z.string().min(1),
            ownership: z.literal("group"),
            dimensions: z
              .object({})
              .catchall(rPermissionsDocumentsListSchema0Schema),
          }),
          z.strictObject({
            enterpriseKey: z.string().min(1),
            ownership: z.literal("store"),
            storeName: z.string().min(1).max(255),
            dimensions: z
              .object({})
              .catchall(rPermissionsDocumentsListSchema0Schema),
          }),
        ]),
      ),
    }),
  ),
  nextCursor: z.union([z.string(), z.null()]),
});

export type PermissionsDocumentsListResponse = z.infer<
  typeof permissionsDocumentsListResponseSchema
>;

export const permissionsDocumentsUpdateBodySchema = z.strictObject({
  expectedVersion: z.string().regex(new RegExp("^(0|[1-9]\\d*)$")),
  categoryId: z.string().min(1).max(64),
  fileConfidentialityLevel: z.number().int().min(0).max(3),
  scopes: z.array(bPermissionsDocumentsUpdateSchema0Schema).min(1).max(1000),
  historicalSupplementReason: z.string().min(1).max(2048).optional(),
});

export type PermissionsDocumentsUpdateBody = z.infer<
  typeof permissionsDocumentsUpdateBodySchema
>;

export const permissionsDocumentsUpdateParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
  documentId: z.string().min(1).max(64),
});

export type PermissionsDocumentsUpdateParams = z.infer<
  typeof permissionsDocumentsUpdateParamsSchema
>;

export const permissionsDocumentsUpdateQuerySchema = z.strictObject({});

export type PermissionsDocumentsUpdateQuery = z.infer<
  typeof permissionsDocumentsUpdateQuerySchema
>;

export const permissionsDocumentsUpdateResponseSchema = z.strictObject({
  authorizationVersion: z.string(),
  value: z.strictObject({
    orgId: z.string(),
    id: z.string(),
    kind: z.enum([
      "store_review",
      "cost_card",
      "evidence",
      "structured",
      "quarantine_certificate",
      "ledger_pdf",
      "source_fragment",
    ]),
    resourceKey: z.string(),
    categoryId: z.string(),
    valid: z.boolean(),
    fileConfidentialityLevel: z.union([
      z.number().int().min(-9007199254740991).max(9007199254740991),
      z.null(),
    ]),
    contentVersion: z.string(),
    authorizationVersion: z.string(),
    documentId: z.union([z.string(), z.null()]),
    sourceDocumentId: z.union([z.string(), z.null()]),
    scopes: z.array(
      z.strictObject({
        orgId: z.string(),
        resourceId: z.string(),
        id: z.string(),
        enterpriseKey: z.string(),
        ownership: z.enum(["group", "store"]),
        storeName: z.union([z.string(), z.null()]),
        dimensions: z.array(
          z.strictObject({
            orgId: z.string(),
            resourceId: z.string(),
            scopeId: z.string(),
            dimensionId: z.string(),
            valueId: z.string(),
          }),
        ),
      }),
    ),
  }),
});

export type PermissionsDocumentsUpdateResponse = z.infer<
  typeof permissionsDocumentsUpdateResponseSchema
>;

export const permissionsEnterprisesDeclareBodySchema = z.strictObject({
  expectedVersion: z.string().regex(new RegExp("^(0|[1-9]\\d*)$")),
  name: z.string().min(1).max(255),
});

export type PermissionsEnterprisesDeclareBody = z.infer<
  typeof permissionsEnterprisesDeclareBodySchema
>;

export const permissionsEnterprisesDeclareParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type PermissionsEnterprisesDeclareParams = z.infer<
  typeof permissionsEnterprisesDeclareParamsSchema
>;

export const permissionsEnterprisesDeclareQuerySchema = z.strictObject({});

export type PermissionsEnterprisesDeclareQuery = z.infer<
  typeof permissionsEnterprisesDeclareQuerySchema
>;

export const permissionsEnterprisesDeclareResponseSchema = z.strictObject({
  authorizationVersion: z.string(),
  value: z.strictObject({
    orgId: z.string(),
    enterpriseKey: z.string(),
    enterpriseName: z.string(),
  }),
});

export type PermissionsEnterprisesDeclareResponse = z.infer<
  typeof permissionsEnterprisesDeclareResponseSchema
>;

export const permissionsEnterprisesListBodySchema = z.strictObject({});

export type PermissionsEnterprisesListBody = z.infer<
  typeof permissionsEnterprisesListBodySchema
>;

export const permissionsEnterprisesListParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type PermissionsEnterprisesListParams = z.infer<
  typeof permissionsEnterprisesListParamsSchema
>;

export const permissionsEnterprisesListQuerySchema = z.strictObject({});

export type PermissionsEnterprisesListQuery = z.infer<
  typeof permissionsEnterprisesListQuerySchema
>;

export const permissionsEnterprisesListResponseSchema = z.strictObject({
  authorizationVersion: z.string(),
  enterprises: z.array(
    z.strictObject({
      enterpriseKey: z.string(),
      enterpriseName: z.string(),
    }),
  ),
});

export type PermissionsEnterprisesListResponse = z.infer<
  typeof permissionsEnterprisesListResponseSchema
>;

export const permissionsEnterprisesPreviewBodySchema = z.strictObject({
  name: z.string().min(1).max(255),
});

export type PermissionsEnterprisesPreviewBody = z.infer<
  typeof permissionsEnterprisesPreviewBodySchema
>;

export const permissionsEnterprisesPreviewParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type PermissionsEnterprisesPreviewParams = z.infer<
  typeof permissionsEnterprisesPreviewParamsSchema
>;

export const permissionsEnterprisesPreviewQuerySchema = z.strictObject({});

export type PermissionsEnterprisesPreviewQuery = z.infer<
  typeof permissionsEnterprisesPreviewQuerySchema
>;

export const permissionsEnterprisesPreviewResponseSchema = z.strictObject({
  enterpriseKey: z.string(),
  enterpriseName: z.string(),
});

export type PermissionsEnterprisesPreviewResponse = z.infer<
  typeof permissionsEnterprisesPreviewResponseSchema
>;

export const permissionsMeReadBodySchema = z.strictObject({});

export type PermissionsMeReadBody = z.infer<typeof permissionsMeReadBodySchema>;

export const permissionsMeReadParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type PermissionsMeReadParams = z.infer<
  typeof permissionsMeReadParamsSchema
>;

export const permissionsMeReadQuerySchema = z.strictObject({});

export type PermissionsMeReadQuery = z.infer<
  typeof permissionsMeReadQuerySchema
>;

export const permissionsMeReadResponseSchema = z.strictObject({
  orgId: z.string(),
  userAccountId: z.string(),
  role: z.enum(["admin", "employee"]),
  disabled: z.boolean(),
  clearance: z.number().int().min(-9007199254740991).max(9007199254740991),
  mode: z.enum(["legacy", "preparing", "enabled", "suspended"]),
  authorizationVersion: z.string(),
  categories: z.array(
    z.strictObject({
      id: z.string(),
      key: z.string().optional(),
      kind: z.enum(["fixed", "evidence"]),
      confidentialityLevel: z.union([
        z.number().int().min(-9007199254740991).max(9007199254740991),
        z.null(),
      ]),
      ownerships: z.array(rPermissionsMeReadSchema0Schema),
      requiredDimensionIds: z.array(z.string()),
    }),
  ),
  grants: z.array(
    z.strictObject({
      id: z.string(),
      orgId: z.string(),
      enterpriseKey: z.string(),
      categoryIds: z.array(z.string()),
      ownership: rPermissionsMeReadSchema0Schema,
      stores: rPermissionsMeReadSchema1Schema.optional(),
      dimensions: z.object({}).catchall(rPermissionsMeReadSchema1Schema),
    }),
  ),
  storeReviewEnterprises: z.strictObject({
    complete: z.literal(true),
    write: z.array(rPermissionsMeReadSchema3Schema),
    read: z.array(rPermissionsMeReadSchema3Schema),
  }),
});

export type PermissionsMeReadResponse = z.infer<
  typeof permissionsMeReadResponseSchema
>;

export const permissionsStoresListBodySchema = z.strictObject({});

export type PermissionsStoresListBody = z.infer<
  typeof permissionsStoresListBodySchema
>;

export const permissionsStoresListParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type PermissionsStoresListParams = z.infer<
  typeof permissionsStoresListParamsSchema
>;

export const permissionsStoresListQuerySchema = z.strictObject({});

export type PermissionsStoresListQuery = z.infer<
  typeof permissionsStoresListQuerySchema
>;

export const permissionsStoresListResponseSchema = z.strictObject({
  authorizationVersion: z.string(),
  stores: z.array(
    z.strictObject({
      orgId: z.string(),
      enterpriseKey: z.string(),
      name: z.string(),
      retired: z.boolean(),
      storeId: z
        .string()
        .regex(
          new RegExp(
            "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
          ),
        )
        .optional(),
      officialName: z.string().optional(),
      confirmation: z.enum(["pending", "confirmed", "historical"]).optional(),
      version: z.string().optional(),
    }),
  ),
});

export type PermissionsStoresListResponse = z.infer<
  typeof permissionsStoresListResponseSchema
>;

export const permissionsStoresUpsertBodySchema = z.strictObject({
  expectedVersion: z.string().regex(new RegExp("^(0|[1-9]\\d*)$")),
  enterpriseKey: z.string().min(1).max(128).optional(),
  enterpriseName: bPermissionsStoresUpsertSchema0Schema.optional(),
  name: bPermissionsStoresUpsertSchema0Schema,
  retired: z.boolean().optional(),
});

export type PermissionsStoresUpsertBody = z.infer<
  typeof permissionsStoresUpsertBodySchema
>;

export const permissionsStoresUpsertParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type PermissionsStoresUpsertParams = z.infer<
  typeof permissionsStoresUpsertParamsSchema
>;

export const permissionsStoresUpsertQuerySchema = z.strictObject({});

export type PermissionsStoresUpsertQuery = z.infer<
  typeof permissionsStoresUpsertQuerySchema
>;

export const permissionsStoresUpsertResponseSchema = z.strictObject({
  authorizationVersion: z.string(),
  value: z.strictObject({
    orgId: z.string(),
    enterpriseKey: z.string(),
    name: z.string(),
    retired: z.boolean(),
    storeId: z
      .string()
      .regex(
        new RegExp(
          "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
        ),
      )
      .optional(),
    officialName: z.string().optional(),
    confirmation: z.enum(["pending", "confirmed", "historical"]).optional(),
    version: z.string().optional(),
    enterpriseName: z.string(),
  }),
});

export type PermissionsStoresUpsertResponse = z.infer<
  typeof permissionsStoresUpsertResponseSchema
>;

export const sessionLoginBodySchema = z.strictObject({
  email: z.string().min(1).max(320),
  password: z.string().min(1),
});

export type SessionLoginBody = z.infer<typeof sessionLoginBodySchema>;

export const sessionLoginParamsSchema = z.strictObject({});

export type SessionLoginParams = z.infer<typeof sessionLoginParamsSchema>;

export const sessionLoginQuerySchema = z.strictObject({});

export type SessionLoginQuery = z.infer<typeof sessionLoginQuerySchema>;

export const sessionLoginResponseSchema = z.strictObject({
  identity: z.strictObject({
    userAccountId: z.string().min(1),
    displayName: z.string().min(1),
    email: z.string().min(1),
    orgId: z.string().min(1),
    organizationName: z.string().min(1),
    role: z.enum(["admin", "employee"]),
    clearance: z.number().int().min(0).max(3),
  }),
  csrfToken: z.string().min(1),
  canManageSettings: z.boolean(),
});

export type SessionLoginResponse = z.infer<typeof sessionLoginResponseSchema>;

export const sessionLogoutBodySchema = z.strictObject({});

export type SessionLogoutBody = z.infer<typeof sessionLogoutBodySchema>;

export const sessionLogoutParamsSchema = z.strictObject({});

export type SessionLogoutParams = z.infer<typeof sessionLogoutParamsSchema>;

export const sessionLogoutQuerySchema = z.strictObject({});

export type SessionLogoutQuery = z.infer<typeof sessionLogoutQuerySchema>;

export const sessionLogoutResponseSchema = z.strictObject({
  signedOut: z.literal(true),
});

export type SessionLogoutResponse = z.infer<typeof sessionLogoutResponseSchema>;

export const sessionReadBodySchema = z.strictObject({});

export type SessionReadBody = z.infer<typeof sessionReadBodySchema>;

export const sessionReadParamsSchema = z.strictObject({});

export type SessionReadParams = z.infer<typeof sessionReadParamsSchema>;

export const sessionReadQuerySchema = z.strictObject({});

export type SessionReadQuery = z.infer<typeof sessionReadQuerySchema>;

export const sessionReadResponseSchema = z.strictObject({
  identity: z.strictObject({
    userAccountId: z.string().min(1),
    displayName: z.string().min(1),
    email: z.string().min(1),
    orgId: z.string().min(1),
    organizationName: z.string().min(1),
    role: z.enum(["admin", "employee"]),
    clearance: z.number().int().min(0).max(3),
  }),
  csrfToken: z.string().min(1),
  canManageSettings: z.boolean(),
});

export type SessionReadResponse = z.infer<typeof sessionReadResponseSchema>;

export const workflowsGetEnterpriseWorkflowBodySchema = z.strictObject({
  enterpriseKey: z.string().min(1).max(128),
  workflowType: z.enum([
    "meituan-daily-ingestion",
    "meituan-review-operations",
    "weekly-business-report",
  ]),
});

export type WorkflowsGetEnterpriseWorkflowBody = z.infer<
  typeof workflowsGetEnterpriseWorkflowBodySchema
>;

export const workflowsGetEnterpriseWorkflowParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type WorkflowsGetEnterpriseWorkflowParams = z.infer<
  typeof workflowsGetEnterpriseWorkflowParamsSchema
>;

export const workflowsGetEnterpriseWorkflowQuerySchema = z.strictObject({});

export type WorkflowsGetEnterpriseWorkflowQuery = z.infer<
  typeof workflowsGetEnterpriseWorkflowQuerySchema
>;

export const workflowsGetEnterpriseWorkflowResponseSchema = z.strictObject({
  capability: z.strictObject({
    id: z.string(),
    version: z.string(),
    configurationSchemaVersion: z
      .number()
      .int()
      .min(-9007199254740991)
      .max(9007199254740991),
    minimumLauncherVersion: z.string(),
  }),
  workflowId: z.string().min(1).max(64).regex(new RegExp("^[A-Za-z0-9_-]+$")),
  enterpriseKey: z.string(),
  workflowType: z.enum([
    "meituan-daily-ingestion",
    "meituan-review-operations",
    "weekly-business-report",
  ]),
  version: rWorkflowsGetEnterpriseWorkflowSchema0Schema,
  controlVersion: rWorkflowsGetEnterpriseWorkflowSchema0Schema,
  controlState: z.enum(["active", "paused", "revoked"]),
  assignmentEpoch: rWorkflowsGetEnterpriseWorkflowSchema0Schema,
  assignedInstallationId: z.union([z.string(), z.null()]),
  lease: z.strictObject({
    runId: z.union([z.string(), z.null()]),
    expiresAt: z.union([
      rWorkflowsGetEnterpriseWorkflowSchema1Schema,
      z.null(),
    ]),
  }),
  configuration: z.union([
    z.union([
      rWorkflowsGetEnterpriseWorkflowSchema2Schema,
      rWorkflowsGetEnterpriseWorkflowSchema8Schema,
      rWorkflowsGetEnterpriseWorkflowSchema20Schema,
    ]),
    z.null(),
  ]),
  integration: z.strictObject({
    orgId: z.string(),
    enterpriseKey: z.string(),
    version: rWorkflowsGetEnterpriseWorkflowSchema0Schema,
    schemaVersion: z
      .number()
      .int()
      .min(-9007199254740991)
      .max(9007199254740991),
    configuration: z.strictObject({
      schemaVersion: rWorkflowsGetEnterpriseWorkflowSchema22Schema,
      timezone: rWorkflowsGetEnterpriseWorkflowSchema23Schema,
      sourceAccounts: rWorkflowsGetEnterpriseWorkflowSchema24Schema,
      storeMappings: rWorkflowsGetEnterpriseWorkflowSchema26Schema,
      exclusions: rWorkflowsGetEnterpriseWorkflowSchema28Schema,
    }),
    orderScopeRequired: z.boolean(),
    updatedBy: z.string(),
    createdAt: rWorkflowsGetEnterpriseWorkflowSchema1Schema,
    updatedAt: rWorkflowsGetEnterpriseWorkflowSchema1Schema,
  }),
  authorizations: z.array(
    z.strictObject({
      authorizationId: z.string(),
      scope: z.union([
        z.strictObject({
          kind: z.literal("upload"),
          datasets: z
            .array(rWorkflowsGetEnterpriseWorkflowSchema30Schema)
            .min(1)
            .max(5),
          storeNames: rWorkflowsGetEnterpriseWorkflowSchema4Schema,
        }),
        z.strictObject({
          kind: z.literal("download"),
          datasets: z
            .array(rWorkflowsGetEnterpriseWorkflowSchema31Schema)
            .min(1)
            .max(4),
          storeNames: rWorkflowsGetEnterpriseWorkflowSchema4Schema,
        }),
        z.strictObject({
          kind: z.literal("review_sync"),
          channels: z
            .array(rWorkflowsGetEnterpriseWorkflowSchema32Schema)
            .min(1)
            .max(2),
          storeNames: rWorkflowsGetEnterpriseWorkflowSchema4Schema,
        }),
        z.strictObject({
          kind: z.literal("review_publish"),
          channels: z
            .array(rWorkflowsGetEnterpriseWorkflowSchema33Schema)
            .min(1)
            .max(2),
          storeNames: rWorkflowsGetEnterpriseWorkflowSchema4Schema,
        }),
        z.strictObject({
          kind: z.literal("email"),
          purpose: z.enum(["review_drafts", "weekly_report", "exception"]),
          storeNames: rWorkflowsGetEnterpriseWorkflowSchema4Schema,
          recipients: rWorkflowsGetEnterpriseWorkflowSchema17Schema,
          allowedSender: z
            .string()
            .max(254)
            .regex(
              new RegExp(
                "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
              ),
            ),
          deliveryVersion: rWorkflowsGetEnterpriseWorkflowSchema0Schema,
        }),
      ]),
      configurationVersion: rWorkflowsGetEnterpriseWorkflowSchema0Schema,
      controlVersion: rWorkflowsGetEnterpriseWorkflowSchema0Schema,
      grantedBy: z.string(),
      grantedAt: rWorkflowsGetEnterpriseWorkflowSchema1Schema,
      revokedAt: z.union([
        rWorkflowsGetEnterpriseWorkflowSchema1Schema,
        z.null(),
      ]),
    }),
  ),
});

export type WorkflowsGetEnterpriseWorkflowResponse = z.infer<
  typeof workflowsGetEnterpriseWorkflowResponseSchema
>;

export const workflowsGetWorkflowStatusBodySchema = z.strictObject({
  workflowId: bWorkflowsGetWorkflowStatusSchema0Schema,
  runId: bWorkflowsGetWorkflowStatusSchema0Schema.optional(),
  limit: z.number().int().min(1).max(100).optional(),
  cursor: bWorkflowsGetWorkflowStatusSchema0Schema.optional(),
  actionCursor: bWorkflowsGetWorkflowStatusSchema0Schema.optional(),
  migrationCursor: bWorkflowsGetWorkflowStatusSchema0Schema.optional(),
});

export type WorkflowsGetWorkflowStatusBody = z.infer<
  typeof workflowsGetWorkflowStatusBodySchema
>;

export const workflowsGetWorkflowStatusParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type WorkflowsGetWorkflowStatusParams = z.infer<
  typeof workflowsGetWorkflowStatusParamsSchema
>;

export const workflowsGetWorkflowStatusQuerySchema = z.strictObject({});

export type WorkflowsGetWorkflowStatusQuery = z.infer<
  typeof workflowsGetWorkflowStatusQuerySchema
>;

export const workflowsGetWorkflowStatusResponseSchema = z.strictObject({
  capability: z.strictObject({
    id: z.string(),
    version: z.string(),
    configurationSchemaVersion: z
      .number()
      .int()
      .min(-9007199254740991)
      .max(9007199254740991),
    minimumLauncherVersion: z.string(),
  }),
  workflowId: rWorkflowsGetWorkflowStatusSchema0Schema,
  enterpriseKey: z.string(),
  workflowType: rWorkflowsGetWorkflowStatusSchema1Schema,
  version: rWorkflowsGetWorkflowStatusSchema2Schema,
  controlVersion: rWorkflowsGetWorkflowStatusSchema2Schema,
  controlState: z.enum(["active", "paused", "revoked"]),
  assignmentEpoch: rWorkflowsGetWorkflowStatusSchema2Schema,
  assignedInstallationId: z.union([z.string(), z.null()]),
  lease: z.strictObject({
    runId: z.union([z.string(), z.null()]),
    expiresAt: z.union([rWorkflowsGetWorkflowStatusSchema3Schema, z.null()]),
  }),
  configuration: z.union([rWorkflowsGetWorkflowStatusSchema4Schema, z.null()]),
  integration: z.strictObject({
    orgId: z.string(),
    enterpriseKey: z.string(),
    version: rWorkflowsGetWorkflowStatusSchema2Schema,
    schemaVersion: z
      .number()
      .int()
      .min(-9007199254740991)
      .max(9007199254740991),
    configuration: rWorkflowsGetWorkflowStatusSchema25Schema,
    orderScopeRequired: z.boolean(),
    updatedBy: z.string(),
    createdAt: rWorkflowsGetWorkflowStatusSchema3Schema,
    updatedAt: rWorkflowsGetWorkflowStatusSchema3Schema,
  }),
  authorizations: z.array(
    z.strictObject({
      authorizationId: z.string(),
      scope: z.union([
        z.strictObject({
          kind: z.literal("upload"),
          datasets: z
            .array(rWorkflowsGetWorkflowStatusSchema34Schema)
            .min(1)
            .max(5),
          storeNames: rWorkflowsGetWorkflowStatusSchema7Schema,
        }),
        z.strictObject({
          kind: z.literal("download"),
          datasets: z
            .array(rWorkflowsGetWorkflowStatusSchema35Schema)
            .min(1)
            .max(4),
          storeNames: rWorkflowsGetWorkflowStatusSchema7Schema,
        }),
        z.strictObject({
          kind: z.literal("review_sync"),
          channels: z
            .array(rWorkflowsGetWorkflowStatusSchema36Schema)
            .min(1)
            .max(2),
          storeNames: rWorkflowsGetWorkflowStatusSchema7Schema,
        }),
        z.strictObject({
          kind: z.literal("review_publish"),
          channels: z
            .array(rWorkflowsGetWorkflowStatusSchema37Schema)
            .min(1)
            .max(2),
          storeNames: rWorkflowsGetWorkflowStatusSchema7Schema,
        }),
        z.strictObject({
          kind: z.literal("email"),
          purpose: z.enum(["review_drafts", "weekly_report", "exception"]),
          storeNames: rWorkflowsGetWorkflowStatusSchema7Schema,
          recipients: rWorkflowsGetWorkflowStatusSchema20Schema,
          allowedSender: z
            .string()
            .max(254)
            .regex(
              new RegExp(
                "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
              ),
            ),
          deliveryVersion: rWorkflowsGetWorkflowStatusSchema2Schema,
        }),
      ]),
      configurationVersion: rWorkflowsGetWorkflowStatusSchema2Schema,
      controlVersion: rWorkflowsGetWorkflowStatusSchema2Schema,
      grantedBy: z.string(),
      grantedAt: rWorkflowsGetWorkflowStatusSchema3Schema,
      revokedAt: z.union([rWorkflowsGetWorkflowStatusSchema3Schema, z.null()]),
    }),
  ),
  observedAt: rWorkflowsGetWorkflowStatusSchema3Schema,
  expectedWindow: rWorkflowsGetWorkflowStatusSchema38Schema,
  possibleMissedWindow: z.boolean(),
  pendingActions: z.array(rWorkflowsGetWorkflowStatusSchema40Schema),
  nextActionCursor: z.union([z.string(), z.null()]),
  runActionRefs: z.array(rWorkflowsGetWorkflowStatusSchema40Schema).optional(),
  nextRunActionCursor: z.union([z.string(), z.null()]).optional(),
  migrations: z.array(
    z.strictObject({
      migrationId: z.string(),
      stage: z.enum([
        "preview",
        "validated",
        "imported",
        "host_switched",
        "verified",
      ]),
      version: z.number().int().min(-9007199254740991).max(9007199254740991),
      sourceSnapshotHash: rWorkflowsGetWorkflowStatusSchema41Schema,
      targetVersion: z
        .number()
        .int()
        .min(-9007199254740991)
        .max(9007199254740991),
      chunkCount: z.number().int().min(-9007199254740991).max(9007199254740991),
      recordCount: z
        .number()
        .int()
        .min(-9007199254740991)
        .max(9007199254740991),
      chunksDigest: z.union([
        rWorkflowsGetWorkflowStatusSchema41Schema,
        z.null(),
      ]),
      validatedChunks: z
        .number()
        .int()
        .min(-9007199254740991)
        .max(9007199254740991),
      importedChunks: z
        .number()
        .int()
        .min(-9007199254740991)
        .max(9007199254740991),
      createdAt: rWorkflowsGetWorkflowStatusSchema3Schema,
      updatedAt: rWorkflowsGetWorkflowStatusSchema3Schema,
      workflowIds: z.array(z.string()),
    }),
  ),
  nextMigrationCursor: z.union([z.string(), z.null()]),
  installations: z.array(
    z.strictObject({
      orgId: z.string(),
      workflowId: z.string(),
      installationId: z.string(),
      userAccountId: z.string(),
      version: z.number().int().min(-9007199254740991).max(9007199254740991),
      deviceAlias: z.string(),
      host: z.string(),
      platform: z.string(),
      launcherVersion: z.string(),
      workflowPackageVersion: z.string(),
      state: z.enum([
        "not_installed",
        "pending",
        "paused",
        "enabled",
        "revoked",
      ]),
      hostSnapshot: z.union([
        z.strictObject({
          host: z.literal("codex"),
          platform: z.literal("macos"),
          taskId: rWorkflowsGetWorkflowStatusSchema0Schema,
          projectRef: rWorkflowsGetWorkflowStatusSchema0Schema,
          cron: z.string().min(1).max(255),
          timezone: z.literal("Asia/Shanghai"),
          model: rWorkflowsGetWorkflowStatusSchema8Schema,
          reasoningEffort: z.enum([
            "minimal",
            "low",
            "medium",
            "high",
            "xhigh",
            "max",
            "ultra",
          ]),
          state: z.enum(["paused", "enabled"]),
          verifiedAt: z
            .string()
            .regex(
              new RegExp(
                "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
              ),
            ),
        }),
        z.null(),
      ]),
      readinessChecks: z.union([
        z.array(
          z.strictObject({
            capability: z.enum([
              "configuration",
              "permissions",
              "meituan_erp",
              "meituan_reviews",
              "download",
              "workspace",
              "dependencies",
              "email_identity",
              "sent_mail_lookup",
              "host_schedule",
              "host_timezone",
              "host_model",
              "assignment",
              "file_format",
            ]),
            status: z.enum([
              "ready",
              "needs_configuration",
              "needs_login",
              "permission_denied",
              "unsupported",
              "unavailable",
            ]),
            nextStep: z.string().max(2000),
            checkedAt: z
              .string()
              .regex(
                new RegExp(
                  "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
                ),
              ),
            sampleStatus: z
              .enum(["verified", "no_sample", "not_checked"])
              .optional(),
          }),
        ),
        z.null(),
      ]),
      firstRunVerification: z.string(),
      lastCheckedAt: z.union([
        rWorkflowsGetWorkflowStatusSchema3Schema,
        z.null(),
      ]),
      createdAt: rWorkflowsGetWorkflowStatusSchema3Schema,
      updatedAt: rWorkflowsGetWorkflowStatusSchema3Schema,
    }),
  ),
  runs: z.array(
    z.strictObject({
      id: z.string(),
      orgId: z.string(),
      workflowId: z.string(),
      installationId: z.string(),
      userAccountId: z.string(),
      configurationVersion: z
        .number()
        .int()
        .min(-9007199254740991)
        .max(9007199254740991),
      integrationVersion: z
        .number()
        .int()
        .min(-9007199254740991)
        .max(9007199254740991),
      controlVersion: z
        .number()
        .int()
        .min(-9007199254740991)
        .max(9007199254740991),
      assignmentEpoch: z
        .number()
        .int()
        .min(-9007199254740991)
        .max(9007199254740991),
      workflowPackageVersion: z.string(),
      startDate: rWorkflowsGetWorkflowStatusSchema3Schema,
      endDate: rWorkflowsGetWorkflowStatusSchema3Schema,
      mode: z.string(),
      phase: z.string(),
      status: z.enum([
        "running",
        "succeeded",
        "partial",
        "needs_attention",
        "failed",
        "unknown",
      ]),
      snapshot: z.strictObject({
        workflowType: rWorkflowsGetWorkflowStatusSchema1Schema,
        window: rWorkflowsGetWorkflowStatusSchema38Schema,
        integrationVersion: rWorkflowsGetWorkflowStatusSchema2Schema,
        configurationVersion: rWorkflowsGetWorkflowStatusSchema2Schema,
        workflowPackageVersion: rWorkflowsGetWorkflowStatusSchema42Schema,
        integration: rWorkflowsGetWorkflowStatusSchema25Schema,
        configuration: rWorkflowsGetWorkflowStatusSchema4Schema,
      }),
      summary: z.union([
        z.strictObject({
          phase: rWorkflowsGetWorkflowStatusSchema43Schema,
          status: rWorkflowsGetWorkflowStatusSchema44Schema,
          observations: rWorkflowsGetWorkflowStatusSchema45Schema,
          unresolved: rWorkflowsGetWorkflowStatusSchema50Schema,
          cleanup: rWorkflowsGetWorkflowStatusSchema52Schema,
        }),
        z.null(),
      ]),
      startedAt: rWorkflowsGetWorkflowStatusSchema3Schema,
      renewedAt: rWorkflowsGetWorkflowStatusSchema3Schema,
      finishedAt: z.union([rWorkflowsGetWorkflowStatusSchema3Schema, z.null()]),
      retainUntil: rWorkflowsGetWorkflowStatusSchema3Schema,
      runId: z.string(),
    }),
  ),
  nextCursor: z.union([z.string(), z.null()]),
});

export type WorkflowsGetWorkflowStatusResponse = z.infer<
  typeof workflowsGetWorkflowStatusResponseSchema
>;

export const workflowsListEnterpriseWorkflowsBodySchema = z.strictObject({
  enterpriseKey: z.string().min(1).max(128).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  cursor: z
    .string()
    .min(1)
    .max(64)
    .regex(new RegExp("^[A-Za-z0-9_-]+$"))
    .optional(),
});

export type WorkflowsListEnterpriseWorkflowsBody = z.infer<
  typeof workflowsListEnterpriseWorkflowsBodySchema
>;

export const workflowsListEnterpriseWorkflowsParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type WorkflowsListEnterpriseWorkflowsParams = z.infer<
  typeof workflowsListEnterpriseWorkflowsParamsSchema
>;

export const workflowsListEnterpriseWorkflowsQuerySchema = z.strictObject({});

export type WorkflowsListEnterpriseWorkflowsQuery = z.infer<
  typeof workflowsListEnterpriseWorkflowsQuerySchema
>;

export const workflowsListEnterpriseWorkflowsResponseSchema = z.strictObject({
  capability: rWorkflowsListEnterpriseWorkflowsSchema0Schema,
  needsConfiguration: z.boolean(),
  setupUrl: z.string(),
  workflows: z.array(
    z.strictObject({
      capability: rWorkflowsListEnterpriseWorkflowsSchema0Schema,
      workflowId: z
        .string()
        .min(1)
        .max(64)
        .regex(new RegExp("^[A-Za-z0-9_-]+$")),
      enterpriseKey: z.string(),
      workflowType: z.enum([
        "meituan-daily-ingestion",
        "meituan-review-operations",
        "weekly-business-report",
      ]),
      version: rWorkflowsListEnterpriseWorkflowsSchema1Schema,
      controlVersion: rWorkflowsListEnterpriseWorkflowsSchema1Schema,
      controlState: z.enum(["active", "paused", "revoked"]),
      assignmentEpoch: rWorkflowsListEnterpriseWorkflowsSchema1Schema,
      assignedInstallationId: z.union([z.string(), z.null()]),
      lease: z.strictObject({
        runId: z.union([z.string(), z.null()]),
        expiresAt: z.union([
          rWorkflowsListEnterpriseWorkflowsSchema2Schema,
          z.null(),
        ]),
      }),
      configuration: z.union([
        z.union([
          rWorkflowsListEnterpriseWorkflowsSchema3Schema,
          rWorkflowsListEnterpriseWorkflowsSchema9Schema,
          rWorkflowsListEnterpriseWorkflowsSchema21Schema,
        ]),
        z.null(),
      ]),
      integration: z.strictObject({
        orgId: z.string(),
        enterpriseKey: z.string(),
        version: rWorkflowsListEnterpriseWorkflowsSchema1Schema,
        schemaVersion: z
          .number()
          .int()
          .min(-9007199254740991)
          .max(9007199254740991),
        configuration: z.strictObject({
          schemaVersion: rWorkflowsListEnterpriseWorkflowsSchema23Schema,
          timezone: rWorkflowsListEnterpriseWorkflowsSchema24Schema,
          sourceAccounts: rWorkflowsListEnterpriseWorkflowsSchema25Schema,
          storeMappings: rWorkflowsListEnterpriseWorkflowsSchema27Schema,
          exclusions: rWorkflowsListEnterpriseWorkflowsSchema29Schema,
        }),
        orderScopeRequired: z.boolean(),
        updatedBy: z.string(),
        createdAt: rWorkflowsListEnterpriseWorkflowsSchema2Schema,
        updatedAt: rWorkflowsListEnterpriseWorkflowsSchema2Schema,
      }),
      authorizations: z.array(
        z.strictObject({
          authorizationId: z.string(),
          scope: z.union([
            z.strictObject({
              kind: z.literal("upload"),
              datasets: z
                .array(rWorkflowsListEnterpriseWorkflowsSchema31Schema)
                .min(1)
                .max(5),
              storeNames: rWorkflowsListEnterpriseWorkflowsSchema5Schema,
            }),
            z.strictObject({
              kind: z.literal("download"),
              datasets: z
                .array(rWorkflowsListEnterpriseWorkflowsSchema32Schema)
                .min(1)
                .max(4),
              storeNames: rWorkflowsListEnterpriseWorkflowsSchema5Schema,
            }),
            z.strictObject({
              kind: z.literal("review_sync"),
              channels: z
                .array(rWorkflowsListEnterpriseWorkflowsSchema33Schema)
                .min(1)
                .max(2),
              storeNames: rWorkflowsListEnterpriseWorkflowsSchema5Schema,
            }),
            z.strictObject({
              kind: z.literal("review_publish"),
              channels: z
                .array(rWorkflowsListEnterpriseWorkflowsSchema34Schema)
                .min(1)
                .max(2),
              storeNames: rWorkflowsListEnterpriseWorkflowsSchema5Schema,
            }),
            z.strictObject({
              kind: z.literal("email"),
              purpose: z.enum(["review_drafts", "weekly_report", "exception"]),
              storeNames: rWorkflowsListEnterpriseWorkflowsSchema5Schema,
              recipients: rWorkflowsListEnterpriseWorkflowsSchema18Schema,
              allowedSender: z
                .string()
                .max(254)
                .regex(
                  new RegExp(
                    "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
                  ),
                ),
              deliveryVersion: rWorkflowsListEnterpriseWorkflowsSchema1Schema,
            }),
          ]),
          configurationVersion: rWorkflowsListEnterpriseWorkflowsSchema1Schema,
          controlVersion: rWorkflowsListEnterpriseWorkflowsSchema1Schema,
          grantedBy: z.string(),
          grantedAt: rWorkflowsListEnterpriseWorkflowsSchema2Schema,
          revokedAt: z.union([
            rWorkflowsListEnterpriseWorkflowsSchema2Schema,
            z.null(),
          ]),
        }),
      ),
    }),
  ),
  nextCursor: z.union([z.string(), z.null()]),
});

export type WorkflowsListEnterpriseWorkflowsResponse = z.infer<
  typeof workflowsListEnterpriseWorkflowsResponseSchema
>;

export const workflowsManageWorkflowInstallationBodySchema = z.strictObject({
  workflowId: bWorkflowsManageWorkflowInstallationSchema0Schema,
  operation: z.union([
    z.strictObject({
      kind: z.literal("migration_append"),
      migrationId: bWorkflowsManageWorkflowInstallationSchema0Schema,
      expectedVersion: bWorkflowsManageWorkflowInstallationSchema1Schema,
      sequence: bWorkflowsManageWorkflowInstallationSchema1Schema,
      chunk: z
        .array(bWorkflowsManageWorkflowInstallationSchema2Schema)
        .min(1)
        .max(3),
      chunkHash: bWorkflowsManageWorkflowInstallationSchema5Schema,
    }),
    z.strictObject({
      kind: z.literal("migration_seal"),
      migrationId: bWorkflowsManageWorkflowInstallationSchema0Schema,
      expectedVersion: bWorkflowsManageWorkflowInstallationSchema1Schema,
      chunkCount: z.number().int().min(1).max(9007199254740991),
      recordCount: z.number().int().min(0).max(9007199254740991),
      chunksDigest: bWorkflowsManageWorkflowInstallationSchema5Schema,
    }),
    z.strictObject({
      kind: z.literal("migration_get"),
      migrationId: bWorkflowsManageWorkflowInstallationSchema0Schema,
      cursor: bWorkflowsManageWorkflowInstallationSchema1Schema.optional(),
      limit: z.literal(1).optional(),
    }),
    z.strictObject({
      kind: z.literal("register"),
      installation: z.strictObject({
        installationId: bWorkflowsManageWorkflowInstallationSchema0Schema,
        deviceAlias: bWorkflowsManageWorkflowInstallationSchema9Schema,
        host: z.literal("codex"),
        platform: z.literal("macos"),
        launcherVersion: z.string().regex(new RegExp("^\\d+\\.\\d+\\.\\d+$")),
        workflowPackageVersion: z
          .string()
          .regex(new RegExp("^\\d+\\.\\d+\\.\\d+$")),
        hostSnapshot:
          bWorkflowsManageWorkflowInstallationSchema56Schema.optional(),
      }),
    }),
    z.strictObject({
      kind: z.literal("record_checks"),
      installationId: bWorkflowsManageWorkflowInstallationSchema0Schema,
      checks: z
        .array(bWorkflowsManageWorkflowInstallationSchema57Schema)
        .max(100),
      firstRunVerification: z.enum([
        "not_run",
        "verified",
        "failed",
        "partial",
      ]),
    }),
    z.strictObject({
      kind: z.literal("record_host"),
      installationId: bWorkflowsManageWorkflowInstallationSchema0Schema,
      hostSnapshot: bWorkflowsManageWorkflowInstallationSchema56Schema,
    }),
    z.strictObject({
      kind: z.literal("prepare_takeover"),
      installationId: bWorkflowsManageWorkflowInstallationSchema0Schema,
      expectedAssignmentEpoch:
        bWorkflowsManageWorkflowInstallationSchema1Schema,
      oldHostState: z.enum(["paused", "unavailable"]),
    }),
    z.strictObject({
      kind: z.literal("takeover"),
      installationId: bWorkflowsManageWorkflowInstallationSchema0Schema,
      expectedAssignmentEpoch:
        bWorkflowsManageWorkflowInstallationSchema1Schema,
      previewId: bWorkflowsManageWorkflowInstallationSchema0Schema,
      confirmationDigest: bWorkflowsManageWorkflowInstallationSchema5Schema,
    }),
    z.strictObject({
      kind: z.literal("set_state"),
      installationId: bWorkflowsManageWorkflowInstallationSchema0Schema,
      expectedVersion: bWorkflowsManageWorkflowInstallationSchema1Schema,
      state: z.enum(["paused", "enabled", "revoked"]),
      reason: z.string().min(1).max(2000),
    }),
    z.strictObject({
      kind: z.literal("migration_preview"),
      manifest: z.strictObject({
        sourceSnapshotHash: bWorkflowsManageWorkflowInstallationSchema5Schema,
        targetVersion: bWorkflowsManageWorkflowInstallationSchema1Schema,
        integration: bWorkflowsManageWorkflowInstallationSchema58Schema,
        workflows: bWorkflowsManageWorkflowInstallationSchema67Schema,
      }),
    }),
    z.strictObject({
      kind: z.literal("migration_advance"),
      migrationId: bWorkflowsManageWorkflowInstallationSchema0Schema,
      sourceSnapshotHash: bWorkflowsManageWorkflowInstallationSchema5Schema,
      expectedVersion: bWorkflowsManageWorkflowInstallationSchema1Schema,
      stage: z.enum(["validated", "imported", "host_switched", "verified"]),
      confirmationDigest: bWorkflowsManageWorkflowInstallationSchema5Schema,
    }),
  ]),
});

export type WorkflowsManageWorkflowInstallationBody = z.infer<
  typeof workflowsManageWorkflowInstallationBodySchema
>;

export const workflowsManageWorkflowInstallationParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type WorkflowsManageWorkflowInstallationParams = z.infer<
  typeof workflowsManageWorkflowInstallationParamsSchema
>;

export const workflowsManageWorkflowInstallationQuerySchema = z.strictObject(
  {},
);

export type WorkflowsManageWorkflowInstallationQuery = z.infer<
  typeof workflowsManageWorkflowInstallationQuerySchema
>;

export const workflowsManageWorkflowInstallationResponseSchema = z.union([
  z.strictObject({
    id: rWorkflowsManageWorkflowInstallationSchema0Schema,
    migrationId: rWorkflowsManageWorkflowInstallationSchema1Schema,
    orgId: rWorkflowsManageWorkflowInstallationSchema2Schema,
    enterpriseKey: rWorkflowsManageWorkflowInstallationSchema3Schema,
    sourceSnapshotHash: rWorkflowsManageWorkflowInstallationSchema4Schema,
    targetVersion: rWorkflowsManageWorkflowInstallationSchema5Schema,
    version: rWorkflowsManageWorkflowInstallationSchema6Schema,
    stage: rWorkflowsManageWorkflowInstallationSchema7Schema,
    manifest: rWorkflowsManageWorkflowInstallationSchema8Schema,
    confirmationDigest: rWorkflowsManageWorkflowInstallationSchema4Schema,
    createdBy: rWorkflowsManageWorkflowInstallationSchema92Schema,
    createdAt: rWorkflowsManageWorkflowInstallationSchema93Schema,
    updatedAt: rWorkflowsManageWorkflowInstallationSchema93Schema,
    sealedAt: rWorkflowsManageWorkflowInstallationSchema94Schema,
    chunkCount: rWorkflowsManageWorkflowInstallationSchema95Schema,
    recordCount: rWorkflowsManageWorkflowInstallationSchema96Schema,
    chunksDigest: rWorkflowsManageWorkflowInstallationSchema97Schema,
    importedChunks: rWorkflowsManageWorkflowInstallationSchema98Schema,
    validatedChunks: rWorkflowsManageWorkflowInstallationSchema99Schema,
    targetVersions: rWorkflowsManageWorkflowInstallationSchema100Schema,
    chunks: z.array(
      z.strictObject({
        sequence: z.number().int().min(-9007199254740991).max(9007199254740991),
        chunk: z
          .array(rWorkflowsManageWorkflowInstallationSchema101Schema)
          .min(1)
          .max(3),
        chunkHash: rWorkflowsManageWorkflowInstallationSchema4Schema,
        recordCount: z
          .number()
          .int()
          .min(-9007199254740991)
          .max(9007199254740991),
        importedAt: z.union([
          rWorkflowsManageWorkflowInstallationSchema93Schema,
          z.null(),
        ]),
      }),
    ),
    nextCursor: z.union([
      z.number().int().min(-9007199254740991).max(9007199254740991),
      z.null(),
    ]),
  }),
  z.strictObject({
    id: rWorkflowsManageWorkflowInstallationSchema0Schema,
    migrationId: rWorkflowsManageWorkflowInstallationSchema1Schema,
    orgId: rWorkflowsManageWorkflowInstallationSchema2Schema,
    enterpriseKey: rWorkflowsManageWorkflowInstallationSchema3Schema,
    sourceSnapshotHash: rWorkflowsManageWorkflowInstallationSchema4Schema,
    targetVersion: rWorkflowsManageWorkflowInstallationSchema5Schema,
    version: rWorkflowsManageWorkflowInstallationSchema6Schema,
    stage: rWorkflowsManageWorkflowInstallationSchema7Schema,
    manifest: rWorkflowsManageWorkflowInstallationSchema8Schema,
    confirmationDigest: rWorkflowsManageWorkflowInstallationSchema4Schema,
    createdBy: rWorkflowsManageWorkflowInstallationSchema92Schema,
    createdAt: rWorkflowsManageWorkflowInstallationSchema93Schema,
    updatedAt: rWorkflowsManageWorkflowInstallationSchema93Schema,
    sealedAt: rWorkflowsManageWorkflowInstallationSchema94Schema,
    chunkCount: rWorkflowsManageWorkflowInstallationSchema95Schema,
    recordCount: rWorkflowsManageWorkflowInstallationSchema96Schema,
    chunksDigest: rWorkflowsManageWorkflowInstallationSchema97Schema,
    importedChunks: rWorkflowsManageWorkflowInstallationSchema98Schema,
    validatedChunks: rWorkflowsManageWorkflowInstallationSchema99Schema,
    targetVersions: rWorkflowsManageWorkflowInstallationSchema100Schema,
    complete: z.boolean(),
    nextSequence: z.union([
      z.number().int().min(-9007199254740991).max(9007199254740991),
      z.null(),
    ]),
  }),
  z.strictObject({
    previewId: rWorkflowsManageWorkflowInstallationSchema26Schema,
    confirmationDigest: rWorkflowsManageWorkflowInstallationSchema4Schema,
    kind: z.literal("takeover"),
    installationId: z.string(),
    assignmentEpoch: z
      .number()
      .int()
      .min(-9007199254740991)
      .max(9007199254740991),
    oldInstallationId: z.union([z.string(), z.null()]),
    oldHostState: z.enum(["paused", "unavailable"]),
    unknownActionIds: z.array(z.string()),
    unknownActionCount: z
      .number()
      .int()
      .min(-9007199254740991)
      .max(9007199254740991),
    unknownLatestChange: z.union([z.string(), z.null()]),
    leaseExpiresAt: z.union([
      rWorkflowsManageWorkflowInstallationSchema93Schema,
      z.null(),
    ]),
  }),
  z.strictObject({
    workflowId: z.string(),
    assignmentEpoch: z
      .number()
      .int()
      .min(-9007199254740991)
      .max(9007199254740991),
    installationId: z.string(),
    unresolvedActionIds: z.array(z.string()),
    unresolvedActionCount: z
      .number()
      .int()
      .min(-9007199254740991)
      .max(9007199254740991),
    nextActionCursor: z.union([z.string(), z.null()]),
  }),
  z.strictObject({
    id: rWorkflowsManageWorkflowInstallationSchema0Schema,
    migrationId: rWorkflowsManageWorkflowInstallationSchema1Schema,
    orgId: rWorkflowsManageWorkflowInstallationSchema2Schema,
    enterpriseKey: rWorkflowsManageWorkflowInstallationSchema3Schema,
    sourceSnapshotHash: rWorkflowsManageWorkflowInstallationSchema4Schema,
    targetVersion: rWorkflowsManageWorkflowInstallationSchema5Schema,
    version: rWorkflowsManageWorkflowInstallationSchema6Schema,
    stage: rWorkflowsManageWorkflowInstallationSchema7Schema,
    manifest: rWorkflowsManageWorkflowInstallationSchema8Schema,
    confirmationDigest: rWorkflowsManageWorkflowInstallationSchema4Schema,
    createdBy: rWorkflowsManageWorkflowInstallationSchema92Schema,
    createdAt: rWorkflowsManageWorkflowInstallationSchema93Schema,
    updatedAt: rWorkflowsManageWorkflowInstallationSchema93Schema,
    sealedAt: rWorkflowsManageWorkflowInstallationSchema94Schema,
    chunkCount: rWorkflowsManageWorkflowInstallationSchema95Schema,
    recordCount: rWorkflowsManageWorkflowInstallationSchema96Schema,
    chunksDigest: rWorkflowsManageWorkflowInstallationSchema97Schema,
    importedChunks: rWorkflowsManageWorkflowInstallationSchema98Schema,
    validatedChunks: rWorkflowsManageWorkflowInstallationSchema99Schema,
    targetVersions: rWorkflowsManageWorkflowInstallationSchema100Schema,
  }),
  z.strictObject({
    orgId: z.string(),
    workflowId: z.string(),
    installationId: z.string(),
    userAccountId: z.string(),
    version: z.number().int().min(-9007199254740991).max(9007199254740991),
    deviceAlias: z.string(),
    host: z.string(),
    platform: z.string(),
    launcherVersion: z.string(),
    workflowPackageVersion: z.string(),
    state: z.enum(["not_installed", "pending", "paused", "enabled", "revoked"]),
    hostSnapshot: z.union([
      rWorkflowsManageWorkflowInstallationSchema48Schema,
      z.null(),
    ]),
    readinessChecks: z.union([
      z.array(
        z.strictObject({
          capability: z.enum([
            "configuration",
            "permissions",
            "meituan_erp",
            "meituan_reviews",
            "download",
            "workspace",
            "dependencies",
            "email_identity",
            "sent_mail_lookup",
            "host_schedule",
            "host_timezone",
            "host_model",
            "assignment",
            "file_format",
          ]),
          status: z.enum([
            "ready",
            "needs_configuration",
            "needs_login",
            "permission_denied",
            "unsupported",
            "unavailable",
          ]),
          nextStep: z.string().max(2000),
          checkedAt: z
            .string()
            .regex(
              new RegExp(
                "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
              ),
            ),
          sampleStatus: z
            .enum(["verified", "no_sample", "not_checked"])
            .optional(),
        }),
      ),
      z.null(),
    ]),
    firstRunVerification: z.string(),
    lastCheckedAt: z.union([
      rWorkflowsManageWorkflowInstallationSchema93Schema,
      z.null(),
    ]),
    createdAt: rWorkflowsManageWorkflowInstallationSchema93Schema,
    updatedAt: rWorkflowsManageWorkflowInstallationSchema93Schema,
  }),
]);

export type WorkflowsManageWorkflowInstallationResponse = z.infer<
  typeof workflowsManageWorkflowInstallationResponseSchema
>;

export const workflowsManageWorkflowRunBodySchema = z.strictObject({
  workflowId: bWorkflowsManageWorkflowRunSchema0Schema,
  operation: z.union([
    z.strictObject({
      kind: z.literal("prepare_backfill"),
      installationId: bWorkflowsManageWorkflowRunSchema0Schema,
      assignmentEpoch: bWorkflowsManageWorkflowRunSchema1Schema,
      window: bWorkflowsManageWorkflowRunSchema2Schema,
      reason: z.string().min(1).max(2000),
    }),
    z.strictObject({
      kind: bWorkflowsManageWorkflowRunSchema4Schema,
      installationId: bWorkflowsManageWorkflowRunSchema0Schema,
      assignmentEpoch: bWorkflowsManageWorkflowRunSchema1Schema,
      expectedConfigurationVersion: bWorkflowsManageWorkflowRunSchema1Schema,
      expectedIntegrationVersion: bWorkflowsManageWorkflowRunSchema1Schema,
      expectedControlVersion: bWorkflowsManageWorkflowRunSchema1Schema,
      workflowPackageVersion: bWorkflowsManageWorkflowRunSchema5Schema,
      window: bWorkflowsManageWorkflowRunSchema2Schema,
      mode: bWorkflowsManageWorkflowRunSchema6Schema,
      backfillConfirmationDigest:
        bWorkflowsManageWorkflowRunSchema7Schema.optional(),
    }),
    z.strictObject({
      kind: z.literal("renew"),
      installationId: bWorkflowsManageWorkflowRunSchema0Schema,
      runId: bWorkflowsManageWorkflowRunSchema0Schema,
      assignmentEpoch: bWorkflowsManageWorkflowRunSchema1Schema,
      controlVersion: bWorkflowsManageWorkflowRunSchema1Schema,
    }),
    z.strictObject({
      kind: z.literal("resume"),
      installationId: bWorkflowsManageWorkflowRunSchema0Schema,
      runId: bWorkflowsManageWorkflowRunSchema0Schema,
      assignmentEpoch: bWorkflowsManageWorkflowRunSchema1Schema,
      controlVersion: bWorkflowsManageWorkflowRunSchema1Schema,
    }),
    z.strictObject({
      kind: z.literal("check_actions"),
      installationId: bWorkflowsManageWorkflowRunSchema0Schema,
      runId: bWorkflowsManageWorkflowRunSchema0Schema,
      assignmentEpoch: bWorkflowsManageWorkflowRunSchema1Schema,
      controlVersion: bWorkflowsManageWorkflowRunSchema1Schema,
      actions: z
        .array(bWorkflowsManageWorkflowRunSchema9Schema)
        .min(1)
        .max(100),
    }),
    z.strictObject({
      kind: z.literal("record_summary"),
      installationId: bWorkflowsManageWorkflowRunSchema0Schema,
      runId: bWorkflowsManageWorkflowRunSchema0Schema,
      assignmentEpoch: bWorkflowsManageWorkflowRunSchema1Schema,
      controlVersion: bWorkflowsManageWorkflowRunSchema1Schema,
      summary: bWorkflowsManageWorkflowRunSchema29Schema,
    }),
    z.strictObject({
      kind: z.literal("finish"),
      installationId: bWorkflowsManageWorkflowRunSchema0Schema,
      runId: bWorkflowsManageWorkflowRunSchema0Schema,
      assignmentEpoch: bWorkflowsManageWorkflowRunSchema1Schema,
      controlVersion: bWorkflowsManageWorkflowRunSchema1Schema,
      summary: bWorkflowsManageWorkflowRunSchema29Schema,
    }),
    z.strictObject({
      kind: z.literal("release"),
      installationId: bWorkflowsManageWorkflowRunSchema0Schema,
      runId: bWorkflowsManageWorkflowRunSchema0Schema,
      assignmentEpoch: bWorkflowsManageWorkflowRunSchema1Schema,
      controlVersion: bWorkflowsManageWorkflowRunSchema1Schema,
    }),
  ]),
});

export type WorkflowsManageWorkflowRunBody = z.infer<
  typeof workflowsManageWorkflowRunBodySchema
>;

export const workflowsManageWorkflowRunParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type WorkflowsManageWorkflowRunParams = z.infer<
  typeof workflowsManageWorkflowRunParamsSchema
>;

export const workflowsManageWorkflowRunQuerySchema = z.strictObject({});

export type WorkflowsManageWorkflowRunQuery = z.infer<
  typeof workflowsManageWorkflowRunQuerySchema
>;

export const workflowsManageWorkflowRunResponseSchema = z.union([
  z.strictObject({
    previewId: rWorkflowsManageWorkflowRunSchema0Schema,
    confirmationDigest: rWorkflowsManageWorkflowRunSchema1Schema,
    window: rWorkflowsManageWorkflowRunSchema2Schema,
    expiresAt: rWorkflowsManageWorkflowRunSchema4Schema,
  }),
  z.strictObject({
    id: rWorkflowsManageWorkflowRunSchema5Schema,
    orgId: rWorkflowsManageWorkflowRunSchema6Schema,
    workflowId: rWorkflowsManageWorkflowRunSchema7Schema,
    installationId: rWorkflowsManageWorkflowRunSchema8Schema,
    userAccountId: rWorkflowsManageWorkflowRunSchema9Schema,
    configurationVersion: rWorkflowsManageWorkflowRunSchema10Schema,
    integrationVersion: rWorkflowsManageWorkflowRunSchema11Schema,
    controlVersion: rWorkflowsManageWorkflowRunSchema12Schema,
    assignmentEpoch: rWorkflowsManageWorkflowRunSchema13Schema,
    workflowPackageVersion: rWorkflowsManageWorkflowRunSchema14Schema,
    startDate: rWorkflowsManageWorkflowRunSchema4Schema,
    endDate: rWorkflowsManageWorkflowRunSchema4Schema,
    mode: rWorkflowsManageWorkflowRunSchema15Schema,
    phase: rWorkflowsManageWorkflowRunSchema16Schema,
    status: rWorkflowsManageWorkflowRunSchema17Schema,
    snapshot: rWorkflowsManageWorkflowRunSchema18Schema,
    summary: rWorkflowsManageWorkflowRunSchema52Schema,
    startedAt: rWorkflowsManageWorkflowRunSchema4Schema,
    renewedAt: rWorkflowsManageWorkflowRunSchema4Schema,
    finishedAt: rWorkflowsManageWorkflowRunSchema63Schema,
    retainUntil: rWorkflowsManageWorkflowRunSchema4Schema,
    runId: rWorkflowsManageWorkflowRunSchema64Schema,
    leaseExpiresAt: rWorkflowsManageWorkflowRunSchema4Schema,
    renewAfterSeconds: z
      .number()
      .int()
      .min(-9007199254740991)
      .max(9007199254740991),
  }),
  z.strictObject({
    released: z.literal(true),
    runId: z.string(),
  }),
  z.strictObject({
    allowed: z.literal(true),
    intentRequired: z.literal(true),
  }),
  z.strictObject({
    id: rWorkflowsManageWorkflowRunSchema5Schema,
    orgId: rWorkflowsManageWorkflowRunSchema6Schema,
    workflowId: rWorkflowsManageWorkflowRunSchema7Schema,
    installationId: rWorkflowsManageWorkflowRunSchema8Schema,
    userAccountId: rWorkflowsManageWorkflowRunSchema9Schema,
    configurationVersion: rWorkflowsManageWorkflowRunSchema10Schema,
    integrationVersion: rWorkflowsManageWorkflowRunSchema11Schema,
    controlVersion: rWorkflowsManageWorkflowRunSchema12Schema,
    assignmentEpoch: rWorkflowsManageWorkflowRunSchema13Schema,
    workflowPackageVersion: rWorkflowsManageWorkflowRunSchema14Schema,
    startDate: rWorkflowsManageWorkflowRunSchema4Schema,
    endDate: rWorkflowsManageWorkflowRunSchema4Schema,
    mode: rWorkflowsManageWorkflowRunSchema15Schema,
    phase: rWorkflowsManageWorkflowRunSchema16Schema,
    status: rWorkflowsManageWorkflowRunSchema17Schema,
    snapshot: rWorkflowsManageWorkflowRunSchema18Schema,
    summary: rWorkflowsManageWorkflowRunSchema52Schema,
    startedAt: rWorkflowsManageWorkflowRunSchema4Schema,
    renewedAt: rWorkflowsManageWorkflowRunSchema4Schema,
    finishedAt: rWorkflowsManageWorkflowRunSchema63Schema,
    retainUntil: rWorkflowsManageWorkflowRunSchema4Schema,
    runId: rWorkflowsManageWorkflowRunSchema64Schema,
  }),
]);

export type WorkflowsManageWorkflowRunResponse = z.infer<
  typeof workflowsManageWorkflowRunResponseSchema
>;

export const workflowsPrepareEnterpriseWorkflowChangeBodySchema =
  z.strictObject({
    enterpriseKey: z.string().min(1).max(128),
    workflowType: z.enum([
      "meituan-daily-ingestion",
      "meituan-review-operations",
      "weekly-business-report",
    ]),
    expectedVersion: bWorkflowsPrepareEnterpriseWorkflowChangeSchema0Schema,
    expectedIntegrationVersion:
      bWorkflowsPrepareEnterpriseWorkflowChangeSchema0Schema,
    expectedControlVersion:
      bWorkflowsPrepareEnterpriseWorkflowChangeSchema0Schema,
    change: z.union([
      z.strictObject({
        kind: z.literal("integration"),
        configuration: z.strictObject({
          schemaVersion: bWorkflowsPrepareEnterpriseWorkflowChangeSchema1Schema,
          timezone: bWorkflowsPrepareEnterpriseWorkflowChangeSchema2Schema,
          sourceAccounts:
            bWorkflowsPrepareEnterpriseWorkflowChangeSchema3Schema,
          storeMappings: bWorkflowsPrepareEnterpriseWorkflowChangeSchema6Schema,
          exclusions: bWorkflowsPrepareEnterpriseWorkflowChangeSchema12Schema,
        }),
      }),
      z.strictObject({
        kind: z.literal("configuration"),
        configuration: z.union([
          bWorkflowsPrepareEnterpriseWorkflowChangeSchema14Schema,
          bWorkflowsPrepareEnterpriseWorkflowChangeSchema19Schema,
          bWorkflowsPrepareEnterpriseWorkflowChangeSchema27Schema,
        ]),
      }),
      z.strictObject({
        kind: z.literal("authorization"),
        grant: z
          .array(bWorkflowsPrepareEnterpriseWorkflowChangeSchema29Schema)
          .max(20),
        revokeAuthorizationIds: z
          .array(bWorkflowsPrepareEnterpriseWorkflowChangeSchema34Schema)
          .max(100),
      }),
      z.strictObject({
        kind: z.literal("control"),
        state: z.enum(["active", "paused", "revoked"]),
        reason: z.string().min(1).max(2000),
      }),
    ]),
  });

export type WorkflowsPrepareEnterpriseWorkflowChangeBody = z.infer<
  typeof workflowsPrepareEnterpriseWorkflowChangeBodySchema
>;

export const workflowsPrepareEnterpriseWorkflowChangeParamsSchema =
  z.strictObject({
    orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
  });

export type WorkflowsPrepareEnterpriseWorkflowChangeParams = z.infer<
  typeof workflowsPrepareEnterpriseWorkflowChangeParamsSchema
>;

export const workflowsPrepareEnterpriseWorkflowChangeQuerySchema =
  z.strictObject({});

export type WorkflowsPrepareEnterpriseWorkflowChangeQuery = z.infer<
  typeof workflowsPrepareEnterpriseWorkflowChangeQuerySchema
>;

export const workflowsPrepareEnterpriseWorkflowChangeResponseSchema =
  z.strictObject({
    enterpriseKey: z.string(),
    workflowType: z.enum([
      "meituan-daily-ingestion",
      "meituan-review-operations",
      "weekly-business-report",
    ]),
    expectedVersion: rWorkflowsPrepareEnterpriseWorkflowChangeSchema0Schema,
    expectedIntegrationVersion:
      rWorkflowsPrepareEnterpriseWorkflowChangeSchema0Schema,
    expectedControlVersion:
      rWorkflowsPrepareEnterpriseWorkflowChangeSchema0Schema,
    change: z.union([
      z.strictObject({
        kind: z.literal("integration"),
        configuration: z.strictObject({
          schemaVersion: rWorkflowsPrepareEnterpriseWorkflowChangeSchema1Schema,
          timezone: rWorkflowsPrepareEnterpriseWorkflowChangeSchema2Schema,
          sourceAccounts:
            rWorkflowsPrepareEnterpriseWorkflowChangeSchema3Schema,
          storeMappings: rWorkflowsPrepareEnterpriseWorkflowChangeSchema6Schema,
          exclusions: rWorkflowsPrepareEnterpriseWorkflowChangeSchema12Schema,
        }),
      }),
      z.strictObject({
        kind: z.literal("configuration"),
        configuration: z.union([
          rWorkflowsPrepareEnterpriseWorkflowChangeSchema14Schema,
          rWorkflowsPrepareEnterpriseWorkflowChangeSchema19Schema,
          rWorkflowsPrepareEnterpriseWorkflowChangeSchema27Schema,
        ]),
      }),
      z.strictObject({
        kind: z.literal("authorization"),
        grant: z
          .array(rWorkflowsPrepareEnterpriseWorkflowChangeSchema29Schema)
          .max(20),
        revokeAuthorizationIds: z
          .array(rWorkflowsPrepareEnterpriseWorkflowChangeSchema34Schema)
          .max(100),
      }),
      z.strictObject({
        kind: z.literal("control"),
        state: z.enum(["active", "paused", "revoked"]),
        reason: z.string().min(1).max(2000),
      }),
    ]),
    previewId: rWorkflowsPrepareEnterpriseWorkflowChangeSchema34Schema,
    confirmationDigest: z.string().regex(new RegExp("^[a-f0-9]{64}$")),
    expiresAt: z
      .string()
      .regex(
        new RegExp(
          "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
        ),
      ),
    impact: z
      .strictObject({
        affectedWorkflows: z.array(
          z.strictObject({
            workflowType: z.string(),
            storeNames: z.array(z.string()),
          }),
        ),
      })
      .optional(),
  });

export type WorkflowsPrepareEnterpriseWorkflowChangeResponse = z.infer<
  typeof workflowsPrepareEnterpriseWorkflowChangeResponseSchema
>;

export const workflowsRecordWorkflowActionBodySchema = z.strictObject({
  workflowId: bWorkflowsRecordWorkflowActionSchema0Schema,
  operation: z.union([
    z.strictObject({
      kind: z.literal("intent"),
      installationId: bWorkflowsRecordWorkflowActionSchema0Schema,
      runId: bWorkflowsRecordWorkflowActionSchema0Schema,
      assignmentEpoch: bWorkflowsRecordWorkflowActionSchema1Schema,
      controlVersion: bWorkflowsRecordWorkflowActionSchema1Schema,
      actions: z
        .array(bWorkflowsRecordWorkflowActionSchema2Schema)
        .min(1)
        .max(100),
    }),
    z.strictObject({
      kind: z.literal("record_receipts"),
      installationId: bWorkflowsRecordWorkflowActionSchema0Schema,
      runId: bWorkflowsRecordWorkflowActionSchema0Schema,
      assignmentEpoch: bWorkflowsRecordWorkflowActionSchema1Schema,
      controlVersion: bWorkflowsRecordWorkflowActionSchema1Schema,
      receipts: z
        .array(bWorkflowsRecordWorkflowActionSchema25Schema)
        .min(1)
        .max(100),
    }),
    z.strictObject({
      kind: z.literal("resolve_unknown"),
      installationId: bWorkflowsRecordWorkflowActionSchema0Schema,
      runId: bWorkflowsRecordWorkflowActionSchema0Schema,
      assignmentEpoch: bWorkflowsRecordWorkflowActionSchema1Schema,
      controlVersion: bWorkflowsRecordWorkflowActionSchema1Schema,
      receipt: bWorkflowsRecordWorkflowActionSchema25Schema,
    }),
    z.strictObject({
      kind: z.literal("get"),
      actionIds: z
        .array(bWorkflowsRecordWorkflowActionSchema0Schema)
        .min(1)
        .max(100),
    }),
  ]),
});

export type WorkflowsRecordWorkflowActionBody = z.infer<
  typeof workflowsRecordWorkflowActionBodySchema
>;

export const workflowsRecordWorkflowActionParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type WorkflowsRecordWorkflowActionParams = z.infer<
  typeof workflowsRecordWorkflowActionParamsSchema
>;

export const workflowsRecordWorkflowActionQuerySchema = z.strictObject({});

export type WorkflowsRecordWorkflowActionQuery = z.infer<
  typeof workflowsRecordWorkflowActionQuerySchema
>;

export const workflowsRecordWorkflowActionResponseSchema = z.union([
  z.strictObject({
    actions: z.array(
      z.strictObject({
        actionId: z.string(),
        runId: z.string(),
        state: z.enum(["intent", "confirmed", "failed", "unknown"]),
        identity: z.union([
          z.strictObject({
            storeNames: rWorkflowsRecordWorkflowActionSchema0Schema,
            window: rWorkflowsRecordWorkflowActionSchema2Schema,
            kind: rWorkflowsRecordWorkflowActionSchema4Schema,
            dataset: rWorkflowsRecordWorkflowActionSchema5Schema,
            orderScope: rWorkflowsRecordWorkflowActionSchema6Schema.optional(),
            sourceHash: rWorkflowsRecordWorkflowActionSchema7Schema,
            metadataHash: rWorkflowsRecordWorkflowActionSchema7Schema,
          }),
          z.strictObject({
            storeNames: rWorkflowsRecordWorkflowActionSchema0Schema,
            window: rWorkflowsRecordWorkflowActionSchema2Schema,
            kind: z.literal("download"),
            dataset: z.enum([
              "business",
              "dishes",
              "in_store_orders",
              "takeaway_orders",
            ]),
            manifestHash:
              rWorkflowsRecordWorkflowActionSchema7Schema.optional(),
          }),
          z.strictObject({
            storeNames: rWorkflowsRecordWorkflowActionSchema0Schema,
            window: rWorkflowsRecordWorkflowActionSchema2Schema,
            kind: z.literal("review_sync"),
            source: rWorkflowsRecordWorkflowActionSchema8Schema,
            observedFactsHash: rWorkflowsRecordWorkflowActionSchema7Schema,
          }),
          z.strictObject({
            kind: z.literal("review_publish"),
            storeName: rWorkflowsRecordWorkflowActionSchema1Schema,
            source: rWorkflowsRecordWorkflowActionSchema8Schema,
            feedbackId: rWorkflowsRecordWorkflowActionSchema1Schema,
            purpose: z.literal("customer_reply"),
          }),
          z.strictObject({
            storeNames: rWorkflowsRecordWorkflowActionSchema0Schema,
            window: rWorkflowsRecordWorkflowActionSchema2Schema,
            kind: rWorkflowsRecordWorkflowActionSchema12Schema,
            purpose: rWorkflowsRecordWorkflowActionSchema13Schema,
            recipients: rWorkflowsRecordWorkflowActionSchema14Schema,
            sender: rWorkflowsRecordWorkflowActionSchema16Schema,
            deliveryVersion: rWorkflowsRecordWorkflowActionSchema17Schema,
            reviewIdentities:
              rWorkflowsRecordWorkflowActionSchema18Schema.optional(),
          }),
        ]),
        identityHash: rWorkflowsRecordWorkflowActionSchema7Schema,
        artifactHash: z.union([
          rWorkflowsRecordWorkflowActionSchema7Schema,
          z.null(),
        ]),
        correlationMarker: z.union([z.string(), z.null()]),
        receipt: z.union([
          rWorkflowsRecordWorkflowActionSchema20Schema,
          z.null(),
        ]),
      }),
    ),
  }),
  z.strictObject({
    actions: z.array(
      z.strictObject({
        actionId: z.string(),
        state: z.literal("intent"),
        permitted: z.literal(true),
        identityHash: rWorkflowsRecordWorkflowActionSchema7Schema,
      }),
    ),
  }),
  z.strictObject({
    recorded: z.number().int().min(-9007199254740991).max(9007199254740991),
    receipts: z.array(rWorkflowsRecordWorkflowActionSchema20Schema),
  }),
]);

export type WorkflowsRecordWorkflowActionResponse = z.infer<
  typeof workflowsRecordWorkflowActionResponseSchema
>;

export const workflowsSaveEnterpriseWorkflowBodySchema = z.strictObject({
  enterpriseKey: z.string().min(1).max(128),
  workflowType: z.enum([
    "meituan-daily-ingestion",
    "meituan-review-operations",
    "weekly-business-report",
  ]),
  expectedVersion: bWorkflowsSaveEnterpriseWorkflowSchema0Schema,
  expectedIntegrationVersion: bWorkflowsSaveEnterpriseWorkflowSchema0Schema,
  expectedControlVersion: bWorkflowsSaveEnterpriseWorkflowSchema0Schema,
  previewId: z.string().min(1).max(64).regex(new RegExp("^[A-Za-z0-9_-]+$")),
  confirmationDigest: z.string().regex(new RegExp("^[a-f0-9]{64}$")),
});

export type WorkflowsSaveEnterpriseWorkflowBody = z.infer<
  typeof workflowsSaveEnterpriseWorkflowBodySchema
>;

export const workflowsSaveEnterpriseWorkflowParamsSchema = z.strictObject({
  orgId: z.string().regex(new RegExp("^[A-Za-z0-9_-]{1,64}$")),
});

export type WorkflowsSaveEnterpriseWorkflowParams = z.infer<
  typeof workflowsSaveEnterpriseWorkflowParamsSchema
>;

export const workflowsSaveEnterpriseWorkflowQuerySchema = z.strictObject({});

export type WorkflowsSaveEnterpriseWorkflowQuery = z.infer<
  typeof workflowsSaveEnterpriseWorkflowQuerySchema
>;

export const workflowsSaveEnterpriseWorkflowResponseSchema = z.strictObject({
  capability: z.strictObject({
    id: z.string(),
    version: z.string(),
    configurationSchemaVersion: z
      .number()
      .int()
      .min(-9007199254740991)
      .max(9007199254740991),
    minimumLauncherVersion: z.string(),
  }),
  workflowId: z.string().min(1).max(64).regex(new RegExp("^[A-Za-z0-9_-]+$")),
  enterpriseKey: z.string(),
  workflowType: z.enum([
    "meituan-daily-ingestion",
    "meituan-review-operations",
    "weekly-business-report",
  ]),
  version: rWorkflowsSaveEnterpriseWorkflowSchema0Schema,
  controlVersion: rWorkflowsSaveEnterpriseWorkflowSchema0Schema,
  controlState: z.enum(["active", "paused", "revoked"]),
  assignmentEpoch: rWorkflowsSaveEnterpriseWorkflowSchema0Schema,
  assignedInstallationId: z.union([z.string(), z.null()]),
  lease: z.strictObject({
    runId: z.union([z.string(), z.null()]),
    expiresAt: z.union([
      rWorkflowsSaveEnterpriseWorkflowSchema1Schema,
      z.null(),
    ]),
  }),
  configuration: z.union([
    z.union([
      rWorkflowsSaveEnterpriseWorkflowSchema2Schema,
      rWorkflowsSaveEnterpriseWorkflowSchema8Schema,
      rWorkflowsSaveEnterpriseWorkflowSchema20Schema,
    ]),
    z.null(),
  ]),
  integration: z.strictObject({
    orgId: z.string(),
    enterpriseKey: z.string(),
    version: rWorkflowsSaveEnterpriseWorkflowSchema0Schema,
    schemaVersion: z
      .number()
      .int()
      .min(-9007199254740991)
      .max(9007199254740991),
    configuration: z.strictObject({
      schemaVersion: rWorkflowsSaveEnterpriseWorkflowSchema22Schema,
      timezone: rWorkflowsSaveEnterpriseWorkflowSchema23Schema,
      sourceAccounts: rWorkflowsSaveEnterpriseWorkflowSchema24Schema,
      storeMappings: rWorkflowsSaveEnterpriseWorkflowSchema26Schema,
      exclusions: rWorkflowsSaveEnterpriseWorkflowSchema28Schema,
    }),
    orderScopeRequired: z.boolean(),
    updatedBy: z.string(),
    createdAt: rWorkflowsSaveEnterpriseWorkflowSchema1Schema,
    updatedAt: rWorkflowsSaveEnterpriseWorkflowSchema1Schema,
  }),
  authorizations: z.array(
    z.strictObject({
      authorizationId: z.string(),
      scope: z.union([
        z.strictObject({
          kind: z.literal("upload"),
          datasets: z
            .array(rWorkflowsSaveEnterpriseWorkflowSchema30Schema)
            .min(1)
            .max(5),
          storeNames: rWorkflowsSaveEnterpriseWorkflowSchema4Schema,
        }),
        z.strictObject({
          kind: z.literal("download"),
          datasets: z
            .array(rWorkflowsSaveEnterpriseWorkflowSchema31Schema)
            .min(1)
            .max(4),
          storeNames: rWorkflowsSaveEnterpriseWorkflowSchema4Schema,
        }),
        z.strictObject({
          kind: z.literal("review_sync"),
          channels: z
            .array(rWorkflowsSaveEnterpriseWorkflowSchema32Schema)
            .min(1)
            .max(2),
          storeNames: rWorkflowsSaveEnterpriseWorkflowSchema4Schema,
        }),
        z.strictObject({
          kind: z.literal("review_publish"),
          channels: z
            .array(rWorkflowsSaveEnterpriseWorkflowSchema33Schema)
            .min(1)
            .max(2),
          storeNames: rWorkflowsSaveEnterpriseWorkflowSchema4Schema,
        }),
        z.strictObject({
          kind: z.literal("email"),
          purpose: z.enum(["review_drafts", "weekly_report", "exception"]),
          storeNames: rWorkflowsSaveEnterpriseWorkflowSchema4Schema,
          recipients: rWorkflowsSaveEnterpriseWorkflowSchema17Schema,
          allowedSender: z
            .string()
            .max(254)
            .regex(
              new RegExp(
                "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
              ),
            ),
          deliveryVersion: rWorkflowsSaveEnterpriseWorkflowSchema0Schema,
        }),
      ]),
      configurationVersion: rWorkflowsSaveEnterpriseWorkflowSchema0Schema,
      controlVersion: rWorkflowsSaveEnterpriseWorkflowSchema0Schema,
      grantedBy: z.string(),
      grantedAt: rWorkflowsSaveEnterpriseWorkflowSchema1Schema,
      revokedAt: z.union([
        rWorkflowsSaveEnterpriseWorkflowSchema1Schema,
        z.null(),
      ]),
    }),
  ),
});

export type WorkflowsSaveEnterpriseWorkflowResponse = z.infer<
  typeof workflowsSaveEnterpriseWorkflowResponseSchema
>;

// route id → 调用方需要的静态元数据；运行时校验以各自的 zod schema 为准

export const webApiRoutes = {
  "directory.createEmployee": {
    method: "POST",
    path: "/api/web/v1/orgs/:orgId/directory/create_employee",
    auth: "session-write",
    errors: [
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "DIRECTORY_ACCESS_DENIED",
      "DIRECTORY_CONFLICT",
      "DIRECTORY_IN_USE",
      "DIRECTORY_NOT_FOUND",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "创建员工档案",
  },
  "directory.getEmployee": {
    method: "POST",
    path: "/api/web/v1/orgs/:orgId/directory/get_employee",
    auth: "session-write",
    errors: [
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "DIRECTORY_ACCESS_DENIED",
      "DIRECTORY_CONFLICT",
      "DIRECTORY_IN_USE",
      "DIRECTORY_NOT_FOUND",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "读取授权范围内的单个员工档案",
  },
  "directory.listDirectory": {
    method: "POST",
    path: "/api/web/v1/orgs/:orgId/directory/list_directory",
    auth: "session-write",
    errors: [
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "DIRECTORY_ACCESS_DENIED",
      "DIRECTORY_CONFLICT",
      "DIRECTORY_IN_USE",
      "DIRECTORY_NOT_FOUND",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "读取企业门店和部门目录",
  },
  "directory.listEmployees": {
    method: "POST",
    path: "/api/web/v1/orgs/:orgId/directory/list_employees",
    auth: "session-write",
    errors: [
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "DIRECTORY_ACCESS_DENIED",
      "DIRECTORY_CONFLICT",
      "DIRECTORY_IN_USE",
      "DIRECTORY_NOT_FOUND",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "读取授权范围内的员工档案",
  },
  "directory.manageDepartment": {
    method: "POST",
    path: "/api/web/v1/orgs/:orgId/directory/manage_department",
    auth: "session-write",
    errors: [
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "DIRECTORY_ACCESS_DENIED",
      "DIRECTORY_CONFLICT",
      "DIRECTORY_IN_USE",
      "DIRECTORY_NOT_FOUND",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "维护部门目录",
  },
  "directory.manageStore": {
    method: "POST",
    path: "/api/web/v1/orgs/:orgId/directory/manage_store",
    auth: "session-write",
    errors: [
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "DIRECTORY_ACCESS_DENIED",
      "DIRECTORY_CONFLICT",
      "DIRECTORY_IN_USE",
      "DIRECTORY_NOT_FOUND",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "维护正式门店目录",
  },
  "directory.updateEmployee": {
    method: "POST",
    path: "/api/web/v1/orgs/:orgId/directory/update_employee",
    auth: "session-write",
    errors: [
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "DIRECTORY_ACCESS_DENIED",
      "DIRECTORY_CONFLICT",
      "DIRECTORY_IN_USE",
      "DIRECTORY_NOT_FOUND",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "维护员工档案与归属",
  },
  "ledger.context": {
    method: "GET",
    path: "/api/web/v1/ledger/context",
    auth: "session",
    errors: ["BROWSER_SIGN_IN_REQUIRED", "INTERNAL_ERROR"],
    summary: "读取台账下载中心所需的本人身份、CSRF 令牌与静态限额",
  },
  "ledger.coverage": {
    method: "POST",
    path: "/api/web/v1/ledger/coverage",
    auth: "session-write",
    errors: [
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "LEDGER_CURSOR_INVALID",
      "LEDGER_PDF_NOT_ENABLED",
      "LEDGER_PDF_UNAVAILABLE",
      "LEDGER_SCOPE_INVALID",
      "LEDGER_SCOPE_LIMIT_EXCEEDED",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "按日期范围或精确分区选择读取台账 PDF 覆盖、大小与下一页游标",
  },
  "ledger.downloads": {
    method: "POST",
    path: "/api/web/v1/ledger/downloads",
    auth: "session-write",
    errors: [
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "LEDGER_IDEMPOTENCY_CONFLICT",
      "LEDGER_PDF_BUNDLE_LIMIT_EXCEEDED",
      "LEDGER_PDF_NOT_ENABLED",
      "LEDGER_PDF_NOT_READY",
      "LEDGER_PDF_UNAVAILABLE",
      "LEDGER_SCOPE_INVALID",
      "LEDGER_SCOPE_LIMIT_EXCEEDED",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "按精确分区清单幂等提交台账 ZIP 制作任务",
  },
  "ledger.pdf": {
    method: "GET",
    path: "/api/web/v1/ledger/pdf",
    auth: "session",
    errors: [
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "LEDGER_PDF_BUNDLE_STALE",
      "LEDGER_PDF_NOT_ENABLED",
      "LEDGER_PDF_NOT_READY",
      "LEDGER_PDF_UNAVAILABLE",
      "LEDGER_SCOPE_INVALID",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "以同源流式响应预览或下载单个台账 PDF（非 JSON）",
  },
  "ledger.requests.downloadUrl": {
    method: "POST",
    path: "/api/web/v1/ledger/requests/:requestId/download-url",
    auth: "session-write",
    errors: [
      "AUTHORIZATION_VERSION_CONFLICT",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "LEDGER_DOWNLOAD_REBUILD_REQUIRED",
      "LEDGER_PDF_BUNDLE_STALE",
      "LEDGER_PDF_NOT_ENABLED",
      "LEDGER_PDF_NOT_READY",
      "LEDGER_PDF_UNAVAILABLE",
      "LEDGER_REQUEST_INVALID",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "为已完成的本人台账 ZIP 重新签发短时下载链接",
  },
  "ledger.requests.read": {
    method: "GET",
    path: "/api/web/v1/ledger/requests/:requestId",
    auth: "session",
    errors: [
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "LEDGER_CURSOR_INVALID",
      "LEDGER_PDF_NOT_ENABLED",
      "LEDGER_PDF_UNAVAILABLE",
      "LEDGER_REQUEST_INVALID",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "轮询本人台账 ZIP 任务的进度与分区结果",
  },
  "permissions.accounts.list": {
    method: "GET",
    path: "/api/web/v1/orgs/:orgId/permissions/accounts",
    auth: "session",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "列出同企业账号及其授权",
  },
  "permissions.accounts.read": {
    method: "GET",
    path: "/api/web/v1/orgs/:orgId/permissions/accounts/:userAccountId",
    auth: "session",
    errors: [
      "AUTHORIZATION_ACCOUNT_NOT_FOUND",
      "AUTHORIZATION_ADMIN_REQUIRED",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "读取单个账号的授权快照",
  },
  "permissions.accounts.update": {
    method: "PATCH",
    path: "/api/web/v1/orgs/:orgId/permissions/accounts/:userAccountId",
    auth: "session-write",
    errors: [
      "AUTHORIZATION_ACCOUNT_NOT_FOUND",
      "AUTHORIZATION_ADMIN_REQUIRED",
      "AUTHORIZATION_VERSION_CONFLICT",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "ENTERPRISE_NAME_REQUIRED",
      "INTERNAL_ERROR",
      "INVALID_PERMISSION_CONFIGURATION",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "按期望版本保存账号密级与业务授权",
  },
  "permissions.categories.create": {
    method: "POST",
    path: "/api/web/v1/orgs/:orgId/permissions/categories",
    auth: "session-write",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "AUTHORIZATION_VERSION_CONFLICT",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "INVALID_PERMISSION_CONFIGURATION",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "新建证据类别",
  },
  "permissions.categories.initialize": {
    method: "POST",
    path: "/api/web/v1/orgs/:orgId/permissions/categories/initialize",
    auth: "session-write",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "AUTHORIZATION_VERSION_CONFLICT",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "INVALID_PERMISSION_CONFIGURATION",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "按期望版本初始化固定业务类别",
  },
  "permissions.categories.list": {
    method: "GET",
    path: "/api/web/v1/orgs/:orgId/permissions/categories",
    auth: "session",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "列出业务类别及其必需维度",
  },
  "permissions.categories.update": {
    method: "PATCH",
    path: "/api/web/v1/orgs/:orgId/permissions/categories/:id",
    auth: "session-write",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "AUTHORIZATION_VERSION_CONFLICT",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "CATEGORY_NOT_FOUND",
      "INTERNAL_ERROR",
      "INVALID_PERMISSION_CONFIGURATION",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "更新固定类别密级或证据类别配置",
  },
  "permissions.cutover.activate": {
    method: "POST",
    path: "/api/web/v1/orgs/:orgId/permissions/cutover/activate",
    auth: "session-write",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "AUTHORIZATION_CUTOVER_NOT_READY",
      "AUTHORIZATION_SUSPENDED",
      "AUTHORIZATION_VERSION_CONFLICT",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "INVALID_PERMISSION_CONFIGURATION",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "按期望版本并显式确认后启用业务授权",
  },
  "permissions.cutover.read": {
    method: "GET",
    path: "/api/web/v1/orgs/:orgId/permissions/cutover",
    auth: "session",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "检查业务授权启用前的准备项",
  },
  "permissions.cutover.suspend": {
    method: "POST",
    path: "/api/web/v1/orgs/:orgId/permissions/cutover/suspend",
    auth: "session-write",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "AUTHORIZATION_NOT_ENABLED",
      "AUTHORIZATION_VERSION_CONFLICT",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "INVALID_PERMISSION_CONFIGURATION",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "按期望版本并显式确认后暂停业务授权读取",
  },
  "permissions.dimensions.create": {
    method: "POST",
    path: "/api/web/v1/orgs/:orgId/permissions/dimensions",
    auth: "session-write",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "AUTHORIZATION_VERSION_CONFLICT",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "INVALID_PERMISSION_CONFIGURATION",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "新建业务维度",
  },
  "permissions.dimensions.list": {
    method: "GET",
    path: "/api/web/v1/orgs/:orgId/permissions/dimensions",
    auth: "session",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "列出业务维度及其取值",
  },
  "permissions.dimensions.update": {
    method: "PATCH",
    path: "/api/web/v1/orgs/:orgId/permissions/dimensions/:id",
    auth: "session-write",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "AUTHORIZATION_VERSION_CONFLICT",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "INVALID_PERMISSION_CONFIGURATION",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "更新业务维度名称与停用状态",
  },
  "permissions.dimensions.valueCreate": {
    method: "POST",
    path: "/api/web/v1/orgs/:orgId/permissions/dimensions/:dimensionId/values",
    auth: "session-write",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "AUTHORIZATION_VERSION_CONFLICT",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "INVALID_PERMISSION_CONFIGURATION",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "在维度下新建取值",
  },
  "permissions.dimensions.valueUpdate": {
    method: "PATCH",
    path: "/api/web/v1/orgs/:orgId/permissions/dimensions/:dimensionId/values/:id",
    auth: "session-write",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "AUTHORIZATION_VERSION_CONFLICT",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "INVALID_PERMISSION_CONFIGURATION",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "更新维度取值的名称与停用状态",
  },
  "permissions.documents.list": {
    method: "GET",
    path: "/api/web/v1/orgs/:orgId/permissions/documents",
    auth: "session",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "分页检索证据文档及其授权属性",
  },
  "permissions.documents.update": {
    method: "PATCH",
    path: "/api/web/v1/orgs/:orgId/permissions/documents/:documentId",
    auth: "session-write",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "AUTHORIZATION_VERSION_CONFLICT",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "INVALID_PERMISSION_CONFIGURATION",
      "RESOURCE_NOT_FOUND",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "按期望版本保存证据文档的类别、密级与作用域",
  },
  "permissions.enterprises.declare": {
    method: "POST",
    path: "/api/web/v1/orgs/:orgId/permissions/enterprises",
    auth: "session-write",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "AUTHORIZATION_VERSION_CONFLICT",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "ENTERPRISE_NAME_CONFLICT",
      "INTERNAL_ERROR",
      "INVALID_ENTERPRISE_NAME",
      "INVALID_PERMISSION_CONFIGURATION",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "按期望版本登记业务企业名称",
  },
  "permissions.enterprises.list": {
    method: "GET",
    path: "/api/web/v1/orgs/:orgId/permissions/enterprises",
    auth: "session",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "列出已登记的业务企业",
  },
  "permissions.enterprises.preview": {
    method: "POST",
    path: "/api/web/v1/orgs/:orgId/permissions/enterprises/preview",
    auth: "session-write",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "AUTHORIZATION_VERSION_CONFLICT",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "INVALID_ENTERPRISE_NAME",
      "INVALID_PERMISSION_CONFIGURATION",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "只计算企业名称的规范化标识，不落库",
  },
  "permissions.me.read": {
    method: "GET",
    path: "/api/web/v1/orgs/:orgId/permissions/me",
    auth: "session",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "读取当前账号的权限卡片与可审核企业范围",
  },
  "permissions.stores.list": {
    method: "GET",
    path: "/api/web/v1/orgs/:orgId/permissions/stores",
    auth: "session",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "列出企业门店目录",
  },
  "permissions.stores.upsert": {
    method: "POST",
    path: "/api/web/v1/orgs/:orgId/permissions/stores",
    auth: "session-write",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "AUTHORIZATION_VERSION_CONFLICT",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "ENTERPRISE_NAME_CONFLICT",
      "ENTERPRISE_NAME_REQUIRED",
      "INTERNAL_ERROR",
      "INVALID_PERMISSION_CONFIGURATION",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "按期望版本新增或更新门店",
  },
  "session.login": {
    method: "POST",
    path: "/api/web/v1/session",
    auth: "anonymous-write",
    errors: [
      "BROWSER_INVALID_CREDENTIALS",
      "BROWSER_SECURITY_CHECK_FAILED",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
    ],
    summary: "用邮箱与密码登录网页，签发会话 Cookie 并返回身份与 CSRF 令牌",
  },
  "session.logout": {
    method: "DELETE",
    path: "/api/web/v1/session",
    auth: "session-write",
    errors: [
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
    ],
    summary: "注销当前网页会话并清除会话 Cookie",
  },
  "session.read": {
    method: "GET",
    path: "/api/web/v1/session",
    auth: "session",
    errors: ["BROWSER_SIGN_IN_REQUIRED", "INTERNAL_ERROR"],
    summary: "读取当前网页会话的身份、CSRF 令牌与管理设置权限",
  },
  "workflows.getEnterpriseWorkflow": {
    method: "POST",
    path: "/api/web/v1/orgs/:orgId/workflows/get_enterprise_workflow",
    auth: "session-write",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
      "WORKFLOW_ACTION_UNKNOWN",
      "WORKFLOW_ADMIN_REQUIRED",
      "WORKFLOW_BUSY",
      "WORKFLOW_CONFIGURATION_REQUIRED",
      "WORKFLOW_CONTROL_REVOKED",
      "WORKFLOW_INSTALLATION_MISMATCH",
      "WORKFLOW_PERMISSION_DENIED",
      "WORKFLOW_SOURCE_MAPPING_CONFLICT",
      "WORKFLOW_SOURCE_UNAVAILABLE",
      "WORKFLOW_VERSION_CONFLICT",
      "WORKFLOW_VERSION_INCOMPATIBLE",
    ],
    summary: "读取单个自动任务的配置、来源与授权",
  },
  "workflows.getWorkflowStatus": {
    method: "POST",
    path: "/api/web/v1/orgs/:orgId/workflows/get_workflow_status",
    auth: "session-write",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
      "WORKFLOW_ACTION_UNKNOWN",
      "WORKFLOW_ADMIN_REQUIRED",
      "WORKFLOW_BUSY",
      "WORKFLOW_CONFIGURATION_REQUIRED",
      "WORKFLOW_CONTROL_REVOKED",
      "WORKFLOW_INSTALLATION_MISMATCH",
      "WORKFLOW_PERMISSION_DENIED",
      "WORKFLOW_SOURCE_MAPPING_CONFLICT",
      "WORKFLOW_SOURCE_UNAVAILABLE",
      "WORKFLOW_VERSION_CONFLICT",
      "WORKFLOW_VERSION_INCOMPATIBLE",
    ],
    summary: "读取运行窗口、未决动作、安装与迁移分页",
  },
  "workflows.listEnterpriseWorkflows": {
    method: "POST",
    path: "/api/web/v1/orgs/:orgId/workflows/list_enterprise_workflows",
    auth: "session-write",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
      "WORKFLOW_ACTION_UNKNOWN",
      "WORKFLOW_ADMIN_REQUIRED",
      "WORKFLOW_BUSY",
      "WORKFLOW_CONFIGURATION_REQUIRED",
      "WORKFLOW_CONTROL_REVOKED",
      "WORKFLOW_INSTALLATION_MISMATCH",
      "WORKFLOW_PERMISSION_DENIED",
      "WORKFLOW_SOURCE_MAPPING_CONFLICT",
      "WORKFLOW_SOURCE_UNAVAILABLE",
      "WORKFLOW_VERSION_CONFLICT",
      "WORKFLOW_VERSION_INCOMPATIBLE",
    ],
    summary: "列出企业下的自动任务与配置缺口",
  },
  "workflows.manageWorkflowInstallation": {
    method: "POST",
    path: "/api/web/v1/orgs/:orgId/workflows/manage_workflow_installation",
    auth: "session-write",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
      "WORKFLOW_ACTION_UNKNOWN",
      "WORKFLOW_ADMIN_REQUIRED",
      "WORKFLOW_BUSY",
      "WORKFLOW_CONFIGURATION_REQUIRED",
      "WORKFLOW_CONTROL_REVOKED",
      "WORKFLOW_INSTALLATION_MISMATCH",
      "WORKFLOW_PERMISSION_DENIED",
      "WORKFLOW_SOURCE_MAPPING_CONFLICT",
      "WORKFLOW_SOURCE_UNAVAILABLE",
      "WORKFLOW_VERSION_CONFLICT",
      "WORKFLOW_VERSION_INCOMPATIBLE",
    ],
    summary: "登记主机、记录就绪检查、切换接管或迁移任务",
  },
  "workflows.manageWorkflowRun": {
    method: "POST",
    path: "/api/web/v1/orgs/:orgId/workflows/manage_workflow_run",
    auth: "session-write",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
      "WORKFLOW_ACTION_UNKNOWN",
      "WORKFLOW_ADMIN_REQUIRED",
      "WORKFLOW_BUSY",
      "WORKFLOW_CONFIGURATION_REQUIRED",
      "WORKFLOW_CONTROL_REVOKED",
      "WORKFLOW_INSTALLATION_MISMATCH",
      "WORKFLOW_PERMISSION_DENIED",
      "WORKFLOW_SOURCE_MAPPING_CONFLICT",
      "WORKFLOW_SOURCE_UNAVAILABLE",
      "WORKFLOW_VERSION_CONFLICT",
      "WORKFLOW_VERSION_INCOMPATIBLE",
    ],
    summary: "开始、续租、释放、结束一次运行或校验动作许可",
  },
  "workflows.prepareEnterpriseWorkflowChange": {
    method: "POST",
    path: "/api/web/v1/orgs/:orgId/workflows/prepare_enterprise_workflow_change",
    auth: "session-write",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
      "WORKFLOW_ACTION_UNKNOWN",
      "WORKFLOW_ADMIN_REQUIRED",
      "WORKFLOW_BUSY",
      "WORKFLOW_CONFIGURATION_REQUIRED",
      "WORKFLOW_CONTROL_REVOKED",
      "WORKFLOW_INSTALLATION_MISMATCH",
      "WORKFLOW_PERMISSION_DENIED",
      "WORKFLOW_SOURCE_MAPPING_CONFLICT",
      "WORKFLOW_SOURCE_UNAVAILABLE",
      "WORKFLOW_VERSION_CONFLICT",
      "WORKFLOW_VERSION_INCOMPATIBLE",
    ],
    summary: "准备一次配置、来源、授权或控制状态变更并返回确认摘要",
  },
  "workflows.recordWorkflowAction": {
    method: "POST",
    path: "/api/web/v1/orgs/:orgId/workflows/record_workflow_action",
    auth: "session-write",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
      "WORKFLOW_ACTION_UNKNOWN",
      "WORKFLOW_ADMIN_REQUIRED",
      "WORKFLOW_BUSY",
      "WORKFLOW_CONFIGURATION_REQUIRED",
      "WORKFLOW_CONTROL_REVOKED",
      "WORKFLOW_INSTALLATION_MISMATCH",
      "WORKFLOW_PERMISSION_DENIED",
      "WORKFLOW_SOURCE_MAPPING_CONFLICT",
      "WORKFLOW_SOURCE_UNAVAILABLE",
      "WORKFLOW_VERSION_CONFLICT",
      "WORKFLOW_VERSION_INCOMPATIBLE",
    ],
    summary: "读取动作库存、登记动作意图或登记可信回执",
  },
  "workflows.saveEnterpriseWorkflow": {
    method: "POST",
    path: "/api/web/v1/orgs/:orgId/workflows/save_enterprise_workflow",
    auth: "session-write",
    errors: [
      "AUTHORIZATION_ADMIN_REQUIRED",
      "BROWSER_ACCESS_DENIED",
      "BROWSER_SECURITY_CHECK_FAILED",
      "BROWSER_SIGN_IN_REQUIRED",
      "INTERNAL_ERROR",
      "WEB_API_INVALID_REQUEST",
      "WORKFLOW_ACTION_UNKNOWN",
      "WORKFLOW_ADMIN_REQUIRED",
      "WORKFLOW_BUSY",
      "WORKFLOW_CONFIGURATION_REQUIRED",
      "WORKFLOW_CONTROL_REVOKED",
      "WORKFLOW_INSTALLATION_MISMATCH",
      "WORKFLOW_PERMISSION_DENIED",
      "WORKFLOW_SOURCE_MAPPING_CONFLICT",
      "WORKFLOW_SOURCE_UNAVAILABLE",
      "WORKFLOW_VERSION_CONFLICT",
      "WORKFLOW_VERSION_INCOMPATIBLE",
    ],
    summary: "按预览摘要提交自动任务变更",
  },
} as const satisfies Record<string, WebApiRouteMeta>;

export type WebApiRouteId = keyof typeof webApiRoutes;
