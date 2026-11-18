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
  SourceAccount,
  SourceExclusion,
  SourceProduct,
  SourceSettings,
  SourceStoreMapping,
  WorkflowStore,
} from "@/features/workflows/model";
import { newSourceIdentity } from "@/features/workflows/model";
import { useWorkflowText } from "@/features/workflows/text";

import styles from "@/features/workflows/Page.module.css";

export interface IntegrationSectionProps {
  readonly product: SourceProduct;
  readonly settings: SourceSettings;
  readonly limits: Record<keyof SourceSettings, number>;
  readonly stores: readonly WorkflowStore[];
  readonly onChange: (next: SourceSettings) => void;
  readonly disabled: boolean;
  readonly dirty: boolean;
  readonly busy: boolean;
  readonly onRequest: () => void;
}

export function IntegrationSection({
  product,
  settings,
  limits,
  stores,
  onChange,
  disabled,
  dirty,
  busy,
  onRequest,
}: IntegrationSectionProps) {
  const { w } = useWorkflowText();

  const update = (patch: Partial<SourceSettings>) =>
    onChange({ ...settings, ...patch });

  return (
    <PageSection
      title={w(
        product === "meituan_erp"
          ? "erpSourceSettings"
          : "reviewSourceSettings",
      )}
      description={w("sourceHelp")}
    >
      <p className={styles.hint}>{w("sourceAccountHelp")}</p>

      <EditableList<SourceAccount>
        title={w("sourceAccounts")}
        items={settings.sourceAccounts}
        maximum={limits.sourceAccounts}
        disabled={disabled}
        create={() => ({
          product,
          accountRef: "",
          displayName: "",
          sourceEnterpriseName: "",
        })}
        onChange={(sourceAccounts) => update({ sourceAccounts })}
        renderItem={(account, replace) => (
          <div className={styles.row}>
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
        items={settings.storeMappings}
        maximum={limits.storeMappings}
        disabled={disabled}
        create={() => ({ source: newSourceIdentity(product), storeName: "" })}
        onChange={(storeMappings) => update({ storeMappings })}
        renderItem={(mapping, replace) => (
          <div className={styles.stack}>
            <SourceFields
              source={mapping.source}
              accounts={settings.sourceAccounts}
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
        items={settings.exclusions}
        maximum={limits.exclusions}
        disabled={disabled}
        create={() => ({ source: newSourceIdentity(product), reason: "" })}
        onChange={(exclusions) => update({ exclusions })}
        renderItem={(exclusion, replace) => (
          <div className={styles.stack}>
            <SourceFields
              source={exclusion.source}
              accounts={settings.sourceAccounts}
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
