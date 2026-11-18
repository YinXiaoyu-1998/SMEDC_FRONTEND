import type { WorkflowBundle } from "@/features/workflows/api";
import {
  SelectField,
  SourceFields,
  TextField,
} from "@/features/workflows/Fields";
import {
  storeOptions,
  withSourceAccount,
} from "@/features/workflows/formValues";
import {
  newSourceIdentity,
  type SourceAccount,
  type SourceExclusion,
  type SourceIdentity,
  type SourceProduct,
  type SourceSettings,
  type SourceStoreMapping,
  type WorkflowStore,
} from "@/features/workflows/model";
import {
  WorkflowEditError,
  type RecordOperation,
  type SubmitWorkflowEdit,
  type WorkflowEdit,
} from "@/features/workflows/recordEdits";
import {
  savedIntegration,
  sourceAccountEdit,
  sourceAccountKey,
  sourceAccountReferences,
  sourceAddLimitReached,
  sourceStoreEdit,
  sourceStoreRecordKey,
  type SourceAccountReference,
} from "@/features/workflows/sourceRecordEdits";
import { useWorkflowText } from "@/features/workflows/text";
import {
  RecordDetails,
  WorkflowRecordList,
} from "@/features/workflows/WorkflowRecordList";
import { resolveText, type TextDictionary } from "@/i18n/text";
import { PageSection } from "@/ui/PageSection";

import styles from "@/features/workflows/Page.module.css";

const sourceMessages = {
  accountRequired: [
    "请填写账号标记、显示名称和来源企业名称。",
    "Enter the account reference, display name, and source enterprise name.",
  ],
  groupInvalid: [
    "来源集团名称不能只有空格。",
    "Enter a source group name or leave the field empty.",
  ],
  storeIdentityRequired: [
    "请填写精确的来源店铺名称。店铺编号不能只有空格。",
    "Enter the exact source store name. Enter a store number or leave it empty.",
  ],
  standardStoreRequired: ["请选择标准门店。", "Select a standard store."],
} satisfies TextDictionary;

export interface IntegrationSectionProps {
  readonly product: SourceProduct;
  readonly settings: SourceSettings;
  readonly stores: readonly WorkflowStore[];
  readonly bundle: WorkflowBundle;
  readonly disabled: boolean;
  readonly submitEdit: SubmitWorkflowEdit;
}

export function IntegrationSection({
  product,
  settings,
  stores,
  bundle,
  disabled,
  submitEdit,
}: IntegrationSectionProps) {
  const { locale, w } = useWorkflowText();
  const sourceText = (key: keyof typeof sourceMessages) =>
    resolveText(sourceMessages, locale, key);
  const configuration = savedIntegration(bundle);
  const accountDisplayNames = new Map(
    settings.sourceAccounts.map((account) => [
      account.accountRef,
      account.displayName,
    ]),
  );

  const addBlockedReason = (field: keyof SourceSettings) => {
    if (sourceAddLimitReached(configuration, field)) {
      return w("sourceLimitsReached");
    }
    if (field !== "sourceAccounts" && settings.sourceAccounts.length === 0) {
      return w("sourceAccountUnavailable");
    }
    if (field === "storeMappings" && !stores.some((store) => !store.retired)) {
      return sourceText("standardStoreRequired");
    }
    return undefined;
  };

  const editError = (error: WorkflowEditError) =>
    [w(error.message), error.details].filter(Boolean).join(" ");

  function validateEdit<T>(
    item: T,
    original: T | undefined,
    editFor: (operation: RecordOperation<T>) => WorkflowEdit,
  ): string | undefined {
    try {
      const operation: RecordOperation<T> =
        original === undefined
          ? { kind: "add", value: item }
          : { kind: "edit", original, value: item };
      editFor(operation).change(bundle);
      return undefined;
    } catch (caught) {
      if (caught instanceof WorkflowEditError) return editError(caught);
      throw caught;
    }
  }

  const sourceLabel = (source: SourceIdentity) =>
    [
      source.sourceStoreName,
      w(source.channel),
      source.accountRef,
      source.sourceStoreId,
    ]
      .filter(Boolean)
      .join(" / ");

  const describeReferences = (references: readonly SourceAccountReference[]) =>
    references
      .map(({ list, source, recordLabel }) =>
        [w(list), sourceLabel(source), recordLabel].filter(Boolean).join(" / "),
      )
      .join(" · ");

  const accountEdit = (operation: RecordOperation<SourceAccount>) =>
    sourceAccountEdit(operation, describeReferences);
  const mappingEdit = (operation: RecordOperation<SourceStoreMapping>) =>
    sourceStoreEdit("storeMappings", operation);
  const exclusionEdit = (operation: RecordOperation<SourceExclusion>) =>
    sourceStoreEdit("exclusions", operation);

  const sourceDetails = (source: SourceIdentity) => [
    { label: w("product"), value: w(source.product) },
    { label: w("channel"), value: w(source.channel) },
    { label: w("accountRef"), value: source.accountRef },
    {
      label: w("displayName"),
      value: accountDisplayNames.get(source.accountRef),
    },
    { label: w("sourceStoreName"), value: source.sourceStoreName },
    { label: w("sourceStoreId"), value: source.sourceStoreId },
  ];

  const validateSource = (source: SourceIdentity) => {
    if (source.accountRef === "") return w("sourceAccountUnavailable");
    if (
      source.sourceStoreName.trim() === "" ||
      source.sourceStoreId?.trim() === ""
    )
      return sourceText("storeIdentityRequired");
    return undefined;
  };

  return (
    <PageSection
      title={w(
        product === "meituan_erp"
          ? "erpSourceSettings"
          : "reviewSourceSettings",
      )}
      description={w("sourceHelp")}
    >
      <WorkflowRecordList<SourceAccount>
        title={w("sourceAccounts")}
        items={settings.sourceAccounts}
        keyFor={sourceAccountKey}
        labelFor={(account) => `${account.displayName} / ${account.accountRef}`}
        details={(account) => (
          <RecordDetails
            fields={[
              { label: w("product"), value: w(account.product) },
              { label: w("accountRef"), value: account.accountRef },
              { label: w("displayName"), value: account.displayName },
              {
                label: w("sourceEnterpriseName"),
                value: account.sourceEnterpriseName,
              },
              { label: w("sourceGroupName"), value: account.sourceGroupName },
            ]}
          />
        )}
        disabled={disabled}
        addBlockedReason={addBlockedReason("sourceAccounts")}
        removeBlockedReason={(account) => {
          const references = sourceAccountReferences(bundle, account);
          return references.length === 0
            ? undefined
            : `${w("sourceAccountInUse")} ${describeReferences(references)}`;
        }}
        create={() => ({
          product,
          accountRef: "",
          displayName: "",
          sourceEnterpriseName: "",
        })}
        fields={(account, replace) => (
          <div className={styles.stack}>
            <p className={styles.hint}>{w("sourceAccountHelp")}</p>
            <TextField
              label={w("accountRef")}
              value={account.accountRef}
              maxLength={255}
              required
              onChange={(accountRef) =>
                replace(withSourceAccount(account, { accountRef }))
              }
            />
            <TextField
              label={w("displayName")}
              value={account.displayName}
              maxLength={255}
              required
              onChange={(displayName) =>
                replace(withSourceAccount(account, { displayName }))
              }
            />
            <TextField
              label={w("sourceEnterpriseName")}
              value={account.sourceEnterpriseName}
              maxLength={255}
              required
              onChange={(sourceEnterpriseName) =>
                replace(withSourceAccount(account, { sourceEnterpriseName }))
              }
            />
            <TextField
              label={w("sourceGroupName")}
              value={account.sourceGroupName ?? ""}
              maxLength={255}
              onChange={(sourceGroupName) =>
                replace(withSourceAccount(account, { sourceGroupName }))
              }
            />
          </div>
        )}
        validate={(account, original) => {
          if (
            [
              account.accountRef,
              account.displayName,
              account.sourceEnterpriseName,
            ].some((value) => value.trim() === "")
          )
            return sourceText("accountRequired");
          if (account.sourceGroupName?.trim() === "") {
            return sourceText("groupInvalid");
          }
          return validateEdit(account, original, accountEdit);
        }}
        editFor={accountEdit}
        submitEdit={submitEdit}
      />

      <WorkflowRecordList<SourceStoreMapping>
        title={w("storeMappings")}
        items={settings.storeMappings}
        keyFor={sourceStoreRecordKey}
        labelFor={(mapping) => sourceLabel(mapping.source)}
        details={(mapping) => (
          <RecordDetails
            fields={[
              ...sourceDetails(mapping.source),
              { label: w("storeName"), value: mapping.storeName },
            ]}
          />
        )}
        disabled={disabled}
        addBlockedReason={addBlockedReason("storeMappings")}
        create={() => ({ source: newSourceIdentity(product), storeName: "" })}
        fields={(mapping, replace, original) => (
          <div className={styles.stack}>
            <SourceFields
              source={mapping.source}
              accounts={settings.sourceAccounts}
              onChange={(source) => replace({ ...mapping, source })}
            />
            <SelectField
              label={w("storeName")}
              value={mapping.storeName}
              options={storeOptions(
                stores,
                original === undefined ? [] : [original.storeName],
              )}
              placeholder={w("choose")}
              onChange={(storeName) => replace({ ...mapping, storeName })}
            />
          </div>
        )}
        validate={(mapping, original) =>
          validateSource(mapping.source) ??
          (mapping.storeName === ""
            ? sourceText("standardStoreRequired")
            : validateEdit(mapping, original, mappingEdit))
        }
        editFor={mappingEdit}
        submitEdit={submitEdit}
      />

      <WorkflowRecordList<SourceExclusion>
        title={w("exclusions")}
        items={settings.exclusions}
        keyFor={sourceStoreRecordKey}
        labelFor={(exclusion) => sourceLabel(exclusion.source)}
        details={(exclusion) => (
          <RecordDetails
            fields={[
              ...sourceDetails(exclusion.source),
              { label: w("reason"), value: exclusion.reason },
            ]}
          />
        )}
        disabled={disabled}
        addBlockedReason={addBlockedReason("exclusions")}
        create={() => ({ source: newSourceIdentity(product), reason: "" })}
        fields={(exclusion, replace) => (
          <div className={styles.stack}>
            <SourceFields
              source={exclusion.source}
              accounts={settings.sourceAccounts}
              onChange={(source) => replace({ ...exclusion, source })}
            />
            <TextField
              label={w("reason")}
              value={exclusion.reason}
              multiline
              rows={3}
              required
              maxLength={2000}
              onChange={(reason) => replace({ ...exclusion, reason })}
            />
          </div>
        )}
        validate={(exclusion, original) =>
          validateSource(exclusion.source) ??
          (exclusion.reason.trim() === ""
            ? w("reasonRequired")
            : validateEdit(exclusion, original, exclusionEdit))
        }
        editFor={exclusionEdit}
        submitEdit={submitEdit}
      />
    </PageSection>
  );
}
