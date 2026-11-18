import { useState } from "react";
import { Link, useSearchParams } from "react-router";

import type { WorkflowsSaveEnterpriseWorkflowResponse } from "@/api/generated/contract";
import { appPaths } from "@/app/paths";
import { AdminIcon } from "@/ui/AdminIcon";
import { AuthorizationSection } from "@/features/workflows/AuthorizationSection";
import { ConfigurationSection } from "@/features/workflows/ConfigurationSection";
import { ControlSection } from "@/features/workflows/ControlSection";
import { IntegrationSection } from "@/features/workflows/IntegrationSection";
import { StatusSection } from "@/features/workflows/StatusSection";
import { WorkflowEditDialog } from "@/features/workflows/WorkflowEditDialog";
import { RecordDetails } from "@/features/workflows/WorkflowRecordList";
import { createWorkflowSubmit } from "@/features/workflows/submitWorkflowEdit";
import {
  WorkflowEditError,
  type SubmitWorkflowEdit,
} from "@/features/workflows/recordEdits";
import type { WorkflowBundle, WorkflowClient } from "@/features/workflows/api";
import type {
  WorkflowStore,
  WorkflowType,
  WorkflowView,
} from "@/features/workflows/model";
import {
  configurationFor,
  defaultIntegrationConfiguration,
  sourceSettingsFor,
  workflowSourceProduct,
  workflowTypes,
} from "@/features/workflows/model";
import { useWorkflowText } from "@/features/workflows/text";

import styles from "@/features/workflows/Page.module.css";

type SavedView = WorkflowsSaveEnterpriseWorkflowResponse;
type ControlState = WorkflowView["controlState"];

interface ControlEdit {
  readonly original: ControlState;
  readonly state: ControlState;
  readonly reason: string;
  readonly trigger: HTMLElement | null;
}

export interface WorkflowEditorProps {
  readonly client: WorkflowClient;
  readonly enterpriseKey: string;
  readonly enterpriseName: string;
  readonly stores: readonly WorkflowStore[];
  readonly grantorNames: ReadonlyMap<string, string> | undefined;
  readonly bundle: WorkflowBundle;
  readonly onUpdateBundle: (
    next: WorkflowBundle | ((current: WorkflowBundle) => WorkflowBundle),
  ) => void;
}

function applySavedView(
  bundle: WorkflowBundle,
  saved: SavedView,
): WorkflowBundle {
  const views: Partial<Record<WorkflowType, WorkflowView>> = {
    ...bundle.views,
  };
  const current = views[saved.workflowType];
  if (
    current === undefined ||
    (current.version <= saved.version &&
      current.controlVersion <= saved.controlVersion)
  ) {
    views[saved.workflowType] = saved;
  }
  const integration =
    (bundle.integration?.version ?? 0) > saved.integration.version
      ? bundle.integration
      : saved.integration;
  if (integration !== null) {
    for (const type of workflowTypes) {
      const view = views[type];
      if (view !== undefined) views[type] = { ...view, integration };
    }
  }
  return {
    ...bundle,
    views,
    integration,
    needsConfiguration:
      saved.configuration === null ? bundle.needsConfiguration : false,
  };
}

export function WorkflowEditor({
  client,
  enterpriseKey,
  enterpriseName,
  stores,
  grantorNames,
  bundle,
  onUpdateBundle,
}: WorkflowEditorProps) {
  const { w } = useWorkflowText();
  const [params, setParams] = useSearchParams();
  const task = params.get("task");
  const selected =
    workflowTypes.find((type) => type === task) ?? workflowTypes[0];
  const [savedNotice, setSavedNotice] = useState<WorkflowType | null>(null);
  const [statusRevision, setStatusRevision] = useState(0);

  const view = bundle.views[selected];
  const configuration = configurationFor(bundle.views, selected);
  const product = workflowSourceProduct(selected);
  const integration =
    bundle.integration?.configuration ?? defaultIntegrationConfiguration();
  const saveEdit = createWorkflowSubmit({
    client,
    enterpriseKey,
    workflowType: selected,
    bundle,
    onRefresh: onUpdateBundle,
    onSaved: (saved) => {
      onUpdateBundle((current) => applySavedView(current, saved));
      setSavedNotice(selected);
      setStatusRevision((current) => current + 1);
    },
  });
  const submitEdit: SubmitWorkflowEdit = (edit) => {
    setSavedNotice(null);
    return saveEdit(edit);
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

      {savedNotice === selected ? (
        <p className={styles.success} role="status">
          {w("saved")}
        </p>
      ) : null}

      <nav className={styles.tabs} aria-label={w("title")}>
        {workflowTypes.map((type) => (
          <button
            key={type}
            type="button"
            className={styles.tab}
            aria-current={selected === type ? "page" : undefined}
            onClick={() => {
              const next = new URLSearchParams(params);
              next.set("task", type);
              setParams(next, { replace: true });
              setSavedNotice(null);
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
        key={`settings:${selected}`}
        configuration={configuration}
        configured={view?.configuration != null}
        accounts={integration.sourceAccounts.filter(
          (account) => account.product === "meituan_reviews",
        )}
        stores={stores}
        disabled={false}
        submitEdit={submitEdit}
      />

      {product === null ? null : (
        <IntegrationSection
          key={product}
          product={product}
          settings={sourceSettingsFor(integration, product)}
          stores={stores}
          bundle={bundle}
          submitEdit={submitEdit}
          disabled={false}
        />
      )}

      <AuthorizationSection
        key={`authorization:${selected}`}
        view={view}
        type={selected}
        stores={stores}
        grantorNames={grantorNames}
        submitEdit={submitEdit}
        disabled={false}
      />

      <WorkflowControls
        key={`controls:${selected}`}
        view={view}
        type={selected}
        submitEdit={submitEdit}
        showOrderScopeHelp={
          configuration.type === "meituan-daily-ingestion" &&
          configuration.datasets.includes("in_store_orders")
        }
      />

      <StatusSection
        key={`${view?.workflowId ?? "none"}:${statusRevision}`}
        client={client}
        view={view}
        revision={statusRevision}
      />
    </div>
  );
}

function WorkflowControls({
  view,
  type,
  submitEdit,
  showOrderScopeHelp,
}: {
  readonly view: WorkflowView | undefined;
  readonly type: WorkflowType;
  readonly submitEdit: SubmitWorkflowEdit;
  readonly showOrderScopeHelp: boolean;
}) {
  const { w } = useWorkflowText();
  const [reason, setReason] = useState("");
  const [edit, setEdit] = useState<ControlEdit | null>(null);

  return (
    <>
      <ControlSection
        view={view}
        reason={reason}
        onReasonChange={setReason}
        showOrderScopeHelp={showOrderScopeHelp}
        onRequest={(state) => {
          if (view === undefined) return;
          setEdit({
            original: view.controlState,
            state,
            reason,
            trigger:
              document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null,
          });
        }}
      />
      {edit === null ? null : (
        <WorkflowEditDialog
          title={w("preview")}
          description={w("confirmHelp")}
          actionLabel={w("confirm")}
          trigger={edit.trigger}
          onClose={() => setEdit(null)}
          onSaved={() => setReason("")}
          onSubmit={() =>
            submitEdit({
              before: { state: edit.original },
              after: { state: edit.state, reason: edit.reason },
              current: (latest) => ({
                state: latest.views[type]?.controlState ?? null,
              }),
              change: (latest) => {
                if (latest.views[type] === undefined)
                  throw new WorkflowEditError("recordMissing");
                return {
                  kind: "control",
                  state: edit.state,
                  reason: edit.reason,
                };
              },
            })
          }
        >
          <RecordDetails
            fields={[
              { label: w("before"), value: w(edit.original) },
              { label: w("after"), value: w(edit.state) },
              { label: w("reason"), value: edit.reason },
            ]}
          />
        </WorkflowEditDialog>
      )}
    </>
  );
}
