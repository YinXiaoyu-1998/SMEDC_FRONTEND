import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
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
import { PageSection } from "@/ui/PageSection";
import { useConfirmFlow } from "@/ui/useConfirmFlow";

import { AccountsSection } from "./Accounts";
import { CategoriesSection } from "./Categories";
import { sectionKeys, type SectionKey } from "./constants";
import { DimensionsSection } from "./Dimensions";
import { DocumentsSection } from "./Documents";
import { permissionsErrorKey } from "./errorKeys";
import styles from "./Permissions.module.css";
import { ReadinessSection } from "./Readiness";
import { PermissionsScopeContext } from "./scope";
import { StoresSection } from "./Stores";
import { usePermissionsWrites } from "./writes";

export function PermissionsPage() {
  const params = useParams<"orgId">();
  const session = useSession().data;
  const orgId = params.orgId ?? session?.identity.orgId ?? "";

  if (session === null || session === undefined) {
    return null;
  }

  return (
    <PageFrame orgId={orgId}>
      <PermissionsContent orgId={orgId} csrfToken={session.csrfToken} />
    </PageFrame>
  );
}

function PageHeader({
  action,
}: {
  readonly action?: { readonly label: string; readonly run: () => void };
}) {
  const { t } = useText();
  return (
    <header className={styles.titlebar}>
      <div>
        <h1 className={styles.pageTitle}>{t("pages.permissions.title")}</h1>
        <p className={styles.subtitle}>{t("permissions.subtitle")}</p>
      </div>
      {action === undefined ? null : (
        <ActionButton label={action.label} onRun={action.run} />
      )}
    </header>
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
      <>
        <PageHeader />
        <PageSection title={t("permissions.tabs.categories")}>
          <p role="status" className={styles.status}>
            {t("permissions.loading")}
          </p>
        </PageSection>
      </>
    );
  }

  if (query.isError || query.data === undefined) {
    return (
      <>
        <PageHeader />
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
      </>
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

const primaryActionKeys: Partial<Record<SectionKey, string>> = {
  categories: "permissions.addCategory",
  dimensions: "permissions.addDimension",
  stores: "permissions.declareEnterprise",
};

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
  const [draftEpoch, setDraftEpoch] = useState(0);
  const [createSignal, setCreateSignal] = useState(0);
  const [dirtyIds, setDirtyIds] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );
  const pendingSection = useRef<SectionKey | null>(null);
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

  const hasDrafts = dirtyIds.size > 0;

  const discardDrafts = useCallback(() => {
    setDraftEpoch((epoch) => epoch + 1);
    setDirtyIds(new Set<string>());
  }, []);

  const requestCreate = useCallback(() => {
    setCreateSignal((signal) => signal + 1);
  }, []);

  const discardFlow = useConfirmFlow<void, void>({
    prepare: () => undefined,
    submit: () => {
      const target = pendingSection.current;
      pendingSection.current = null;
      discardDrafts();
      if (target !== null) setActive(target);
    },
  });

  const navigate = useCallback(
    (section: SectionKey) => {
      if (section === active) return;
      if (hasDrafts) {
        pendingSection.current = section;
        void discardFlow.request();
        return;
      }
      setActive(section);
      setNotice(null);
    },
    [active, discardFlow, hasDrafts],
  );

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
    if (target !== undefined) navigate(target);
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
      draftEpoch,
      discardDrafts,
      createSignal,
      requestCreate,
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
      draftEpoch,
      discardDrafts,
      createSignal,
      requestCreate,
    ],
  );

  const primaryKey = primaryActionKeys[active];

  const sections: ReadonlyArray<{
    readonly key: SectionKey;
    readonly node: ReactNode;
  }> = [
    {
      key: "categories",
      node: <CategoriesSection active={active === "categories"} />,
    },
    { key: "stores", node: <StoresSection active={active === "stores"} /> },
    {
      key: "dimensions",
      node: <DimensionsSection active={active === "dimensions"} />,
    },
    { key: "accounts", node: <AccountsSection /> },
    {
      key: "documents",
      node: <DocumentsSection active={active === "documents"} />,
    },
    {
      key: "readiness",
      node: <ReadinessSection active={active === "readiness"} />,
    },
  ];

  return (
    <PermissionsScopeContext.Provider value={scopeValue}>
      <PageHeader
        {...(primaryKey === undefined
          ? {}
          : { action: { label: t(primaryKey), run: requestCreate } })}
      />
      <section
        className={styles.banner}
        aria-label={t("permissions.banner.label")}
      >
        <div className={styles.bannerBody}>
          <strong>{t(`permissions.mode.${bundle.me.mode}`)}</strong>
          <p>{t(`permissions.banner.${bundle.me.mode}`)}</p>
        </div>
        <ActionButton
          label={t("permissions.viewReadiness")}
          variant="secondary"
          onRun={() => {
            navigate("readiness");
          }}
        />
      </section>
      {notice === null ? null : (
        <p className={styles.notice} role="status">
          {t(notice)}
        </p>
      )}
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
              navigate(key);
            }}
          >
            {t(`permissions.tabs.${key}`)}
          </button>
        ))}
      </nav>
      {sections.map((section) => (
        <div
          key={`${section.key}-${draftEpoch}`}
          id={`permissions-panel-${section.key}`}
          role="tabpanel"
          aria-labelledby={`permissions-tab-${section.key}`}
          hidden={active !== section.key}
        >
          {section.node}
        </div>
      ))}
      <ConfirmDialog
        flow={discardFlow}
        title={t("permissions.discard.title")}
        description={t("permissions.discardDescription")}
        confirmLabel={t("permissions.discard.action")}
        cancelLabel={t("permissions.discard.keep")}
      />
    </PermissionsScopeContext.Provider>
  );
}
