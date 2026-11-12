import { useEffect, useRef, useState, type RefObject } from "react";
import { Link } from "react-router";

import type {
  PermissionsEnterprisesDeclareResponse,
  PermissionStore,
} from "@/api/permissions";
import { appPaths } from "@/app/paths";
import { useText } from "@/i18n/useText";
import { ActionButton } from "@/ui/ActionButton";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { DataTable } from "@/ui/DataTable";
import { InlineError } from "@/ui/InlineError";
import { useConfirmFlow } from "@/ui/useConfirmFlow";

import {
  DraftFeedback,
  NameField,
  SaveButton,
  SearchInput,
} from "./components";
import type { Confirmation } from "./diff";
import { permissionsErrorKey } from "./errorKeys";
import { enterpriseName, itemLabel, type Translate } from "./labels";
import {
  DraftConflict,
  ListHeader,
  Panel,
  PermissionConfirmDialog,
} from "./panel";
import styles from "./Permissions.module.css";
import { usePermissionsScope } from "./scope";
import { useDraftSave } from "./useDraftSave";
import { useRegisterDraft } from "./useRegisterDraft";

interface EnterpriseDraft {
  readonly name: string;
}

interface EnterprisePreview {
  readonly enterpriseName: string;
  readonly enterpriseKey: string;
}

const EMPTY_ENTERPRISE: EnterpriseDraft = { name: "" };
const ENTERPRISE_NAME_MAX_LENGTH = 255;

export function StoresSection({ active }: { readonly active: boolean }) {
  const scope = usePermissionsScope();
  const [panelOpen, setPanelOpen] = useState(false);
  const lastActive = useRef(active);
  const lastCreateSignal = useRef(scope.createSignal);
  const opener = useRef<HTMLElement | null>(null);

  // 页头主操作通过递增 createSignal 请求打开面板；切换分区时关闭。
  // 用 ref 记录上一次的 active 与信号，避免 effect 在无关渲染时反复触发。
  useEffect(() => {
    if (
      lastActive.current === active &&
      lastCreateSignal.current === scope.createSignal
    ) {
      return;
    }
    const signalChanged = lastCreateSignal.current !== scope.createSignal;
    lastActive.current = active;
    lastCreateSignal.current = scope.createSignal;
    // 面板由页头按钮触发，按钮不在本组件内；打开前记录焦点供关闭时恢复。
    if (active && signalChanged && !panelOpen) {
      const focused = document.activeElement;
      if (focused instanceof HTMLElement) opener.current = focused;
    }
    setPanelOpen(active && (signalChanged || panelOpen));
  }, [active, panelOpen, scope.createSignal]);

  return (
    <>
      <div className={styles.stack}>
        <EnterpriseDirectory />
        <StoreDirectory />
      </div>
      {panelOpen ? (
        <EnterprisePanel
          returnFocusRef={opener}
          onRequestClose={() => {
            setPanelOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function EnterpriseDirectory() {
  const { t } = useText();
  const scope = usePermissionsScope();
  const enterprises = scope.bundle.enterprises;

  return (
    <section aria-label={t("permissions.enterpriseSection")}>
      <ListHeader
        title={t("permissions.enterpriseSection")}
        description={t("permissions.enterpriseSectionHint")}
        action={
          <Link to={appPaths.directory(scope.orgId)}>
            {t("permissions.goToDirectory")}
          </Link>
        }
      />
      <DataTable
        columns={[
          {
            id: "name",
            header: t("permissions.name"),
            cell: (enterprise) => enterprise.enterpriseName,
          },
          {
            id: "key",
            header: t("permissions.enterpriseKey"),
            cell: (enterprise) => (
              <span className={styles.muted}>{enterprise.enterpriseKey}</span>
            ),
          },
        ]}
        rows={enterprises}
        getRowId={(enterprise) => enterprise.enterpriseKey}
        label={t("permissions.enterpriseSection")}
        emptyLabel={t("permissions.empty")}
      />
    </section>
  );
}

function StoreDirectory() {
  const { t } = useText();
  const scope = usePermissionsScope();
  const [search, setSearch] = useState("");
  const needle = search.trim().toLowerCase();
  const stores = scope.bundle.stores.filter((store) => {
    if (needle === "") return true;
    const name = (store.officialName ?? store.name).toLowerCase();
    const enterprise = enterpriseName(
      t,
      scope.bundle,
      store.enterpriseKey,
    ).toLowerCase();
    return name.includes(needle) || enterprise.includes(needle);
  });

  return (
    <section aria-label={t("permissions.storeDirectory")}>
      <ListHeader
        title={t("permissions.storeDirectory")}
        description={t("permissions.storeDirectoryHint")}
      />
      <div className={styles.toolbar}>
        <SearchInput
          label={t("permissions.searchStore")}
          value={search}
          onChange={setSearch}
        />
      </div>
      <DataTable
        columns={[
          {
            id: "store",
            header: t("permissions.storeName"),
            cell: (store) =>
              itemLabel(t, store.officialName ?? store.name, store.retired),
          },
          {
            id: "enterprise",
            header: t("permissions.storeEnterprise"),
            cell: (store) =>
              enterpriseName(t, scope.bundle, store.enterpriseKey),
          },
          {
            id: "state",
            header: t("permissions.storeState"),
            cell: (store) => (
              <span className={styles.chip}>{storeStateLabel(t, store)}</span>
            ),
          },
        ]}
        rows={stores}
        getRowId={(store) => `${store.enterpriseKey}\u0000${store.name}`}
        label={t("permissions.storeDirectory")}
        emptyLabel={t("permissions.empty")}
      />
    </section>
  );
}

function storeStateLabel(t: Translate, store: PermissionStore): string {
  if (store.retired) return t("permissions.retired");
  if (store.confirmation === "pending") return t("permissions.storePending");
  if (store.confirmation === "historical") {
    return t("permissions.storeHistorical");
  }
  return t("permissions.storeConfirmed");
}

function EnterprisePanel({
  onRequestClose,
  returnFocusRef,
}: {
  readonly onRequestClose: () => void;
  readonly returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const [preview, setPreview] = useState<EnterprisePreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<unknown>(null);
  const previewSequence = useRef(0);

  const save = useDraftSave<
    EnterpriseDraft,
    PermissionsEnterprisesDeclareResponse
  >({
    baseline: {
      snapshot: EMPTY_ENTERPRISE,
      version: scope.bundle.version,
    },
    validate: (draft) =>
      draft.name.trim() === "" ? "permissions.required" : null,
    confirmation: (draft): Confirmation => {
      const name = draft.name.trim();
      if (name === "") return { subject: "", diff: [] };
      const after =
        preview === null ? name : `${name} · ${preview.enterpriseKey}`;
      return {
        subject: name,
        diff: [{ kind: "added", label: t("permissions.enterprise"), after }],
      };
    },
    submit: (draft, expectedVersion) =>
      scope.writes.declareEnterprise(draft.name.trim(), expectedVersion),
    nextBaseline: () => EMPTY_ENTERPRISE,
    reload: async () => {
      const next = await scope.reload();
      return { snapshot: EMPTY_ENTERPRISE, version: next.version };
    },
    onSaved: () => {
      scope.setNotice("permissions.saved");
      onRequestClose();
    },
  });
  useRegisterDraft(save.isDirty || save.conflict);

  useEffect(
    () => () => {
      previewSequence.current += 1;
    },
    [],
  );

  const resetPreview = () => {
    previewSequence.current += 1;
    setPreview(null);
    setPreviewError(null);
    setPreviewing(false);
  };

  const changeName = (name: string) => {
    resetPreview();
    save.setDraft({ name });
  };

  const runPreview = async () => {
    const name = save.draft.name.trim();
    if (name === "") return;
    const sequence = previewSequence.current + 1;
    previewSequence.current = sequence;
    setPreviewing(true);
    setPreviewError(null);
    setPreview(null);
    try {
      const result = await scope.writes.previewEnterprise(name);
      if (previewSequence.current !== sequence) return;
      setPreview({
        enterpriseName: result.enterpriseName,
        enterpriseKey: result.enterpriseKey,
      });
    } catch (caught) {
      if (previewSequence.current !== sequence) return;
      setPreviewError(caught);
    } finally {
      if (previewSequence.current === sequence) setPreviewing(false);
    }
  };

  const discardFlow = useConfirmFlow<void, void>({
    prepare: () => undefined,
    submit: () => {
      save.reset();
      onRequestClose();
    },
  });

  const requestClose = () => {
    if (save.isDirty || save.conflict) {
      void discardFlow.request();
      return;
    }
    onRequestClose();
  };

  const nameBlank = save.draft.name.trim() === "";

  return (
    <>
      <Panel
        open
        title={t("permissions.declareEnterprise")}
        subtitle={t("permissions.enterpriseDeclared")}
        onRequestClose={requestClose}
        returnFocusRef={returnFocusRef}
        footer={
          <>
            <ActionButton
              label={t("permissions.cancel")}
              variant="secondary"
              onRun={requestClose}
            />
            <SaveButton save={save} />
          </>
        }
      >
        <NameField
          label={t("permissions.enterpriseName")}
          required
          maxLength={ENTERPRISE_NAME_MAX_LENGTH}
          value={save.draft.name}
          disabled={save.saving}
          onChange={changeName}
        />
        <div className={styles.actions}>
          <ActionButton
            label={t("permissions.previewEnterprise")}
            variant="secondary"
            busy={previewing}
            disabled={nameBlank || save.saving}
            {...(nameBlank
              ? { disabledReason: t("permissions.enterprisePreviewInvalid") }
              : {})}
            onRun={() => {
              void runPreview();
            }}
          />
        </div>
        {preview === null ? null : (
          <p className={styles.status} role="status">
            {t("permissions.previewResult")}: {preview.enterpriseName} ·{" "}
            {preview.enterpriseKey}
          </p>
        )}
        {previewError === null ? null : (
          <p className={styles.error} role="alert">
            {t(permissionsErrorKey(previewError))}
          </p>
        )}
        <p className={styles.inlineNote}>
          {t("permissions.enterprisePreviewHint")}
        </p>
        {save.conflict ? (
          save.conflictConfirmation === null ? (
            <div className={styles.conflict} role="alert">
              <h3 className={styles.conflictTitle}>{t("ui.conflict.title")}</h3>
              <InlineError error={save.conflictError} />
              <div className={styles.actions}>
                <ActionButton
                  label={t("permissions.reload")}
                  busy={save.conflictReloading}
                  onRun={save.retryConflict}
                />
              </div>
            </div>
          ) : (
            // 登记是新增动作，不做 rebase：冲突只涉及提交版本，
            // 载入最新快照后可直接用原草稿重新提交，无需逐项选择。
            <DraftConflict
              confirmation={save.conflictConfirmation}
              choices={save.conflictChoices}
              selected={save.conflictDecisions}
              onSelect={save.chooseConflict}
              canApply={save.conflictCanApply}
              {...(save.conflictApplyReason === undefined
                ? {}
                : { applyReason: save.conflictApplyReason })}
              onLoadServer={() => {
                resetPreview();
                save.loadServer();
              }}
              onApplyMine={save.applyMine}
              reloading={save.conflictReloading}
              error={save.conflictError}
            />
          )
        ) : null}
        <DraftFeedback save={save} />
      </Panel>

      <PermissionConfirmDialog
        flow={save.flow}
        title={t("permissions.confirm.title")}
        confirmLabel={t("permissions.confirm.action")}
        cancelLabel={t("permissions.cancel")}
      />
      <ConfirmDialog
        flow={discardFlow}
        title={t("permissions.discardTitle")}
        description={t("permissions.discardDescription")}
        confirmLabel={t("permissions.discardChanges")}
        cancelLabel={t("permissions.discard.keep")}
      />
    </>
  );
}
