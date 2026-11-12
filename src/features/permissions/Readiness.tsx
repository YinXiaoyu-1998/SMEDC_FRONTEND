import { useState } from "react";

import { WebApiError } from "@/api/client";
import {
  VERSION_CONFLICT_CODE,
  isVersionConflict,
  type PermissionsBundle,
  type PermissionsCutoverReadResponse,
} from "@/api/permissions";
import { useText } from "@/i18n/useText";
import { ActionButton } from "@/ui/ActionButton";
import { DataTable } from "@/ui/DataTable";
import { PageSection } from "@/ui/PageSection";
import { useConfirmFlow } from "@/ui/useConfirmFlow";

import { SectionNote } from "./components";
import type { SectionKey } from "./constants";
import type { Confirmation } from "./diff";
import { permissionsErrorKey } from "./errorKeys";
import { categoryLabel, type Translate } from "./labels";
import { PermissionConfirmDialog } from "./panel";
import styles from "./Permissions.module.css";
import { usePermissionsScope } from "./scope";

type CutoverMode = PermissionsCutoverReadResponse["mode"];
type ReadinessIssue = PermissionsCutoverReadResponse["missing"][number];

interface CutoverRequest {
  /** 确认时绑定的版本：启用用检查报告版本，暂停用当前配置版本 */
  readonly version: string;
  readonly confirmation: Confirmation;
}

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

function issueLabel(t: Translate, code: string): string {
  const key = `permissions.missing.${code}`;
  const label = t(key);
  // 未收录的新缺项代码按原样显示，仍能让管理员把报告交给运维核对
  return label === key ? code : label;
}

/** targetId 可能是账号、账号内授权（accountId/grantId）、类别或资料 ID。 */
function reportTarget(
  t: Translate,
  bundle: PermissionsBundle,
  targetId: string,
): string {
  const account = bundle.accounts.find(
    (item) => item.id === targetId || targetId.startsWith(`${item.id}/`),
  );
  if (account !== undefined) return account.displayName;
  const category = bundle.categories.find(
    (item) =>
      item.id === targetId || (item.key !== null && item.key === targetId),
  );
  if (category !== undefined) return categoryLabel(t, category);
  return targetId;
}

function modeChangeConfirmation(
  t: Translate,
  before: CutoverMode,
  after: CutoverMode,
  impact: string,
): Confirmation {
  return {
    subject: t("permissions.banner.label"),
    diff: [
      {
        kind: "changed",
        label: t("permissions.statusLabel"),
        before: t(`permissions.mode.${before}`),
        after: t(`permissions.mode.${after}`),
      },
    ],
    impact,
  };
}

export function ReadinessSection({ active }: { readonly active: boolean }) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const mode = scope.bundle.me.mode;
  const [report, setReport] = useState<PermissionsCutoverReadResponse | null>(
    null,
  );
  const [expired, setExpired] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<unknown>(null);
  const [reloading, setReloading] = useState(false);
  const [reloadError, setReloadError] = useState<unknown>(null);
  const [actionError, setActionError] = useState<unknown>(null);

  const versionMatches =
    report !== null && report.authorizationVersion === scope.bundle.version;
  const needsCheck = report === null || expired || checking || !versionMatches;
  const canActivate =
    report !== null &&
    !needsCheck &&
    report.ready &&
    mode !== "enabled" &&
    mode !== "suspended";
  const blockedReason = t(
    needsCheck ? "permissions.checkFirst" : "permissions.notReady",
  );

  const runCheck = async () => {
    if (checking || reloading) return;
    setChecking(true);
    setCheckError(null);
    setActionError(null);
    try {
      const result = await scope.readCutover();
      if (result.authorizationVersion !== scope.bundle.version) {
        // 报告来自另一版本：按版本冲突处理，要求重新读取并再次检查
        setExpired(true);
        throw new WebApiError({
          status: 409,
          code: VERSION_CONFLICT_CODE,
          message: "配置版本不一致",
        });
      }
      setReport(result);
      setExpired(false);
    } catch (caught) {
      setCheckError(caught);
    } finally {
      setChecking(false);
    }
  };

  const reloadConfig = async () => {
    if (reloading || scope.hasDrafts) return;
    setReloading(true);
    setReloadError(null);
    setActionError(null);
    try {
      await scope.reload();
      // 快照已替换：旧的检查报告可能因此过期，需重新运行只读检查
      setCheckError(null);
      scope.setNotice("permissions.saved");
    } catch (caught) {
      setReloadError(caught);
    } finally {
      setReloading(false);
    }
  };

  const activateFlow = useConfirmFlow<CutoverRequest, void>({
    prepare: () => {
      setActionError(null);
      if (report === null) {
        throw new WebApiError({
          status: 409,
          code: VERSION_CONFLICT_CODE,
          message: "缺少准备检查报告",
        });
      }
      return {
        version: report.authorizationVersion,
        confirmation: modeChangeConfirmation(
          t,
          mode,
          "enabled",
          t("permissions.activateHelp"),
        ),
      };
    },
    submit: async (prepared) => {
      setActionError(null);
      if (prepared.version !== scope.bundle.version) {
        // 确认期间配置已变化：保留错误并要求重新检查，不自动重试
        setExpired(true);
        setActionError(
          new WebApiError({
            status: 409,
            code: VERSION_CONFLICT_CODE,
            message: "配置版本不一致",
          }),
        );
        return;
      }
      try {
        await scope.writes.activate(prepared.version);
        setReport(null);
        setExpired(false);
        scope.setNotice("permissions.activated");
      } catch (caught) {
        setActionError(caught);
        if (isVersionConflict(caught)) setExpired(true);
      }
    },
  });

  const suspendFlow = useConfirmFlow<CutoverRequest, void>({
    prepare: () => {
      setActionError(null);
      return {
        version: scope.bundle.version,
        confirmation: modeChangeConfirmation(
          t,
          "enabled",
          "suspended",
          t("permissions.suspendHelp"),
        ),
      };
    },
    submit: async (prepared) => {
      setActionError(null);
      if (prepared.version !== scope.bundle.version) {
        setActionError(
          new WebApiError({
            status: 409,
            code: VERSION_CONFLICT_CODE,
            message: "配置版本不一致",
          }),
        );
        return;
      }
      try {
        await scope.writes.suspend(prepared.version);
        setReport(null);
        setExpired(false);
        scope.setNotice("permissions.suspendedNotice");
      } catch (caught) {
        setActionError(caught);
      }
    },
  });

  if (!active) return null;

  return (
    <PageSection title={t("permissions.tabs.readiness")}>
      <SectionNote>{t("permissions.readinessHint")}</SectionNote>

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div>
            <span className={styles.mode}>{t(`permissions.mode.${mode}`)}</span>
            <p className={styles.version}>
              {`${t("permissions.version")}: ${scope.bundle.version}`}
            </p>
          </div>
          <ActionButton
            label={t("permissions.reload")}
            variant="secondary"
            busy={reloading}
            disabled={scope.hasDrafts || scope.busy || checking}
            {...(scope.hasDrafts
              ? { disabledReason: t("permissions.reloadWithDrafts") }
              : {})}
            onRun={() => {
              void reloadConfig();
            }}
          />
        </div>
        <p className={styles.inlineNote}>{t("permissions.reloadHelp")}</p>
        {scope.hasDrafts ? (
          <p className={styles.inlineNote}>
            {t("permissions.reloadWithDrafts")}
          </p>
        ) : null}
        {reloadError === null ? null : (
          <p className={styles.error} role="alert">
            {t(permissionsErrorKey(reloadError))}
          </p>
        )}
      </div>

      <div className={styles.actions}>
        <ActionButton
          label={t("permissions.check")}
          variant="secondary"
          busy={checking}
          disabled={scope.busy || reloading}
          onRun={() => {
            void runCheck();
          }}
        />
      </div>
      {checkError === null ? null : (
        <p className={styles.error} role="alert">
          {t(permissionsErrorKey(checkError))}
        </p>
      )}

      {report === null ? null : (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            {t(
              report.ready ? "permissions.reportReady" : "permissions.notReady",
            )}
          </h3>
          <p className={styles.version}>
            {`${t("permissions.reportVersion")}: ${report.authorizationVersion}`}
          </p>
          {report.ready ? (
            <p className={styles.inlineNote}>{t("permissions.noDataClaim")}</p>
          ) : null}
          {report.missing.length === 0 ? (
            <p className={styles.inlineNote}>{t("permissions.noIssues")}</p>
          ) : (
            <DataTable<ReadinessIssue>
              columns={[
                {
                  id: "issue",
                  header: t("permissions.issue"),
                  cell: (issue) => issueLabel(t, issue.code),
                },
                {
                  id: "target",
                  header: t("permissions.target"),
                  cell: (issue) =>
                    reportTarget(t, scope.bundle, issue.targetId),
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
              label={t("permissions.reportIssues")}
            />
          )}
          <h4 className={styles.subheading}>
            {t("permissions.accountsWithoutGrants")}
          </h4>
          {report.accountsWithoutGrants.length === 0 ? (
            <p className={styles.inlineNote}>{t("permissions.none")}</p>
          ) : (
            <ul
              className={styles.stack}
              aria-label={t("permissions.accountsWithoutGrants")}
            >
              {report.accountsWithoutGrants.map((id) => (
                <li key={id}>{reportTarget(t, scope.bundle, id)}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {mode === "enabled" || mode === "suspended" ? null : (
        <div className={styles.card}>
          <SectionNote>{t("permissions.activateHelp")}</SectionNote>
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
          {needsCheck ? (
            <p className={styles.inlineNote}>{t("permissions.checkFirst")}</p>
          ) : null}
        </div>
      )}

      {mode === "enabled" ? (
        <div className={styles.card}>
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
        </div>
      ) : null}

      {mode === "suspended" ? (
        <div className={styles.card}>
          <SectionNote>{t("permissions.suspendedHelp")}</SectionNote>
        </div>
      ) : null}

      {actionError === null ? null : (
        <p className={styles.error} role="alert">
          {t(permissionsErrorKey(actionError))}
        </p>
      )}

      <PermissionConfirmDialog<CutoverRequest>
        flow={activateFlow}
        title={t("permissions.activate")}
        confirmLabel={t("permissions.activateConfirm")}
        cancelLabel={t("permissions.cancel")}
      />
      <PermissionConfirmDialog<CutoverRequest>
        flow={suspendFlow}
        title={t("permissions.suspend")}
        confirmLabel={t("permissions.suspend")}
        cancelLabel={t("permissions.cancel")}
      />
    </PageSection>
  );
}
