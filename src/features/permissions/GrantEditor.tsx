import { useMemo, useState, type RefObject } from "react";

import { useText } from "@/i18n/useText";
import { ActionButton } from "@/ui/ActionButton";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Field } from "@/ui/Field";
import { useConfirmFlow } from "@/ui/useConfirmFlow";

import { Checklist } from "./components";
import { INTERNAL_CATEGORY_KEY } from "./constants";
import { createId } from "./ids";
import { categoryLabel, itemLabel } from "./labels";
import {
  emptyGrant,
  sameGrant,
  validSelection,
  validateGrant,
  type GrantData,
  type GrantDraft,
} from "./grants";
import { Panel } from "./panel";
import styles from "./Permissions.module.css";

function requiredDimensionIds(
  grant: GrantDraft,
  data: GrantData,
): readonly string[] {
  const ids = new Set<string>();
  for (const categoryId of grant.categoryIds) {
    const category = data.categories.find((item) => item.id === categoryId);
    for (const dimension of category?.dimensions ?? []) {
      ids.add(dimension.dimensionId);
    }
  }
  return [...ids];
}

function ownershipAllowed(
  grant: GrantDraft,
  data: GrantData,
  categoryId: string,
): boolean {
  const category = data.categories.find((item) => item.id === categoryId);
  if (category === undefined) return grant.categoryIds.includes(categoryId);
  if (grant.ownership === "store") return category.allowStore;
  if (grant.ownership === "group") return category.allowGroup;
  return true;
}

/**
 * 单条读取授权编辑器：所有输入只进入本地条目草稿，
 * 「完成条目」把校验通过的条目交回父面板，整个过程不发写请求。
 */
export function GrantEditor({
  open,
  grant,
  accountName,
  orgId,
  data,
  onComplete,
  onRemove,
  onCancel,
  returnFocusRef,
}: {
  readonly open: boolean;
  readonly grant: GrantDraft | null;
  readonly accountName: string;
  readonly orgId: string;
  readonly data: GrantData;
  readonly onComplete: (grant: GrantDraft) => void;
  readonly onRemove: () => void;
  readonly onCancel: () => void;
  readonly returnFocusRef?: RefObject<HTMLElement | null>;
}) {
  const { t } = useText();
  const [draft, setDraft] = useState<GrantDraft>(() =>
    grant === null ? emptyGrant(orgId, createId()) : grant,
  );
  const [issue, setIssue] = useState<string | null>(null);
  const [initial] = useState<GrantDraft | null>(grant);
  const dirty = useMemo(() => {
    if (initial === null) {
      return (
        draft.enterpriseKey !== "" ||
        draft.ownership !== "" ||
        draft.categoryIds.length > 0 ||
        Object.keys(draft.dimensions).length > 0
      );
    }
    return !sameGrant(initial, draft);
  }, [draft, initial]);
  const discardFlow = useConfirmFlow<void, void>({
    prepare: () => undefined,
    submit: () => {
      onCancel();
    },
  });
  const requestClose = () => {
    if (dirty) {
      void discardFlow.request();
      return;
    }
    onCancel();
  };

  const required = useMemo(
    () => requiredDimensionIds(draft, data),
    [data, draft],
  );

  const enterpriseOptions = data.enterprises.map((enterprise) => ({
    value: enterprise.enterpriseKey,
    label: enterprise.enterpriseName,
  }));
  if (
    draft.enterpriseKey !== "" &&
    !enterpriseOptions.some((option) => option.value === draft.enterpriseKey)
  ) {
    enterpriseOptions.push({
      value: draft.enterpriseKey,
      label: draft.enterpriseKey,
    });
  }

  const categoryOptions = data.categories
    .filter(
      (category) =>
        category.key !== INTERNAL_CATEGORY_KEY &&
        (draft.ownership === "" ||
          ownershipAllowed(draft, data, category.id) ||
          draft.categoryIds.includes(category.id)),
    )
    .map((category) => ({
      value: category.id,
      label: itemLabel(t, categoryLabel(t, category), category.retired),
      disabled: category.retired && !draft.categoryIds.includes(category.id),
    }));
  for (const categoryId of draft.categoryIds) {
    if (!categoryOptions.some((option) => option.value === categoryId)) {
      categoryOptions.push({
        value: categoryId,
        label: t("permissions.preserved"),
        disabled: false,
      });
    }
  }

  const selectedStoreNames =
    draft.stores !== undefined && draft.stores.kind === "fixed"
      ? draft.stores.values
      : [];
  const storeOptions = data.stores
    .filter(
      (store) =>
        store.enterpriseKey === draft.enterpriseKey &&
        (store.confirmation === undefined ||
          store.confirmation === "confirmed" ||
          selectedStoreNames.includes(store.name)),
    )
    .map((store) => ({
      value: store.name,
      label: itemLabel(t, store.officialName ?? store.name, store.retired),
      disabled:
        store.retired ||
        (store.confirmation !== undefined &&
          store.confirmation !== "confirmed"),
    }));
  for (const name of selectedStoreNames) {
    if (!storeOptions.some((option) => option.value === name)) {
      storeOptions.push({ value: name, label: name, disabled: false });
    }
  }

  const storeMode =
    draft.ownership !== "store"
      ? ""
      : draft.stores === undefined
        ? ""
        : draft.stores.kind === "all"
          ? "all"
          : "fixed";

  const setCategories = (categoryIds: readonly string[]) => {
    const nextRequired = new Set<string>();
    for (const categoryId of categoryIds) {
      const category = data.categories.find((item) => item.id === categoryId);
      for (const dimension of category?.dimensions ?? []) {
        nextRequired.add(dimension.dimensionId);
      }
    }
    const dimensions = Object.fromEntries(
      [...nextRequired].flatMap((id) => {
        const selection = draft.dimensions[id];
        return selection === undefined ? [] : [[id, selection]];
      }),
    );
    setDraft({ ...draft, categoryIds, dimensions });
    setIssue(null);
  };

  const setDimensionValue = (dimensionId: string, mode: string) => {
    const dimensions = { ...draft.dimensions };
    if (mode === "") {
      delete dimensions[dimensionId];
    } else if (mode === "all") {
      dimensions[dimensionId] = { kind: "all" };
    } else {
      const previous = dimensions[dimensionId];
      dimensions[dimensionId] = {
        kind: "fixed",
        values:
          previous !== undefined && previous.kind === "fixed"
            ? [...previous.values]
            : [],
      };
    }
    setDraft({ ...draft, dimensions });
    setIssue(null);
  };

  const nextForOwnership = (ownership: GrantDraft["ownership"]): GrantDraft => {
    const categoryIds = draft.categoryIds.filter((id) => {
      const category = data.categories.find((item) => item.id === id);
      if (category === undefined) return true;
      if (ownership === "store") return category.allowStore;
      if (ownership === "group") return category.allowGroup;
      return true;
    });
    const required = new Set<string>();
    for (const id of categoryIds) {
      const category = data.categories.find((item) => item.id === id);
      for (const dimension of category?.dimensions ?? []) {
        required.add(dimension.dimensionId);
      }
    }
    const dimensions = Object.fromEntries(
      [...required].flatMap((dimensionId) => {
        const selection = draft.dimensions[dimensionId];
        return selection === undefined ? [] : [[dimensionId, selection]];
      }),
    );
    const base = {
      id: draft.id,
      orgId: draft.orgId,
      enterpriseKey: draft.enterpriseKey,
      categoryIds,
      dimensions,
    };
    if (ownership === "store") {
      return {
        ...base,
        ownership: "store",
        stores: draft.stores ?? { kind: "fixed", values: [] },
      };
    }
    return { ...base, ownership };
  };

  const submit = () => {
    if (
      draft.enterpriseKey === "" ||
      draft.ownership === "" ||
      draft.categoryIds.length === 0
    ) {
      setIssue(t("permissions.grantNeedsIdentity"));
      return;
    }
    if (draft.ownership === "store" && !validSelection(draft.stores)) {
      setIssue(t("permissions.grantNeedsStore"));
      return;
    }
    const missingConditions = required.some(
      (dimensionId) => !validSelection(draft.dimensions[dimensionId]),
    );
    const emptyFixed = Object.values(draft.dimensions).some(
      (selection) =>
        selection.kind === "fixed" && selection.values.length === 0,
    );
    if (required.length > 0 && (missingConditions || emptyFixed)) {
      setIssue(t("permissions.grantNeedsConditions"));
      return;
    }
    const result = validateGrant(draft, data);
    if (result !== null) {
      setIssue(t(result));
      return;
    }
    onComplete(draft);
  };

  return (
    <Panel
      open={open}
      variant="modal"
      title={
        grant === null
          ? t("permissions.addGrantEntry")
          : t("permissions.editGrantEntry")
      }
      subtitle={`${accountName} · ${t("permissions.grants")}`}
      onRequestClose={requestClose}
      {...(returnFocusRef === undefined ? {} : { returnFocusRef })}
      footer={
        <>
          <ActionButton
            label={t("permissions.cancel")}
            variant="secondary"
            onRun={requestClose}
          />
          <ActionButton label={t("permissions.grantComplete")} onRun={submit} />
        </>
      }
    >
      <div className={styles.fieldPair}>
        <Field label={t("permissions.enterprise")}>
          <select
            value={draft.enterpriseKey}
            onChange={(event) => {
              const enterpriseKey = event.target.value;
              if (draft.ownership === "store") {
                setDraft({
                  ...draft,
                  enterpriseKey,
                  stores: { kind: "fixed", values: [] },
                });
              } else {
                setDraft({ ...draft, enterpriseKey });
              }
              setIssue(null);
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
            value={draft.ownership}
            onChange={(event) => {
              const ownership = event.target.value;
              setDraft(
                nextForOwnership(
                  ownership === "store" || ownership === "group"
                    ? ownership
                    : "",
                ),
              );
              setIssue(null);
            }}
          >
            <option value="">{t("permissions.choose")}</option>
            <option value="store">{t("permissions.store")}</option>
            <option value="group">{t("permissions.group")}</option>
          </select>
        </Field>
      </div>

      {draft.ownership === "store" ? (
        <>
          <Field label={t("permissions.storeMode")}>
            <select
              value={storeMode}
              onChange={(event) => {
                const mode = event.target.value;
                if (mode === "none") {
                  onRemove();
                  return;
                }
                if (mode === "all") {
                  setDraft({ ...draft, stores: { kind: "all" } });
                } else if (mode === "fixed") {
                  setDraft({
                    ...draft,
                    stores: {
                      kind: "fixed",
                      values:
                        draft.stores !== undefined &&
                        draft.stores.kind === "fixed"
                          ? [...draft.stores.values]
                          : [],
                    },
                  });
                } else {
                  setDraft({
                    id: draft.id,
                    orgId: draft.orgId,
                    enterpriseKey: draft.enterpriseKey,
                    categoryIds: draft.categoryIds,
                    ownership: draft.ownership,
                    dimensions: draft.dimensions,
                  });
                }
                setIssue(null);
              }}
            >
              <option value="">{t("permissions.choose")}</option>
              {grant === null ? null : (
                <option value="none">{t("permissions.noStoreRead")}</option>
              )}
              <option value="fixed">{t("permissions.selectedStores")}</option>
              <option value="all">{t("permissions.allStores")}</option>
            </select>
          </Field>
          {draft.stores !== undefined && draft.stores.kind === "fixed" ? (
            <Checklist
              legend={t("permissions.selectedStores")}
              options={storeOptions}
              selected={draft.stores.values}
              onChange={(values) => {
                setDraft({ ...draft, stores: { kind: "fixed", values } });
                setIssue(null);
              }}
            />
          ) : null}
        </>
      ) : draft.ownership === "group" ? (
        <p className={styles.inlineNote}>{t("permissions.groupHelp")}</p>
      ) : null}

      <Checklist
        legend={t("permissions.categoriesLabel")}
        options={categoryOptions}
        selected={draft.categoryIds}
        onChange={setCategories}
      />

      {required.length === 0 &&
      Object.keys(draft.dimensions).length === 0 ? null : (
        <div className={styles.stack}>
          {required.map((dimensionId) => {
            const dimension = data.dimensions.find(
              (item) => item.id === dimensionId,
            );
            const selection = draft.dimensions[dimensionId];
            const mode =
              selection === undefined
                ? ""
                : selection.kind === "all"
                  ? "all"
                  : "fixed";
            const valueOptions = (dimension?.values ?? [])
              .filter(
                (value) =>
                  !value.retired ||
                  (selection !== undefined &&
                    selection.kind === "fixed" &&
                    selection.values.includes(value.id)),
              )
              .map((value) => ({
                value: value.id,
                label: itemLabel(t, value.name, value.retired),
                disabled: value.retired,
              }));
            return (
              <div className={styles.subcard} key={dimensionId}>
                <Field
                  label={`${dimension?.name ?? t("permissions.preserved")}${t("permissions.conditionRequired")}`}
                >
                  <select
                    value={mode}
                    onChange={(event) => {
                      setDimensionValue(dimensionId, event.target.value);
                    }}
                  >
                    <option value="">{t("permissions.choose")}</option>
                    <option value="fixed">
                      {t("permissions.selectedValues")}
                    </option>
                    <option value="all">{t("permissions.allValues")}</option>
                  </select>
                </Field>
                {selection !== undefined && selection.kind === "fixed" ? (
                  <Checklist
                    legend={t("permissions.selectedValues")}
                    options={valueOptions}
                    selected={selection.values}
                    onChange={(values) => {
                      setDraft({
                        ...draft,
                        dimensions: {
                          ...draft.dimensions,
                          [dimensionId]: { kind: "fixed", values },
                        },
                      });
                      setIssue(null);
                    }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {issue === null ? null : (
        <p className={styles.formIssue} role="alert">
          {issue}
        </p>
      )}
      <ConfirmDialog
        flow={discardFlow}
        title={t("permissions.discardTitle")}
        description={t("permissions.discardDescription")}
        confirmLabel={t("permissions.discardChanges")}
        cancelLabel={t("permissions.discard.keep")}
      />
    </Panel>
  );
}
