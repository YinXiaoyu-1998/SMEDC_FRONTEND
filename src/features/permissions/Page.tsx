import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useParams } from "react-router";

import { WebApiError } from "@/api/client";
import {
  loadPermissionsBundle,
  permissionsQueryKey,
  readCutover,
  type PermissionsBundle,
} from "@/api/permissions";
import { useSession } from "@/api/session";
import { PageFrame } from "@/app/PageFrame";
import { useText } from "@/i18n/useText";
import { ActionButton } from "@/ui/ActionButton";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { InlineError } from "@/ui/InlineError";
import { PageSection } from "@/ui/PageSection";
import { useConfirmFlow } from "@/ui/useConfirmFlow";

import { AccountsSection } from "./Accounts";
import { CategoriesSection } from "./Categories";
import { sectionKeys, type SectionKey } from "./constants";
import { DocumentsSection } from "./Documents";
import { DimensionsSection } from "./Dimensions";
import { permissionsErrorKey } from "./errorKeys";
import styles from "./Permissions.module.css";
import { ReadinessSection } from "./Readiness";
import { PermissionsScopeContext } from "./scope";
import { StoresSection } from "./Stores";
import { usePermissionsWrites } from "./writes";

export function PermissionsPage() {
  const { t } = useText();
  const params = useParams<"orgId">();
  const session = useSession().data;
  const orgId = params.orgId ?? session?.identity.orgId ?? "";

  if (session === null || session === undefined) {
    return null;
  }

  return (
    <PageFrame title={t("pages.permissions.title")} orgId={orgId}>
      <PermissionsContent orgId={orgId} csrfToken={session.csrfToken} />
    </PageFrame>
  );
}

function PermissionsContent({
  orgId,
  csrfToken,
}: {
  readonly orgId: string;
  readonly csrfToken: string;
}) {
  const { t } = useText();
  const queryKey = useMemo(() => permissionsQueryKey(orgId), [orgId]);
  const query = useQuery<PermissionsBundle>({
    queryKey,
    queryFn: () => loadPermissionsBundle(orgId),
    retry: false,
  });
  const writes = usePermissionsWrites({ orgId, csrfToken, queryKey });
  const { refetch } = query;

  const reload = useCallback(async (): Promise<PermissionsBundle> => {
    const result = await refetch();
    if (result.error !== null) {
      throw result.error;
    }
    if (result.data === undefined) {
      throw new WebApiError({
        status: 0,
        code: "INVALID_RESPONSE",
        message: "配置快照缺失",
      });
    }
    return result.data;
  }, [refetch]);

  const readCutoverValue = useCallback(() => readCutover(orgId), [orgId]);

  if (query.isPending) {
    return (
      <PageSection title={t("permissions.tabs.categories")}>
        <p role="status" className={styles.status}>
          {t("permissions.loading")}
        </p>
      </PageSection>
    );
  }

  if (query.isError || query.data === undefined) {
    return (
      <PageSection title={t("permissions.reload")}>
        <p role="alert" className={styles.error}>
          {t(permissionsErrorKey(query.error))}
        </p>
        <div className={styles.actions}>
          <ActionButton
            label={t("permissions.reload")}
            busy={query.isFetching}
            onRun={() => {
              void refetch();
            }}
          />
        </div>
      </PageSection>
    );
  }

  return (
    <PermissionsReady
      bundle={query.data}
      writes={writes}
      reload={reload}
      readCutover={readCutoverValue}
      orgId={orgId}
    />
  );
}

function PermissionsReady({
  bundle,
  writes,
  reload,
  readCutover: readCutoverValue,
  orgId,
}: {
  readonly bundle: PermissionsBundle;
  readonly writes: ReturnType<typeof usePermissionsWrites>;
  readonly reload: () => Promise<PermissionsBundle>;
  readonly readCutover: () => Promise<Awaited<ReturnType<typeof readCutover>>>;
  readonly orgId: string;
}) {
  const { t } = useText();
  const [active, setActive] = useState<SectionKey>("categories");
  const [notice, setNotice] = useState<string | null>(null);
  const [dirtyIds, setDirtyIds] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );
  const [reloading, setReloading] = useState(false);
  const [reloadError, setReloadError] = useState<unknown>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const registerDraft = useCallback((id: string, dirty: boolean) => {
    setDirtyIds((previous) => {
      const current = previous.has(id);
      if (current === dirty) return previous;
      const next = new Set(previous);
      if (dirty) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const navigate = useCallback((section: SectionKey) => {
    setActive(section);
  }, []);

  const hasDrafts = dirtyIds.size > 0;

  const runReload = async () => {
    setReloading(true);
    setReloadError(null);
    try {
      await reload();
    } catch (caught) {
      setReloadError(caught);
    } finally {
      setReloading(false);
    }
  };

  const reloadFlow = useConfirmFlow<void, void>({
    prepare: () => undefined,
    submit: async () => {
      await reload();
    },
  });

  const requestReload = () => {
    if (hasDrafts) {
      void reloadFlow.request();
      return;
    }
    void runReload();
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const last = sectionKeys.length - 1;
    let next = -1;
    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    if (next < 0) return;
    event.preventDefault();
    const target = sectionKeys[next];
    if (target !== undefined) setActive(target);
    tabRefs.current[next]?.focus();
  };

  const scopeValue = useMemo(
    () => ({
      orgId,
      bundle,
      busy: writes.busy,
      hasDrafts,
      writes,
      reload,
      readCutover: readCutoverValue,
      registerDraft,
      setNotice,
      navigate,
    }),
    [
      orgId,
      bundle,
      hasDrafts,
      writes,
      reload,
      readCutoverValue,
      registerDraft,
      navigate,
    ],
  );

  return (
    <PermissionsScopeContext.Provider value={scopeValue}>
      <div className={styles.pageHeader}>
        <span className={styles.mode}>
          {t(`permissions.mode.${bundle.me.mode}`)}
        </span>
        <span className={styles.version}>
          {t("permissions.version")}: {bundle.version}
        </span>
        <ActionButton
          label={t("permissions.reload")}
          variant="secondary"
          busy={reloading || reloadFlow.isSubmitting}
          onRun={requestReload}
        />
      </div>
      <p className={styles.intro}>{t("permissions.intro")}</p>
      {notice === null ? null : (
        <p className={styles.notice} role="alert">
          {t(notice)}
        </p>
      )}
      <InlineError error={reloadError} />

      <nav
        className={styles.tabs}
        role="tablist"
        aria-label={t("permissions.tabs.label")}
      >
        {sectionKeys.map((key, index) => (
          <button
            key={key}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`permissions-tab-${key}`}
            aria-controls={`permissions-panel-${key}`}
            aria-selected={active === key}
            tabIndex={active === key ? 0 : -1}
            className={
              active === key ? `${styles.tab} ${styles.tabActive}` : styles.tab
            }
            onKeyDown={(event) => {
              handleTabKeyDown(event, index);
            }}
            onClick={() => {
              setActive(key);
            }}
          >
            {t(`permissions.tabs.${key}`)}
          </button>
        ))}
      </nav>

      <div
        id="permissions-panel-categories"
        role="tabpanel"
        aria-labelledby="permissions-tab-categories"
        hidden={active !== "categories"}
      >
        <CategoriesSection />
      </div>
      <div
        id="permissions-panel-stores"
        role="tabpanel"
        aria-labelledby="permissions-tab-stores"
        hidden={active !== "stores"}
      >
        <StoresSection />
      </div>
      <div
        id="permissions-panel-dimensions"
        role="tabpanel"
        aria-labelledby="permissions-tab-dimensions"
        hidden={active !== "dimensions"}
      >
        <DimensionsSection />
      </div>
      <div
        id="permissions-panel-accounts"
        role="tabpanel"
        aria-labelledby="permissions-tab-accounts"
        hidden={active !== "accounts"}
      >
        <AccountsSection />
      </div>
      <div
        id="permissions-panel-documents"
        role="tabpanel"
        aria-labelledby="permissions-tab-documents"
        hidden={active !== "documents"}
      >
        <DocumentsSection active={active === "documents"} />
      </div>
      <div
        id="permissions-panel-readiness"
        role="tabpanel"
        aria-labelledby="permissions-tab-readiness"
        hidden={active !== "readiness"}
      >
        <ReadinessSection />
      </div>

      <ConfirmDialog
        flow={reloadFlow}
        title={t("permissions.discard.title")}
        description={t("permissions.discard.description")}
        confirmLabel={t("permissions.discard.action")}
        cancelLabel={t("permissions.discard.keep")}
      />
    </PermissionsScopeContext.Provider>
  );
}
