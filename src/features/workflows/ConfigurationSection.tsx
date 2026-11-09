import { ActionButton } from "@/ui/ActionButton";
import { PageSection } from "@/ui/PageSection";
import {
  CheckboxField,
  Checklist,
  EditableList,
  MailFields,
  SourceFields,
  StoreChecklist,
  TextField,
} from "@/features/workflows/Fields";
import type {
  ConfigurationErrors,
  DailyIngestionConfiguration,
  ReviewOperationsConfiguration,
  SourceAccount,
  WeeklyReportConfiguration,
  WorkflowConfiguration,
  WorkflowStore,
} from "@/features/workflows/model";
import {
  firstConfigurationError,
  newSourceIdentity,
} from "@/features/workflows/model";
import { useWorkflowText } from "@/features/workflows/text";

import styles from "@/features/workflows/Page.module.css";

const DATASETS = [
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
] as const;

const CHANNELS = ["meituan", "dianping"] as const;

export interface ConfigurationSectionProps {
  readonly configuration: WorkflowConfiguration;
  readonly accounts: readonly SourceAccount[];
  readonly stores: readonly WorkflowStore[];
  readonly errors: ConfigurationErrors;
  readonly disabled: boolean;
  readonly dirty: boolean;
  readonly busy: boolean;
  readonly onRequest: () => void;
  readonly onChange: (next: WorkflowConfiguration) => void;
}

export function ConfigurationSection({
  configuration,
  accounts,
  stores,
  errors,
  disabled,
  dirty,
  busy,
  onRequest,
  onChange,
}: ConfigurationSectionProps) {
  const { w } = useWorkflowText();
  const firstError = firstConfigurationError(errors);
  const blocked = disabled || !dirty || firstError !== null;

  return (
    <PageSection title={w("configuration")}>
      {stores.length === 0 ? (
        <p className={styles.hint}>{w("noStores")}</p>
      ) : null}

      <StoreChecklist
        legend={w("stores")}
        stores={stores}
        selected={configuration.storeNames}
        error={
          errors.storeNames === undefined ? undefined : w(errors.storeNames)
        }
        disabled={disabled}
        onChange={(storeNames) => onChange({ ...configuration, storeNames })}
      />

      {configuration.type === "meituan-daily-ingestion" ? (
        <DailyFields
          configuration={configuration}
          errors={errors}
          disabled={disabled}
          onChange={onChange}
        />
      ) : configuration.type === "meituan-review-operations" ? (
        <ReviewFields
          configuration={configuration}
          accounts={accounts}
          stores={stores}
          errors={errors}
          disabled={disabled}
          onChange={onChange}
        />
      ) : (
        <WeeklyFields
          configuration={configuration}
          stores={stores}
          errors={errors}
          disabled={disabled}
          onChange={onChange}
        />
      )}

      <div className={styles.actionsRow}>
        <ActionButton
          label={w("saveConfiguration")}
          busy={busy}
          disabled={blocked}
          {...(firstError === null ? {} : { disabledReason: w(firstError) })}
          onRun={onRequest}
        />
      </div>
    </PageSection>
  );
}

interface DailyFieldsProps {
  readonly configuration: DailyIngestionConfiguration;
  readonly errors: ConfigurationErrors;
  readonly disabled: boolean;
  readonly onChange: (next: WorkflowConfiguration) => void;
}

function DailyFields({
  configuration,
  errors,
  disabled,
  onChange,
}: DailyFieldsProps) {
  const { w } = useWorkflowText();

  return (
    <div className={styles.stack}>
      <Checklist
        legend={w("datasets")}
        options={DATASETS.map((dataset) => ({
          value: dataset,
          label: w(dataset),
        }))}
        selected={configuration.datasets}
        error={errors.datasets === undefined ? undefined : w(errors.datasets)}
        disabled={disabled}
        onChange={(datasets) =>
          onChange({
            ...configuration,
            datasets: datasets.filter(
              (dataset): dataset is (typeof DATASETS)[number] =>
                DATASETS.some((candidate) => candidate === dataset),
            ),
          })
        }
      />
      <p className={styles.hint}>{w("orderScope")}</p>
      <p className={styles.hint}>{w("cleanupIngestion")}</p>
    </div>
  );
}

interface ReviewFieldsProps {
  readonly configuration: ReviewOperationsConfiguration;
  readonly accounts: readonly SourceAccount[];
  readonly stores: readonly WorkflowStore[];
  readonly errors: ConfigurationErrors;
  readonly disabled: boolean;
  readonly onChange: (next: WorkflowConfiguration) => void;
}

function ReviewFields({
  configuration,
  accounts,
  stores,
  errors,
  disabled,
  onChange,
}: ReviewFieldsProps) {
  const { w } = useWorkflowText();

  return (
    <div className={styles.stack}>
      <Checklist
        legend={w("channels")}
        options={CHANNELS.map((channel) => ({
          value: channel,
          label: w(channel),
        }))}
        selected={configuration.channels}
        error={errors.channels === undefined ? undefined : w(errors.channels)}
        disabled={disabled}
        onChange={(channels) =>
          onChange({
            ...configuration,
            channels: channels.filter(
              (channel): channel is (typeof CHANNELS)[number] =>
                CHANNELS.some((candidate) => candidate === channel),
            ),
          })
        }
      />

      <CheckboxField
        label={w("publicationEnabled")}
        checked={configuration.publication.enabled}
        disabled={disabled}
        onChange={(enabled) =>
          onChange({
            ...configuration,
            publication: { ...configuration.publication, enabled },
          })
        }
      />
      <StoreChecklist
        legend={w("publicationStores")}
        stores={stores}
        selected={configuration.publication.storeNames}
        error={
          errors.publication === undefined ? undefined : w(errors.publication)
        }
        disabled={disabled}
        onChange={(storeNames) =>
          onChange({
            ...configuration,
            publication: { ...configuration.publication, storeNames },
          })
        }
      />

      <TextField
        label={w("brandFacts")}
        value={configuration.brandFacts}
        multiline
        rows={4}
        maxLength={20000}
        disabled={disabled}
        onChange={(brandFacts) => onChange({ ...configuration, brandFacts })}
      />
      <TextField
        label={w("tone")}
        value={configuration.tone}
        multiline
        rows={2}
        maxLength={2000}
        disabled={disabled}
        onChange={(tone) => onChange({ ...configuration, tone })}
      />
      <p className={styles.hint}>{w("textHelp")}</p>
      <p className={styles.hint}>{w("policy")}</p>
      <p className={styles.hint}>{w("ignoredHelp")}</p>

      <EditableList
        title={w("ignoredReviewIdentities")}
        items={configuration.ignoredReviewIdentities}
        maximum={2000}
        disabled={disabled}
        create={() => ({
          source: newSourceIdentity(true),
          feedbackId: "",
          reason: "",
          purpose: "exclude_source_record" as const,
        })}
        onChange={(ignoredReviewIdentities) =>
          onChange({ ...configuration, ignoredReviewIdentities })
        }
        renderItem={(identity, replace) => (
          <div className={styles.stack}>
            <SourceFields
              source={identity.source}
              accounts={accounts}
              reviewsOnly
              disabled={disabled}
              onChange={(source) => replace({ ...identity, source })}
            />
            <TextField
              label={w("feedbackId")}
              value={identity.feedbackId}
              maxLength={255}
              disabled={disabled}
              onChange={(feedbackId) => replace({ ...identity, feedbackId })}
            />
            <TextField
              label={w("reason")}
              value={identity.reason}
              multiline
              rows={2}
              maxLength={2000}
              disabled={disabled}
              onChange={(reason) => replace({ ...identity, reason })}
            />
          </div>
        )}
      />

      <MailFields
        title={w("draftNotification")}
        mail={configuration.draftNotification}
        errors={{
          recipients:
            errors.recipients === undefined ? undefined : w(errors.recipients),
          allowedSender:
            errors.allowedSender === undefined
              ? undefined
              : w(errors.allowedSender),
        }}
        disabled={disabled}
        onChange={(draftNotification) =>
          onChange({ ...configuration, draftNotification })
        }
      />
    </div>
  );
}

interface WeeklyFieldsProps {
  readonly configuration: WeeklyReportConfiguration;
  readonly stores: readonly WorkflowStore[];
  readonly errors: ConfigurationErrors;
  readonly disabled: boolean;
  readonly onChange: (next: WorkflowConfiguration) => void;
}

function WeeklyFields({
  configuration,
  stores,
  errors,
  disabled,
  onChange,
}: WeeklyFieldsProps) {
  const { w } = useWorkflowText();

  return (
    <div className={styles.stack}>
      <p className={styles.hint}>{w("ungrouped")}</p>

      {errors.groups === undefined ? null : (
        <p className={styles.fieldError} role="alert">
          {w(errors.groups)}
        </p>
      )}

      <EditableList
        title={w("groups")}
        items={configuration.groups}
        maximum={100}
        disabled={disabled}
        create={() => ({ name: "", storeNames: [] })}
        onChange={(groups) => onChange({ ...configuration, groups })}
        renderItem={(group, replace) => (
          <div className={styles.stack}>
            <TextField
              label={w("groupName")}
              value={group.name}
              maxLength={255}
              disabled={disabled}
              onChange={(name) => replace({ ...group, name })}
            />
            <StoreChecklist
              legend={w("stores")}
              stores={stores}
              selected={group.storeNames}
              disabled={disabled}
              onChange={(storeNames) => replace({ ...group, storeNames })}
            />
          </div>
        )}
      />

      <MailFields
        title={w("delivery")}
        mail={configuration.delivery}
        errors={{
          recipients:
            errors.recipients === undefined ? undefined : w(errors.recipients),
          allowedSender:
            errors.allowedSender === undefined
              ? undefined
              : w(errors.allowedSender),
        }}
        disabled={disabled}
        onChange={(delivery) => onChange({ ...configuration, delivery })}
      />
      <p className={styles.hint}>{w("localReport")}</p>
    </div>
  );
}
