import { useState } from "react";

import { WebApiError } from "@/api/client";
import type {
  PermissionsCutoverActivateResponse,
  PermissionsCutoverReadResponse,
  PermissionsCutoverSuspendResponse,
} from "@/api/generated/contract";
import { VERSION_CONFLICT_CODE } from "@/api/permissions";
import { useText } from "@/i18n/useText";
import { ActionButton } from "@/ui/ActionButton";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { DataTable } from "@/ui/DataTable";
import { PageSection } from "@/ui/PageSection";
import { useConfirmFlow } from "@/ui/useConfirmFlow";

import { SectionNote } from "./components";
import type { SectionKey } from "./constants";
import { permissionsErrorKey } from "./errorKeys";
import { categoryLabel } from "./labels";
import styles from "./Permissions.module.css";
import { usePermissionsScope } from "./scope";

function sectionForIssue(code: string): SectionKey {
  switch (code) {
    case "FIXED_CATEGORY_CLEARANCE_REQUIRED":
    case "INTERNAL_CATEGORY_REQUIRED":
      return "categories";
    case "DIMENSION_NOT_READY":
    case "DIMENSION_VALUE_REQUIRED":
      return "dimensions";
    case "EXACT_STORE_REFERENCE_REQUIRED":
      return "stores";
    case "GRANT_CONFIGURATION_REQUIRED":
    case "GRANT_DIMENSION_REQUIRED":
      return "accounts";
    case "READ_ADAPTER_NOT_READY":
      return "readiness";
    default:
      return "documents";
  }
}

export function ReadinessSection() {
  const { t } = useText();
  const scope = usePermissionsScope();
  const [report, setReport] = useState<PermissionsCutoverReadResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [actionError, setActionError] = useState<unknown>(null);

  const mode = scope.bundle.me.mode;

  const check = async () => {
    setLoading(true);
    setError(null);
    setActionError(null);
    try {
      const result = await scope.readCutover();
      if (result.authorizationVersion !== scope.bundle.version) {
        throw new WebApiError({
          status: 409,
          code: VERSION_CONFLICT_CODE,
          message: "配置版本不一致",
        });
      }
      setReport(result);
    } catch (caught) {
      setError(caught);
    } finally {
      setLoading(false);
    }
  };

  const activateFlow = useConfirmFlow<
    void,
    PermissionsCutoverActivateResponse | null
  >({
    prepare: () => undefined,
    submit: async () => {
      setActionError(null);
      try {
        const result = await scope.writes.activate();
        scope.setNotice("permissions.activated");
        return result;
      } catch (caught) {
        setActionError(caught);
        return null;
      }
    },
  });

  const suspendFlow = useConfirmFlow<
    void,
    PermissionsCutoverSuspendResponse | null
  >({
    prepare: () => undefined,
    submit: async () => {
      setActionError(null);
      try {
        const result = await scope.writes.suspend();
        scope.setNotice("permissions.suspendedNotice");
        return result;
      } catch (caught) {
        setActionError(caught);
        return null;
      }
    },
  });

  const reportTarget = (targetId: string): string => {
    const account = scope.bundle.accounts.find(
      (item) => item.id === targetId || targetId.startsWith(`${item.id}/`),
    );
    if (account !== undefined) return account.displayName;
    const category = scope.bundle.categories.find(
      (item) => item.id === targetId || item.key === targetId,
    );
    if (category !== undefined) return categoryLabel(t, category);
    return targetId;
  };

  const issueLabel = (code: string): string => {
    const key = `permissions.missing.${code}`;
    const label = t(key);
    return label === key ? t("permissions.error.invalid") : label;
  };

  const canActivate =
    report?.ready === true && mode !== "enabled" && mode !== "suspended";
  const blockedReason =
    report === null ? t("permissions.checkFirst") : t("permissions.notReady");

  return (
    <PageSection title={t("permissions.tabs.readiness")}>
      <SectionNote>{t("permissions.activateHelp")}</SectionNote>
      <SectionNote>{t("permissions.noDataClaim")}</SectionNote>

      <div className={styles.actions}>
        <ActionButton
          label={t("permissions.check")}
          variant="secondary"
          busy={loading}
          onRun={() => {
            void check();
          }}
        />
      </div>
      {error === null ? null : (
        <p className={styles.error} role="alert">
          {t(permissionsErrorKey(error))}
        </p>
      )}

      {report === null ? null : (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            {t(report.ready ? "permissions.ready" : "permissions.notReady")}
          </h3>
          {report.missing.length === 0 ? null : (
            <DataTable<{ readonly code: string; readonly targetId: string }>
              columns={[
                {
                  id: "issue",
                  header: t("permissions.issue"),
                  cell: (issue) => issueLabel(issue.code),
                },
                {
                  id: "target",
                  header: t("permissions.target"),
                  cell: (issue) => reportTarget(issue.targetId),
                },
                {
                  id: "locate",
                  header: t("permissions.goToSection"),
                  cell: (issue) => (
                    <ActionButton
                      label={t("permissions.goToSection")}
                      variant="secondary"
                      onRun={() => {
                        scope.navigate(sectionForIssue(issue.code));
                      }}
                    />
                  ),
                },
              ]}
              rows={report.missing}
              getRowId={(issue) => `${issue.code}/${issue.targetId}`}
              label={t("permissions.issue")}
              emptyLabel={t("permissions.empty")}
            />
          )}
          {report.accountsWithoutGrants.length === 0 ? null : (
            <>
              <h4 className={styles.subheading}>
                {t("permissions.accountsWithoutGrants")}
              </h4>
              <ul>
                {report.accountsWithoutGrants.map((id) => (
                  <li key={id}>{reportTarget(id)}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {mode === "enabled" ? (
        <>
          <SectionNote>{t("permissions.alreadyEnabled")}</SectionNote>
          <div className={styles.actions}>
            <ActionButton
              label={t("permissions.suspend")}
              variant="secondary"
              busy={suspendFlow.isSubmitting}
              disabled={scope.busy}
              onRun={() => {
                void suspendFlow.request();
              }}
            />
          </div>
        </>
      ) : null}
      {mode === "suspended" ? (
        <SectionNote>{t("permissions.suspendedHelp")}</SectionNote>
      ) : null}

      {mode !== "enabled" && mode !== "suspended" ? (
        <div className={styles.actions}>
          <ActionButton
            label={t("permissions.activate")}
            busy={activateFlow.isSubmitting}
            disabled={!canActivate || scope.busy}
            {...(canActivate ? {} : { disabledReason: blockedReason })}
            onRun={() => {
              void activateFlow.request();
            }}
          />
        </div>
      ) : null}

      {actionError === null ? null : (
        <p className={styles.error} role="alert">
          {t(permissionsErrorKey(actionError))}
        </p>
      )}

      <ConfirmDialog
        flow={activateFlow}
        title={t("permissions.activate")}
        description={t("permissions.activateHelp")}
        confirmLabel={t("permissions.activateConfirm")}
        cancelLabel={t("permissions.cancel")}
      />
      <ConfirmDialog
        flow={suspendFlow}
        title={t("permissions.suspend")}
        description={t("permissions.suspendHelp")}
        confirmLabel={t("permissions.suspend")}
        cancelLabel={t("permissions.cancel")}
      />
    </PageSection>
  );
}
