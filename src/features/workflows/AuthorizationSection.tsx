import { PageSection } from "@/ui/PageSection";
import {
  Checklist,
  RecipientsField,
  SelectField,
  TextField,
} from "@/features/workflows/Fields";
import {
  allowedAuthorizationStores,
  authorizationDatasets,
  authorizationRecord,
  authorizationRecordEdit,
  authorizationScopeAllowed,
  maximumDeliveryVersion,
  reviewChannels,
  type AuthorizationRecord,
} from "@/features/workflows/authorizationEdits";
import type {
  WorkflowAuthorization,
  WorkflowStore,
  WorkflowType,
  WorkflowView,
} from "@/features/workflows/model";
import {
  authorizationActions,
  defaultAuthorizationDraft,
  isActiveAuthorization,
  validateAuthorizationDraft,
  workflowEmailPurpose,
} from "@/features/workflows/model";
import type { SubmitWorkflowEdit } from "@/features/workflows/recordEdits";
import {
  RecordDetails,
  WorkflowRecordList,
} from "@/features/workflows/WorkflowRecordList";
import { useWorkflowText } from "@/features/workflows/text";
import { resolveText, toHtmlLang, type TextDictionary } from "@/i18n/text";

import styles from "@/features/workflows/Page.module.css";

const messages = {
  records: ["授权记录", "Authorization records"],
  revoke: ["撤销授权", "Revoke authorization"],
  confirmRevoke: ["确认撤销", "Confirm revocation"],
  revokeHelp: [
    "确认后将撤销此条授权。",
    "Confirm to revoke this authorization.",
  ],
  replaceHelp: [
    "保存后将撤销原授权，并按此范围创建一条新授权。",
    "Saving revokes the original authorization and creates a new one with this scope.",
  ],
  status: ["授权状态", "Authorization status"],
  grantedBy: ["授权人", "Granted by"],
  grantorNameUnavailable: ["姓名不可用", "Name unavailable"],
  authorizationId: ["授权编号", "Authorization ID"],
  configurationVersion: ["授权时的配置版本", "Configuration version at grant"],
  controlVersion: ["授权时的控制版本", "Control version at grant"],
  storeScope: ["授权门店", "Authorized stores"],
  datasetScope: ["授权数据", "Authorized datasets"],
  channelScope: ["授权渠道", "Authorized channels"],
  legacy: ["当前范围不可用", "Outside the allowed scope"],
  updateScope: [
    "请调整为此任务当前允许的授权范围。",
    "Update the authorization to match the scope currently allowed for this task.",
  ],
  invalidFields: [
    "请检查邮件授权字段。",
    "Check the email authorization fields.",
  ],
  deliveryVersionRange: [
    "交付批次必须是 0 至 4294967295 之间的整数。",
    "Delivery revision must be an integer between 0 and 4294967295.",
  ],
} satisfies TextDictionary;

export interface AuthorizationSectionProps {
  readonly view: WorkflowView | undefined;
  readonly type: WorkflowType;
  readonly stores: readonly WorkflowStore[];
  readonly grantorNames: ReadonlyMap<string, string> | undefined;
  readonly disabled: boolean;
  readonly submitEdit: SubmitWorkflowEdit;
}

export function AuthorizationSection({
  view,
  type,
  stores,
  grantorNames,
  disabled,
  submitEdit,
}: AuthorizationSectionProps) {
  const { locale, w } = useWorkflowText();
  const text = (key: keyof typeof messages) =>
    resolveText(messages, locale, key);
  const allowedStores = allowedAuthorizationStores(view, stores);
  const records =
    view?.authorizations.map((saved) => authorizationRecord(type, saved)) ?? [];
  const isActive = ({ saved }: AuthorizationRecord) =>
    saved !== null && isActiveAuthorization(saved);

  return (
    <PageSection
      title={w("authorizations")}
      description={w("authorizationHelp")}
    >
      <WorkflowRecordList
        key={type}
        title={text("records")}
        items={records}
        keyFor={({ saved }) => saved?.authorizationId ?? ""}
        labelFor={({ saved, draft }) =>
          `${w(draft.kind)} ${saved?.authorizationId ?? ""}`
        }
        details={({ saved }) =>
          saved === null ? null : (
            <AuthorizationDetails
              authorization={saved}
              grantorName={grantorNames?.get(saved.grantedBy)}
            />
          )
        }
        create={() => authorizationRecord(type)}
        fields={(record, onChange) => (
          <AuthorizationFields
            type={type}
            allowedStores={allowedStores}
            record={record}
            disabled={disabled}
            onChange={onChange}
          />
        )}
        editFor={(operation) =>
          authorizationRecordEdit(type, stores, operation)
        }
        submitEdit={submitEdit}
        validate={(record) => {
          const errors = validateAuthorizationDraft(record.draft);
          if (!authorizationScopeAllowed(type, allowedStores, record))
            return text("updateScope");
          if (errors.scope !== undefined) return w(errors.scope);
          if (
            errors.recipients !== undefined ||
            errors.allowedSender !== undefined ||
            errors.deliveryVersion !== undefined ||
            (record.draft.kind === "email" &&
              record.draft.deliveryVersion > maximumDeliveryVersion)
          ) {
            return text("invalidFields");
          }
        }}
        addBlockedReason={
          view?.configuration == null
            ? w("authorizationNeedsConfiguration")
            : undefined
        }
        canEdit={isActive}
        canRemove={isActive}
        removeLabel={text("revoke")}
        removeConfirmLabel={text("confirmRevoke")}
        removeHelp={text("revokeHelp")}
        disabled={disabled}
      />
    </PageSection>
  );
}

function AuthorizationDetails({
  authorization,
  grantorName,
}: {
  readonly authorization: WorkflowAuthorization;
  readonly grantorName: string | undefined;
}) {
  const { locale, w } = useWorkflowText();
  const text = (key: keyof typeof messages) =>
    resolveText(messages, locale, key);
  const { scope, revokedAt } = authorization;
  const formatDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString(toHtmlLang(locale));
  };
  const fields = [
    { label: w("action"), value: w(scope.kind) },
    {
      label: text("status"),
      value: w(
        revokedAt === null ? "authorizationGranted" : "authorizationRevoked",
      ),
    },
    { label: text("storeScope"), value: scope.storeNames.join("\n") },
  ];
  if ("datasets" in scope) {
    fields.push({
      label: text("datasetScope"),
      value: scope.datasets.map(w).join("\n"),
    });
  } else if ("channels" in scope) {
    fields.push({
      label: text("channelScope"),
      value: scope.channels.map(w).join("\n"),
    });
  } else {
    fields.push(
      { label: w("purpose"), value: w(scope.purpose) },
      { label: w("recipients"), value: scope.recipients.join("\n") },
      { label: w("allowedSender"), value: scope.allowedSender },
      { label: w("deliveryVersion"), value: String(scope.deliveryVersion) },
    );
  }
  fields.push(
    {
      label: text("grantedBy"),
      value: grantorName?.trim() ? grantorName : text("grantorNameUnavailable"),
    },
    { label: w("grantedAt"), value: formatDate(authorization.grantedAt) },
  );
  if (revokedAt !== null)
    fields.push({ label: w("revokedAt"), value: formatDate(revokedAt) });
  fields.push(
    { label: text("authorizationId"), value: authorization.authorizationId },
    {
      label: text("configurationVersion"),
      value: String(authorization.configurationVersion),
    },
    {
      label: text("controlVersion"),
      value: String(authorization.controlVersion),
    },
  );

  return <RecordDetails fields={fields} />;
}

function AuthorizationFields({
  type,
  allowedStores,
  record,
  disabled,
  onChange,
}: {
  readonly type: WorkflowType;
  readonly allowedStores: readonly string[];
  readonly record: AuthorizationRecord;
  readonly disabled: boolean;
  readonly onChange: (value: AuthorizationRecord) => void;
}) {
  const { w, locale } = useWorkflowText();
  const text = (key: keyof typeof messages) =>
    resolveText(messages, locale, key);
  const { draft, purpose } = record;
  const errors = validateAuthorizationDraft(draft);
  const allowedActions = authorizationActions(type);
  const allowedPurpose = workflowEmailPurpose(type);
  const purposes = allowedPurpose === null ? [] : [allowedPurpose];

  const options = (
    allowed: readonly string[],
    selected: readonly string[],
    label: (value: string) => string,
  ) =>
    [...new Set([...allowed, ...selected])].map((value) => ({
      value,
      label: allowed.includes(value)
        ? label(value)
        : `${label(value)} · ${text("legacy")}`,
    }));

  return (
    <div className={styles.stack}>
      {record.saved === null ? null : (
        <p className={styles.hint}>{text("replaceHelp")}</p>
      )}
      <SelectField
        label={w("action")}
        value={draft.kind}
        options={options(allowedActions, [draft.kind], w)}
        disabled={disabled}
        onChange={(value) => {
          const kind = allowedActions.find((action) => action === value);
          if (kind !== undefined) {
            onChange({
              ...record,
              draft: {
                ...defaultAuthorizationDraft(type),
                kind,
                storeNames: draft.storeNames,
              },
              purpose: allowedPurpose,
            });
          }
        }}
      />
      <Checklist
        legend={text("storeScope")}
        options={options(allowedStores, draft.storeNames, (name) => name)}
        selected={draft.storeNames}
        disabled={disabled}
        onChange={(storeNames) =>
          onChange({ ...record, draft: { ...draft, storeNames } })
        }
      />
      {(draft.kind === "upload" || draft.kind === "download") && (
        <Checklist
          legend={text("datasetScope")}
          options={options(
            authorizationDatasets(draft.kind),
            draft.datasets,
            w,
          )}
          selected={draft.datasets}
          disabled={disabled}
          onChange={(values) => {
            const candidates = [
              ...authorizationDatasets(draft.kind),
              ...draft.datasets,
            ];
            onChange({
              ...record,
              draft: {
                ...draft,
                datasets: values.flatMap(
                  (value) =>
                    candidates.find((dataset) => dataset === value) ?? [],
                ),
              },
            });
          }}
        />
      )}
      {(draft.kind === "review_sync" || draft.kind === "review_publish") && (
        <Checklist
          legend={text("channelScope")}
          options={options(reviewChannels, draft.channels, w)}
          selected={draft.channels}
          disabled={disabled}
          onChange={(values) =>
            onChange({
              ...record,
              draft: {
                ...draft,
                channels: values.flatMap(
                  (value) =>
                    reviewChannels.find((channel) => channel === value) ?? [],
                ),
              },
            })
          }
        />
      )}
      {draft.kind === "email" && (
        <>
          <SelectField
            label={w("purpose")}
            value={purpose ?? ""}
            options={options(purposes, purpose === null ? [] : [purpose], w)}
            disabled={disabled}
            onChange={(value) => {
              if (value === allowedPurpose)
                onChange({ ...record, purpose: allowedPurpose });
            }}
          />
          <RecipientsField
            value={draft.recipients}
            error={
              errors.recipients === undefined ? undefined : w(errors.recipients)
            }
            disabled={disabled}
            onChange={(recipients) =>
              onChange({ ...record, draft: { ...draft, recipients } })
            }
          />
          <TextField
            label={w("allowedSender")}
            value={draft.allowedSender}
            error={
              errors.allowedSender === undefined
                ? undefined
                : w(errors.allowedSender)
            }
            maxLength={254}
            disabled={disabled}
            onChange={(allowedSender) =>
              onChange({ ...record, draft: { ...draft, allowedSender } })
            }
          />
          <TextField
            label={w("deliveryVersion")}
            value={
              Number.isNaN(draft.deliveryVersion)
                ? ""
                : String(draft.deliveryVersion)
            }
            type="number"
            min={0}
            error={
              errors.deliveryVersion !== undefined ||
              draft.deliveryVersion > maximumDeliveryVersion
                ? text("deliveryVersionRange")
                : undefined
            }
            disabled={disabled}
            onChange={(value) =>
              onChange({
                ...record,
                draft: {
                  ...draft,
                  deliveryVersion: value === "" ? NaN : Number(value),
                },
              })
            }
          />
        </>
      )}
    </div>
  );
}
