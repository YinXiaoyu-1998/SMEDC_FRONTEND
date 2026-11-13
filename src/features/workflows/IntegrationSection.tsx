import { ActionButton } from "@/ui/ActionButton";
import { PageSection } from "@/ui/PageSection";
import {
  EditableList,
  SelectField,
  SourceFields,
  TextField,
} from "@/features/workflows/Fields";
import {
  storeOptions,
  withSourceAccount,
} from "@/features/workflows/formValues";
import type {
  IntegrationConfiguration,
  SourceAccount,
  SourceExclusion,
  SourceStoreMapping,
  WorkflowStore,
} from "@/features/workflows/model";
import { newSourceIdentity } from "@/features/workflows/model";
import { useWorkflowText } from "@/features/workflows/text";

import styles from "@/features/workflows/Page.module.css";

export interface IntegrationSectionProps {
  readonly configuration: IntegrationConfiguration;
  readonly stores: readonly WorkflowStore[];
  readonly onChange: (next: IntegrationConfiguration) => void;
  readonly disabled: boolean;
  readonly dirty: boolean;
  readonly busy: boolean;
  readonly onRequest: () => void;
}

export function IntegrationSection({
  configuration,
  stores,
  onChange,
  disabled,
  dirty,
  busy,
  onRequest,
}: IntegrationSectionProps) {
  const { w } = useWorkflowText();

  const update = (patch: Partial<IntegrationConfiguration>) =>
    onChange({
      schemaVersion: 1,
      timezone: "Asia/Shanghai",
      sourceAccounts: patch.sourceAccounts ?? configuration.sourceAccounts,
      storeMappings: patch.storeMappings ?? configuration.storeMappings,
      exclusions: patch.exclusions ?? configuration.exclusions,
    });

  return (
    <PageSection title={w("integration")} description={w("sourceHelp")}>
      <p className={styles.hint}>{w("sourceAccountHelp")}</p>

      <EditableList<SourceAccount>
        title={w("sourceAccounts")}
        items={configuration.sourceAccounts}
        maximum={100}
        disabled={disabled}
        create={() => ({
          product: "meituan_erp",
          accountRef: "",
          displayName: "",
          sourceEnterpriseName: "",
        })}
        onChange={(sourceAccounts) => update({ sourceAccounts })}
        renderItem={(account, replace) => (
          <div className={styles.row}>
            <SelectField
              label={w("product")}
              value={account.product}
              options={[
                { value: "meituan_erp", label: w("meituan_erp") },
                { value: "meituan_reviews", label: w("meituan_reviews") },
              ]}
              disabled={disabled}
              onChange={(value) =>
                replace(
                  withSourceAccount(account, {
                    product:
                      value === "meituan_erp"
                        ? "meituan_erp"
                        : "meituan_reviews",
                  }),
                )
              }
            />
            <TextField
              label={w("accountRef")}
              value={account.accountRef}
              disabled={disabled}
              maxLength={255}
              onChange={(accountRef) =>
                replace(withSourceAccount(account, { accountRef }))
              }
            />
            <TextField
              label={w("displayName")}
              value={account.displayName}
              disabled={disabled}
              maxLength={255}
              onChange={(displayName) =>
                replace(withSourceAccount(account, { displayName }))
              }
            />
            <TextField
              label={w("sourceEnterpriseName")}
              value={account.sourceEnterpriseName}
              disabled={disabled}
              maxLength={255}
              onChange={(sourceEnterpriseName) =>
                replace(withSourceAccount(account, { sourceEnterpriseName }))
              }
            />
            <TextField
              label={w("sourceGroupName")}
              value={account.sourceGroupName ?? ""}
              disabled={disabled}
              maxLength={255}
              onChange={(sourceGroupName) =>
                replace(withSourceAccount(account, { sourceGroupName }))
              }
            />
          </div>
        )}
      />

      <EditableList<SourceStoreMapping>
        title={w("storeMappings")}
        items={configuration.storeMappings}
        maximum={2000}
        disabled={disabled}
        create={() => ({ source: newSourceIdentity(false), storeName: "" })}
        onChange={(storeMappings) => update({ storeMappings })}
        renderItem={(mapping, replace) => (
          <div className={styles.stack}>
            <SourceFields
              source={mapping.source}
              accounts={configuration.sourceAccounts}
              reviewsOnly={false}
              disabled={disabled}
              onChange={(source) => replace({ ...mapping, source })}
            />
            <SelectField
              label={w("storeName")}
              value={mapping.storeName}
              options={storeOptions(
                stores,
                mapping.storeName === "" ? [] : [mapping.storeName],
              )}
              placeholder={w("choose")}
              disabled={disabled}
              onChange={(storeName) => replace({ ...mapping, storeName })}
            />
          </div>
        )}
      />

      <EditableList<SourceExclusion>
        title={w("exclusions")}
        items={configuration.exclusions}
        maximum={2000}
        disabled={disabled}
        create={() => ({ source: newSourceIdentity(false), reason: "" })}
        onChange={(exclusions) => update({ exclusions })}
        renderItem={(exclusion, replace) => (
          <div className={styles.stack}>
            <SourceFields
              source={exclusion.source}
              accounts={configuration.sourceAccounts}
              reviewsOnly={false}
              disabled={disabled}
              onChange={(source) => replace({ ...exclusion, source })}
            />
            <TextField
              label={w("reason")}
              value={exclusion.reason}
              multiline
              rows={3}
              disabled={disabled}
              maxLength={2000}
              onChange={(reason) => replace({ ...exclusion, reason })}
            />
          </div>
        )}
      />

      <div className={styles.actionsRow}>
        <ActionButton
          label={w("saveIntegration")}
          busy={busy}
          disabled={disabled || !dirty}
          onRun={onRequest}
        />
      </div>
    </PageSection>
  );
}
