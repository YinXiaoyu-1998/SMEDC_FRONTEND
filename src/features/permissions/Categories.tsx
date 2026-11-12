import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import type {
  PermissionCategory,
  PermissionsCategoriesCreateResponse,
  PermissionsCategoriesUpdateResponse,
} from "@/api/permissions";
import { useText } from "@/i18n/useText";
import { AdminIcon } from "@/ui/AdminIcon";
import { ActionButton } from "@/ui/ActionButton";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { DataTable } from "@/ui/DataTable";
import { Field } from "@/ui/Field";
import { InlineError } from "@/ui/InlineError";
import { useConfirmFlow, type ConfirmFlow } from "@/ui/useConfirmFlow";

import {
  Checklist,
  DraftFeedback,
  LevelSelect,
  NameField,
  SaveButton,
  SearchInput,
  type ChecklistOption,
} from "./components";
import {
  FIXED_BUSINESS_CATEGORY_KEYS,
  INTERNAL_CATEGORY_KEY,
} from "./constants";
import { diffField, diffSetField, type Confirmation } from "./diff";
import { createId } from "./ids";
import {
  categoryLabel,
  dimensionName,
  itemLabel,
  levelLabel,
  type LabelData,
  type Translate,
} from "./labels";
import {
  DraftConflict,
  ListHeader,
  ObjectRow,
  Panel,
  PermissionConfirmDialog,
} from "./panel";
import styles from "./Permissions.module.css";
import { useRetiredDisclosure } from "./RetirableList";
import { usePermissionsScope } from "./scope";
import { useDraftSave, type DraftSave } from "./useDraftSave";
import { useRegisterDraft } from "./useRegisterDraft";

type Segment = "document" | "fixed";
type Ownership = "group" | "store";
type CategorySaveResult =
  PermissionsCategoriesCreateResponse | PermissionsCategoriesUpdateResponse;

interface EvidenceDraft {
  readonly name: string;
  readonly ownerships: readonly Ownership[];
  readonly requiredDimensionIds: readonly string[];
  readonly retired: boolean;
}

interface CategoryLike {
  readonly name: string;
  readonly allowStore: boolean;
  readonly allowGroup: boolean;
  readonly retired: boolean;
  readonly dimensions: readonly { readonly dimensionId: string }[];
}

const EMPTY_EVIDENCE: EvidenceDraft = {
  name: "",
  ownerships: [],
  requiredDimensionIds: [],
  retired: false,
};

type Editor =
  | { readonly kind: "fixed"; readonly category: PermissionCategory }
  | { readonly kind: "evidence"; readonly category: PermissionCategory | null };

function evidenceFrom(category: CategoryLike): EvidenceDraft {
  return {
    name: category.name,
    ownerships: ownershipsFrom(category),
    requiredDimensionIds: category.dimensions.map((item) => item.dimensionId),
    retired: category.retired,
  };
}

function ownershipsFrom(category: CategoryLike): Ownership[] {
  return [
    ...(category.allowStore ? (["store"] as const) : []),
    ...(category.allowGroup ? (["group"] as const) : []),
  ];
}

function isOwnership(value: string): value is Ownership {
  return value === "store" || value === "group";
}

function ownershipsText(t: Translate, values: readonly Ownership[]): string {
  const labels: string[] = [];
  if (values.includes("store")) labels.push(t("permissions.store"));
  if (values.includes("group")) labels.push(t("permissions.group"));
  return labels.length === 0 ? t("permissions.none") : labels.join("、");
}

function ownershipFlagsText(
  t: Translate,
  allowStore: boolean,
  allowGroup: boolean,
): string {
  const labels: string[] = [];
  if (allowStore) labels.push(t("permissions.store"));
  if (allowGroup) labels.push(t("permissions.group"));
  return labels.length === 0 ? t("permissions.none") : labels.join("、");
}

function conditionsText(
  t: Translate,
  data: LabelData,
  ids: readonly string[],
): string {
  if (ids.length === 0) return t("permissions.none");
  return ids
    .map((id) => dimensionName(t, data, id))
    .sort((left, right) => left.localeCompare(right, "zh"))
    .join("、");
}

function statusText(t: Translate, retired: boolean): string {
  return t(retired ? "permissions.status.off" : "permissions.status.active");
}

function fixedConfirmation(
  t: Translate,
  category: PermissionCategory,
  draft: number | null,
  baseline: number | null,
): Confirmation {
  return {
    subject: categoryLabel(t, category),
    diff: diffField(
      t("permissions.level"),
      levelLabel(t, baseline),
      levelLabel(t, draft),
    ),
  };
}

function evidenceConfirmation(
  t: Translate,
  data: LabelData,
  isNew: boolean,
  category: PermissionCategory | null,
  draft: EvidenceDraft,
  baseline: EvidenceDraft,
): Confirmation {
  const name = draft.name.trim();
  const subject = isNew
    ? name === ""
      ? t("permissions.addDocumentCategory")
      : name
    : (category?.name ?? baseline.name);
  return {
    subject,
    diff: [
      ...diffField(t("permissions.categoryFields"), baseline.name, name),
      ...diffSetField(
        t("permissions.ownership"),
        baseline.ownerships,
        draft.ownerships,
        (values) => ownershipsText(t, values.filter(isOwnership)),
      ),
      ...diffSetField(
        t("permissions.requiredConditions"),
        baseline.requiredDimensionIds,
        draft.requiredDimensionIds,
        (ids) => conditionsText(t, data, ids),
      ),
      ...diffField(
        t("permissions.statusLabel"),
        statusText(t, baseline.retired),
        statusText(t, draft.retired),
      ),
    ],
  };
}

export function CategoriesSection({ active }: { readonly active: boolean }) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const [segment, setSegment] = useState<Segment>("document");
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const documentSegment = useRef<HTMLButtonElement | null>(null);
  const archiveDisclosure = useRef<HTMLButtonElement | null>(null);
  const lastCreateSignal = useRef(scope.createSignal);

  const fixed = scope.bundle.categories.filter(
    (category) =>
      category.kind === "fixed" && category.key !== INTERNAL_CATEGORY_KEY,
  );
  const evidence = scope.bundle.categories.filter(
    (category) => category.kind === "evidence",
  );
  const retired = evidence.filter((category) => category.retired);
  const archive = useRetiredDisclosure(retired.length, archiveDisclosure);
  const missingFixed = FIXED_BUSINESS_CATEGORY_KEYS.filter(
    (key) => !scope.bundle.categories.some((category) => category.key === key),
  );

  const openEditor = useCallback((next: Editor) => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) opener.current = activeElement;
    setEditor(next);
  }, []);

  useEffect(() => {
    if (!active || editor !== null) {
      lastCreateSignal.current = scope.createSignal;
      return;
    }
    if (scope.createSignal === lastCreateSignal.current) return;
    lastCreateSignal.current = scope.createSignal;
    setSegment("document");
    setSearch("");
    openEditor({ kind: "evidence", category: null });
  }, [active, editor, openEditor, scope.createSignal]);

  const chooseSegment = (next: Segment) => {
    if (next === segment) return;
    setSegment(next);
    setSearch("");
  };

  const handleEditorSaved = (change: {
    readonly created: boolean;
    readonly statusChange: "retired" | "restored" | null;
  }) => {
    setEditor(null);
    if (change.created) setSearch("");
    if (change.statusChange === "retired") {
      archive.onRetired();
      return;
    }
    if (change.statusChange === "restored") {
      archive.onRestored();
      requestAnimationFrame(() => {
        documentSegment.current?.focus();
      });
    }
  };

  const needle = search.trim().toLowerCase();
  const fixedRows = fixed.filter((category) =>
    categoryLabel(t, category).toLowerCase().includes(needle),
  );
  const documentRows = evidence.filter(
    (category) =>
      !category.retired && category.name.toLowerCase().includes(needle),
  );

  return (
    <>
      <section className={styles.catalogCard}>
        <ListHeader
          title={t(
            segment === "fixed"
              ? "permissions.segmented.fixed"
              : "permissions.segmented.document",
          )}
          description={t(
            segment === "fixed"
              ? "permissions.fixedListHint"
              : "permissions.docCategoryHint",
          )}
          action={
            <div
              className={styles.segmented}
              role="group"
              aria-label={t("permissions.tabs.categories")}
            >
              <button
                ref={documentSegment}
                type="button"
                className={
                  segment === "document"
                    ? `${styles.segmentedOption} ${styles.segmentedOptionActive}`
                    : styles.segmentedOption
                }
                aria-pressed={segment === "document"}
                onClick={() => {
                  chooseSegment("document");
                }}
              >
                {t("permissions.segmented.document")}
              </button>
              <button
                type="button"
                className={
                  segment === "fixed"
                    ? `${styles.segmentedOption} ${styles.segmentedOptionActive}`
                    : styles.segmentedOption
                }
                aria-pressed={segment === "fixed"}
                onClick={() => {
                  chooseSegment("fixed");
                }}
              >
                {t("permissions.segmented.fixed")}
              </button>
            </div>
          }
        />

        <div className={styles.toolbar}>
          <SearchInput
            label={t("permissions.searchCategory")}
            value={search}
            onChange={setSearch}
          />
          {segment === "fixed" && missingFixed.length > 0 ? (
            <InitializeCategories missingKeys={missingFixed} />
          ) : null}
        </div>

        {segment === "fixed" ? (
          <>
            <DataTable<PermissionCategory>
              className={styles.catalogTable}
              columns={[
                {
                  id: "name",
                  header: t("permissions.categoryFields"),
                  cell: (category) => (
                    <div className={styles.rowName}>
                      <span className={styles.rowIcon}>
                        <AdminIcon name="document" />
                      </span>
                      <strong>{categoryLabel(t, category)}</strong>
                    </div>
                  ),
                },
                {
                  id: "level",
                  header: t("permissions.level"),
                  cell: (category) => (
                    <span className={styles.levelBadge}>
                      {levelLabel(t, category.confidentialityLevel)}
                    </span>
                  ),
                },
                {
                  id: "ownership",
                  header: t("permissions.ownership"),
                  cell: (category) =>
                    ownershipFlagsText(
                      t,
                      category.allowStore,
                      category.allowGroup,
                    ),
                },
                {
                  id: "status",
                  header: t("permissions.statusLabel"),
                  cell: (category) => (
                    <span
                      className={
                        category.retired ? styles.chip : styles.activeStatus
                      }
                    >
                      {statusText(t, category.retired)}
                    </span>
                  ),
                },
                {
                  id: "actions",
                  header: t("permissions.actions"),
                  align: "end",
                  cell: (category) => (
                    <ActionButton
                      label={t("permissions.edit")}
                      variant="ghost"
                      className={styles.rowAction}
                      icon={<AdminIcon name="edit" />}
                      onRun={() => {
                        openEditor({ kind: "fixed", category });
                      }}
                    />
                  ),
                },
              ]}
              rows={fixedRows}
              getRowId={(category) => category.id}
              label={t("permissions.segmented.fixed")}
              emptyLabel={t("permissions.empty")}
            />
            <div className={styles.tableFoot}>
              <span className={styles.countText}>
                {`${t("permissions.rowCount")} ${fixedRows.length} ${t("permissions.count")}`}
              </span>
            </div>
          </>
        ) : (
          <>
            <DataTable<PermissionCategory>
              className={styles.catalogTable}
              columns={[
                {
                  id: "name",
                  header: t("permissions.categoryFields"),
                  cell: (category) => (
                    <div className={styles.rowName}>
                      <span className={styles.rowIcon}>
                        <AdminIcon name="document" />
                      </span>
                      <strong>{category.name}</strong>
                    </div>
                  ),
                },
                {
                  id: "ownership",
                  header: t("permissions.ownership"),
                  cell: (category) =>
                    ownershipFlagsText(
                      t,
                      category.allowStore,
                      category.allowGroup,
                    ),
                },
                {
                  id: "conditions",
                  header: t("permissions.requiredConditions"),
                  cell: (category) =>
                    category.dimensions.length === 0 ? (
                      <span className={styles.muted}>
                        {t("permissions.none")}
                      </span>
                    ) : (
                      category.dimensions
                        .map((item) => ({
                          id: item.dimensionId,
                          name: dimensionName(
                            t,
                            scope.bundle,
                            item.dimensionId,
                          ),
                        }))
                        .sort((left, right) =>
                          left.name.localeCompare(right.name, "zh"),
                        )
                        .map((item) => (
                          <span className={styles.chip} key={item.id}>
                            {item.name}
                          </span>
                        ))
                    ),
                },
                {
                  id: "status",
                  header: t("permissions.statusLabel"),
                  cell: () => (
                    <span className={styles.activeStatus}>
                      {t("permissions.status.active")}
                    </span>
                  ),
                },
                {
                  id: "actions",
                  header: t("permissions.actions"),
                  align: "end",
                  cell: (category) => (
                    <ActionButton
                      label={t("permissions.edit")}
                      variant="ghost"
                      className={styles.rowAction}
                      icon={<AdminIcon name="edit" />}
                      onRun={() => {
                        openEditor({ kind: "evidence", category });
                      }}
                    />
                  ),
                },
              ]}
              rows={documentRows}
              getRowId={(category) => category.id}
              label={t("permissions.segmented.document")}
              emptyLabel={
                needle === ""
                  ? retired.length > 0
                    ? t("permissions.noActiveItems")
                    : t("permissions.noCategories")
                  : t("permissions.empty")
              }
            />
            <div className={styles.tableFoot}>
              <span className={styles.countText}>
                {`${t("permissions.rowCount")} ${documentRows.length} ${t("permissions.count")}`}
              </span>
            </div>
          </>
        )}
      </section>
      {segment !== "document" || retired.length === 0 ? null : (
        <div className={styles.archiveCard}>
          <button
            ref={archiveDisclosure}
            type="button"
            className={styles.retiredDisclosure}
            aria-expanded={archive.expanded}
            onClick={archive.toggle}
          >
            <span className={styles.archiveIcon}>
              <AdminIcon name="archive" />
            </span>
            {t("permissions.archivedCategories")} ({retired.length})
            <span className={styles.archiveChevron}>
              <AdminIcon name="chevron" />
            </span>
          </button>
          {archive.expanded ? (
            <div className={styles.archiveList}>
              {retired.map((category) => (
                <ObjectRow
                  key={category.id}
                  title={category.name}
                  description={`${ownershipFlagsText(
                    t,
                    category.allowStore,
                    category.allowGroup,
                  )} · ${conditionsText(
                    t,
                    scope.bundle,
                    category.dimensions.map((item) => item.dimensionId),
                  )}`}
                  actions={
                    <>
                      <span className={styles.chip}>
                        {t("permissions.retired")}
                      </span>
                      <ActionButton
                        label={t("permissions.edit")}
                        variant="ghost"
                        className={styles.rowAction}
                        icon={<AdminIcon name="edit" />}
                        onRun={() => {
                          openEditor({ kind: "evidence", category });
                        }}
                      />
                    </>
                  }
                />
              ))}
            </div>
          ) : null}
        </div>
      )}

      {editor === null ? null : editor.kind === "fixed" ? (
        <FixedCategoryPanel
          key={`fixed:${editor.category.id}`}
          category={editor.category}
          onRequestClose={() => {
            setEditor(null);
          }}
          returnFocusRef={opener}
        />
      ) : (
        <EvidenceCategoryPanel
          key={`evidence:${editor.category?.id ?? "new"}`}
          category={editor.category}
          onRequestClose={() => {
            setEditor(null);
          }}
          onReveal={archive.reveal}
          onSaved={handleEditorSaved}
          returnFocusRef={opener}
        />
      )}
    </>
  );
}

function InitializeCategories({
  missingKeys,
}: {
  readonly missingKeys: readonly string[];
}) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const [running, setRunning] = useState(false);
  const [needsRead, setNeedsRead] = useState(false);
  const [readError, setReadError] = useState<unknown>(null);
  const reload = async () => {
    setRunning(true);
    setReadError(null);
    try {
      await scope.reload();
      setNeedsRead(false);
    } catch (caught) {
      setReadError(caught);
    } finally {
      setRunning(false);
    }
  };
  const flow = useConfirmFlow<
    { confirmation: Confirmation; version: string },
    void
  >({
    prepare: () => ({
      version: scope.bundle.version,
      confirmation: {
        subject: t("permissions.initializeCategories"),
        diff: missingKeys.map((key) => ({
          kind: "added",
          label: t("permissions.panel.fixedCategories"),
          after: t("permissions.category." + key),
        })),
        impact: t("permissions.initializeCategoriesHelp"),
      },
    }),
    submit: async ({ version }) => {
      await scope.writes.initializeCategories(version);
      setNeedsRead(true);
      await reload();
    },
  });

  return (
    <>
      {needsRead ? (
        <ActionButton
          label={t("permissions.reload")}
          variant="secondary"
          busy={running}
          onRun={() => void reload()}
        />
      ) : (
        <ActionButton
          label={t("permissions.addFixedMissing")}
          variant="secondary"
          disabled={scope.busy || scope.hasDrafts}
          {...(scope.hasDrafts
            ? { disabledReason: t("permissions.initializeDrafts") }
            : {})}
          onRun={() => void flow.request()}
        />
      )}
      <InlineError error={readError} />
      <PermissionConfirmDialog
        flow={flow}
        title={t("permissions.initializeCategories")}
        confirmLabel={t("permissions.confirm.action")}
        cancelLabel={t("permissions.cancel")}
      />
    </>
  );
}

function usePanelClose<Draft>(
  save: DraftSave<Draft>,
  onRequestClose: () => void,
) {
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
  return { discardFlow, requestClose };
}

function PanelDialogs<Draft>({
  save,
  discardFlow,
}: {
  readonly save: DraftSave<Draft>;
  readonly discardFlow: ConfirmFlow<void>;
}) {
  const { t } = useText();
  return (
    <>
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

function ConflictNotice<Draft>({ save }: { readonly save: DraftSave<Draft> }) {
  const { t } = useText();
  if (save.conflict && save.conflictConfirmation !== null) {
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
  if (!save.conflict) return null;
  return (
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
  );
}

function FixedCategoryPanel({
  category,
  onRequestClose,
  returnFocusRef,
}: {
  readonly category: PermissionCategory;
  readonly onRequestClose: () => void;
  readonly returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const save = useDraftSave<number | null, PermissionsCategoriesUpdateResponse>(
    {
      baseline: {
        snapshot: category.confidentialityLevel,
        version: scope.bundle.version,
      },
      validate: (draft) => (draft === null ? "permissions.required" : null),
      confirmation: (draft, baseline) =>
        fixedConfirmation(t, category, draft, baseline),
      submit: (draft, expectedVersion) => {
        if (draft === null) {
          throw new Error("category confidentiality level is required");
        }
        const latest = scope.bundle.categories.find(
          (item) => item.id === category.id,
        );
        return scope.writes.updateCategory(category.id, {
          expectedVersion,
          name: latest?.name ?? category.name,
          confidentialityLevel: draft,
        });
      },
      nextBaseline: (result) => result.value.confidentialityLevel,
      reload: async () => {
        const next = await scope.reload();
        const latest = next.categories.find((item) => item.id === category.id);
        return {
          snapshot:
            latest === undefined
              ? category.confidentialityLevel
              : latest.confidentialityLevel,
          version: next.version,
        };
      },
      onSaved: () => {
        scope.setNotice("permissions.saved");
        onRequestClose();
      },
    },
  );
  useRegisterDraft(save.isDirty || save.conflict);
  const { discardFlow, requestClose } = usePanelClose(save, onRequestClose);

  return (
    <>
      <Panel
        open
        title={t("permissions.panel.fixedCategories")}
        subtitle={categoryLabel(t, category)}
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
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save.requestSave();
          }}
        >
          <Field
            label={t("permissions.level")}
            hint={t("permissions.levelHelp")}
          >
            <LevelSelect
              value={save.draft}
              onChange={save.setDraft}
              disabled={save.saving}
            />
          </Field>
        </form>
        <ConflictNotice save={save} />
        <DraftFeedback save={save} />
      </Panel>
      <PanelDialogs save={save} discardFlow={discardFlow} />
    </>
  );
}

function EvidenceCategoryPanel({
  category,
  onRequestClose,
  onReveal,
  onSaved,
  returnFocusRef,
}: {
  readonly category: PermissionCategory | null;
  readonly onRequestClose: () => void;
  readonly onReveal: () => void;
  readonly onSaved: (change: {
    readonly created: boolean;
    readonly statusChange: "retired" | "restored" | null;
  }) => void;
  readonly returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const isNew = category === null;
  const [newId] = useState(() => createId());
  const saved = isNew ? EMPTY_EVIDENCE : evidenceFrom(category);
  const save = useDraftSave<EvidenceDraft, CategorySaveResult>({
    baseline: { snapshot: saved, version: scope.bundle.version },
    validate: (draft, baseline) => {
      if (draft.name.trim() === "") return "permissions.required";
      if (draft.ownerships.length === 0) return "permissions.required";
      const unavailable = draft.requiredDimensionIds.some((id) => {
        const dimension = scope.bundle.dimensions.find(
          (item) => item.id === id,
        );
        if (dimension === undefined) return true;
        return dimension.retired && !baseline.requiredDimensionIds.includes(id);
      });
      return unavailable ? "permissions.dimensionUnavailable" : null;
    },
    confirmation: (draft, baseline) =>
      evidenceConfirmation(t, scope.bundle, isNew, category, draft, baseline),
    submit: (draft, expectedVersion) => {
      const name = draft.name.trim();
      if (category === null) {
        return scope.writes.createCategory({
          expectedVersion,
          id: newId,
          name,
          kind: "evidence",
          ownerships: [...draft.ownerships],
          requiredDimensionIds: [...draft.requiredDimensionIds],
          retired: draft.retired,
        });
      }
      return scope.writes.updateCategory(category.id, {
        expectedVersion,
        name,
        ownerships: [...draft.ownerships],
        requiredDimensionIds: [...draft.requiredDimensionIds],
        retired: draft.retired,
      });
    },
    nextBaseline: (result) =>
      isNew ? EMPTY_EVIDENCE : evidenceFrom(result.value),
    reload: async () => {
      const next = await scope.reload();
      const id = category === null ? newId : category.id;
      const latest = next.categories.find((item) => item.id === id);
      if (latest?.retired) onReveal();
      return {
        snapshot: latest === undefined ? saved : evidenceFrom(latest),
        version: next.version,
      };
    },
    onSaved: (result) => {
      scope.setNotice("permissions.saved");
      onSaved({
        created: isNew,
        statusChange:
          result.value.retired === saved.retired
            ? null
            : result.value.retired
              ? "retired"
              : "restored",
      });
    },
  });
  useRegisterDraft(save.isDirty || save.conflict);
  const { discardFlow, requestClose } = usePanelClose(save, onRequestClose);

  const dimensionOptions: ChecklistOption[] = scope.bundle.dimensions
    .filter(
      (dimension) =>
        !dimension.retired ||
        saved.requiredDimensionIds.includes(dimension.id) ||
        save.draft.requiredDimensionIds.includes(dimension.id),
    )
    .map((dimension) => ({
      value: dimension.id,
      label: itemLabel(t, dimension.name, dimension.retired),
      disabled:
        dimension.retired &&
        !save.draft.requiredDimensionIds.includes(dimension.id),
    }));
  for (const id of save.draft.requiredDimensionIds) {
    if (!dimensionOptions.some((option) => option.value === id)) {
      dimensionOptions.push({
        value: id,
        label: t("permissions.preserved"),
      });
    }
  }

  const requestStatusChange = () => {
    save.setDraft({ ...save.draft, retired: !save.draft.retired });
    if (
      save.validationError !== null ||
      save.conflict ||
      save.flow.status !== "idle" ||
      scope.busy
    ) {
      return;
    }
    void save.flow.request();
  };

  return (
    <>
      <Panel
        open
        title={t(
          isNew
            ? "permissions.addDocumentCategory"
            : "permissions.editCategory",
        )}
        subtitle={isNew ? t("permissions.docCategoryHint") : category.name}
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
        <form
          className={styles.stack}
          onSubmit={(event) => {
            event.preventDefault();
            save.requestSave();
          }}
        >
          <NameField
            label={t("permissions.categoryName")}
            hint={t("permissions.categoryNameHelp")}
            required
            maxLength={255}
            value={save.draft.name}
            disabled={save.saving}
            onChange={(name) => {
              save.setDraft({ ...save.draft, name });
            }}
          />
          <Checklist
            legend={t("permissions.ownership")}
            options={[
              { value: "store", label: t("permissions.store") },
              { value: "group", label: t("permissions.group") },
            ]}
            selected={save.draft.ownerships}
            disabled={save.saving}
            onChange={(values) => {
              save.setDraft({
                ...save.draft,
                ownerships: values.filter(isOwnership),
              });
            }}
          />
          <Checklist
            legend={t("permissions.requiredConditions")}
            options={dimensionOptions}
            selected={save.draft.requiredDimensionIds}
            disabled={save.saving}
            onChange={(requiredDimensionIds) => {
              save.setDraft({ ...save.draft, requiredDimensionIds });
            }}
          />
        </form>
        <div className={styles.subcard}>
          <p className={styles.inlineNote}>
            {t("permissions.statusLabel")}: {statusText(t, save.draft.retired)}
          </p>
          <div className={styles.actions}>
            <ActionButton
              label={t(
                save.draft.retired
                  ? "permissions.restoreCategory"
                  : "permissions.retireCategory",
              )}
              variant="secondary"
              disabled={save.saving || save.conflict}
              onRun={requestStatusChange}
            />
          </div>
        </div>
        <ConflictNotice save={save} />
        <DraftFeedback save={save} />
      </Panel>
      <PanelDialogs save={save} discardFlow={discardFlow} />
    </>
  );
}
