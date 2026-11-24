import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState, type RefObject } from "react";

import { WebApiError } from "@/api/client";
import { VERSION_CONFLICT_CODE } from "@/api/permissions";
import type {
  InspectionAccountPolicy,
  PermissionAccount,
  PermissionsAccountsReadResponse,
  PermissionsAccountsUpdateResponse,
} from "@/api/permissions";
import { useText } from "@/i18n/useText";
import { ActionButton } from "@/ui/ActionButton";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Field } from "@/ui/Field";
import { InlineError } from "@/ui/InlineError";
import { stableSerialize } from "@/ui/stableSerialize";
import { useConfirmFlow } from "@/ui/useConfirmFlow";

import { DraftFeedback } from "./components";
import { DraftConflict, Panel, PermissionConfirmDialog } from "./panel";
import styles from "./Permissions.module.css";
import { usePermissionsScope } from "./scope";
import { useDraftSave } from "./useDraftSave";
import { useRegisterDraft } from "./useRegisterDraft";

type Tier = "none" | "read" | "write";
type Store = { storeId: string; name: string };

function policyOf(
  entries: InspectionAccountPolicy[],
  enterpriseKey: string,
): InspectionAccountPolicy {
  return (
    entries.find((entry) => entry.enterpriseKey === enterpriseKey) ?? {
      enterpriseKey,
      readStores: { kind: "fixed", storeIds: [] },
      writeStoreIds: [],
      manageTemplates: false,
    }
  );
}

function tierFor(policy: InspectionAccountPolicy, storeId: string): Tier {
  const readable =
    policy.readStores.kind === "all" ||
    policy.readStores.storeIds.includes(storeId);
  if (!readable) return "none";
  return policy.writeStoreIds.includes(storeId) ? "write" : "read";
}

function setTier(
  policy: InspectionAccountPolicy,
  storeId: string,
  tier: Tier,
  stores: Store[],
) {
  const readers = new Set(
    policy.readStores.kind === "all"
      ? stores.map((store) => store.storeId)
      : policy.readStores.storeIds,
  );
  if (tier === "none") readers.delete(storeId);
  else readers.add(storeId);
  const writers = new Set(policy.writeStoreIds);
  if (tier === "write") writers.add(storeId);
  else writers.delete(storeId);
  return {
    ...policy,
    readStores:
      policy.readStores.kind === "all" && tier !== "none"
        ? policy.readStores
        : { kind: "fixed" as const, storeIds: [...readers].sort() },
    writeStoreIds: [...writers].sort(),
  };
}

function normalize(policy: InspectionAccountPolicy) {
  return {
    ...policy,
    readStores:
      policy.readStores.kind === "all"
        ? policy.readStores
        : {
            ...policy.readStores,
            storeIds: [...policy.readStores.storeIds].sort(),
          },
    writeStoreIds: [...policy.writeStoreIds].sort(),
  };
}

function storesOf(policy: InspectionAccountPolicy) {
  const { readStores, writeStoreIds } = normalize(policy);
  return { readStores, writeStoreIds };
}

async function matchedSnapshot(
  refresh: () => Promise<{ version: string }>,
  read: () => Promise<PermissionsAccountsReadResponse>,
) {
  const [directory, account] = await Promise.all([refresh(), read()]);
  if (account.authorizationVersion !== directory.version) {
    throw new WebApiError({
      status: 409,
      code: VERSION_CONFLICT_CODE,
      message: "Inspection permission versions differ.",
    });
  }
  return account;
}

export function InspectionAccountPanel({
  account,
  onClose,
  onSaved,
  onDirtyChange,
  returnFocusRef,
}: {
  account: PermissionAccount;
  onClose: () => void;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const [chosen, setChosen] = useState("");
  const [editorState, setEditorState] = useState({
    dirty: false,
    saving: false,
  });
  const report = useCallback(
    (value: typeof editorState) => setEditorState(value),
    [],
  );
  const snapshot = useQuery({
    queryKey: ["inspection-account-permissions", scope.orgId, account.id],
    queryFn: () =>
      matchedSnapshot(scope.reload, () =>
        scope.writes.readInspectionAccount(account.id),
      ),
    retry: false,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  // The editor holds its initial version for conflict detection. Start it
  // only after this opening has read a matching account and directory.
  const initialSnapshot =
    snapshot.isFetchedAfterMount && snapshot.isSuccess ? snapshot.data : null;
  const enterprises = scope.bundle.enterprises;
  const enterpriseKey = chosen || enterprises[0]?.enterpriseKey || "";
  const enterpriseName =
    enterprises.find((row) => row.enterpriseKey === enterpriseKey)
      ?.enterpriseName ?? enterpriseKey;
  const stores = scope.bundle.stores.flatMap((store) =>
    store.enterpriseKey === enterpriseKey &&
    store.storeId !== undefined &&
    (store.confirmation === "confirmed" || store.confirmation === "historical")
      ? [{ storeId: store.storeId, name: store.officialName ?? store.name }]
      : [],
  );
  const discard = useConfirmFlow({ prepare: () => undefined, submit: onClose });
  const requestClose = () => {
    if (editorState.saving) return;
    if (editorState.dirty) void discard.request();
    else onClose();
  };
  useEffect(() => {
    onDirtyChange(editorState.dirty);
    return () => onDirtyChange(false);
  }, [editorState.dirty, onDirtyChange]);

  return (
    <>
      <Panel
        open
        title={t("permissions.inspection.open")}
        subtitle={account.displayName}
        onRequestClose={requestClose}
        returnFocusRef={returnFocusRef}
      >
        {(!snapshot.isFetchedAfterMount || snapshot.isPending) &&
        !snapshot.isError ? (
          <p role="status">{t("permissions.reload")}</p>
        ) : null}
        <InlineError error={snapshot.error} />
        {snapshot.isError ? (
          <ActionButton
            label={t("permissions.reload")}
            variant="secondary"
            busy={snapshot.isFetching}
            onRun={() => void snapshot.refetch()}
          />
        ) : null}
        {initialSnapshot &&
        (!initialSnapshot.inspectionPermissions || !enterpriseKey) ? (
          <p>{t("permissions.inspection.unavailable")}</p>
        ) : null}
        {initialSnapshot?.inspectionPermissions && enterpriseKey ? (
          <>
            <Field label={t("permissions.inspection.enterprise")}>
              <select
                value={enterpriseKey}
                disabled={editorState.dirty || editorState.saving}
                onChange={(e) => setChosen(e.currentTarget.value)}
              >
                {enterprises.map((value) => (
                  <option value={value.enterpriseKey} key={value.enterpriseKey}>
                    {value.enterpriseName}
                  </option>
                ))}
              </select>
            </Field>
            <EnterprisePolicyEditor
              key={enterpriseKey}
              account={account}
              initial={initialSnapshot}
              enterpriseKey={enterpriseKey}
              enterpriseName={enterpriseName}
              stores={stores}
              onState={report}
              onSaved={onSaved}
            />
          </>
        ) : null}
      </Panel>
      <ConfirmDialog
        flow={discard}
        title={t("permissions.discardTitle")}
        description={t("permissions.discardDescription")}
        confirmLabel={t("permissions.discardChanges")}
        cancelLabel={t("permissions.discard.keep")}
      />
    </>
  );
}

function EnterprisePolicyEditor({
  account,
  initial,
  enterpriseKey,
  enterpriseName,
  stores,
  onState,
  onSaved,
}: {
  account: PermissionAccount;
  initial: PermissionsAccountsReadResponse;
  enterpriseKey: string;
  enterpriseName: string;
  stores: Store[];
  onState: (state: { dirty: boolean; saving: boolean }) => void;
  onSaved: () => void;
}) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const fromAll = (
    base: InspectionAccountPolicy,
    draft: InspectionAccountPolicy,
  ) => base.readStores.kind === "all" && draft.readStores.kind === "fixed";
  const storeLabel = (id: string) =>
    stores.find((store) => store.storeId === id)?.name ?? id;
  const summarize = (policy: InspectionAccountPolicy) => {
    const read =
      policy.readStores.kind === "all"
        ? t("permissions.inspection.all")
        : policy.readStores.storeIds.map(storeLabel).join("、") ||
          t("permissions.inspection.none");
    const write =
      policy.writeStoreIds.map(storeLabel).join("、") ||
      t("permissions.inspection.none");
    return `${t("permissions.inspection.read")} · ${read}\n${t("permissions.inspection.write")} · ${write}\n${policy.manageTemplates ? t("permissions.inspection.templates") : ""}`;
  };

  const save = useDraftSave<
    InspectionAccountPolicy,
    PermissionsAccountsUpdateResponse
  >({
    baseline: {
      snapshot: policyOf(initial.inspectionPermissions ?? [], enterpriseKey),
      version: initial.authorizationVersion,
    },
    confirmation: (draft, base) => ({
      subject: `${account.displayName} · ${enterpriseName}`,
      diff:
        stableSerialize(normalize(draft)) === stableSerialize(normalize(base))
          ? []
          : [
              {
                kind: "changed",
                label: t("permissions.inspection.coverage"),
                before: summarize(base),
                after: summarize(draft),
              },
            ],
      impact: fromAll(base, draft)
        ? t("permissions.inspection.futureImpact")
        : t("permissions.inspection.saveImpact"),
      fullBefore: summarize(base),
      fullAfter: summarize(draft),
    }),
    validate: (draft) =>
      (draft.readStores.kind === "fixed" &&
        draft.readStores.storeIds.length > 1000) ||
      draft.writeStoreIds.length > 1000
        ? "permissions.inspection.tooMany"
        : null,
    submit: (draft, expectedVersion, baseline) =>
      scope.writes.saveAccount(account.id, {
        expectedVersion,
        inspectionPermissions: [
          {
            ...normalize(draft),
            ...(fromAll(baseline, draft)
              ? { confirmLoseFutureStores: true as const }
              : {}),
          },
        ],
      }),
    nextBaseline: (result) =>
      policyOf(result.value.inspectionPermissions ?? [], enterpriseKey),
    reload: async () => {
      // Refresh the store directory as well as the account if the administrator must recompare.
      const current = await matchedSnapshot(scope.reload, () =>
        scope.writes.readInspectionAccount(account.id),
      );
      if (!current.inspectionPermissions)
        throw new WebApiError({
          status: 0,
          code: "INVALID_RESPONSE",
          message: "Inspection permissions unavailable.",
        });
      return {
        snapshot: policyOf(current.inspectionPermissions, enterpriseKey),
        version: current.authorizationVersion,
      };
    },
    rebase: ({ baseline, draft, server, decisions }) => {
      const originalStores = stableSerialize(storesOf(baseline));
      const draftStores = stableSerialize(storesOf(draft));
      const serverStores = stableSerialize(storesOf(server));
      const localChanged = draftStores !== originalStores;
      if (
        localChanged &&
        serverStores !== originalStores &&
        draftStores !== serverStores &&
        !decisions["stores"]
      ) {
        return {
          kind: "choice",
          choices: [
            {
              key: "stores",
              label: t("permissions.inspection.coverage"),
              serverValue: summarize(server),
              draftValue: summarize(draft),
            },
          ],
        };
      }
      const keepLocalStores = localChanged && decisions["stores"] !== "server";
      return {
        kind: "merged",
        notes: [],
        draft: {
          enterpriseKey,
          ...storesOf(keepLocalStores ? draft : server),
          manageTemplates:
            draft.manageTemplates !== baseline.manageTemplates
              ? draft.manageTemplates
              : server.manageTemplates,
        },
      };
    },
    onSaved,
  });
  const dirty = save.isDirty || save.conflict;
  useRegisterDraft(dirty);
  useEffect(() => {
    onState({ dirty, saving: save.saving });
  }, [dirty, save.saving, onState]);

  const disabled = save.saving || save.conflict || account.disabled;
  return (
    <div className={styles.stack}>
      <Field label={t("permissions.inspection.coverage")}>
        <select
          value={save.draft.readStores.kind}
          disabled={disabled}
          onChange={(e) => {
            const readStores =
              e.currentTarget.value === "all"
                ? { kind: "all" as const }
                : {
                    kind: "fixed" as const,
                    storeIds: stores.map((store) => store.storeId).sort(),
                  };
            save.setDraft((current) => ({
              ...current,
              readStores,
              writeStoreIds:
                readStores.kind === "all"
                  ? current.writeStoreIds
                  : current.writeStoreIds.filter((id) =>
                      readStores.storeIds.includes(id),
                    ),
            }));
          }}
        >
          <option value="all">{t("permissions.inspection.all")}</option>
          <option value="fixed">{t("permissions.inspection.fixed")}</option>
        </select>
      </Field>
      <label className={styles.inlineNote}>
        <input
          type="checkbox"
          checked={save.draft.manageTemplates}
          disabled={disabled}
          onChange={(e) => {
            const manageTemplates = e.currentTarget.checked;
            save.setDraft((current) => ({ ...current, manageTemplates }));
          }}
        />{" "}
        {t("permissions.inspection.templates")}
      </label>
      {stores.length === 0 ? (
        <p>{t("permissions.inspection.noStores")}</p>
      ) : null}
      {stores.map((store) => (
        <Field
          key={store.storeId}
          label={`${store.name} · ${t("permissions.inspection.open")}`}
        >
          <select
            value={tierFor(save.draft, store.storeId)}
            disabled={disabled}
            onChange={(e) => {
              const tier = e.currentTarget.value as Tier;
              save.setDraft((current) =>
                setTier(current, store.storeId, tier, stores),
              );
            }}
          >
            <option value="none">{t("permissions.inspection.none")}</option>
            <option value="read">{t("permissions.inspection.read")}</option>
            <option value="write">{t("permissions.inspection.write")}</option>
          </select>
        </Field>
      ))}
      {fromAll(save.baseline, save.draft) ? (
        <p className={styles.inlineNote}>
          {t("permissions.inspection.futureImpact")}
        </p>
      ) : null}
      {save.conflict && save.conflictConfirmation ? (
        <DraftConflict
          confirmation={save.conflictConfirmation}
          choices={save.conflictChoices}
          selected={save.conflictDecisions}
          onSelect={save.chooseConflict}
          canApply={save.conflictCanApply}
          onLoadServer={save.loadServer}
          onApplyMine={save.applyMine}
          reloading={save.conflictReloading}
          error={save.conflictError}
        />
      ) : save.conflict ? (
        <div role="alert">
          <p>{t("ui.conflict.title")}</p>
          <InlineError error={save.conflictError} />
          <ActionButton
            label={t("permissions.reload")}
            variant="secondary"
            busy={save.conflictReloading}
            onRun={save.retryConflict}
          />
        </div>
      ) : null}
      <DraftFeedback save={save} />
      <div className={styles.actions}>
        <ActionButton
          label={t("permissions.discardChanges")}
          variant="secondary"
          disabled={!save.isDirty || save.saving || save.conflict}
          onRun={save.reset}
        />
        <ActionButton
          label={t("permissions.inspection.save")}
          busy={save.saving}
          disabled={!save.canSave || scope.busy || account.disabled}
          onRun={save.requestSave}
        />
      </div>
      <PermissionConfirmDialog
        flow={save.flow}
        title={t("permissions.inspection.save")}
        confirmLabel={t("permissions.confirm.action")}
        cancelLabel={t("permissions.cancel")}
      />
    </div>
  );
}
