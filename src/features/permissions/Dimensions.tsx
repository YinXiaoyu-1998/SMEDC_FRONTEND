import { useRef, useState } from "react";

import type {
  PermissionDimension,
  PermissionDimensionValue,
  PermissionsDimensionsCreateResponse,
  PermissionsDimensionsUpdateResponse,
} from "@/api/permissions";
import { useText } from "@/i18n/useText";
import { AdminIcon } from "@/ui/AdminIcon";
import { ActionButton } from "@/ui/ActionButton";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { DataTable } from "@/ui/DataTable";
import { InlineError } from "@/ui/InlineError";
import { useConfirmFlow } from "@/ui/useConfirmFlow";

import { DraftFeedback, NameField, SearchInput } from "./components";
import type { Confirmation } from "./diff";
import { createId } from "./ids";
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
import { useDraftSave, type DraftSave } from "./useDraftSave";
import { useRegisterDraft } from "./useRegisterDraft";
import { ValueEditor } from "./ValueEditor";

const NEW_DIMENSION = "\u0000new";

export function DimensionsSection({ active }: { readonly active: boolean }) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [lastCreateSignal, setLastCreateSignal] = useState(scope.createSignal);

  const dimensions = scope.bundle.dimensions;
  const editingDimension =
    editing === null || editing === NEW_DIMENSION
      ? null
      : (dimensions.find((item) => item.id === editing) ?? null);

  if (lastCreateSignal !== scope.createSignal) {
    setLastCreateSignal(scope.createSignal);
    if (active) setEditing(NEW_DIMENSION);
  }

  const needle = search.trim().toLowerCase();
  const activeRows = dimensions.filter(
    (dimension) =>
      !dimension.retired &&
      (needle === "" || dimension.name.toLowerCase().includes(needle)),
  );
  const retiredRows = dimensions.filter(
    (dimension) =>
      dimension.retired &&
      (needle === "" || dimension.name.toLowerCase().includes(needle)),
  );

  const openDimension = (id: string) => {
    setEditing(id);
  };

  return (
    <>
      <section className={styles.catalogCard}>
        <ListHeader
          title={t("permissions.tabs.dimensions")}
          description={t("permissions.conditionHint")}
        />
        <div className={styles.toolbar}>
          <SearchInput
            label={t("permissions.searchCondition")}
            value={search}
            onChange={setSearch}
          />
        </div>
        <DataTable<PermissionDimension>
          className={styles.catalogTable}
          columns={[
            {
              id: "name",
              header: t("permissions.conditionName"),
              cell: (dimension) => (
                <div className={styles.rowName}>
                  <span className={styles.rowIcon}>
                    <AdminIcon name="condition" />
                  </span>
                  <strong>{dimension.name}</strong>
                </div>
              ),
            },
            {
              id: "values",
              header: t("permissions.conditionValues"),
              cell: (dimension) => {
                const values = dimension.values.filter(
                  (value) => !value.retired,
                );
                return values.length === 0
                  ? t("permissions.emptyValues")
                  : values.map((value) => (
                      <span className={styles.chip} key={value.id}>
                        {value.name}
                      </span>
                    ));
              },
            },
            {
              id: "actions",
              header: t("permissions.actions"),
              align: "end",
              cell: (dimension) => (
                <ActionButton
                  label={t("permissions.edit")}
                  variant="ghost"
                  className={styles.rowAction}
                  icon={<AdminIcon name="edit" />}
                  onRun={() => {
                    openDimension(dimension.id);
                  }}
                />
              ),
            },
          ]}
          rows={activeRows}
          getRowId={(dimension) => dimension.id}
          label={t("permissions.conditionList")}
          emptyLabel={t("permissions.empty")}
        />
      </section>
      {retiredRows.length === 0 ? null : (
        <details className={styles.archiveCard}>
          <summary>
            {t("permissions.retired")} ({retiredRows.length})
          </summary>
          <div className={styles.archiveList}>
            {retiredRows.map((dimension) => (
              <ObjectRow
                key={dimension.id}
                title={dimension.name}
                description={t("permissions.retired")}
                actions={
                  <ActionButton
                    label={t("permissions.edit")}
                    variant="ghost"
                    className={styles.rowAction}
                    icon={<AdminIcon name="edit" />}
                    onRun={() => {
                      openDimension(dimension.id);
                    }}
                  />
                }
              />
            ))}
          </div>
        </details>
      )}

      {editing === NEW_DIMENSION ? (
        <ConditionCreatePanel
          onClose={() => {
            setEditing(null);
          }}
          onCreated={(id) => {
            setEditing(id);
          }}
        />
      ) : null}

      {editingDimension === null ? null : (
        <ConditionPanel
          key={editingDimension.id}
          dimension={editingDimension}
          onClose={() => {
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function statusText(t: (key: string) => string, retired: boolean): string {
  return t(retired ? "permissions.retired" : "permissions.status.active");
}

function ConditionCreatePanel({
  onClose,
  onCreated,
}: {
  readonly onClose: () => void;
  readonly onCreated: (id: string) => void;
}) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const save = useDraftSave<
    { readonly name: string },
    PermissionsDimensionsCreateResponse
  >({
    baseline: { snapshot: { name: "" }, version: scope.bundle.version },
    validate: (draft) =>
      draft.name.trim() === "" ? "permissions.required" : null,
    confirmation: (draft) => ({
      subject: t("permissions.addCondition"),
      diff:
        draft.name.trim() === ""
          ? []
          : [
              {
                kind: "added",
                label: t("permissions.conditionName"),
                after: draft.name.trim(),
              },
            ],
      impact: t("permissions.conditionCreateImpact"),
    }),
    submit: (draft, expectedVersion) =>
      scope.writes.createDimension({
        expectedVersion,
        id: createId(),
        name: draft.name.trim(),
        retired: false,
      }),
    nextBaseline: () => ({ name: "" }),
    reload: async () => {
      const next = await scope.reload();
      return { snapshot: { name: "" }, version: next.version };
    },
    onSaved: (result) => {
      scope.setNotice("permissions.conditionCreated");
      onCreated(result.value.id);
    },
  });
  useRegisterDraft(save.isDirty || save.conflict);

  const discardFlow = useConfirmFlow<void, void>({
    prepare: () => undefined,
    submit: onClose,
  });
  const requestClose = () => {
    if (save.isDirty || save.conflict) void discardFlow.request();
    else onClose();
  };

  return (
    <Panel
      open
      title={t("permissions.addCondition")}
      onRequestClose={requestClose}
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
            disabled={!save.canSave || scope.busy}
            {...(save.disabledReason === undefined
              ? {}
              : { disabledReason: save.disabledReason })}
            onRun={save.requestSave}
          />
        </>
      }
    >
      <NameField
        label={t("permissions.conditionName")}
        required
        value={save.draft.name}
        disabled={save.saving}
        onChange={(name) => {
          save.setDraft({ name });
        }}
      />
      <DraftFeedback save={save} />
      <ConditionConflict save={save} />
      <ConfirmDialog
        flow={discardFlow}
        title={t("permissions.discardTitle")}
        description={t("permissions.discardDescription")}
        confirmLabel={t("permissions.discardChanges")}
        cancelLabel={t("permissions.discard.keep")}
      />
      <PermissionConfirmDialog
        flow={save.flow}
        title={t("permissions.confirm.title")}
        confirmLabel={t("permissions.confirm.action")}
        cancelLabel={t("permissions.cancel")}
      />
    </Panel>
  );
}

function ConditionPanel({
  dimension,
  onClose,
}: {
  readonly dimension: PermissionDimension;
  readonly onClose: () => void;
}) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const save = useDraftSave<
    { readonly name: string; readonly retired: boolean },
    PermissionsDimensionsUpdateResponse
  >({
    baseline: {
      snapshot: { name: dimension.name, retired: dimension.retired },
      version: scope.bundle.version,
    },
    validate: (draft) =>
      draft.name.trim() === "" ? "permissions.required" : null,
    confirmation: (draft, base) => ({
      subject: dimension.name,
      diff:
        base.name === draft.name.trim()
          ? []
          : [
              {
                kind: "changed",
                label: t("permissions.conditionName"),
                before: base.name,
                after: draft.name.trim(),
              },
            ],
      impact: t("permissions.conditionSaveImpact"),
    }),
    submit: (draft, expectedVersion) =>
      scope.writes.updateDimension(dimension.id, {
        expectedVersion,
        name: draft.name.trim(),
        retired: draft.retired,
      }),
    nextBaseline: (result) => ({
      name: result.value.name,
      retired: result.value.retired,
    }),
    reload: async () => {
      const next = await scope.reload();
      const latest = next.dimensions.find((item) => item.id === dimension.id);
      return {
        snapshot: {
          name: latest?.name ?? dimension.name,
          retired: latest?.retired ?? dimension.retired,
        },
        version: next.version,
      };
    },
    rebase: ({ draft, server }) => ({
      kind: "merged",
      draft: { name: draft.name, retired: server.retired },
      notes: [],
    }),
    onSaved: () => {
      scope.setNotice("permissions.conditionWritten");
    },
  });
  useRegisterDraft(save.isDirty || save.conflict);

  const [editingValue, setEditingValue] = useState<string | null>(null);
  const pendingValue = useRef<PermissionDimensionValue | null>(null);
  const [pendingValueStatus, setPendingValueStatus] = useState<{
    readonly name: string;
    readonly retired: boolean;
  } | null>(null);

  const statusFlow = useConfirmFlow<
    {
      confirmation: Confirmation;
      version: string;
      value: PermissionDimensionValue | null;
    },
    void
  >({
    prepare: () => {
      const value = pendingValue.current;
      return {
        version: scope.bundle.version,
        value,
        confirmation: {
          subject: `${dimension.name} · ${value?.name ?? ""}`,
          diff:
            value === undefined || value === null
              ? []
              : [
                  {
                    kind: "changed",
                    label: t("permissions.statusLabel"),
                    before: statusText(t, value.retired),
                    after: statusText(t, !value.retired),
                  },
                ],
          impact: t("permissions.valueRetireImpact"),
        },
      };
    },
    submit: async ({ version, value }) => {
      if (value === null) return;
      await scope.writes.updateDimensionValue(dimension.id, value.id, {
        expectedVersion: version,
        name: value.name,
        retired: !value.retired,
      });
      pendingValue.current = null;
    },
  });

  const retireFlow = useConfirmFlow<
    {
      confirmation: Confirmation;
      version: string;
      name: string;
      retired: boolean;
    },
    void
  >({
    prepare: () => ({
      version: scope.bundle.version,
      name: dimension.name,
      retired: !dimension.retired,
      confirmation: {
        subject: dimension.name,
        diff: [
          {
            kind: "changed",
            label: t("permissions.statusLabel"),
            before: statusText(t, dimension.retired),
            after: statusText(t, !dimension.retired),
          },
        ],
        impact: dimension.retired
          ? t("permissions.restoreImpact")
          : t("permissions.retireImpact"),
      },
    }),
    submit: async ({ version, name, retired }) => {
      await scope.writes.updateDimension(dimension.id, {
        expectedVersion: version,
        name,
        retired,
      });
    },
  });

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

  const valuesBlocked = save.isDirty || save.conflict;
  const valuesReason = valuesBlocked
    ? t("permissions.conditionSaveFirst")
    : undefined;

  const activeValues = dimension.values.filter((value) => !value.retired);
  const retiredValues = dimension.values.filter((value) => value.retired);

  const valueRow = (value: PermissionDimensionValue) => (
    <ObjectRow
      key={value.id}
      title={value.name}
      description={statusText(t, value.retired)}
      actions={
        <>
          <ActionButton
            label={t("permissions.edit")}
            variant="ghost"
            className={styles.rowAction}
            icon={<AdminIcon name="edit" />}
            disabled={valuesBlocked}
            {...(valuesReason === undefined
              ? {}
              : { disabledReason: valuesReason })}
            onRun={() => {
              setEditingValue(value.id);
            }}
          />
          <ActionButton
            label={t(
              value.retired
                ? "permissions.restoreValue"
                : "permissions.retireValue",
            )}
            variant="ghost"
            disabled={valuesBlocked}
            {...(valuesReason === undefined
              ? {}
              : { disabledReason: valuesReason })}
            onRun={() => {
              pendingValue.current = value;
              setPendingValueStatus({
                name: value.name,
                retired: value.retired,
              });
              void statusFlow.request();
            }}
          />
        </>
      }
    />
  );

  const editedValue =
    editingValue === null
      ? null
      : (dimension.values.find((value) => value.id === editingValue) ?? null);

  return (
    <>
      <Panel
        open
        title={t("permissions.editCondition")}
        subtitle={dimension.name}
        onRequestClose={requestClose}
        footer={
          <>
            <ActionButton
              label={t(
                dimension.retired
                  ? "permissions.restoreCondition"
                  : "permissions.retireCondition",
              )}
              variant="secondary"
              disabled={save.isDirty || save.saving}
              {...(save.isDirty
                ? { disabledReason: t("permissions.conditionSaveFirst") }
                : {})}
              onRun={() => {
                void retireFlow.request();
              }}
            />
            <ActionButton
              label={t("permissions.cancel")}
              variant="secondary"
              onRun={requestClose}
            />
            <ActionButton
              label={t("permissions.save")}
              busy={save.saving}
              disabled={!save.canSave || scope.busy}
              {...(save.disabledReason === undefined
                ? {}
                : { disabledReason: save.disabledReason })}
              onRun={save.requestSave}
            />
          </>
        }
      >
        <NameField
          label={t("permissions.conditionName")}
          required
          value={save.draft.name}
          disabled={save.saving}
          onChange={(name) => {
            save.setDraft((draft) => ({ ...draft, name }));
          }}
        />
        <DraftFeedback save={save} />
        <ConditionConflict save={save} />

        <ObjectListHead
          title={t("permissions.conditionValues")}
          action={
            <ActionButton
              label={t("permissions.addValue")}
              variant="secondary"
              disabled={valuesBlocked}
              {...(valuesReason === undefined
                ? {}
                : { disabledReason: valuesReason })}
              onRun={() => {
                setEditingValue(NEW_DIMENSION);
              }}
            />
          }
        />
        <p className={styles.hint}>{t("permissions.conditionValuesHint")}</p>
        {activeValues.length === 0 ? (
          <p className={styles.emptyEditor}>{t("permissions.emptyValues")}</p>
        ) : (
          <div className={styles.stack}>{activeValues.map(valueRow)}</div>
        )}
        {retiredValues.length === 0 ? null : (
          <details className={styles.valueArchive}>
            <summary>
              {t("permissions.archivedValues")} ({retiredValues.length})
            </summary>
            <div className={styles.archiveList}>
              {retiredValues.map(valueRow)}
            </div>
          </details>
        )}
        <InlineError error={retireFlow.error} />
      </Panel>

      <ValueEditor
        key={editingValue ?? "closed"}
        open={editingValue !== null}
        dimension={dimension}
        value={editingValue === NEW_DIMENSION ? null : editedValue}
        onClose={() => {
          setEditingValue(null);
        }}
      />

      <PermissionConfirmDialog
        flow={retireFlow}
        title={t(
          dimension.retired
            ? "permissions.restoreCondition"
            : "permissions.retireCondition",
        )}
        confirmLabel={t(
          dimension.retired
            ? "permissions.restoreCondition"
            : "permissions.retireCondition",
        )}
        cancelLabel={t("permissions.cancel")}
      />
      <PermissionConfirmDialog
        flow={statusFlow}
        title={t(
          pendingValueStatus?.retired
            ? "permissions.restoreValue"
            : "permissions.retireValue",
        )}
        confirmLabel={t("permissions.confirm.action")}
        cancelLabel={t("permissions.cancel")}
      />
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

function ConditionConflict<Draft>({
  save,
}: {
  readonly save: DraftSave<Draft>;
}) {
  const { t } = useText();
  if (!save.conflict) return null;
  if (save.conflictConfirmation === null) {
    return (
      <div className={styles.actions}>
        <InlineError error={save.conflictError} />
        <ActionButton
          label={t("permissions.reload")}
          variant="secondary"
          busy={save.conflictReloading}
          onRun={save.retryConflict}
        />
      </div>
    );
  }
  return (
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
  );
}
