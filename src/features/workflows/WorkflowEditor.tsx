import { useMemo, useRef, useState } from "react";
import { Link } from "react-router";

import type {
  WorkflowsPrepareEnterpriseWorkflowChangeResponse,
  WorkflowsSaveEnterpriseWorkflowResponse,
} from "@/api/generated/contract";
import { appPaths } from "@/app/paths";
import { ActionButton } from "@/ui/ActionButton";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { ConflictPanel } from "@/ui/ConflictPanel";
import { useConfirmFlow } from "@/ui/useConfirmFlow";
import { useDraft } from "@/ui/useDraft";
import { stableSerialize } from "@/ui/stableSerialize";
import { AuthorizationSection } from "@/features/workflows/AuthorizationSection";
import { ConfigurationSection } from "@/features/workflows/ConfigurationSection";
import { ControlSection } from "@/features/workflows/ControlSection";
import { ErrorNotice } from "@/features/workflows/ErrorNotice";
import { IntegrationSection } from "@/features/workflows/IntegrationSection";
import { StatusSection } from "@/features/workflows/StatusSection";
import { Summary } from "@/features/workflows/Summary";
import {
  loadEnterpriseWorkflows,
  prepareWorkflowChange,
  saveWorkflowChange,
  type WorkflowBundle,
  type WorkflowClient,
} from "@/features/workflows/api";
import type {
  AuthorizationDraft,
  ConfigurationErrors,
  DraftState,
  IntegrationConfiguration,
  WorkflowChange,
  WorkflowConfiguration,
  WorkflowStore,
  WorkflowType,
  WorkflowView,
} from "@/features/workflows/model";
import {
  buildAuthorizationScope,
  defaultAuthorizationDraft,
  defaultConfiguration,
  defaultDraftState,
  defaultIntegrationConfiguration,
  expectedVersions,
  firstConfigurationError,
  isActiveAuthorization,
  isVersionConflict,
  validateConfiguration,
  workflowTypes,
} from "@/features/workflows/model";
import { useWorkflowText } from "@/features/workflows/text";

import styles from "@/features/workflows/Page.module.css";

type Prepared = WorkflowsPrepareEnterpriseWorkflowChangeResponse;

type SaveOutcome =
  | {
      readonly ok: true;
      readonly change: WorkflowChange;
      readonly saved: WorkflowsSaveEnterpriseWorkflowResponse;
    }
  | { readonly ok: false; readonly error: unknown };

interface ConflictSpec {
  readonly key: string;
  readonly serverValue: unknown;
  readonly draftValue: unknown;
}

interface ConflictState {
  readonly change: WorkflowChange;
  readonly fields: readonly ConflictSpec[];
}

export interface WorkflowEditorProps {
  readonly client: WorkflowClient;
  readonly enterpriseKey: string;
  readonly enterpriseName: string;
  readonly stores: readonly WorkflowStore[];
  readonly bundle: WorkflowBundle;
  readonly onUpdateBundle: (next: WorkflowBundle) => void;
  readonly onReloadBundle: () => Promise<void>;
}

function normalizeDraft(value: DraftState) {
  return {
    configurations: workflowTypes.map((type) =>
      comparableConfiguration(value.configurations[type]),
    ),
    integration: value.integration,
  };
}

function withRecordValue<T>(
  record: Record<WorkflowType, T>,
  type: WorkflowType,
  value: T,
): Record<WorkflowType, T> {
  return {
    "meituan-daily-ingestion":
      type === "meituan-daily-ingestion"
        ? value
        : record["meituan-daily-ingestion"],
    "meituan-review-operations":
      type === "meituan-review-operations"
        ? value
        : record["meituan-review-operations"],
    "weekly-business-report":
      type === "weekly-business-report"
        ? value
        : record["weekly-business-report"],
  };
}

function createAuthDrafts(): Record<WorkflowType, AuthorizationDraft> {
  return {
    "meituan-daily-ingestion": defaultAuthorizationDraft(
      "meituan-daily-ingestion",
    ),
    "meituan-review-operations": defaultAuthorizationDraft(
      "meituan-review-operations",
    ),
    "weekly-business-report": defaultAuthorizationDraft(
      "weekly-business-report",
    ),
  };
}

function createRevocations(): Record<WorkflowType, ReadonlySet<string>> {
  return {
    "meituan-daily-ingestion": new Set<string>(),
    "meituan-review-operations": new Set<string>(),
    "weekly-business-report": new Set<string>(),
  };
}

function createReasons(): Record<WorkflowType, string> {
  return {
    "meituan-daily-ingestion": "",
    "meituan-review-operations": "",
    "weekly-business-report": "",
  };
}

function comparableConfiguration(
  configuration: WorkflowConfiguration,
): Record<string, unknown> {
  if (configuration.type === "meituan-daily-ingestion") {
    return {
      storeNames: [...configuration.storeNames].sort(),
      datasets: [...configuration.datasets].sort(),
      orderScope: configuration.orderScope,
      cleanupPolicy: configuration.cleanupPolicy,
    };
  }
  if (configuration.type === "meituan-review-operations") {
    return {
      storeNames: [...configuration.storeNames].sort(),
      channels: [...configuration.channels].sort(),
      publication: {
        ...configuration.publication,
        storeNames: [...configuration.publication.storeNames].sort(),
      },
      brandFacts: configuration.brandFacts,
      tone: configuration.tone,
      ignoredReviewIdentities: configuration.ignoredReviewIdentities,
      draftNotification: {
        ...configuration.draftNotification,
        recipients: [...configuration.draftNotification.recipients].sort(),
      },
      cleanupPolicy: configuration.cleanupPolicy,
    };
  }
  return {
    storeNames: [...configuration.storeNames].sort(),
    groups: configuration.groups.map((group) => ({
      ...group,
      storeNames: [...group.storeNames].sort(),
    })),
    delivery: {
      ...configuration.delivery,
      recipients: [...configuration.delivery.recipients].sort(),
    },
    cleanupPolicy: configuration.cleanupPolicy,
  };
}

function comparableIntegration(
  configuration: IntegrationConfiguration,
): Record<string, unknown> {
  return {
    timezone: configuration.timezone,
    sourceAccounts: configuration.sourceAccounts,
    storeMappings: configuration.storeMappings,
    exclusions: configuration.exclusions,
  };
}

function diffFields(
  server: Record<string, unknown>,
  draft: Record<string, unknown>,
): ConflictSpec[] {
  const keys = [...new Set([...Object.keys(server), ...Object.keys(draft)])];
  const changed = keys
    .filter(
      (key) => stableSerialize(server[key]) !== stableSerialize(draft[key]),
    )
    .map((key) => ({
      key,
      serverValue: server[key],
      draftValue: draft[key],
    }));
  if (changed.length > 0) return changed;
  return keys.map((key) => ({
    key,
    serverValue: server[key],
    draftValue: draft[key],
  }));
}

function buildConflictFields(
  change: WorkflowChange,
  latestView: WorkflowView | undefined,
  latestIntegration: IntegrationConfiguration,
  draftState: DraftState,
  selected: WorkflowType,
): ConflictSpec[] {
  if (change.kind === "configuration") {
    return diffFields(
      comparableConfiguration(
        latestView?.configuration ?? defaultConfiguration(selected),
      ),
      comparableConfiguration(draftState.configurations[selected]),
    );
  }
  if (change.kind === "integration") {
    return diffFields(
      comparableIntegration(latestIntegration),
      comparableIntegration(draftState.integration),
    );
  }
  if (change.kind === "authorization") {
    return [
      {
        key: "authorizations",
        serverValue: latestView?.authorizations ?? [],
        draftValue: {
          grant: change.grant,
          revokeAuthorizationIds: change.revokeAuthorizationIds,
        },
      },
    ];
  }
  return [
    {
      key: "state",
      serverValue: latestView?.controlState ?? "notConfigured",
      draftValue: change.state,
    },
    { key: "reason", serverValue: "", draftValue: change.reason },
  ];
}

function applySavedView(
  bundle: WorkflowBundle,
  saved: WorkflowsSaveEnterpriseWorkflowResponse,
): WorkflowBundle {
  const views: Partial<Record<WorkflowType, WorkflowView>> = {
    ...bundle.views,
    [saved.workflowType]: saved,
  };
  for (const type of workflowTypes) {
    const view = views[type];
    if (view !== undefined) {
      views[type] = { ...view, integration: saved.integration };
    }
  }
  return {
    ...bundle,
    views,
    integration: saved.integration,
    needsConfiguration:
      saved.configuration === null ? bundle.needsConfiguration : false,
  };
}

export function WorkflowEditor({
  client,
  enterpriseKey,
  enterpriseName,
  stores,
  bundle,
  onUpdateBundle,
  onReloadBundle,
}: WorkflowEditorProps) {
  const { t, w } = useWorkflowText();
  const [selected, setSelected] = useState<WorkflowType>(
    "meituan-daily-ingestion",
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [pageError, setPageError] = useState<unknown>(null);
  const [authDrafts, setAuthDrafts] =
    useState<Record<WorkflowType, AuthorizationDraft>>(createAuthDrafts);
  const [revocations, setRevocations] =
    useState<Record<WorkflowType, ReadonlySet<string>>>(createRevocations);
  const [reasons, setReasons] =
    useState<Record<WorkflowType, string>>(createReasons);
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [reloading, setReloading] = useState(false);
  const [pendingKind, setPendingKind] = useState<WorkflowChange["kind"] | null>(
    null,
  );
  const [statusRevision, setStatusRevision] = useState(0);
  const [pendingAuthorization, setPendingAuthorization] = useState<
    "grant" | "revoke" | null
  >(null);
  const [pendingControl, setPendingControl] = useState<
    WorkflowView["controlState"] | null
  >(null);

  const changeRef = useRef<WorkflowChange | null>(null);
  const bindingRef = useRef<{
    readonly enterpriseKey: string;
    readonly workflowType: WorkflowType;
    readonly expectedVersion: number;
    readonly expectedIntegrationVersion: number;
    readonly expectedControlVersion: number;
  } | null>(null);

  const integrationConfiguration =
    bundle.integration?.configuration ?? defaultIntegrationConfiguration();
  const savedState = useMemo<DraftState>(
    () => defaultDraftState(bundle.views, integrationConfiguration),
    [bundle.views, integrationConfiguration],
  );
  const draft = useDraft<DraftState>(savedState, savedState, normalizeDraft);
  const draftState = draft.draft;
  const setDraft = draft.setDraft;

  const configuration = draftState.configurations[selected];
  const savedConfiguration = savedState.configurations[selected];
  const configurationDirty =
    stableSerialize(comparableConfiguration(configuration)) !==
    stableSerialize(comparableConfiguration(savedConfiguration));
  const integrationDirty =
    stableSerialize(draftState.integration) !==
    stableSerialize(savedState.integration);
  const configurationErrors: ConfigurationErrors =
    validateConfiguration(configuration);
  const firstError = firstConfigurationError(configurationErrors);

  const authDraft = authDrafts[selected];
  const revocationsForType = revocations[selected];
  const reason = reasons[selected];
  const view = bundle.views[selected];

  const setAuthDraft = (next: AuthorizationDraft) =>
    setAuthDrafts((current) => withRecordValue(current, selected, next));
  const setRevocationsForType = (next: ReadonlySet<string>) =>
    setRevocations((current) => withRecordValue(current, selected, next));
  const setReason = (next: string) =>
    setReasons((current) => withRecordValue(current, selected, next));

  const enterConflict = async (change: WorkflowChange | null) => {
    if (change === null) return;
    try {
      const latest = await loadEnterpriseWorkflows(client, enterpriseKey);
      onUpdateBundle(latest);
      const latestIntegration =
        latest.integration?.configuration ?? defaultIntegrationConfiguration();
      const latestView = latest.views[selected];
      const fields = buildConflictFields(
        change,
        latestView,
        latestIntegration,
        draft.draft,
        selected,
      );
      // 来源草稿也可能同时与服务器不同，一并列出，避免刷新后静默覆盖
      const integrationFields =
        change.kind !== "integration" &&
        stableSerialize(draft.draft.integration) !==
          stableSerialize(latestIntegration)
          ? buildConflictFields(
              { kind: "integration", configuration: draft.draft.integration },
              latestView,
              latestIntegration,
              draft.draft,
              selected,
            )
          : [];
      setConflict({
        change,
        fields: [...fields, ...integrationFields],
      });
      draft.markConflicting();
      setPageError(null);
    } catch (error) {
      setPageError(error);
    }
  };

  const applySaved = (
    saved: WorkflowsSaveEnterpriseWorkflowResponse,
    change: WorkflowChange,
  ) => {
    onUpdateBundle(applySavedView(bundle, saved));
    if (change.kind === "configuration") {
      const configuration = saved.configuration;
      if (configuration !== null) {
        setDraft((previous) => ({
          ...previous,
          configurations: withRecordValue(
            previous.configurations,
            saved.workflowType,
            configuration,
          ),
        }));
      }
    } else if (change.kind === "integration") {
      setDraft((previous) => ({
        ...previous,
        integration: saved.integration.configuration,
      }));
    } else if (change.kind === "authorization") {
      if (change.grant.length > 0) {
        setAuthDrafts((current) =>
          withRecordValue(
            current,
            saved.workflowType,
            defaultAuthorizationDraft(saved.workflowType),
          ),
        );
      }
      if (change.revokeAuthorizationIds.length > 0) {
        setRevocations((current) =>
          withRecordValue(current, saved.workflowType, new Set<string>()),
        );
      }
    } else {
      setReasons((current) => withRecordValue(current, saved.workflowType, ""));
    }
    setNotice("saved");
    setPageError(null);
    setConflict(null);
    draft.acknowledgeConflict();
    setStatusRevision((current) => current + 1);
  };

  const flow = useConfirmFlow<Prepared, SaveOutcome>({
    prepare: async () => {
      const change = changeRef.current;
      if (change === null) throw new Error("没有待提交的变更");
      const binding = {
        enterpriseKey,
        workflowType: selected,
        ...expectedVersions(
          bundle.views[selected],
          bundle.integration?.version ?? 0,
        ),
      };
      bindingRef.current = binding;
      try {
        return await prepareWorkflowChange(client, { ...binding, change });
      } catch (error) {
        if (isVersionConflict(error)) await enterConflict(change);
        throw error;
      }
    },
    submit: async (preview) => {
      const binding = bindingRef.current;
      if (binding === null) {
        return { ok: false, error: new Error("缺少预览绑定") };
      }
      try {
        const saved = await saveWorkflowChange(client, {
          ...binding,
          previewId: preview.previewId,
          confirmationDigest: preview.confirmationDigest,
        });
        return { ok: true, change: preview.change, saved };
      } catch (error) {
        return { ok: false, error };
      }
    },
    onSuccess: (outcome) => {
      if (!outcome.ok) {
        if (isVersionConflict(outcome.error)) {
          void enterConflict(changeRef.current);
        } else {
          setPageError(outcome.error);
        }
        return;
      }
      applySaved(outcome.saved, outcome.change);
    },
  });

  const busy = flow.isPreparing || flow.isSubmitting;
  const locked = flow.status !== "idle" || draft.status === "conflicting";

  const requestChange = (change: WorkflowChange) => {
    changeRef.current = change;
    setPendingKind(change.kind);
    setPageError(null);
    setNotice(null);
    void flow.request();
  };

  const handleRefresh = async () => {
    setPageError(null);
    setNotice(null);
    // 草稿未保存时先比较服务端最新值，绝不直接刷新基线后静默覆盖
    if (draft.status === "dirty") {
      const change: WorkflowChange | null = configurationDirty
        ? { kind: "configuration", configuration }
        : integrationDirty
          ? { kind: "integration", configuration: draftState.integration }
          : null;
      if (change !== null) {
        await enterConflict(change);
        return;
      }
    }
    try {
      await onReloadBundle();
      setStatusRevision((current) => current + 1);
    } catch (error) {
      setPageError(error);
    }
  };

  const handleConflictReload = async () => {
    setReloading(true);
    setPageError(null);
    try {
      const latest = await loadEnterpriseWorkflows(client, enterpriseKey);
      onUpdateBundle(latest);
      const latestIntegration =
        latest.integration?.configuration ?? defaultIntegrationConfiguration();
      setDraft(defaultDraftState(latest.views, latestIntegration));
      setAuthDrafts(createAuthDrafts());
      setRevocations(createRevocations());
      setReasons(createReasons());
      setConflict(null);
      setNotice(null);
      draft.acknowledgeConflict();
      setStatusRevision((current) => current + 1);
    } catch (error) {
      setPageError(error);
    } finally {
      setReloading(false);
    }
  };

  const handleConflictResubmit = () => {
    const pending = conflict;
    if (pending === null) return;
    setConflict(null);
    draft.acknowledgeConflict();
    requestChange(pending.change);
  };

  const handleSaveConfiguration = () => {
    if (firstError !== null) return;
    requestChange({ kind: "configuration", configuration });
  };

  const handleSaveIntegration = () => {
    requestChange({
      kind: "integration",
      configuration: draftState.integration,
    });
  };

  const handleRevoke = () => {
    const current = bundle.views[selected];
    if (current === undefined) return;
    const ids = current.authorizations
      .filter(
        (authorization) =>
          isActiveAuthorization(authorization) &&
          revocationsForType.has(authorization.authorizationId),
      )
      .map((authorization) => authorization.authorizationId);
    if (ids.length === 0) return;
    setPendingAuthorization("revoke");
    requestChange({
      kind: "authorization",
      grant: [],
      revokeAuthorizationIds: ids,
    });
  };

  const handleGrant = () => {
    const scope = buildAuthorizationScope(authDraft);
    if (scope === null) return;
    setPendingAuthorization("grant");
    requestChange({
      kind: "authorization",
      grant: [scope],
      revokeAuthorizationIds: [],
    });
  };

  const handleControl = (state: WorkflowView["controlState"]) => {
    if (reason.trim() === "") return;
    setPendingControl(state);
    requestChange({ kind: "control", state, reason });
  };

  const showOrderScopeHelp =
    selected === "meituan-daily-ingestion" &&
    configuration.type === "meituan-daily-ingestion" &&
    configuration.datasets.includes("in_store_orders");

  const beforeValue = (change: WorkflowChange): unknown => {
    if (change.kind === "configuration") {
      return bundle.views[selected]?.configuration ?? null;
    }
    if (change.kind === "integration") {
      return bundle.integration?.configuration ?? null;
    }
    if (change.kind === "authorization") {
      return { authorizations: bundle.views[selected]?.authorizations ?? [] };
    }
    return { state: bundle.views[selected]?.controlState ?? "paused" };
  };

  const afterValue = (prepared: Prepared): unknown => {
    const change = prepared.change;
    if (change.kind === "authorization") {
      const current = bundle.views[selected];
      const revokedScopes =
        current?.authorizations
          .filter((authorization) =>
            change.revokeAuthorizationIds.includes(
              authorization.authorizationId,
            ),
          )
          .map((authorization) => authorization.scope) ?? [];
      return { grant: change.grant, revokedScopes };
    }
    if (change.kind === "configuration" || change.kind === "integration") {
      return change.configuration;
    }
    return change;
  };

  return (
    <div className={styles.page}>
      <div className={styles.enterpriseHeader}>
        <div className={styles.stack}>
          <h2 className={styles.enterpriseName}>{enterpriseName}</h2>
          <p className={styles.hint}>{w("noReadAccess")}</p>
          <p className={styles.hint}>{w("installHelp")}</p>
        </div>
        <div className={styles.actionsRow}>
          <ActionButton
            label={w("refresh")}
            variant="secondary"
            busy={reloading}
            disabled={locked}
            onRun={() => void handleRefresh()}
          />
        </div>
      </div>

      {bundle.needsConfiguration ? (
        <div className={styles.notice}>
          <div className={styles.stack}>
            <p>{w("needsConfigurationNotice")}</p>
            <p>{w("createGuide")}</p>
            <Link to={appPaths.permissions(client.orgId)}>
              {w("permissionsLink")}
            </Link>
          </div>
        </div>
      ) : null}

      {notice === null ? null : (
        <p className={styles.success} role="status">
          {w(notice)}
        </p>
      )}
      <ErrorNotice error={pageError} />
      <ErrorNotice error={flow.error} />

      {conflict === null ? null : (
        <ConflictPanel
          title={t("ui.conflict.title")}
          description={w("conflict")}
          fields={conflict.fields.map((field) => ({
            key: field.key,
            label: w(field.key),
            serverValue: <Summary value={field.serverValue} />,
            draftValue: <Summary value={field.draftValue} />,
          }))}
          reloading={reloading}
          resubmitting={flow.isSubmitting}
          disabled={flow.status !== "idle" && !flow.isSubmitting}
          onReload={() => void handleConflictReload()}
          onResubmit={handleConflictResubmit}
        />
      )}

      <nav className={styles.tabs} aria-label={w("title")}>
        {workflowTypes.map((type) => (
          <button
            key={type}
            type="button"
            className={styles.tab}
            aria-current={selected === type ? "page" : undefined}
            disabled={locked}
            onClick={() => setSelected(type)}
          >
            {w(type)}
          </button>
        ))}
      </nav>

      {view === undefined ? null : (
        <p className={styles.hint}>
          {w("minimumLauncher")}: {view.capability.minimumLauncherVersion}
        </p>
      )}

      <IntegrationSection
        configuration={draftState.integration}
        stores={stores}
        disabled={locked}
        dirty={integrationDirty}
        busy={busy && pendingKind === "integration"}
        onChange={(integration) =>
          setDraft((previous) => ({ ...previous, integration }))
        }
        onRequest={handleSaveIntegration}
      />

      <ConfigurationSection
        configuration={configuration}
        accounts={draftState.integration.sourceAccounts}
        stores={stores}
        errors={configurationErrors}
        disabled={locked}
        dirty={configurationDirty}
        busy={busy && pendingKind === "configuration"}
        onRequest={handleSaveConfiguration}
        onChange={(next) =>
          setDraft((previous) => ({
            ...previous,
            configurations: withRecordValue(
              previous.configurations,
              selected,
              next,
            ),
          }))
        }
      />

      <AuthorizationSection
        view={view}
        type={selected}
        stores={stores}
        draft={authDraft}
        onDraftChange={setAuthDraft}
        revocations={revocationsForType}
        onRevocationsChange={setRevocationsForType}
        disabled={locked}
        revokeBusy={busy && pendingAuthorization === "revoke"}
        grantBusy={busy && pendingAuthorization === "grant"}
        onRevoke={handleRevoke}
        onGrant={handleGrant}
      />

      <ControlSection
        view={view}
        reason={reason}
        onReasonChange={setReason}
        showOrderScopeHelp={showOrderScopeHelp}
        disabled={locked}
        activeBusy={busy && pendingControl === "active"}
        pauseBusy={busy && pendingControl === "paused"}
        revokeBusy={busy && pendingControl === "revoked"}
        onRequest={handleControl}
      />

      <StatusSection
        key={`${view?.workflowId ?? "none"}:${statusRevision}`}
        client={client}
        view={view}
        revision={statusRevision}
      />

      <ConfirmDialog
        flow={flow}
        title={w("preview")}
        description={w("confirmHelp")}
        confirmLabel={w("confirm")}
        cancelLabel={w("cancel")}
      >
        {flow.prepared === null ? null : (
          <div className={styles.dialogBody}>
            <h3 className={styles.dialogHeading}>{w("before")}</h3>
            <Summary value={beforeValue(flow.prepared.change)} />
            <h3 className={styles.dialogHeading}>{w("after")}</h3>
            <Summary value={afterValue(flow.prepared)} />
            {flow.prepared.impact === undefined ? null : (
              <>
                <h3 className={styles.dialogHeading}>{w("impact")}</h3>
                <Summary value={flow.prepared.impact} />
              </>
            )}
            <p className={styles.hint}>
              {w("expires")}: {formatDateTime(flow.prepared.expiresAt)}
            </p>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
