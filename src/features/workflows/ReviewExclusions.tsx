import type { WorkflowBundle } from "@/features/workflows/api";
import { SourceFields, TextField } from "@/features/workflows/Fields";
import {
  firstConfigurationError,
  newSourceIdentity,
  validateConfiguration,
} from "@/features/workflows/model";
import type {
  IgnoredReviewIdentity,
  ReviewOperationsConfiguration,
  SourceAccount,
} from "@/features/workflows/model";
import {
  listWorkflowEdit,
  WorkflowEditError,
  type RecordOperation,
  type SubmitWorkflowEdit,
} from "@/features/workflows/recordEdits";
import { sourceIdentityKey } from "@/features/workflows/sourceRecordEdits";
import { useWorkflowText } from "@/features/workflows/text";
import {
  RecordDetails,
  WorkflowRecordList,
} from "@/features/workflows/WorkflowRecordList";

import styles from "@/features/workflows/Page.module.css";

const REVIEW_TASK = "meituan-review-operations";
const REVIEW_PRODUCT = "meituan_reviews";
const MAX_IGNORED_REVIEWS = 2000;

function configurationIn(bundle: WorkflowBundle) {
  const configuration = bundle.views[REVIEW_TASK]?.configuration;
  return configuration?.type === REVIEW_TASK ? configuration : null;
}

function hasValidSetup(configuration: ReviewOperationsConfiguration | null) {
  return (
    configuration !== null &&
    firstConfigurationError(validateConfiguration(configuration)) === null
  );
}

function reviewIdentity({ source, feedbackId }: IgnoredReviewIdentity) {
  return JSON.stringify([sourceIdentityKey(source), feedbackId]);
}

function reviewAccounts(accounts: readonly SourceAccount[]) {
  return accounts.filter((account) => account.product === REVIEW_PRODUCT);
}

function validateReview(
  value: IgnoredReviewIdentity,
  original: IgnoredReviewIdentity | undefined,
  accounts: readonly SourceAccount[],
) {
  const { source, feedbackId, reason } = value;
  const names = [source.accountRef, source.sourceStoreName, feedbackId];
  if (source.sourceStoreId !== undefined) names.push(source.sourceStoreId);
  if (
    source.product !== REVIEW_PRODUCT ||
    source.channel === "erp" ||
    names.some((name) => name.trim() === "" || name.length > 255) ||
    reason.trim() === "" ||
    reason.length > 2000
  ) {
    return "reviewExclusionInvalid";
  }

  if (
    !accounts.some((account) => account.accountRef === source.accountRef) &&
    (original === undefined ||
      reviewIdentity(original) !== reviewIdentity(value) ||
      original.source.sourceStoreName !== source.sourceStoreName)
  ) {
    return "reviewExclusionAccountRequired";
  }

  return undefined;
}

function reviewEdit(operation: RecordOperation<IgnoredReviewIdentity>) {
  return listWorkflowEdit({
    operation,
    keyFor: reviewIdentity,
    itemsFor: (bundle) =>
      configurationIn(bundle)?.ignoredReviewIdentities ?? [],
    changeFor: (bundle, ignoredReviewIdentities) => {
      const configuration = configurationIn(bundle);
      if (configuration === null || !hasValidSetup(configuration)) {
        throw new WorkflowEditError("recordSaveTaskFirst");
      }

      if (operation.kind !== "remove") {
        if (ignoredReviewIdentities.length > MAX_IGNORED_REVIEWS) {
          throw new WorkflowEditError("recordLimit");
        }
        const error = validateReview(
          operation.value,
          operation.kind === "edit" ? operation.original : undefined,
          reviewAccounts(
            bundle.integration?.configuration.sourceAccounts ?? [],
          ),
        );
        if (error !== undefined) throw new WorkflowEditError(error);
      }

      return {
        kind: "configuration",
        configuration: { ...configuration, ignoredReviewIdentities },
      };
    },
  });
}

export function ReviewExclusions({
  configuration,
  accounts,
  disabled,
  submitEdit,
}: {
  readonly configuration: ReviewOperationsConfiguration | null;
  readonly accounts: readonly SourceAccount[];
  readonly disabled: boolean;
  readonly submitEdit: SubmitWorkflowEdit;
}) {
  const { w } = useWorkflowText();
  const items = configuration?.ignoredReviewIdentities ?? [];
  const eligibleAccounts = reviewAccounts(accounts);
  const accountOptions = eligibleAccounts.map((account) => ({
    ...account,
    displayName: accountLabel(account),
  }));
  const addBlockedReason = !hasValidSetup(configuration)
    ? "recordSaveTaskFirst"
    : items.length >= MAX_IGNORED_REVIEWS
      ? "recordLimit"
      : eligibleAccounts.length === 0
        ? "reviewExclusionAccountRequired"
        : undefined;

  return (
    <div className={styles.stack}>
      <WorkflowRecordList<IgnoredReviewIdentity>
        title={w("ignoredReviewIdentities")}
        items={items}
        keyFor={reviewIdentity}
        labelFor={({ source, feedbackId }) =>
          `${w(source.channel)} · ${source.accountRef} · ${source.sourceStoreName} · ${source.sourceStoreId ?? "—"} · ${feedbackId}`
        }
        details={({ source, feedbackId, reason, purpose }) => {
          const account = eligibleAccounts.find(
            (item) => item.accountRef === source.accountRef,
          );
          return (
            <RecordDetails
              fields={[
                { label: w("product"), value: w(source.product) },
                { label: w("channel"), value: w(source.channel) },
                {
                  label: w("sourceAccounts"),
                  value:
                    account === undefined
                      ? source.accountRef
                      : accountLabel(account),
                },
                { label: w("sourceStoreName"), value: source.sourceStoreName },
                { label: w("sourceStoreId"), value: source.sourceStoreId },
                { label: w("feedbackId"), value: feedbackId },
                { label: w("reason"), value: reason },
                { label: w("purpose"), value: w(purpose) },
              ]}
            />
          );
        }}
        create={() => ({
          source: {
            ...newSourceIdentity(REVIEW_PRODUCT),
            channel: configuration?.channels[0] ?? "meituan",
          },
          feedbackId: "",
          reason: "",
          purpose: "exclude_source_record",
        })}
        fields={(item, onChange) => (
          <>
            <SourceFields
              source={item.source}
              accounts={accountOptions}
              onChange={(source) => onChange({ ...item, source })}
            />
            <TextField
              label={w("feedbackId")}
              value={item.feedbackId}
              required
              maxLength={255}
              onChange={(feedbackId) => onChange({ ...item, feedbackId })}
            />
            <TextField
              label={w("reason")}
              value={item.reason}
              required
              multiline
              rows={2}
              maxLength={2000}
              onChange={(reason) => onChange({ ...item, reason })}
            />
          </>
        )}
        validate={(item, original) => {
          const error = validateReview(item, original, eligibleAccounts);
          if (error !== undefined) return w(error);
          const key = reviewIdentity(item);
          const originalKey =
            original === undefined ? undefined : reviewIdentity(original);
          if (
            key !== originalKey &&
            items.some((current) => reviewIdentity(current) === key)
          ) {
            return w("recordDuplicate");
          }
          return undefined;
        }}
        editFor={reviewEdit}
        submitEdit={submitEdit}
        addBlockedReason={
          addBlockedReason === undefined ? undefined : w(addBlockedReason)
        }
        disabled={disabled}
      />
      <p className={styles.hint}>{w("ignoredHelp")}</p>
    </div>
  );
}

function accountLabel(account: SourceAccount) {
  return account.displayName === account.accountRef
    ? account.accountRef
    : `${account.displayName} · ${account.accountRef}`;
}
