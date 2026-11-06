import { ActionButton } from "@/ui/ActionButton";
import { PageSection } from "@/ui/PageSection";
import {
  Checklist,
  RecipientsField,
  SelectField,
  StoreChecklist,
  TextField,
} from "@/features/workflows/Fields";
import { Summary } from "@/features/workflows/Summary";
import type {
  AuthorizationAction,
  AuthorizationDraft,
  Dataset,
  ReviewChannel,
  WorkflowAuthorization,
  WorkflowStore,
  WorkflowType,
  WorkflowView,
} from "@/features/workflows/model";
import {
  authorizationActions,
  isActiveAuthorization,
  validateAuthorizationDraft,
} from "@/features/workflows/model";
import { useWorkflowText } from "@/features/workflows/text";

import styles from "@/features/workflows/Page.module.css";

const UPLOAD_DATASETS: readonly Dataset[] = [
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
];
const DOWNLOAD_DATASETS: readonly Dataset[] = [
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
];
const REVIEW_CHANNELS: readonly ReviewChannel[] = ["meituan", "dianping"];
const PURPOSES = ["review_drafts", "weekly_report", "exception"] as const;

export interface AuthorizationSectionProps {
  readonly view: WorkflowView | undefined;
  readonly type: WorkflowType;
  readonly stores: readonly WorkflowStore[];
  readonly draft: AuthorizationDraft;
  readonly onDraftChange: (next: AuthorizationDraft) => void;
  readonly revocations: ReadonlySet<string>;
  readonly onRevocationsChange: (next: ReadonlySet<string>) => void;
  readonly disabled: boolean;
  readonly revokeBusy: boolean;
  readonly grantBusy: boolean;
  readonly onRevoke: () => void;
  readonly onGrant: () => void;
}

export function AuthorizationSection({
  view,
  type,
  stores,
  draft,
  onDraftChange,
  revocations,
  onRevocationsChange,
  disabled,
  revokeBusy,
  grantBusy,
  onRevoke,
  onGrant,
}: AuthorizationSectionProps) {
  const { w } = useWorkflowText();
  const authorizations: readonly WorkflowAuthorization[] =
    view?.authorizations ?? [];
  const active = authorizations.filter(isActiveAuthorization);
  const errors = validateAuthorizationDraft(draft);
  const scopeError = errors.scope === undefined ? undefined : w(errors.scope);

  const toggleRevocation = (authorizationId: string, checked: boolean) => {
    const next = new Set(revocations);
    if (checked) next.add(authorizationId);
    else next.delete(authorizationId);
    onRevocationsChange(next);
  };

  const savedConfiguration = view?.configuration ?? null;
  const authorizedStores = savedConfiguration?.storeNames ?? [];
  // 授权范围只列已保存配置中的门店；即使门店目录未登记也要显示，避免范围被悄悄缩小
  const authorizationStoreOptions: WorkflowStore[] = authorizedStores.map(
    (name) => ({
      name,
      retired: stores.find((store) => store.name === name)?.retired ?? false,
    }),
  );

  const datasetChoices =
    draft.kind === "upload" ? UPLOAD_DATASETS : DOWNLOAD_DATASETS;

  return (
    <PageSection
      title={w("authorizations")}
      description={w("authorizationHelp")}
    >
      {authorizations.length === 0 ? (
        <p className={styles.hint}>{w("empty")}</p>
      ) : (
        <div className={styles.stack}>
          {authorizations.map((authorization) => {
            const revoked = !isActiveAuthorization(authorization);
            return (
              <div
                className={styles.authRow}
                key={authorization.authorizationId}
              >
                <div className={styles.actionsRow}>
                  {revoked ? null : (
                    <label className={styles.check}>
                      <input
                        type="checkbox"
                        aria-label={`${w("revokeSelection")} ${w(
                          authorization.scope.kind,
                        )} ${authorization.authorizationId}`}
                        checked={revocations.has(authorization.authorizationId)}
                        disabled={disabled}
                        onChange={(event) =>
                          toggleRevocation(
                            authorization.authorizationId,
                            event.target.checked,
                          )
                        }
                      />
                      <span>{w("revokeSelection")}</span>
                    </label>
                  )}
                  <strong>{w(authorization.scope.kind)}</strong>
                  {authorization.scope.kind === "email" ? (
                    <span>{w(authorization.scope.purpose)}</span>
                  ) : null}
                  <span className={styles.hint}>
                    {w(
                      revoked ? "authorizationRevoked" : "authorizationGranted",
                    )}
                  </span>
                </div>
                <Summary value={authorization.scope} />
                <div className={styles.authMeta}>
                  <span>
                    {w("grantedAt")}: {formatDateTime(authorization.grantedAt)}
                  </span>
                  {authorization.revokedAt === null ? null : (
                    <span>
                      {w("revokedAt")}:{" "}
                      {formatDateTime(authorization.revokedAt)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {authorizations.length > 0 && active.length === 0 ? (
        <p className={styles.hint}>{w("noActiveAuthorizations")}</p>
      ) : null}

      <div className={styles.actionsRow}>
        <ActionButton
          label={w("revoke")}
          busy={revokeBusy}
          disabled={disabled || revocations.size === 0}
          {...(revocations.size === 0
            ? { disabledReason: w("revokeRequired") }
            : {})}
          onRun={onRevoke}
        />
      </div>

      <h3 className={styles.subheading}>{w("grant")}</h3>
      {savedConfiguration === null ? (
        <p className={styles.hint}>{w("authorizationNeedsConfiguration")}</p>
      ) : (
        <div className={styles.stack}>
          <SelectField
            label={w("action")}
            value={draft.kind}
            options={authorizationActions(type).map((action) => ({
              value: action,
              label: w(action),
            }))}
            disabled={disabled}
            onChange={(value) => {
              const kind = value as AuthorizationAction;
              onDraftChange({
                ...draft,
                kind,
                datasets:
                  kind === "download"
                    ? draft.datasets.filter(
                        (dataset) => dataset !== "delivery_ledger",
                      )
                    : draft.datasets,
              });
            }}
          />

          <StoreChecklist
            legend={w("stores")}
            stores={authorizationStoreOptions}
            selected={draft.storeNames}
            disabled={disabled}
            onChange={(storeNames) => onDraftChange({ ...draft, storeNames })}
          />

          {draft.kind === "upload" || draft.kind === "download" ? (
            <Checklist
              legend={w("datasets")}
              options={datasetChoices.map((dataset) => ({
                value: dataset,
                label: w(dataset),
              }))}
              selected={draft.datasets}
              disabled={disabled}
              onChange={(values) =>
                onDraftChange({
                  ...draft,
                  datasets: values.filter((value): value is Dataset =>
                    datasetChoices.some((dataset) => dataset === value),
                  ),
                })
              }
            />
          ) : null}

          {draft.kind === "review_sync" || draft.kind === "review_publish" ? (
            <Checklist
              legend={w("channels")}
              options={REVIEW_CHANNELS.map((channel) => ({
                value: channel,
                label: w(channel),
              }))}
              selected={draft.channels}
              disabled={disabled}
              onChange={(values) =>
                onDraftChange({
                  ...draft,
                  channels: values.filter((value): value is ReviewChannel =>
                    REVIEW_CHANNELS.some((channel) => channel === value),
                  ),
                })
              }
            />
          ) : null}

          {draft.kind === "email" ? (
            <div className={styles.stack}>
              <SelectField
                label={w("purpose")}
                value={draft.purpose}
                options={PURPOSES.map((purpose) => ({
                  value: purpose,
                  label: w(purpose),
                }))}
                disabled={disabled}
                onChange={(purpose) =>
                  onDraftChange({
                    ...draft,
                    purpose:
                      purpose === "review_drafts" ||
                      purpose === "weekly_report" ||
                      purpose === "exception"
                        ? purpose
                        : "weekly_report",
                  })
                }
              />
              <RecipientsField
                value={draft.recipients}
                error={
                  errors.recipients === undefined
                    ? undefined
                    : w(errors.recipients)
                }
                disabled={disabled}
                onChange={(recipients) =>
                  onDraftChange({ ...draft, recipients })
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
                  onDraftChange({ ...draft, allowedSender })
                }
              />
              <TextField
                label={w("deliveryVersion")}
                value={String(draft.deliveryVersion)}
                type="number"
                min={0}
                error={
                  errors.deliveryVersion === undefined
                    ? undefined
                    : w(errors.deliveryVersion)
                }
                disabled={disabled}
                onChange={(value) =>
                  onDraftChange({
                    ...draft,
                    deliveryVersion: value === "" ? 0 : Number(value),
                  })
                }
              />
            </div>
          ) : null}

          {scopeError === undefined ? null : (
            <p className={styles.fieldError} role="alert">
              {scopeError}
            </p>
          )}

          <div className={styles.actionsRow}>
            <ActionButton
              label={w("previewGrant")}
              busy={grantBusy}
              disabled={
                disabled ||
                errors.scope !== undefined ||
                errors.recipients !== undefined ||
                errors.allowedSender !== undefined ||
                errors.deliveryVersion !== undefined
              }
              {...(scopeError === undefined
                ? {}
                : { disabledReason: scopeError })}
              onRun={onGrant}
            />
          </div>
        </div>
      )}
    </PageSection>
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
