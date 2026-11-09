import { useEffect, useMemo, useRef, useState } from "react";

import type {
  PermissionAccount,
  PermissionDimension,
  PermissionSelection,
  PermissionsAccountsUpdateResponse,
} from "@/api/permissions";
import { useText } from "@/i18n/useText";
import { ActionButton } from "@/ui/ActionButton";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { DataTable } from "@/ui/DataTable";
import { Field } from "@/ui/Field";
import { InlineError } from "@/ui/InlineError";
import { PageSection } from "@/ui/PageSection";
import { useConfirmFlow } from "@/ui/useConfirmFlow";

import {
  Checklist,
  DraftDialogs,
  DraftFeedback,
  LevelSelect,
  SaveButton,
  SectionNote,
} from "./components";
import { useRegisterDraft } from "./useRegisterDraft";
import { INTERNAL_CATEGORY_KEY } from "./constants";
import { createId } from "./ids";
import {
  accountSummary,
  accountRoleLabel,
  categoryLabel,
  changeSummary,
  grantDescription,
  itemLabel,
} from "./labels";
import {
  accountToDraft,
  accountUpdateBody,
  emptyGrant,
  grantToDraft,
  validateAccountDraft,
  type AccountDraft,
  type GrantDraft,
} from "./grants";
import styles from "./Permissions.module.css";
import { usePermissionsScope } from "./scope";
import { useDraftSave } from "./useDraftSave";

export function AccountsSection() {
  const { t } = useText();
  const scope = usePermissionsScope();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorDirty, setEditorDirty] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const pendingId = useRef<string | null>(null);

  const openAccount = async (id: string) => {
    setLoadingId(id);
    setLoadError(null);
    try {
      const account = await scope.writes.readAccount(id);
      setSelectedId(account.id);
      setEditorDirty(false);
    } catch (caught) {
      setLoadError(caught);
    } finally {
      setLoadingId(null);
    }
  };

  const discardFlow = useConfirmFlow<string, void>({
    prepare: () => pendingId.current ?? "",
    submit: async (id) => {
      pendingId.current = null;
      await openAccount(id);
    },
  });

  const chooseAccount = (id: string) => {
    if (id === selectedId) return;
    if (editorDirty) {
      pendingId.current = id;
      void discardFlow.request();
      return;
    }
    void openAccount(id);
  };

  const selected = scope.bundle.accounts.find(
    (account) => account.id === selectedId,
  );

  return (
    <PageSection title={t("permissions.tabs.accounts")}>
      <SectionNote>{t("permissions.accountHelp")}</SectionNote>
      <SectionNote>{t("permissions.levelHelp")}</SectionNote>
      <SectionNote>{t("permissions.groupHelp")}</SectionNote>
      <SectionNote>{t("permissions.noGrantOption")}</SectionNote>

      <DataTable<PermissionAccount>
        columns={[
          {
            id: "name",
            header: t("permissions.account"),
            cell: (account) => account.displayName,
          },
          {
            id: "email",
            header: t("session.identity"),
            cell: (account) => account.email,
          },
          {
            id: "role",
            header: t("permissions.role"),
            cell: (account) => accountRoleLabel(t, account.role),
          },
          {
            id: "clearance",
            header: t("permissions.clearance"),
            cell: (account) => String(account.clearance),
          },
          {
            id: "grants",
            header: t("permissions.grantCount"),
            cell: (account) => String(account.grants.length),
          },
          {
            id: "actions",
            header: t("permissions.edit"),
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
        rows={scope.bundle.accounts}
        getRowId={(account) => account.id}
        label={t("permissions.selectAccount")}
        emptyLabel={t("permissions.empty")}
      />
      <InlineError error={loadError} />
      {selected === undefined ? null : (
        <AccountEditor
          key={selected.id}
          account={selected}
          onDirtyChange={setEditorDirty}
        />
      )}
      <ConfirmDialog
        flow={discardFlow}
        title={t("permissions.discard.title")}
        description={t("permissions.discard.description")}
        confirmLabel={t("permissions.discard.action")}
        cancelLabel={t("permissions.discard.keep")}
      />
    </PageSection>
  );
}

function AccountEditor({
  account,
  onDirtyChange,
}: {
  account: PermissionAccount;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const saved = useMemo(() => accountToDraft(account), [account]);
  const data = scope.bundle;

  const save = useDraftSave<AccountDraft, PermissionsAccountsUpdateResponse>({
    saved,
    expectedVersion: scope.bundle.version,
    normalize: (draft) => draft,
    validate: (draft) => validateAccountDraft(draft, data),
    describe: (draft) =>
      changeSummary(
        t,
        account.displayName,
        accountSummary(t, data, {
          displayName: account.displayName,
          clearance: account.clearance,
          grants: account.grants,
        }),
        accountSummary(t, data, {
          displayName: account.displayName,
          clearance: draft.clearance ?? 0,
          grants: draft.grants,
        }),
      ),
    submit: (draft, expectedVersion) =>
      scope.writes.saveAccount(
        account.id,
        accountUpdateBody(draft, expectedVersion),
      ),
    draftFromResult: (result) => ({
      clearance: result.value.clearance,
      grants: result.value.grants.map((grant) => grantToDraft(grant)),
    }),
    reload: async () => {
      const next = await scope.reload();
      const latest = next.accounts.find((item) => item.id === account.id);
      return latest === undefined ? saved : accountToDraft(latest);
    },
    conflictFields: (draft, current) => [
      {
        key: "clearance",
        label: t("permissions.clearance"),
        serverValue:
          current.clearance === null
            ? t("permissions.unset")
            : String(current.clearance),
        draftValue:
          draft.clearance === null
            ? t("permissions.unset")
            : String(draft.clearance),
      },
      {
        key: "grants",
        label: t("permissions.grants"),
        serverValue:
          current.grants.length === 0
            ? t("permissions.noGrants")
            : current.grants
                .map((grant) => grantDescription(t, data, grant))
                .join("\n"),
        draftValue:
          draft.grants.length === 0
            ? t("permissions.noGrants")
            : draft.grants
                .map((grant) => grantDescription(t, data, grant))
                .join("\n"),
      },
    ],
  });
  useRegisterDraft(save.isDirty || save.conflict);

  useEffect(() => {
    onDirtyChange(save.isDirty || save.conflict);
  }, [onDirtyChange, save.conflict, save.isDirty]);

  const updateGrant = (next: GrantDraft) => {
    save.setDraft({
      ...save.draft,
      grants: save.draft.grants.map((grant) =>
        grant.id === next.id ? next : grant,
      ),
    });
  };

  const removeGrant = (id: string) => {
    save.setDraft({
      ...save.draft,
      grants: save.draft.grants.filter((grant) => grant.id !== id),
    });
  };

  return (
    <form
      className={styles.card}
      onSubmit={(event) => {
        event.preventDefault();
        save.requestSave();
      }}
    >
      <h3 className={styles.cardTitle}>{account.displayName}</h3>
      <p className={styles.hint}>
        {t("permissions.role")}: {accountRoleLabel(t, account.role)}
      </p>
      {account.disabled ? (
        <p className={styles.error}>{t("permissions.disabled")}</p>
      ) : null}
      <Field label={t("permissions.clearance")}>
        <LevelSelect
          value={save.draft.clearance}
          disabled={save.saving}
          onChange={(clearance) => {
            save.setDraft({ ...save.draft, clearance });
          }}
        />
      </Field>

      <h4 className={styles.subheading}>{t("permissions.grants")}</h4>
      {save.draft.grants.length === 0 ? (
        <p className={styles.hint}>{t("permissions.noGrants")}</p>
      ) : (
        <div className={styles.stack}>
          {save.draft.grants.map((grant) => (
            <GrantCard
              key={grant.id}
              grant={grant}
              disabled={save.saving || scope.busy}
              onChange={updateGrant}
              onRemove={() => {
                removeGrant(grant.id);
              }}
            />
          ))}
        </div>
      )}
      <div className={styles.actions}>
        <ActionButton
          label={t("permissions.addGrant")}
          variant="secondary"
          disabled={scope.busy || save.conflict}
          onRun={() => {
            save.setDraft({
              ...save.draft,
              grants: [
                ...save.draft.grants,
                emptyGrant(scope.bundle.me.orgId, createId()),
              ],
            });
          }}
        />
        <SaveButton save={save} />
      </div>
      <DraftFeedback save={save} />
      <DraftDialogs save={save} />
    </form>
  );
}

function selectionMode(selection: PermissionSelection | undefined): string {
  if (selection === undefined) return "";
  return selection.kind;
}

function grantWithStores(
  grant: GrantDraft,
  stores: PermissionSelection | undefined,
): GrantDraft {
  if (stores === undefined) {
    return {
      id: grant.id,
      orgId: grant.orgId,
      enterpriseKey: grant.enterpriseKey,
      categoryIds: grant.categoryIds,
      ownership: grant.ownership,
      dimensions: grant.dimensions,
    };
  }
  return { ...grant, stores };
}

function grantWithDimensions(
  grant: GrantDraft,
  dimensions: Readonly<Record<string, PermissionSelection>>,
): GrantDraft {
  return { ...grant, dimensions };
}

function GrantCard({
  grant,
  disabled,
  onChange,
  onRemove,
}: {
  grant: GrantDraft;
  disabled: boolean;
  onChange: (next: GrantDraft) => void;
  onRemove: () => void;
}) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const { categories, dimensions, enterprises, stores } = scope.bundle;

  const removeFlow = useConfirmFlow<void, void>({
    prepare: () => undefined,
    submit: () => {
      onRemove();
    },
  });

  const categoryChoices = categories
    .filter(
      (category) =>
        category.key !== INTERNAL_CATEGORY_KEY &&
        (grant.ownership === "" ||
          (grant.ownership === "store"
            ? category.allowStore
            : category.allowGroup) ||
          grant.categoryIds.includes(category.id)),
    )
    .map((category) => ({
      value: category.id,
      label: categoryLabel(t, category),
      disabled: category.retired,
    }));
  const internalIds = grant.categoryIds.filter(
    (id) =>
      categories.find((category) => category.id === id)?.key ===
      INTERNAL_CATEGORY_KEY,
  );
  for (const id of grant.categoryIds) {
    if (
      !internalIds.includes(id) &&
      !categoryChoices.some((choice) => choice.value === id) &&
      !categories.some(
        (category) =>
          category.id === id && category.key === INTERNAL_CATEGORY_KEY,
      )
    ) {
      categoryChoices.push({
        value: id,
        label: t("permissions.preserved"),
        disabled: false,
      });
    }
  }

  const selectedStores = grant.stores;
  const storeChoices =
    selectedStores === undefined || selectedStores.kind !== "fixed"
      ? []
      : selectedStores.values;
  const storeOptions = stores
    .filter((store) => store.enterpriseKey === grant.enterpriseKey)
    .map((store) => ({
      value: store.name,
      label: itemLabel(t, store.name, store.retired),
      disabled: store.retired,
    }));
  for (const name of storeChoices) {
    if (!storeOptions.some((option) => option.value === name)) {
      storeOptions.push({ value: name, label: name, disabled: false });
    }
  }

  const requiredDimensionIds = new Set(
    grant.categoryIds.flatMap((id) => {
      const category = categories.find((item) => item.id === id);
      return category === undefined
        ? []
        : category.dimensions.map((item) => item.dimensionId);
    }),
  );
  const dimensionIds = new Set([
    ...requiredDimensionIds,
    ...Object.keys(grant.dimensions),
  ]);

  const enterpriseOptions = enterprises.map((enterprise) => ({
    value: enterprise.enterpriseKey,
    label: enterprise.enterpriseName,
  }));
  if (
    grant.enterpriseKey !== "" &&
    !enterpriseOptions.some((option) => option.value === grant.enterpriseKey)
  ) {
    enterpriseOptions.push({
      value: grant.enterpriseKey,
      label: grant.enterpriseKey,
    });
  }

  const handleStoreMode = (mode: string) => {
    if (mode === "none") {
      // 复刻旧页：选择“无门店读取权限”等于撤掉整条授权，必须显式确认。
      void removeFlow.request();
      return;
    }
    if (mode === "") {
      onChange(grantWithStores(grant, undefined));
      return;
    }
    if (mode === "all") {
      onChange(grantWithStores(grant, { kind: "all" }));
      return;
    }
    onChange(
      grantWithStores(grant, {
        kind: "fixed",
        values:
          selectedStores?.kind === "fixed" ? [...selectedStores.values] : [],
      }),
    );
  };

  return (
    <div className={styles.subcard}>
      <div className={styles.row}>
        <Field label={t("permissions.enterprise")}>
          <select
            value={grant.enterpriseKey}
            disabled={disabled}
            onChange={(event) => {
              onChange({
                ...grant,
                enterpriseKey: event.target.value,
                ...(grant.ownership === "store"
                  ? { stores: { kind: "fixed", values: [] } }
                  : {}),
              });
            }}
          >
            <option value="">{t("permissions.choose")}</option>
            {enterpriseOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("permissions.ownership")}>
          <select
            value={grant.ownership}
            disabled={disabled}
            onChange={(event) => {
              const ownership = event.target.value;
              const next: GrantDraft =
                ownership === "store"
                  ? {
                      ...grant,
                      ownership: "store",
                      stores:
                        grant.stores === undefined
                          ? { kind: "fixed", values: [] }
                          : grant.stores,
                    }
                  : ownership === "group"
                    ? grantWithStores(
                        { ...grant, ownership: "group" },
                        undefined,
                      )
                    : grantWithStores({ ...grant, ownership: "" }, undefined);
              onChange(next);
            }}
          >
            <option value="">{t("permissions.choose")}</option>
            <option value="store">{t("permissions.store")}</option>
            <option value="group">{t("permissions.group")}</option>
          </select>
        </Field>
      </div>

      <Checklist
        legend={t("permissions.categoriesLabel")}
        options={categoryChoices}
        selected={grant.categoryIds}
        disabled={disabled}
        onChange={(values) => {
          onChange({
            ...grant,
            categoryIds: [...internalIds, ...values],
          });
        }}
      />
      {internalIds.length === 0 ? null : (
        <SectionNote>{t("permissions.internalLedger")}</SectionNote>
      )}

      {grant.ownership === "group" ? (
        <SectionNote>{t("permissions.groupHelp")}</SectionNote>
      ) : null}
      {grant.ownership === "store" ? (
        <div>
          <Field label={t("permissions.selectedStores")}>
            <select
              value={selectionMode(grant.stores)}
              disabled={disabled}
              onChange={(event) => {
                handleStoreMode(event.target.value);
              }}
            >
              <option value="">{t("permissions.choose")}</option>
              <option value="none">{t("permissions.noStoreRead")}</option>
              <option value="fixed">{t("permissions.selectedStores")}</option>
              <option value="all">{t("permissions.allStores")}</option>
            </select>
          </Field>
          {grant.stores !== undefined && grant.stores.kind === "fixed" ? (
            <Checklist
              legend={t("permissions.selectedStores")}
              options={storeOptions}
              selected={grant.stores.values}
              disabled={disabled}
              onChange={(values) => {
                onChange(grantWithStores(grant, { kind: "fixed", values }));
              }}
            />
          ) : null}
        </div>
      ) : null}

      <div className={styles.stack}>
        {[...dimensionIds].map((dimensionId) => (
          <GrantDimensionCard
            key={dimensionId}
            dimension={dimensions.find((item) => item.id === dimensionId)}
            dimensionId={dimensionId}
            required={requiredDimensionIds.has(dimensionId)}
            grant={grant}
            disabled={disabled}
            onChange={onChange}
          />
        ))}
      </div>

      <ConfirmDialog
        flow={removeFlow}
        title={t("permissions.removeGrant")}
        description={grantDescription(t, scope.bundle, grant)}
        confirmLabel={t("permissions.removeGrant")}
        cancelLabel={t("permissions.cancel")}
      />
      <div className={styles.actions}>
        <ActionButton
          label={t("permissions.removeGrant")}
          variant="secondary"
          disabled={disabled}
          onRun={() => {
            void removeFlow.request();
          }}
        />
      </div>
    </div>
  );
}

function GrantDimensionCard({
  dimension,
  dimensionId,
  required,
  grant,
  disabled,
  onChange,
}: {
  dimension: PermissionDimension | undefined;
  dimensionId: string;
  required: boolean;
  grant: GrantDraft;
  disabled: boolean;
  onChange: (next: GrantDraft) => void;
}) {
  const { t } = useText();
  const selection = grant.dimensions[dimensionId];
  const mode = selectionMode(selection);

  const setSelection = (next: PermissionSelection | undefined) => {
    const dimensions = { ...grant.dimensions };
    if (next === undefined) {
      delete dimensions[dimensionId];
    } else {
      dimensions[dimensionId] = next;
    }
    onChange(grantWithDimensions(grant, dimensions));
  };

  const valueChoices = (dimension?.values ?? []).map((value) => ({
    value: value.id,
    label: itemLabel(t, value.name, value.retired),
    disabled: value.retired,
  }));
  if (selection !== undefined && selection.kind === "fixed") {
    for (const id of selection.values) {
      if (!valueChoices.some((choice) => choice.value === id)) {
        valueChoices.push({
          value: id,
          label: t("permissions.preserved"),
          disabled: false,
        });
      }
    }
  }

  return (
    <div className={styles.subcard}>
      <Field
        label={
          dimension === undefined ? t("permissions.preserved") : dimension.name
        }
      >
        <select
          value={mode}
          disabled={disabled}
          onChange={(event) => {
            const next = event.target.value;
            if (next === "") {
              setSelection(undefined);
            } else if (next === "all") {
              setSelection({ kind: "all" });
            } else {
              setSelection({
                kind: "fixed",
                values:
                  selection !== undefined && selection.kind === "fixed"
                    ? [...selection.values]
                    : [],
              });
            }
          }}
        >
          <option value="">{t("permissions.choose")}</option>
          <option value="fixed">{t("permissions.selectedValues")}</option>
          <option value="all">{t("permissions.allValues")}</option>
        </select>
      </Field>
      {selection !== undefined && selection.kind === "fixed" ? (
        <Checklist
          legend={t("permissions.selectedValues")}
          options={valueChoices}
          selected={selection.values}
          disabled={disabled}
          onChange={(values) => {
            setSelection({ kind: "fixed", values });
          }}
        />
      ) : null}
      {required ? null : (
        <div className={styles.actions}>
          <ActionButton
            label={t("permissions.removeCondition")}
            variant="secondary"
            disabled={disabled}
            onRun={() => {
              setSelection(undefined);
            }}
          />
        </div>
      )}
    </div>
  );
}
