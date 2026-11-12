import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

import { WebApiError } from "@/api/client";
import type {
  PermissionAccount,
  PermissionsAccountsUpdateResponse,
} from "@/api/permissions";
import { useText } from "@/i18n/useText";
import { ActionButton } from "@/ui/ActionButton";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { DataTable } from "@/ui/DataTable";
import { Field } from "@/ui/Field";
import { InlineError } from "@/ui/InlineError";
import { useConfirmFlow } from "@/ui/useConfirmFlow";

import { DraftFeedback, LevelSelect, SearchInput } from "./components";
import type { Confirmation } from "./diff";
import {
  accountDiff,
  accountToDraft,
  accountUpdateBody,
  rebaseAccount,
  sameGrant,
  validateAccountDraft,
  type AccountDraft,
  type GrantDraft,
} from "./grants";
import {
  accountRoleLabel,
  accountSummary,
  enterpriseName,
  grantCategoryLabels,
  grantConditionLabels,
  grantDescription,
  grantLocationLabel,
} from "./labels";
import { GrantEditor } from "./GrantEditor";
import {
  DraftConflict,
  ListHeader,
  ObjectListHead,
  ObjectRow,
  Panel,
  PermissionConfirmDialog,
} from "./panel";
import styles from "./Permissions.module.css";
import { usePermissionsScope } from "./scope";
import { useDraftSave } from "./useDraftSave";
import { useRegisterDraft } from "./useRegisterDraft";

const NEW_GRANT = "\u0000new";

export function AccountsSection() {
  const { t } = useText();
  const scope = usePermissionsScope();
  const [search, setSearch] = useState("");
  const [snapshot, setSnapshot] = useState<PermissionAccount | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [dirty, setDirty] = useState(false);
  const pendingId = useRef<string | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  // 记录触发面板的按钮：部分浏览器点击不聚焦按钮，仅靠 activeElement 会丢失焦点来源。
  useEffect(() => {
    const remember = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const trigger = target.closest("button, a");
      if (trigger instanceof HTMLElement) opener.current = trigger;
    };
    document.addEventListener("pointerdown", remember, true);
    return () => {
      document.removeEventListener("pointerdown", remember, true);
    };
  }, []);

  const discardFlow = useConfirmFlow<void, void>({
    prepare: () => undefined,
    submit: () => {
      const id = pendingId.current;
      pendingId.current = null;
      setSnapshot(null);
      setDirty(false);
      if (id !== null) void openAccount(id);
    },
  });

  const closePanel = () => {
    setSnapshot(null);
    setDirty(false);
  };

  const openAccount = async (id: string) => {
    setLoadingId(id);
    setLoadError(null);
    try {
      let account = await scope.writes.readAccount(id);
      if (account.authorizationVersion !== scope.bundle.version) {
        await scope.reload();
        account = await scope.writes.readAccount(id);
      }
      setSnapshot(account);
      setDirty(false);
    } catch (caught) {
      setLoadError(caught);
    } finally {
      setLoadingId(null);
    }
  };

  const chooseAccount = (id: string) => {
    if (snapshot?.id === id) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body) {
      opener.current = active;
    }
    if (dirty) {
      pendingId.current = id;
      void discardFlow.request();
      return;
    }
    closePanel();
    void openAccount(id);
  };

  const needle = search.trim().toLowerCase();
  const accounts = scope.bundle.accounts.filter(
    (account) =>
      needle === "" ||
      account.displayName.toLowerCase().includes(needle) ||
      account.email.toLowerCase().includes(needle),
  );

  return (
    <>
      <ListHeader
        title={t("permissions.tabs.accounts")}
        description={t("permissions.accountListHint")}
      />
      <div className={styles.toolbar}>
        <SearchInput
          label={t("permissions.searchAccount")}
          value={search}
          onChange={setSearch}
        />
      </div>
      <DataTable<PermissionAccount>
        columns={[
          {
            id: "name",
            header: t("permissions.account"),
            cell: (account) => (
              <>
                <strong>{account.displayName}</strong>
                <br />
                <span className={styles.muted}>{account.email}</span>
              </>
            ),
          },
          {
            id: "role",
            header: t("permissions.role"),
            cell: (account) => accountRoleLabel(t, account.role),
          },
          {
            id: "clearance",
            header: t("permissions.clearance"),
            cell: (account) => (
              <span className={styles.levelBadge}>{account.clearance}</span>
            ),
          },
          {
            id: "grants",
            header: t("permissions.grantCount"),
            cell: (account) => String(account.grants.length),
          },
          {
            id: "actions",
            header: t("permissions.actions"),
            align: "end",
            cell: (account) => (
              <ActionButton
                label={t("permissions.edit")}
                variant="secondary"
                busy={loadingId === account.id}
                disabled={loadingId !== null && loadingId !== account.id}
                onRun={() => {
                  chooseAccount(account.id);
                }}
              />
            ),
          },
        ]}
        rows={accounts}
        getRowId={(account) => account.id}
        label={t("permissions.tabs.accounts")}
        emptyLabel={t("permissions.empty")}
      />
      <InlineError error={loadError} />

      {snapshot === null ? null : (
        <AccountPanel
          key={snapshot.id}
          account={snapshot}
          onClose={closePanel}
          onDirtyChange={setDirty}
          returnFocusRef={opener}
        />
      )}

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

function AccountPanel({
  account,
  onClose,
  onDirtyChange,
  returnFocusRef,
}: {
  readonly account: PermissionAccount;
  /** 关闭并卸载面板；是否需要放弃确认由面板内部判断。 */
  readonly onClose: () => void;
  readonly onDirtyChange: (dirty: boolean) => void;
  readonly returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const data = scope.bundle;
  const baseline = useMemo(
    () => ({
      snapshot: accountToDraft(account),
      version: account.authorizationVersion,
    }),
    [account],
  );

  const save = useDraftSave<AccountDraft, PermissionsAccountsUpdateResponse>({
    baseline,
    validate: (draft) => validateAccountDraft(draft, data),
    confirmation: (draft, base) => ({
      subject: account.displayName,
      diff: accountDiff(t, data, draft, base),
      impact: t("permissions.accountSaveImpact"),
      fullBefore: accountSummary(t, data, {
        displayName: account.displayName,
        clearance: base.clearance ?? 0,
        grants: base.grants,
      }),
      fullAfter: accountSummary(t, data, {
        displayName: account.displayName,
        clearance: draft.clearance ?? 0,
        grants: draft.grants,
      }),
    }),
    submit: (draft, expectedVersion) =>
      scope.writes.saveAccount(
        account.id,
        accountUpdateBody(draft, expectedVersion),
      ),
    nextBaseline: (result) =>
      accountToDraft({
        clearance: result.value.clearance,
        grants: result.value.grants,
      }),
    reload: async () => {
      const next = await scope.reload();
      const latest = next.accounts.find((item) => item.id === account.id);
      if (latest === undefined) {
        throw new WebApiError({
          status: 409,
          code: "AUTHORIZATION_ACCOUNT_NOT_FOUND",
          message: "账号已不可用",
        });
      }
      return {
        snapshot: accountToDraft(latest),
        version: latest.authorizationVersion,
      };
    },
    rebase: (input) => rebaseAccount(t, data, input),
    onSaved: () => {
      scope.setNotice("permissions.saved");
      onClose();
    },
  });
  useRegisterDraft(save.isDirty || save.conflict);

  useEffect(() => {
    onDirtyChange(save.isDirty || save.conflict);
  }, [onDirtyChange, save.conflict, save.isDirty]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const pendingRemoval = useRef<string | null>(null);

  const removeFlow = useConfirmFlow<{ confirmation: Confirmation }, void>({
    prepare: () => {
      const id = pendingRemoval.current;
      const grant = save.draft.grants.find((item) => item.id === id);
      return {
        confirmation: {
          subject: account.displayName,
          diff:
            grant === undefined
              ? []
              : [
                  {
                    kind: "removed" as const,
                    label: t("permissions.grant"),
                    before: grantDescription(t, data, grant),
                  },
                ],
          impact: t("permissions.grantRemoveImpact"),
        },
      };
    },
    submit: () => {
      const id = pendingRemoval.current;
      pendingRemoval.current = null;
      if (id === null) return;
      save.setDraft((previous) => ({
        ...previous,
        grants: previous.grants.filter((grant) => grant.id !== id),
      }));
    },
  });

  const requestRemove = (id: string) => {
    setEditingId(null);
    pendingRemoval.current = id;
    void removeFlow.request();
  };

  const discardFlow = useConfirmFlow<void, void>({
    prepare: () => undefined,
    submit: () => {
      save.reset();
      onClose();
    },
  });

  const requestClose = () => {
    if (save.isDirty || save.conflict) {
      void discardFlow.request();
      return;
    }
    onClose();
  };

  const completeGrant = (next: GrantDraft) => {
    if (editingId === NEW_GRANT) {
      save.setDraft((previous) => ({
        ...previous,
        grants: [...previous.grants, next],
      }));
    } else {
      save.setDraft((previous) => ({
        ...previous,
        grants: previous.grants.map((grant) =>
          grant.id === next.id ? next : grant,
        ),
      }));
    }
    setEditingId(null);
  };

  const editingGrant =
    editingId === null || editingId === NEW_GRANT
      ? null
      : (save.draft.grants.find((grant) => grant.id === editingId) ?? null);

  return (
    <>
      <Panel
        open
        title={t("permissions.accountPanel")}
        subtitle={`${account.displayName} · ${accountRoleLabel(t, account.role)} · ${account.email}`}
        onRequestClose={requestClose}
        returnFocusRef={returnFocusRef}
        footer={
          <>
            <ActionButton
              label={t("permissions.cancel")}
              variant="secondary"
              onRun={requestClose}
            />
            <ActionButton
              label={t("permissions.save")}
              busy={save.saving}
              disabled={!save.canSave || scope.busy || account.disabled}
              disabledReason={
                account.disabled
                  ? t("permissions.disabled")
                  : (save.disabledReason ?? t("permissions.noChange"))
              }
              onRun={save.requestSave}
            />
          </>
        }
      >
        <p className={styles.inlineNote}>{t("permissions.accountRoleHint")}</p>
        {account.disabled ? (
          <p className={styles.error} role="alert">
            {t("permissions.disabled")}
          </p>
        ) : null}
        <Field
          label={t("permissions.clearance")}
          hint={t("permissions.levelHelp")}
        >
          <LevelSelect
            value={save.draft.clearance}
            disabled={save.saving}
            onChange={(clearance) => {
              save.setDraft({ ...save.draft, clearance });
            }}
          />
        </Field>

        <ObjectListHead
          title={t("permissions.grants")}
          action={
            <ActionButton
              label={t("permissions.addGrantEntry")}
              variant="secondary"
              disabled={save.saving || save.conflict}
              onRun={() => {
                setEditingId(NEW_GRANT);
              }}
            />
          }
        />
        {save.draft.grants.length === 0 ? (
          <p className={styles.emptyEditor}>{t("permissions.noGrants")}</p>
        ) : (
          <div className={styles.stack}>
            {save.draft.grants.map((grant) => {
              const unchanged = save.baseline.grants.some((base) =>
                sameGrant(base, grant),
              );
              return (
                <ObjectRow
                  key={grant.id}
                  highlight={!unchanged}
                  title={`${enterpriseName(t, data, grant.enterpriseKey)} · ${grantCategoryLabels(t, data, grant.categoryIds)}`}
                  description={[
                    grantLocationLabel(t, data, grant),
                    grantConditionLabels(t, data, grant.dimensions),
                  ]
                    .filter((part) => part !== "")
                    .join(" · ")}
                  actions={
                    <>
                      <ActionButton
                        label={t("permissions.edit")}
                        variant="ghost"
                        disabled={save.saving}
                        onRun={() => {
                          setEditingId(grant.id);
                        }}
                      />
                      <ActionButton
                        label={t("permissions.remove")}
                        variant="ghost"
                        disabled={save.saving}
                        onRun={() => {
                          requestRemove(grant.id);
                        }}
                      />
                    </>
                  }
                />
              );
            })}
          </div>
        )}

        {save.conflict && save.conflictConfirmation !== null ? (
          <DraftConflict
            confirmation={save.conflictConfirmation}
            choices={save.conflictChoices}
            selected={save.conflictDecisions}
            onSelect={save.chooseConflict}
            canApply={save.conflictCanApply}
            {...(save.conflictApplyReason === undefined
              ? {}
              : { applyReason: save.conflictApplyReason })}
            onLoadServer={save.loadServer}
            onApplyMine={save.applyMine}
            reloading={save.conflictReloading}
            error={save.conflictError}
          />
        ) : save.conflict ? (
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
        ) : null}

        <DraftFeedback save={save} />
      </Panel>

      <GrantEditor
        key={editingId ?? "closed"}
        open={editingId !== null}
        grant={editingGrant}
        accountName={account.displayName}
        orgId={account.orgId}
        data={data}
        onComplete={completeGrant}
        onRemove={() => {
          if (editingId === null || editingId === NEW_GRANT) return;
          requestRemove(editingId);
        }}
        onCancel={() => {
          setEditingId(null);
        }}
      />

      <PermissionConfirmDialog
        flow={save.flow}
        title={t("permissions.confirm.title")}
        confirmLabel={t("permissions.confirm.action")}
        cancelLabel={t("permissions.cancel")}
      />
      <PermissionConfirmDialog
        flow={removeFlow}
        title={t("permissions.grantRemoveConfirm")}
        confirmLabel={t("permissions.remove")}
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
