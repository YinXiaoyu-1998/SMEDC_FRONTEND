import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";

import type {
  WorkflowsPrepareEnterpriseWorkflowChangeResponse,
  WorkflowsSaveEnterpriseWorkflowResponse,
} from "@/api/generated/contract";
import { appPaths } from "@/app/paths";
import theme from "@/styles/AdminTheme.module.css";
import { AdminIcon } from "@/ui/AdminIcon";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { ConflictPanel } from "@/ui/ConflictPanel";
import { useConfirmFlow } from "@/ui/useConfirmFlow";
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
  SourceProduct,
  SourceSettings,
  WorkflowChange,
  WorkflowConfiguration,
  WorkflowStore,
  WorkflowType,
  WorkflowView,
} from "@/features/workflows/model";
import {
  buildAuthorizationScope,
  configurationFor,
  defaultAuthorizationDraft,
  defaultIntegrationConfiguration,
  expectedVersions,
  firstConfigurationError,
  isActiveAuthorization,
  isVersionConflict,
  replaceSourceSettings,
  sourceSettingsFor,
  validateConfiguration,
  workflowSourceProduct,
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

interface ConfigurationDraft {
  readonly configuration: WorkflowConfiguration;
  readonly version: number;
}

interface SourceDraft {
  readonly base: SourceSettings;
  readonly version: number;
  readonly settings: SourceSettings;
}

interface WorkflowRequest {
  readonly change: WorkflowChange;
  readonly binding: Omit<Parameters<typeof prepareWorkflowChange>[1], "change">;
}

interface ConflictState {
  readonly workflowType: WorkflowType;
  readonly latest: WorkflowBundle;
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
  latest: WorkflowBundle,
  selected: WorkflowType,
): ConflictSpec[] {
  const latestView = latest.views[selected];
  if (change.kind === "configuration") {
    return diffFields(
      comparableConfiguration(configurationFor(latest.views, selected)),
      comparableConfiguration(change.configuration),
    );
  }
  if (change.kind === "integration") {
    const product = workflowSourceProduct(selected);
    if (product === null) return [];
    return diffFields(
      sourceSettingsFor(
        latest.integration?.configuration ?? defaultIntegrationConfiguration(),
        product,
      ),
      sourceSettingsFor(change.configuration, product),
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
}: WorkflowEditorProps) {
  const { t, w } = useWorkflowText();
  const [searchParams, setSearchParams] = useSearchParams();
  const task = searchParams.get("task");
  const selected =
    workflowTypes.find((type) => type === task) ?? workflowTypes[0];
  const [configurationDrafts, setConfigurationDrafts] = useState<
    Partial<Record<WorkflowType, ConfigurationDraft>>
  >({});
  const [sourceDrafts, setSourceDrafts] = useState<
    Partial<Record<SourceProduct, SourceDraft>>
  >({});
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

  const requestRef = useRef<WorkflowRequest | null>(null);

  const integrationConfiguration =
    bundle.integration?.configuration ?? defaultIntegrationConfiguration();
  const integrationVersion = bundle.integration?.version ?? 0;
  const product = workflowSourceProduct(selected);
  const savedSources =
    product === null
      ? null
      : sourceSettingsFor(integrationConfiguration, product);
  const sourceDraft = product === null ? undefined : sourceDrafts[product];
  const sources = sourceDraft?.settings ?? savedSources;
  const integrationDirty =
    sourceDraft !== undefined &&
    stableSerialize(sourceDraft.settings) !== stableSerialize(savedSources);
  const configurationDraft = configurationDrafts[selected];
  const savedConfiguration = configurationFor(bundle.views, selected);
  const configuration = configurationDraft?.configuration ?? savedConfiguration;
  const configurationDirty =
    stableSerialize(comparableConfiguration(configuration)) !==
    stableSerialize(comparableConfiguration(savedConfiguration));
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

  const enterConflict = async (request: WorkflowRequest) => {
    try {
      const latest = await loadEnterpriseWorkflows(client, enterpriseKey);
      onUpdateBundle(latest);
      const { change } = request;
      const { workflowType } = request.binding;
      setConflict({
        change,
        latest,
        workflowType,
        fields: buildConflictFields(change, latest, workflowType),
      });
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
      setConfigurationDrafts((previous) => ({
        ...previous,
        [saved.workflowType]: undefined,
      }));
    } else if (change.kind === "integration") {
      const savedProduct = workflowSourceProduct(saved.workflowType);
      if (savedProduct !== null) {
        setSourceDrafts((previous) => ({
          ...previous,
          [savedProduct]: undefined,
        }));
      }
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
    setStatusRevision((current) => current + 1);
  };

  const flow = useConfirmFlow<Prepared, SaveOutcome>({
    prepare: async () => {
      const request = requestRef.current;
      if (request === null) throw new Error("没有待提交的变更");
      try {
        return await prepareWorkflowChange(client, {
          ...request.binding,
          change: request.change,
        });
      } catch (error) {
        if (isVersionConflict(error)) await enterConflict(request);
        throw error;
      }
    },
    submit: async (preview) => {
      const request = requestRef.current;
      if (request === null) {
        return { ok: false, error: new Error("缺少预览绑定") };
      }
      try {
        const saved = await saveWorkflowChange(client, {
          ...request.binding,
          previewId: preview.previewId,
          confirmationDigest: preview.confirmationDigest,
        });
        return { ok: true, change: preview.change, saved };
      } catch (error) {
        if (isVersionConflict(error)) await enterConflict(request);
        return { ok: false, error };
      }
    },
    onSuccess: (outcome) => {
      if (!outcome.ok) {
        if (!isVersionConflict(outcome.error)) setPageError(outcome.error);
        return;
      }
      applySaved(outcome.saved, outcome.change);
    },
  });

  const busy = flow.isPreparing || flow.isSubmitting;
  const locked = flow.status !== "idle" || conflict !== null;

  const requestChange = (
    change: WorkflowChange,
    base = bundle,
    workflowType = selected,
    versions: Partial<ReturnType<typeof expectedVersions>> = {},
  ) => {
    requestRef.current = {
      change,
      binding: {
        enterpriseKey,
        workflowType,
        ...expectedVersions(
          base.views[workflowType],
          base.integration?.version ?? 0,
        ),
        ...versions,
      },
    };
    setPendingKind(change.kind);
    setPageError(null);
    setNotice(null);
    void flow.request();
  };

  const handleConflictReload = async () => {
    if (conflict === null) return;
    setReloading(true);
    setPageError(null);
    try {
      const latest = await loadEnterpriseWorkflows(client, enterpriseKey);
      onUpdateBundle(latest);
      const { change, workflowType } = conflict;
      const conflictProduct = workflowSourceProduct(workflowType);
      if (change.kind === "integration" && conflictProduct !== null) {
        setSourceDrafts((previous) => ({
          ...previous,
          [conflictProduct]: undefined,
        }));
      } else if (change.kind === "configuration") {
        setConfigurationDrafts((previous) => ({
          ...previous,
          [workflowType]: undefined,
        }));
      } else if (change.kind === "authorization") {
        setAuthDrafts((previous) =>
          withRecordValue(
            previous,
            workflowType,
            defaultAuthorizationDraft(workflowType),
          ),
        );
        setRevocations((previous) =>
          withRecordValue(previous, workflowType, new Set<string>()),
        );
      } else if (change.kind === "control") {
        setReasons((previous) => withRecordValue(previous, workflowType, ""));
      }
      flow.clearError();
      setConflict(null);
      setNotice(null);
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
    const { change, latest, workflowType } = pending;
    const conflictProduct = workflowSourceProduct(workflowType);
    setConflict(null);
    if (change.kind === "integration" && conflictProduct !== null) {
      requestChange(
        {
          kind: "integration",
          configuration: replaceSourceSettings(
            latest.integration?.configuration ??
              defaultIntegrationConfiguration(),
            conflictProduct,
            sourceSettingsFor(change.configuration, conflictProduct),
          ),
        },
        latest,
        workflowType,
      );
      return;
    }
    requestChange(change, latest, workflowType);
  };

  const handleSaveConfiguration = () => {
    if (
      firstError !== null ||
      configurationDraft === undefined ||
      !configurationDirty
    )
      return;
    requestChange({ kind: "configuration", configuration }, bundle, selected, {
      expectedVersion: configurationDraft.version,
    });
  };

  const updateSources = (settings: SourceSettings) => {
    if (product === null || savedSources === null) return;
    setSourceDrafts((previous) => {
      const current = previous[product];
      return {
        ...previous,
        [product]:
          stableSerialize(settings) === stableSerialize(savedSources)
            ? undefined
            : {
                base: current?.base ?? savedSources,
                version: current?.version ?? integrationVersion,
                settings,
              },
      };
    });
  };

  const handleSaveIntegration = () => {
    if (product === null || sourceDraft === undefined || !integrationDirty)
      return;
    // A background refresh may advance the version while a source draft is open.
    // Only reuse that version if this product is unchanged.
    const version =
      stableSerialize(sourceDraft.base) === stableSerialize(savedSources)
        ? integrationVersion
        : sourceDraft.version;
    requestChange(
      {
        kind: "integration",
        configuration: replaceSourceSettings(
          integrationConfiguration,
          product,
          sourceDraft.settings,
        ),
      },
      bundle,
      selected,
      { expectedIntegrationVersion: version },
    );
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
    const scope = buildAuthorizationScope(selected, authDraft);
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
      return product === null
        ? null
        : sourceSettingsFor(integrationConfiguration, product);
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
    if (change.kind === "integration" && product !== null) {
      return sourceSettingsFor(change.configuration, product);
    }
    if (change.kind === "configuration") {
      return change.configuration;
    }
    return change;
  };

  return (
    <div className={styles.page}>
      <div className={styles.enterpriseHeader}>
        <span className={styles.enterpriseIcon}>
          <AdminIcon name="building" />
        </span>
        <div className={styles.enterpriseInfo}>
          <h2 className={styles.enterpriseName}>{enterpriseName}</h2>
          <p className={styles.hint}>{w("noReadAccess")}</p>
          <p className={styles.hint}>{w("installHelp")}</p>
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
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.set("task", type);
              setSearchParams(next, { replace: true });
              setNotice(null);
            }}
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

      <ConfigurationSection
        configuration={configuration}
        accounts={sources?.sourceAccounts ?? []}
        stores={stores}
        errors={configurationErrors}
        disabled={locked}
        dirty={configurationDirty}
        busy={busy && pendingKind === "configuration"}
        onRequest={handleSaveConfiguration}
        onChange={(next) =>
          setConfigurationDrafts((previous) => ({
            ...previous,
            [selected]:
              stableSerialize(comparableConfiguration(next)) ===
              stableSerialize(comparableConfiguration(savedConfiguration))
                ? undefined
                : {
                    configuration: next,
                    version: previous[selected]?.version ?? view?.version ?? 0,
                  },
          }))
        }
      />

      {product !== null && sources !== null && savedSources !== null ? (
        <IntegrationSection
          key={product}
          product={product}
          settings={sources}
          limits={{
            sourceAccounts:
              100 -
              integrationConfiguration.sourceAccounts.length +
              savedSources.sourceAccounts.length,
            storeMappings:
              2000 -
              integrationConfiguration.storeMappings.length +
              savedSources.storeMappings.length,
            exclusions:
              2000 -
              integrationConfiguration.exclusions.length +
              savedSources.exclusions.length,
          }}
          stores={stores}
          disabled={locked}
          dirty={integrationDirty}
          busy={busy && pendingKind === "integration"}
          onChange={updateSources}
          onRequest={handleSaveIntegration}
        />
      ) : null}

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
        className={theme.theme}
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
