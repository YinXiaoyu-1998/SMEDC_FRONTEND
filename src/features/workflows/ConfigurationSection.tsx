import { useId, useState } from "react";
import type { ReactNode } from "react";

import { ActionButton } from "@/ui/ActionButton";
import { PageSection } from "@/ui/PageSection";
import { stableSerialize } from "@/ui/stableSerialize";
import {
  CheckboxField,
  Checklist,
  MailFields,
  StoreChecklist,
  TextField,
} from "@/features/workflows/Fields";
import {
  configurationFor,
  firstConfigurationError,
  validateConfiguration,
  type DailyIngestionConfiguration,
  type MailConfiguration,
  type ReviewOperationsConfiguration,
  type SourceAccount,
  type WeeklyReportConfiguration,
  type WorkflowConfiguration,
  type WorkflowStore,
} from "@/features/workflows/model";
import { ReportGroups } from "@/features/workflows/ReportGroups";
import { ReviewExclusions } from "@/features/workflows/ReviewExclusions";
import { WorkflowEditDialog } from "@/features/workflows/WorkflowEditDialog";
import { RecordDetails } from "@/features/workflows/WorkflowRecordList";
import {
  WorkflowEditError,
  type SubmitWorkflowEdit,
} from "@/features/workflows/recordEdits";
import { useWorkflowText } from "@/features/workflows/text";

import styles from "@/features/workflows/Page.module.css";
import records from "@/features/workflows/WorkflowRecords.module.css";

const DATASETS = [
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "combo_sales",
  "delivery_ledger",
] as const;
const CHANNELS = ["meituan", "dianping"] as const;

export interface ConfigurationSectionProps {
  readonly configuration: WorkflowConfiguration;
  readonly configured: boolean;
  readonly accounts: readonly SourceAccount[];
  readonly stores: readonly WorkflowStore[];
  readonly disabled: boolean;
  readonly submitEdit: SubmitWorkflowEdit;
}

function configurationError(
  configuration: WorkflowConfiguration,
): WorkflowEditError | null {
  const errors = validateConfiguration(configuration);
  if (
    configuration.type === "weekly-business-report" &&
    errors.groups !== undefined
  ) {
    const affected = configuration.groups
      .filter((group) =>
        group.storeNames.some(
          (name) => !configuration.storeNames.includes(name),
        ),
      )
      .map((group) => group.name);
    if (affected.length > 0)
      return new WorkflowEditError("scopeGroupsInUse", affected.join("、"));
  }
  if (
    configuration.type === "meituan-review-operations" &&
    errors.publication !== undefined
  ) {
    const affected = configuration.publication.storeNames.filter(
      (name) => !configuration.storeNames.includes(name),
    );
    if (affected.length > 0)
      return new WorkflowEditError(
        "scopePublicationInUse",
        affected.join("、"),
      );
  }
  const error = firstConfigurationError(errors);
  return error === null ? null : new WorkflowEditError(error);
}

function SettingsCard<C extends WorkflowConfiguration, T>({
  title,
  configuration,
  disabled,
  blockedReason,
  submitEdit,
  read,
  update,
  detail,
  fields,
}: {
  readonly title: string;
  readonly configuration: C;
  readonly disabled: boolean;
  readonly blockedReason?: string | undefined;
  readonly submitEdit: SubmitWorkflowEdit;
  readonly read: (configuration: C) => T;
  readonly update: (configuration: C, value: T) => C;
  readonly detail: (value: T) => ReactNode;
  readonly fields: (value: T, onChange: (value: T) => void) => ReactNode;
}) {
  const { w } = useWorkflowText();
  const titleId = useId();
  const [draft, setDraft] = useState<{
    before: T;
    value: T;
    trigger: HTMLElement;
  } | null>(null);
  const current = read(configuration);
  const invalid =
    draft === null
      ? null
      : configurationError(update(configuration, draft.value));
  return (
    <section className={styles.subpanel} aria-labelledby={titleId}>
      <div className={records.heading}>
        <h3 id={titleId}>{title}</h3>
        <ActionButton
          label={w("recordEdit")}
          aria-label={`${w("recordEdit")} ${title}`}
          variant="secondary"
          disabled={disabled || blockedReason !== undefined}
          onRun={() => {
            const trigger = document.activeElement;
            if (trigger instanceof HTMLElement)
              setDraft({ before: current, value: current, trigger });
          }}
        />
      </div>
      {detail(current)}
      {blockedReason === undefined ? null : (
        <p className={styles.hint}>{blockedReason}</p>
      )}
      {draft === null ? null : (
        <WorkflowEditDialog
          title={`${w("recordEdit")} · ${title}`}
          actionLabel={w("recordSave")}
          disabled={
            invalid !== null ||
            stableSerialize(draft.value) === stableSerialize(draft.before)
          }
          onClose={() => setDraft(null)}
          trigger={draft.trigger}
          onSubmit={() =>
            submitEdit({
              before: draft.before,
              after: draft.value,
              current: (bundle) =>
                read(configurationFor(bundle.views, configuration.type) as C),
              change: (bundle) => {
                const latest = configurationFor(
                  bundle.views,
                  configuration.type,
                ) as C;
                const next = update(latest, draft.value);
                const error = configurationError(next);
                if (error !== null) throw error;
                return { kind: "configuration", configuration: next };
              },
            })
          }
        >
          {fields(draft.value, (value) => setDraft({ ...draft, value }))}
          {invalid === null ? null : (
            <p className={styles.hint}>
              {w(invalid.message)} {invalid.details}
            </p>
          )}
        </WorkflowEditDialog>
      )}
    </section>
  );
}

function AddableScope<C extends WorkflowConfiguration, Option extends string>({
  title,
  configuration,
  stores,
  disabled,
  submitEdit,
  options,
  optionLabel,
  readOptions,
  update,
}: {
  readonly title: string;
  readonly configuration: C;
  readonly stores: readonly WorkflowStore[];
  readonly disabled: boolean;
  readonly submitEdit: SubmitWorkflowEdit;
  readonly options: readonly Option[];
  readonly optionLabel?: string;
  readonly readOptions: (configuration: C) => Option[];
  readonly update: (configuration: C, stores: string[], options: Option[]) => C;
}) {
  const { w } = useWorkflowText();
  return (
    <SettingsCard
      title={title}
      configuration={configuration}
      disabled={disabled}
      submitEdit={submitEdit}
      read={(config) => ({
        storeNames: config.storeNames,
        options: readOptions(config),
      })}
      update={(config, scope) =>
        update(config, scope.storeNames, scope.options)
      }
      detail={(scope) => (
        <RecordDetails
          fields={[
            { label: w("stores"), value: scope.storeNames.join("\n") },
            ...(optionLabel === undefined
              ? []
              : [
                  {
                    label: optionLabel,
                    value: scope.options.map(w).join("\n"),
                  },
                ]),
          ]}
        />
      )}
      fields={(scope, onChange) => (
        <>
          <StoreChecklist
            legend={w("stores")}
            stores={stores}
            selected={scope.storeNames}
            onChange={(storeNames) => onChange({ ...scope, storeNames })}
          />
          {optionLabel === undefined ? null : (
            <Checklist
              legend={optionLabel}
              selected={scope.options}
              options={options.map((value) => ({ value, label: w(value) }))}
              onChange={(selected) =>
                onChange({
                  ...scope,
                  options: options.filter((option) =>
                    selected.includes(option),
                  ),
                })
              }
            />
          )}
        </>
      )}
    />
  );
}

function MailSettings<
  C extends ReviewOperationsConfiguration | WeeklyReportConfiguration,
>({
  title,
  configuration,
  disabled,
  blockedReason,
  submitEdit,
  read,
  update,
}: {
  readonly title: string;
  readonly configuration: C;
  readonly disabled: boolean;
  readonly blockedReason: string | undefined;
  readonly submitEdit: SubmitWorkflowEdit;
  readonly read: (configuration: C) => MailConfiguration;
  readonly update: (configuration: C, value: MailConfiguration) => C;
}) {
  const { w } = useWorkflowText();
  return (
    <SettingsCard
      title={title}
      configuration={configuration}
      disabled={disabled}
      blockedReason={blockedReason}
      submitEdit={submitEdit}
      read={read}
      update={update}
      detail={(mail) => (
        <RecordDetails
          fields={[
            {
              label: w("mailEnabled"),
              value: w(mail.enabled ? "enabled" : "settingDisabled"),
            },
            { label: w("allowedSender"), value: mail.allowedSender },
            { label: w("recipients"), value: mail.recipients.join("\n") },
          ]}
        />
      )}
      fields={(mail, onChange) => (
        <MailFields mail={mail} onChange={onChange} errors={{}} />
      )}
    />
  );
}

export function ConfigurationSection({
  configuration,
  configured,
  accounts,
  stores,
  disabled,
  submitEdit,
}: ConfigurationSectionProps) {
  const { w } = useWorkflowText();
  const blockedReason = configured ? undefined : w("recordSaveTaskFirst");

  return (
    <PageSection title={w("configuration")}>
      {stores.length === 0 ? (
        <p className={styles.hint}>{w("noStores")}</p>
      ) : null}
      {configuration.type === "meituan-daily-ingestion" ? (
        <>
          <AddableScope
            title={w("dailySettingsScope")}
            configuration={configuration}
            stores={stores}
            disabled={disabled}
            submitEdit={submitEdit}
            options={DATASETS}
            optionLabel={w("datasets")}
            readOptions={(config: DailyIngestionConfiguration) =>
              config.datasets
            }
            update={(config, storeNames, datasets) => ({
              ...config,
              storeNames,
              datasets,
            })}
          />
          <p className={styles.hint}>{w("orderScope")}</p>
          <p className={styles.hint}>{w("cleanupIngestion")}</p>
        </>
      ) : configuration.type === "meituan-review-operations" ? (
        <>
          <AddableScope
            title={w("reviewSettingsScope")}
            configuration={configuration}
            stores={stores}
            disabled={disabled}
            submitEdit={submitEdit}
            options={CHANNELS}
            optionLabel={w("channels")}
            readOptions={(config: ReviewOperationsConfiguration) =>
              config.channels
            }
            update={(config, storeNames, channels) => ({
              ...config,
              storeNames,
              channels,
            })}
          />
          <SettingsCard
            title={w("reviewReplySettings")}
            configuration={configuration}
            disabled={disabled}
            blockedReason={blockedReason}
            submitEdit={submitEdit}
            read={({ brandFacts, tone }) => ({ brandFacts, tone })}
            update={(config, values) => ({ ...config, ...values })}
            detail={({ brandFacts, tone }) => (
              <RecordDetails
                fields={[
                  { label: w("brandFacts"), value: brandFacts },
                  { label: w("tone"), value: tone },
                ]}
              />
            )}
            fields={(values, onChange) => (
              <>
                <TextField
                  label={w("brandFacts")}
                  value={values.brandFacts}
                  multiline
                  rows={4}
                  maxLength={20000}
                  onChange={(brandFacts) => onChange({ ...values, brandFacts })}
                />
                <TextField
                  label={w("tone")}
                  value={values.tone}
                  multiline
                  rows={2}
                  maxLength={2000}
                  onChange={(tone) => onChange({ ...values, tone })}
                />
              </>
            )}
          />
          <SettingsCard
            title={w("publication")}
            configuration={configuration}
            disabled={disabled}
            blockedReason={blockedReason}
            submitEdit={submitEdit}
            read={(config) => config.publication}
            update={(config, publication) => ({ ...config, publication })}
            detail={(publication) => (
              <RecordDetails
                fields={[
                  {
                    label: w("publicationEnabled"),
                    value: w(
                      publication.enabled ? "enabled" : "settingDisabled",
                    ),
                  },
                  {
                    label: w("publicationStores"),
                    value: publication.storeNames.join("\n"),
                  },
                ]}
              />
            )}
            fields={(publication, onChange) => (
              <>
                <CheckboxField
                  label={w("publicationEnabled")}
                  checked={publication.enabled}
                  onChange={(enabled) => onChange({ ...publication, enabled })}
                />
                <StoreChecklist
                  legend={w("publicationStores")}
                  stores={stores.filter((store) =>
                    configuration.storeNames.includes(store.name),
                  )}
                  selected={publication.storeNames}
                  onChange={(storeNames) =>
                    onChange({ ...publication, storeNames })
                  }
                />
                <p className={styles.hint}>{w("policy")}</p>
              </>
            )}
          />
          <ReviewExclusions
            configuration={configured ? configuration : null}
            accounts={accounts}
            disabled={disabled}
            submitEdit={submitEdit}
          />
          <MailSettings
            title={w("draftNotification")}
            configuration={configuration}
            disabled={disabled}
            blockedReason={blockedReason}
            submitEdit={submitEdit}
            read={(config) => config.draftNotification}
            update={(config, draftNotification) => ({
              ...config,
              draftNotification,
            })}
          />
        </>
      ) : (
        <>
          <AddableScope
            title={w("weeklySettingsScope")}
            configuration={configuration}
            stores={stores}
            disabled={disabled}
            submitEdit={submitEdit}
            options={[]}
            readOptions={() => []}
            update={(config: WeeklyReportConfiguration, storeNames) => ({
              ...config,
              storeNames,
            })}
          />
          <ReportGroups
            configuration={configured ? configuration : null}
            stores={stores}
            disabled={disabled}
            submitEdit={submitEdit}
          />
          <MailSettings
            title={w("delivery")}
            configuration={configuration}
            disabled={disabled}
            blockedReason={blockedReason}
            submitEdit={submitEdit}
            read={(config) => config.delivery}
            update={(config, delivery) => ({ ...config, delivery })}
          />
          <p className={styles.hint}>{w("localReport")}</p>
        </>
      )}
    </PageSection>
  );
}
