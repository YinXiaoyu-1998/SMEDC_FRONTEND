import type { WorkflowBundle } from "@/features/workflows/api";
import {
  defaultIntegrationConfiguration,
  type IntegrationConfiguration,
  type SourceAccount,
  type SourceExclusion,
  type SourceIdentity,
  type SourceSettings,
  type SourceStoreMapping,
} from "@/features/workflows/model";
import {
  listWorkflowEdit,
  WorkflowEditError,
  type RecordOperation,
  type WorkflowEdit,
} from "@/features/workflows/recordEdits";

// These limits apply to the whole integration across both source products.
const maximumAccounts = 100;
const maximumIdentities = 2_000;
const maximumBytes = 1_048_576;

export function savedIntegration(bundle: WorkflowBundle) {
  return bundle.integration?.configuration ?? defaultIntegrationConfiguration();
}

export function sourceAddLimitReached(
  configuration: IntegrationConfiguration,
  field: keyof SourceSettings,
): boolean {
  return field === "sourceAccounts"
    ? configuration.sourceAccounts.length >= maximumAccounts
    : configuration.storeMappings.length + configuration.exclusions.length >=
        maximumIdentities;
}

export function sourceAccountKey(
  account: Pick<SourceAccount, "product" | "accountRef">,
) {
  return JSON.stringify([account.product, account.accountRef]);
}

// Mirrors workflowSourceIdentityKey in the server domain.
export function sourceIdentityKey(source: SourceIdentity): string {
  return JSON.stringify([
    source.product,
    source.channel,
    source.accountRef,
    source.sourceStoreId === undefined
      ? ["name", source.sourceStoreName]
      : ["id", source.sourceStoreId],
  ]);
}

type SourceStoreRecord = SourceStoreMapping | SourceExclusion;

export function sourceStoreRecordKey(item: SourceStoreRecord): string {
  return sourceIdentityKey(item.source);
}

function listIntegrationEdit<K extends keyof SourceSettings>({
  field,
  operation,
  keyFor,
  validate,
}: {
  readonly field: K;
  readonly operation: RecordOperation<SourceSettings[K][number]>;
  readonly keyFor: (item: SourceSettings[K][number]) => string;
  readonly validate: (
    bundle: WorkflowBundle,
    configuration: IntegrationConfiguration,
  ) => void;
}): WorkflowEdit {
  return listWorkflowEdit({
    operation,
    keyFor,
    itemsFor: (bundle) => savedIntegration(bundle)[field],
    changeFor: (bundle, items) => {
      const configuration = savedIntegration(bundle);
      validate(bundle, configuration);
      const next = { ...configuration, [field]: items };
      if (
        (operation.kind === "add" &&
          sourceAddLimitReached(configuration, field)) ||
        new TextEncoder().encode(JSON.stringify(next)).byteLength > maximumBytes
      ) {
        throw new WorkflowEditError("sourceLimitsReached");
      }
      return { kind: "integration", configuration: next };
    },
  });
}

export type SourceAccountReference = {
  readonly list: "storeMappings" | "exclusions" | "ignoredReviewIdentities";
  readonly source: SourceIdentity;
  readonly recordLabel?: string;
};

export function sourceAccountReferences(
  bundle: WorkflowBundle,
  account: SourceAccount,
): SourceAccountReference[] {
  const { storeMappings, exclusions } = savedIntegration(bundle);
  const review = bundle.views["meituan-review-operations"]?.configuration;
  const ignored =
    review?.type === "meituan-review-operations"
      ? review.ignoredReviewIdentities
      : [];
  const key = sourceAccountKey(account);
  const matches = ({ source }: { readonly source: SourceIdentity }) =>
    sourceAccountKey(source) === key;

  return [
    ...storeMappings.filter(matches).map<SourceAccountReference>((mapping) => ({
      list: "storeMappings",
      source: mapping.source,
      recordLabel: mapping.storeName,
    })),
    ...exclusions.filter(matches).map<SourceAccountReference>((exclusion) => ({
      list: "exclusions",
      source: exclusion.source,
    })),
    ...ignored.filter(matches).map<SourceAccountReference>((record) => ({
      list: "ignoredReviewIdentities",
      source: record.source,
      recordLabel: record.feedbackId,
    })),
  ];
}

export function sourceAccountEdit(
  operation: RecordOperation<SourceAccount>,
  describeReferences: (references: readonly SourceAccountReference[]) => string,
): WorkflowEdit {
  return listIntegrationEdit({
    field: "sourceAccounts",
    operation,
    keyFor: sourceAccountKey,
    validate: (bundle) => {
      if (
        operation.kind === "add" ||
        (operation.kind === "edit" &&
          sourceAccountKey(operation.original) ===
            sourceAccountKey(operation.value))
      )
        return;

      const references = sourceAccountReferences(bundle, operation.original);
      if (references.length > 0) {
        throw new WorkflowEditError(
          "sourceAccountInUse",
          describeReferences(references),
        );
      }
    },
  });
}

export function sourceStoreEdit<K extends "storeMappings" | "exclusions">(
  field: K,
  operation: RecordOperation<SourceSettings[K][number]>,
): WorkflowEdit {
  return listIntegrationEdit({
    field,
    operation,
    keyFor: sourceStoreRecordKey,
    validate: (_bundle, configuration) => {
      if (operation.kind === "remove") return;

      const { source } = operation.value;
      const account = sourceAccountKey(source);
      if (
        !configuration.sourceAccounts.some(
          (item) => sourceAccountKey(item) === account,
        )
      ) {
        throw new WorkflowEditError("sourceAccountUnavailable");
      }

      const other = field === "storeMappings" ? "exclusions" : "storeMappings";
      const identity = sourceIdentityKey(source);
      if (
        configuration[other].some(
          (item) => sourceStoreRecordKey(item) === identity,
        )
      ) {
        throw new WorkflowEditError("recordDuplicate");
      }
    },
  });
}
