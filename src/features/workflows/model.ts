import { WebApiError } from "@/api/client";
import type {
  WorkflowsGetEnterpriseWorkflowResponse,
  WorkflowsPrepareEnterpriseWorkflowChangeBody,
} from "@/api/generated/contract";

export const workflowTypes = [
  "meituan-daily-ingestion",
  "meituan-review-operations",
  "weekly-business-report",
] as const;

export type WorkflowType = (typeof workflowTypes)[number];

/** 列表项、单项读取与保存响应结构一致，统一用单项读取的类型收窄后再渲染。 */
export type WorkflowView = WorkflowsGetEnterpriseWorkflowResponse;
export type WorkflowConfiguration = NonNullable<WorkflowView["configuration"]>;
export type DailyIngestionConfiguration = Extract<
  WorkflowConfiguration,
  { type: "meituan-daily-ingestion" }
>;
export type ReviewOperationsConfiguration = Extract<
  WorkflowConfiguration,
  { type: "meituan-review-operations" }
>;
export type WeeklyReportConfiguration = Extract<
  WorkflowConfiguration,
  { type: "weekly-business-report" }
>;
export type IntegrationConfiguration =
  WorkflowView["integration"]["configuration"];
export type WorkflowChange =
  WorkflowsPrepareEnterpriseWorkflowChangeBody["change"];
export type WorkflowAuthorization = WorkflowView["authorizations"][number];
export type AuthorizationScope = WorkflowAuthorization["scope"];
export type AuthorizationAction = AuthorizationScope["kind"];
export type Dataset = DailyIngestionConfiguration["datasets"][number];
export type ReviewChannel = ReviewOperationsConfiguration["channels"][number];
export type MailConfiguration =
  ReviewOperationsConfiguration["draftNotification"];
export type EmailPurpose = Extract<
  AuthorizationScope,
  { kind: "email" }
>["purpose"];
export type WorkflowStore = {
  readonly name: string;
  readonly retired: boolean;
};
export type SourceIdentity =
  IntegrationConfiguration["storeMappings"][number]["source"];
export type SourceAccount = IntegrationConfiguration["sourceAccounts"][number];
export type SourceStoreMapping =
  IntegrationConfiguration["storeMappings"][number];
export type SourceExclusion = IntegrationConfiguration["exclusions"][number];
export type IgnoredReviewIdentity =
  ReviewOperationsConfiguration["ignoredReviewIdentities"][number];
export type ReportGroup = WeeklyReportConfiguration["groups"][number];

export interface DraftState {
  readonly configurations: Record<WorkflowType, WorkflowConfiguration>;
  readonly integration: IntegrationConfiguration;
}

export function configurationFor(
  views: Readonly<Partial<Record<WorkflowType, WorkflowView>>>,
  type: WorkflowType,
): WorkflowConfiguration {
  const saved = views[type]?.configuration;
  if (saved !== null && saved !== undefined) {
    // 服务端按 type 分支返回配置，这里再收窄一次，避免把别的分支当成当前任务类型
    if (saved.type === type) return saved;
  }
  return defaultConfiguration(type);
}

export function defaultConfiguration(
  type: WorkflowType,
): WorkflowConfiguration {
  const common = {
    schemaVersion: 1 as const,
    storeNames: [] as string[],
    notificationPolicy: "action_required" as const,
  };

  if (type === "meituan-daily-ingestion") {
    return {
      ...common,
      type,
      datasets: [],
      orderScope: "settled_only",
      cleanupPolicy: "confirmed_files_only",
    };
  }

  if (type === "meituan-review-operations") {
    return {
      ...common,
      type,
      executionPolicy: { id: "verified-review-operations", version: 1 },
      ignoredReviewIdentities: [],
      channels: [],
      publication: { enabled: false, storeNames: [] },
      brandFacts: "",
      tone: "",
      draftNotification: { enabled: false, recipients: [] },
      cleanupPolicy: "complete_run_only",
    };
  }

  return {
    ...common,
    type,
    groups: [],
    delivery: { enabled: false, recipients: [] },
    cleanupPolicy: "retain_final_report",
  };
}

export function defaultIntegrationConfiguration(): IntegrationConfiguration {
  return {
    schemaVersion: 1,
    timezone: "Asia/Shanghai",
    sourceAccounts: [],
    storeMappings: [],
    exclusions: [],
  };
}

export function defaultDraftState(
  views: Readonly<Partial<Record<WorkflowType, WorkflowView>>>,
  integration: IntegrationConfiguration,
): DraftState {
  return {
    configurations: {
      "meituan-daily-ingestion": configurationFor(
        views,
        "meituan-daily-ingestion",
      ),
      "meituan-review-operations": configurationFor(
        views,
        "meituan-review-operations",
      ),
      "weekly-business-report": configurationFor(
        views,
        "weekly-business-report",
      ),
    },
    integration,
  };
}

export function newSourceIdentity(reviews: boolean): SourceIdentity {
  return {
    product: reviews ? "meituan_reviews" : "meituan_erp",
    channel: reviews ? "meituan" : "erp",
    accountRef: "",
    sourceStoreName: "",
  };
}

export function expectedVersions(
  view: WorkflowView | undefined,
  integrationVersion: number,
): {
  readonly expectedVersion: number;
  readonly expectedIntegrationVersion: number;
  readonly expectedControlVersion: number;
} {
  return {
    expectedVersion: view?.version ?? 0,
    expectedIntegrationVersion: integrationVersion,
    expectedControlVersion: view?.controlVersion ?? 0,
  };
}

/** 复选清单只改当前可见选项，隐藏/退役但已选的值必须保留。 */
export function selectVisible(
  selected: readonly string[],
  visible: readonly string[],
  checked: readonly string[],
): string[] {
  return [
    ...new Set([
      ...selected.filter((name) => !visible.includes(name)),
      ...checked,
    ]),
  ];
}

export type ConfigurationErrorField =
  | "storeNames"
  | "datasets"
  | "channels"
  | "publication"
  | "groups"
  | "recipients"
  | "allowedSender";

export type ConfigurationErrors = Partial<
  Record<ConfigurationErrorField, string>
>;

export const configurationErrorFields: readonly ConfigurationErrorField[] = [
  "storeNames",
  "datasets",
  "channels",
  "publication",
  "groups",
  "recipients",
  "allowedSender",
];

// 与契约里的邮箱约束保持一致（比旧网页的更严格，只会更早拦下非法地址）
const EMAIL_PATTERN =
  /^(?:[A-Za-z0-9_'+.-]+\.)*[A-Za-z0-9_'+.-]*[A-Za-z0-9_+.-]@(?:[A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

/**
 * 与后端必填规则一一对应：门店、数据集、渠道、公开范围、分组与邮箱。
 * 返回的键是字段级错误，页面据此逐项提示并置灰保存按钮。
 */
export function validateConfiguration(
  configuration: WorkflowConfiguration,
): ConfigurationErrors {
  const errors: ConfigurationErrors = {};

  if (configuration.storeNames.length === 0) {
    errors.storeNames = "storesRequired";
  }

  if (configuration.type === "meituan-daily-ingestion") {
    if (configuration.datasets.length === 0) {
      errors.datasets = "datasetsRequired";
    }
  } else if (configuration.type === "meituan-review-operations") {
    if (configuration.channels.length === 0) {
      errors.channels = "channelsRequired";
    }
    const publication = configuration.publication;
    const outsideStores = publication.storeNames.some(
      (name) => !configuration.storeNames.includes(name),
    );
    if (
      (publication.enabled && publication.storeNames.length === 0) ||
      outsideStores
    ) {
      errors.publication = "publicationInvalid";
    }
    validateMail(configuration.draftNotification, errors);
  } else {
    const names = configuration.groups.map((group) => group.name.trim());
    const stores = configuration.groups.flatMap((group) => group.storeNames);
    if (
      names.some((name) => name === "") ||
      new Set(names).size !== names.length ||
      configuration.groups.some((group) => group.storeNames.length === 0) ||
      stores.some((name) => !configuration.storeNames.includes(name)) ||
      new Set(stores).size !== stores.length
    ) {
      errors.groups = "groupsInvalid";
    }
    validateMail(configuration.delivery, errors);
  }

  return errors;
}

function validateMail(
  mail: MailConfiguration,
  errors: ConfigurationErrors,
): void {
  const normalized = mail.recipients.map((value) => value.toLowerCase());
  const recipientsInvalid =
    mail.recipients.length > 20 ||
    new Set(normalized).size !== normalized.length ||
    mail.recipients.some((value) => !isValidEmail(value));
  if (recipientsInvalid || (mail.enabled && mail.recipients.length === 0)) {
    errors.recipients = "mailInvalid";
  }

  const sender = mail.allowedSender;
  if (sender !== undefined && sender !== "" && !isValidEmail(sender)) {
    errors.allowedSender = "mailInvalid";
  } else if (mail.enabled && (sender === undefined || sender === "")) {
    errors.allowedSender = "mailInvalid";
  }
}

export function firstConfigurationError(
  errors: ConfigurationErrors,
): string | null {
  for (const field of configurationErrorFields) {
    const message = errors[field];
    if (message !== undefined) return message;
  }
  return null;
}

export interface AuthorizationDraft {
  readonly kind: AuthorizationAction;
  readonly storeNames: readonly string[];
  readonly datasets: readonly Dataset[];
  readonly channels: readonly ReviewChannel[];
  readonly purpose: EmailPurpose;
  readonly recipients: readonly string[];
  readonly allowedSender: string;
  readonly deliveryVersion: number;
}

export interface AuthorizationDraftErrors {
  readonly scope?: string;
  readonly recipients?: string;
  readonly allowedSender?: string;
  readonly deliveryVersion?: string;
}

export function authorizationActions(
  type: WorkflowType,
): readonly AuthorizationAction[] {
  if (type === "meituan-daily-ingestion") return ["upload"];
  if (type === "meituan-review-operations") {
    return ["review_sync", "review_publish", "email"];
  }
  return ["download", "email"];
}

export function defaultAuthorizationDraft(
  type: WorkflowType,
): AuthorizationDraft {
  return {
    kind: authorizationActions(type)[0] ?? "upload",
    storeNames: [],
    datasets: [],
    channels: [],
    purpose:
      type === "meituan-review-operations" ? "review_drafts" : "weekly_report",
    recipients: [],
    allowedSender: "",
    deliveryVersion: 1,
  };
}

export function validateAuthorizationDraft(
  draft: AuthorizationDraft,
): AuthorizationDraftErrors {
  const errors: {
    scope?: string;
    recipients?: string;
    allowedSender?: string;
    deliveryVersion?: string;
  } = {};
  const mailAction = draft.kind === "email";

  if (draft.storeNames.length === 0) {
    errors.scope = "scopeIncomplete";
  } else if (
    (draft.kind === "upload" || draft.kind === "download") &&
    draft.datasets.length === 0
  ) {
    errors.scope = "scopeIncomplete";
  } else if (
    (draft.kind === "review_sync" || draft.kind === "review_publish") &&
    draft.channels.length === 0
  ) {
    errors.scope = "scopeIncomplete";
  }

  if (mailAction) {
    const normalized = draft.recipients.map((value) => value.toLowerCase());
    if (
      draft.recipients.length === 0 ||
      draft.recipients.length > 20 ||
      new Set(normalized).size !== normalized.length ||
      draft.recipients.some((value) => !isValidEmail(value))
    ) {
      errors.recipients = "mailInvalid";
    }
    if (!isValidEmail(draft.allowedSender)) {
      errors.allowedSender = "mailInvalid";
    }
    // 契约里 deliveryVersion 是 uint32，0 也是合法值
    if (!Number.isInteger(draft.deliveryVersion) || draft.deliveryVersion < 0) {
      errors.deliveryVersion = "deliveryVersionInvalid";
    }
  }

  return errors;
}

export function hasAuthorizationErrors(
  errors: AuthorizationDraftErrors,
): boolean {
  return (
    errors.scope !== undefined ||
    errors.recipients !== undefined ||
    errors.allowedSender !== undefined ||
    errors.deliveryVersion !== undefined
  );
}

export function buildAuthorizationScope(
  draft: AuthorizationDraft,
): AuthorizationScope | null {
  if (hasAuthorizationErrors(validateAuthorizationDraft(draft))) return null;

  if (draft.kind === "upload") {
    return {
      kind: "upload",
      storeNames: [...draft.storeNames],
      datasets: [...draft.datasets],
    };
  }
  if (draft.kind === "download") {
    const datasets = draft.datasets.filter(
      (dataset): dataset is Exclude<Dataset, "delivery_ledger"> =>
        dataset !== "delivery_ledger",
    );
    if (datasets.length === 0) return null;
    return { kind: "download", storeNames: [...draft.storeNames], datasets };
  }
  if (draft.kind === "review_sync") {
    return {
      kind: "review_sync",
      storeNames: [...draft.storeNames],
      channels: [...draft.channels],
    };
  }
  if (draft.kind === "review_publish") {
    return {
      kind: "review_publish",
      storeNames: [...draft.storeNames],
      channels: [...draft.channels],
    };
  }
  return {
    kind: "email",
    purpose: draft.purpose,
    storeNames: [...draft.storeNames],
    recipients: [...draft.recipients],
    allowedSender: draft.allowedSender,
    deliveryVersion: draft.deliveryVersion,
  };
}

export function isActiveAuthorization(
  authorization: WorkflowAuthorization,
): boolean {
  return authorization.revokedAt === null;
}

export function isVersionConflict(error: unknown): boolean {
  return (
    error instanceof WebApiError &&
    (error.status === 409 || error.code === "WORKFLOW_VERSION_CONFLICT")
  );
}

/** 摘要不重复渲染内部哈希、版本与身份字段，与旧网页的跳过清单一致。 */
export const summarySkippedKeys: ReadonlySet<string> = new Set([
  "schemaVersion",
  "type",
  "executionPolicy",
  "cleanupPolicy",
  "notificationPolicy",
  "authorizationId",
  "grantedBy",
  "configurationVersion",
  "controlVersion",
  "sourceHash",
  "metadataHash",
  "manifestHash",
  "artifactHash",
  "identityHash",
  "correlationMarker",
]);
