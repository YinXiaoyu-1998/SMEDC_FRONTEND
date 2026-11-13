import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ActionButton } from "@/ui/ActionButton";
import { PageSection } from "@/ui/PageSection";
import { ErrorNotice } from "@/features/workflows/ErrorNotice";
import { Summary } from "@/features/workflows/Summary";
import {
  readActionIdentities,
  readWorkflowStatus,
  type WorkflowClient,
} from "@/features/workflows/api";
import type { WorkflowView } from "@/features/workflows/model";
import { useWorkflowText } from "@/features/workflows/text";

import styles from "@/features/workflows/Page.module.css";
import type { WorkflowsGetWorkflowStatusResponse } from "@/api/generated/contract";

type StatusPage = WorkflowsGetWorkflowStatusResponse;
type RunRecord = StatusPage["runs"][number];
type PendingAction = StatusPage["pendingActions"][number];
type Installation = StatusPage["installations"][number];

export interface StatusSectionProps {
  readonly client: WorkflowClient;
  readonly view: WorkflowView | undefined;
  readonly revision: number;
}

export function StatusSection({ client, view, revision }: StatusSectionProps) {
  const { w } = useWorkflowText();
  const workflowId = view?.workflowId;
  const [extraRuns, setExtraRuns] = useState<readonly RunRecord[]>([]);
  const [extraActions, setExtraActions] = useState<readonly PendingAction[]>(
    [],
  );
  const [runCursorState, setRunCursorState] = useState<{
    readonly cursor: string | null;
  } | null>(null);
  const [actionCursorState, setActionCursorState] = useState<{
    readonly cursor: string | null;
  } | null>(null);
  const [loadingMore, setLoadingMore] = useState<"runs" | "actions" | null>(
    null,
  );
  const [moreError, setMoreError] = useState<unknown>(null);

  const statusQuery = useQuery({
    queryKey: ["workflows", "status", client.orgId, workflowId, revision],
    enabled: workflowId !== undefined,
    retry: false,
    queryFn: async () => {
      if (workflowId === undefined) throw new Error("缺少任务标识");
      return readWorkflowStatus(client, { workflowId, limit: 25 });
    },
  });

  const runCursor =
    runCursorState === null
      ? (statusQuery.data?.nextCursor ?? null)
      : runCursorState.cursor;
  const actionCursor =
    actionCursorState === null
      ? (statusQuery.data?.nextActionCursor ?? null)
      : actionCursorState.cursor;

  const actions = [
    ...(statusQuery.data?.pendingActions ?? []),
    ...extraActions,
  ];
  const actionIds = actions.map((action) => action.actionId);
  const identityKey = actionIds.join(",");

  const identities = useQuery({
    queryKey: [
      "workflows",
      "action-identities",
      client.orgId,
      workflowId,
      identityKey,
    ],
    enabled: workflowId !== undefined && actionIds.length > 0,
    retry: false,
    staleTime: Infinity,
    queryFn: async () => {
      if (workflowId === undefined) throw new Error("缺少任务标识");
      return readActionIdentities(client, workflowId, actionIds);
    },
  });

  const runs = [...(statusQuery.data?.runs ?? []), ...extraRuns];

  const loadMoreRuns = async () => {
    if (workflowId === undefined || runCursor === null) return;
    setLoadingMore("runs");
    setMoreError(null);
    try {
      const page = await readWorkflowStatus(client, {
        workflowId,
        cursor: runCursor,
        limit: 25,
      });
      setExtraRuns((current) => [...current, ...page.runs]);
      setRunCursorState({ cursor: page.nextCursor });
    } catch (error) {
      setMoreError(error);
    } finally {
      setLoadingMore(null);
    }
  };

  const loadMoreActions = async () => {
    if (workflowId === undefined || actionCursor === null) return;
    setLoadingMore("actions");
    setMoreError(null);
    try {
      const page = await readWorkflowStatus(client, {
        workflowId,
        actionCursor,
        limit: 25,
      });
      setExtraActions((current) => [...current, ...page.pendingActions]);
      setActionCursorState({ cursor: page.nextActionCursor });
    } catch (error) {
      setMoreError(error);
    } finally {
      setLoadingMore(null);
    }
  };

  if (view === undefined || workflowId === undefined) {
    return (
      <PageSection title={w("status")} description={w("statusHelp")}>
        <p className={styles.hint}>{w("statusUnavailable")}</p>
      </PageSection>
    );
  }

  const status = statusQuery.data;
  const designated = status?.installations.find(
    (installation) =>
      installation.installationId === status.assignedInstallationId,
  );

  return (
    <PageSection title={w("status")} description={w("statusHelp")}>
      {statusQuery.isPending ? <p role="status">{w("loading")}</p> : null}
      <ErrorNotice error={statusQuery.error} />

      {status === undefined ? null : (
        <div className={styles.stack}>
          <p className={styles.hint}>
            {w("observedAt")}: {formatDateTime(status.observedAt)}
          </p>
          {status.possibleMissedWindow ? (
            <p className={styles.notice}>{w("possibleMissed")}</p>
          ) : null}

          <p>
            <strong>{w("designated")}</strong>:{" "}
            {designated?.deviceAlias ?? w("notAssigned")}
          </p>

          {status.installations.length === 0 ? (
            <div className={styles.stack}>
              <p className={styles.hint}>{w("not_installed")}</p>
              <p className={styles.hint}>{w("installHelp")}</p>
            </div>
          ) : (
            status.installations.map((installation) => (
              <InstallationPanel
                installation={installation}
                key={installation.installationId}
              />
            ))
          )}

          <div className={styles.stack}>
            <h3 className={styles.subheading}>{w("pendingActions")}</h3>
            <p className={styles.hint}>{w("pendingHelp")}</p>
            {actions.length === 0 ? (
              <p className={styles.hint}>{w("pendingEmpty")}</p>
            ) : (
              actions.map((action) => (
                <div className={styles.subpanel} key={action.actionId}>
                  <p>{w(action.state)}</p>
                  <small>{formatDateTime(action.updatedAt)}</small>
                  {identities.data?.get(action.actionId) !== undefined ? (
                    <Summary value={identities.data.get(action.actionId)} />
                  ) : identities.isPending ? null : (
                    <p className={styles.hint}>{w("unavailable")}</p>
                  )}
                </div>
              ))
            )}
            {actionCursor === null ? null : (
              <ActionButton
                label={w("more")}
                variant="secondary"
                busy={loadingMore === "actions"}
                disabled={loadingMore !== null}
                onRun={() => void loadMoreActions()}
              />
            )}
          </div>

          <div className={styles.stack}>
            <h3 className={styles.subheading}>{w("runs")}</h3>
            {runs.length === 0 ? (
              <p className={styles.hint}>{w("runsEmpty")}</p>
            ) : (
              runs.map((run) => (
                <div className={styles.runRow} key={run.id}>
                  <span>{w(run.status)}</span>
                  <span>
                    {w("window")}: {run.startDate} – {run.endDate}
                  </span>
                </div>
              ))
            )}
            {runCursor === null ? null : (
              <ActionButton
                label={w("more")}
                variant="secondary"
                busy={loadingMore === "runs"}
                disabled={loadingMore !== null}
                onRun={() => void loadMoreRuns()}
              />
            )}
          </div>

          <ErrorNotice error={moreError} />
        </div>
      )}
    </PageSection>
  );
}

function InstallationPanel({
  installation,
}: {
  readonly installation: Installation;
}) {
  const { w } = useWorkflowText();
  const checks = installation.readinessChecks ?? [];
  const host = installation.hostSnapshot;

  return (
    <div className={styles.subpanel}>
      <h3 className={styles.subheading}>{installation.deviceAlias}</h3>
      <p>{w(installation.state)}</p>
      <p>
        {w("firstRun")}: {w(installation.firstRunVerification)}
      </p>

      <h4 className={styles.subheading}>{w("preparation")}</h4>
      {checks.length === 0 ? (
        <p className={styles.hint}>{w("not_checked")}</p>
      ) : (
        checks.map((check) => (
          <div className={styles.subpanel} key={check.capability}>
            <strong>{w(check.capability)}</strong>
            <p>{w(check.status)}</p>
            {check.sampleStatus === undefined ? null : (
              <p className={styles.hint}>{w(check.sampleStatus)}</p>
            )}
            <p>
              {w("nextStep")}: {check.nextStep}
            </p>
            <small>
              {w("checkedAt")}: {formatDateTime(check.checkedAt)}
            </small>
          </div>
        ))
      )}

      {host === null ? null : (
        <div className={styles.stack}>
          <h4 className={styles.subheading}>{w("schedule")}</h4>
          <Summary
            value={{
              host: host.host === "dsh" ? "DeepSeek Harness" : "Codex",
              cron: host.cron,
              host_timezone: host.timezone,
              model: host.model,
              reasoningEffort: host.reasoningEffort,
              state: host.state,
              verifiedAt: host.verifiedAt,
            }}
          />
        </div>
      )}
    </div>
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
