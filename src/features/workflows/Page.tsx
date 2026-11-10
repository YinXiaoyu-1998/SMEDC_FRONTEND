import { useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router";

import { useSession } from "@/api/session";
import { PageFrame } from "@/app/PageFrame";
import { appPaths } from "@/app/paths";
import { ActionButton } from "@/ui/ActionButton";
import { EnterprisePicker } from "@/features/workflows/EnterprisePicker";
import { ErrorNotice } from "@/features/workflows/ErrorNotice";
import { WorkflowEditor } from "@/features/workflows/WorkflowEditor";
import {
  listEnterprises,
  listStores,
  loadEnterpriseWorkflows,
  workflowQueryKeys,
  type WorkflowBundle,
  type WorkflowClient,
} from "@/features/workflows/api";
import { useWorkflowText } from "@/features/workflows/text";
import { useText } from "@/i18n/useText";

import styles from "@/features/workflows/Page.module.css";

export function WorkflowsPage() {
  const { t } = useText();
  const { w } = useWorkflowText();
  const params = useParams<"orgId" | "enterpriseKey">();
  const orgId = params.orgId ?? "";
  const enterpriseKey = params.enterpriseKey;
  const session = useSession().data;
  const queryClient = useQueryClient();

  const client = useMemo<WorkflowClient>(
    () => ({ orgId, csrfToken: session?.csrfToken ?? "" }),
    [orgId, session?.csrfToken],
  );
  const enabled = session !== null && session !== undefined && orgId !== "";

  const enterprisesQuery = useQuery({
    queryKey: workflowQueryKeys.enterprises(orgId),
    queryFn: () => listEnterprises(client),
    enabled,
    retry: false,
  });
  const storesQuery = useQuery({
    queryKey: workflowQueryKeys.stores(orgId),
    queryFn: () => listStores(client),
    enabled,
    retry: false,
  });

  const enterprise = enterprisesQuery.data?.enterprises.find(
    (item) => item.enterpriseKey === enterpriseKey,
  );
  const enterpriseKnown = enterprise !== undefined;

  const bundleQuery = useQuery({
    queryKey: workflowQueryKeys.bundle(orgId, enterpriseKey ?? ""),
    queryFn: () => loadEnterpriseWorkflows(client, enterpriseKey ?? ""),
    enabled: enabled && enterpriseKey !== undefined && enterpriseKnown,
    retry: false,
  });

  const updateBundle = useCallback(
    (next: WorkflowBundle) => {
      if (enterpriseKey === undefined) return;
      queryClient.setQueryData(
        workflowQueryKeys.bundle(orgId, enterpriseKey),
        next,
      );
    },
    [enterpriseKey, orgId, queryClient],
  );

  const reloadBundle = useCallback(async () => {
    const result = await bundleQuery.refetch();
    if (result.error !== null) throw result.error;
  }, [bundleQuery]);

  const stores = useMemo(
    () =>
      (storesQuery.data?.stores ?? [])
        .filter(
          (store) =>
            store.enterpriseKey === enterpriseKey &&
            (store.confirmation === undefined ||
              store.confirmation === "confirmed"),
        )
        .map((store) => ({
          name: store.officialName ?? store.name,
          retired: store.retired,
        })),
    [enterpriseKey, storesQuery.data],
  );

  let content: ReactNode = null;

  if (!enabled) {
    content = null;
  } else if (enterprisesQuery.isPending || storesQuery.isPending) {
    content = <p role="status">{w("loading")}</p>;
  } else if (enterprisesQuery.isError) {
    content = (
      <LoadFailure
        error={enterprisesQuery.error}
        onRetry={() => void enterprisesQuery.refetch()}
      />
    );
  } else if (storesQuery.isError) {
    content = (
      <LoadFailure
        error={storesQuery.error}
        onRetry={() => void storesQuery.refetch()}
      />
    );
  } else if (enterpriseKey === undefined) {
    content = (
      <EnterprisePicker
        client={client}
        enterprises={enterprisesQuery.data?.enterprises ?? []}
      />
    );
  } else if (!enterpriseKnown) {
    content = (
      <div className={styles.stack}>
        <p className={styles.error} role="alert">
          {w("expired")}
        </p>
        <Link to={appPaths.permissions(orgId)}>{w("permissionsLink")}</Link>
      </div>
    );
  } else if (bundleQuery.isPending) {
    content = <p role="status">{w("loading")}</p>;
  } else if (bundleQuery.isError) {
    content = (
      <LoadFailure
        error={bundleQuery.error}
        onRetry={() => void bundleQuery.refetch()}
      />
    );
  } else if (bundleQuery.data !== undefined) {
    content = (
      <WorkflowEditor
        client={client}
        enterpriseKey={enterpriseKey}
        enterpriseName={enterprise.enterpriseName}
        stores={stores}
        bundle={bundleQuery.data}
        onUpdateBundle={updateBundle}
        onReloadBundle={reloadBundle}
      />
    );
  }

  return (
    <PageFrame
      title={t("pages.workflows.title")}
      {...(orgId === "" ? {} : { orgId })}
    >
      {content}
    </PageFrame>
  );
}

function LoadFailure({
  error,
  onRetry,
}: {
  readonly error: unknown;
  readonly onRetry: () => void;
}) {
  const { w } = useWorkflowText();

  return (
    <div className={styles.stack}>
      <ErrorNotice error={error} />
      <div className={styles.actionsRow}>
        <ActionButton label={w("retry")} variant="secondary" onRun={onRetry} />
      </div>
    </div>
  );
}
