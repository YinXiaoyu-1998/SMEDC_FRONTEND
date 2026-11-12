import { useState } from "react";

import type { PermissionCategory, PermissionsBundle } from "@/api/permissions";
import { useText } from "@/i18n/useText";
import { ActionButton } from "@/ui/ActionButton";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Field } from "@/ui/Field";
import { useConfirmFlow } from "@/ui/useConfirmFlow";

import {
  describeScope,
  emptyDocumentScope,
  sameScopeTuple,
  type DocumentScopeDraft,
} from "./document-draft";
import { itemLabel } from "./labels";
import { Panel } from "./panel";
import styles from "./Permissions.module.css";

/** 单个文档范围编辑器：只编辑本地草稿，点「完成范围」交回父面板。 */
export function DocumentScopeEditor({
  open,
  initial,
  category,
  data,
  documentTitle,
  onComplete,
  onCancel,
}: {
  readonly open: boolean;
  readonly initial: DocumentScopeDraft | null;
  readonly category: PermissionCategory | undefined;
  readonly data: PermissionsBundle;
  readonly documentTitle: string;
  readonly onComplete: (scope: DocumentScopeDraft) => void;
  readonly onCancel: () => void;
}) {
  const { t } = useText();
  const [draft, setDraft] = useState<DocumentScopeDraft>(
    () => initial ?? emptyDocumentScope(),
  );
  const [issue, setIssue] = useState<string | null>(null);
  const dirty =
    initial === null
      ? draft.enterpriseKey !== "" ||
        draft.ownership !== "" ||
        Object.keys(draft.dimensions).length > 0
      : !sameScopeTuple(initial, draft);
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

  const requiredDimensionIds =
    category?.dimensions.map((item) => item.dimensionId) ?? [];

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

  const ownershipOptions: { value: string; label: string }[] = [
    { value: "", label: t("permissions.choose") },
  ];
  if (category?.allowStore === true || draft.ownership === "store") {
    ownershipOptions.push({ value: "store", label: t("permissions.store") });
  }
  if (category?.allowGroup === true || draft.ownership === "group") {
    ownershipOptions.push({ value: "group", label: t("permissions.group") });
  }

  const storeOptions = data.stores
    .filter(
      (store) =>
        store.enterpriseKey === draft.enterpriseKey &&
        (store.confirmation === undefined ||
          store.confirmation === "confirmed" ||
          store.name === draft.storeName),
    )
    .map((store) => ({
      value: store.name,
      label: itemLabel(t, store.officialName ?? store.name, store.retired),
      disabled:
        (store.retired ||
          (store.confirmation !== undefined &&
            store.confirmation !== "confirmed")) &&
        store.name !== draft.storeName,
    }));

  const submit = () => {
    if (draft.enterpriseKey === "" || draft.ownership === "") {
      setIssue(t("permissions.scopeMissing"));
      return;
    }
    if (
      draft.ownership === "store" &&
      (draft.storeName === undefined ||
        draft.storeName === "" ||
        !data.stores.some(
          (store) =>
            store.enterpriseKey === draft.enterpriseKey &&
            store.name === draft.storeName,
        ))
    ) {
      setIssue(t("permissions.scopeMissing"));
      return;
    }
    if (requiredDimensionIds.some((id) => draft.dimensions[id] === undefined)) {
      setIssue(t("permissions.scopeMissing"));
      return;
    }
    onComplete(draft);
  };

  return (
    <Panel
      open={open}
      variant="modal"
      title={
        initial === null
          ? t("permissions.addDocumentScope")
          : t("permissions.editScope")
      }
      subtitle={documentTitle}
      onRequestClose={requestClose}
      footer={
        <>
          <ActionButton
            label={t("permissions.cancel")}
            variant="secondary"
            onRun={requestClose}
          />
          <ActionButton label={t("permissions.scopeComplete")} onRun={submit} />
        </>
      }
    >
      <div className={styles.fieldPair}>
        <Field label={t("permissions.scopeEnterprise")}>
          <select
            value={draft.enterpriseKey}
            onChange={(event) => {
              setDraft({
                ...draft,
                enterpriseKey: event.target.value,
                ...(draft.ownership === "store" ? { storeName: "" } : {}),
              });
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
              if (ownership === "store") {
                setDraft({ ...draft, ownership: "store", storeName: "" });
              } else if (ownership === "group") {
                setDraft({
                  id: draft.id,
                  enterpriseKey: draft.enterpriseKey,
                  ownership: "group",
                  dimensions: draft.dimensions,
                });
              } else {
                setDraft({
                  id: draft.id,
                  enterpriseKey: draft.enterpriseKey,
                  ownership: "",
                  dimensions: draft.dimensions,
                });
              }
              setIssue(null);
            }}
          >
            {ownershipOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {draft.ownership === "store" ? (
        <Field label={t("permissions.scopeStore")}>
          <select
            value={draft.storeName ?? ""}
            onChange={(event) => {
              setDraft({ ...draft, storeName: event.target.value });
              setIssue(null);
            }}
          >
            <option value="">{t("permissions.choose")}</option>
            {storeOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      {requiredDimensionIds.map((dimensionId) => {
        const dimension = data.dimensions.find(
          (item) => item.id === dimensionId,
        );
        const current = draft.dimensions[dimensionId] ?? "";
        const valueOptions = (dimension?.values ?? [])
          .filter((value) => !value.retired || value.id === current)
          .map((value) => ({
            value: value.id,
            label: itemLabel(t, value.name, value.retired),
            disabled: value.retired && value.id !== current,
          }));
        return (
          <Field
            key={dimensionId}
            label={`${dimension?.name ?? t("permissions.preserved")}${t("permissions.conditionRequired")}`}
          >
            <select
              value={current}
              onChange={(event) => {
                const dimensions = { ...draft.dimensions };
                if (event.target.value === "") {
                  delete dimensions[dimensionId];
                } else {
                  dimensions[dimensionId] = event.target.value;
                }
                setDraft({ ...draft, dimensions });
                setIssue(null);
              }}
            >
              <option value="">{t("permissions.choose")}</option>
              {valueOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        );
      })}

      <p className={styles.inlineNote}>{describeScope(t, data, draft)}</p>
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
