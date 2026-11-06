import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import { WebApiError } from "@/api/client";
import {
  VERSION_CONFLICT_CODE,
  listDocuments,
  type PermissionCategory,
  type PermissionDocument,
  type PermissionsDocumentsListResponse,
} from "@/api/permissions";
import { useText } from "@/i18n/useText";
import { ActionButton } from "@/ui/ActionButton";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { DataTable } from "@/ui/DataTable";
import { Field } from "@/ui/Field";
import { PageSection } from "@/ui/PageSection";
import { useConfirmFlow } from "@/ui/useConfirmFlow";

import {
  ConfirmAction,
  DraftDialogs,
  DraftFeedback,
  LevelSelect,
  SaveButton,
  SectionNote,
} from "./components";
import { useRegisterDraft } from "./useRegisterDraft";
import {
  documentToDraft,
  documentUpdateBody,
  emptyDocumentScope,
  validateDocumentDraft,
  type DocumentDraft,
  type DocumentScopeDraft,
} from "./document-draft";
import { permissionsErrorKey } from "./errorKeys";
import {
  categoryName,
  changeSummary,
  dimensionName,
  dimensionValueName,
  documentStatusLabel,
  enterpriseName,
  itemLabel,
  type LabelData,
  type Translate,
} from "./labels";
import styles from "./Permissions.module.css";
import { usePermissionsScope } from "./scope";
import { useDraftSave } from "./useDraftSave";

/** DataTable 用 null 表示禁用；返回上一页需要一个非空占位值。 */
const PREVIOUS_PAGE = "previous-page";

export function DocumentsSection({ active }: { readonly active: boolean }) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [stack, setStack] = useState<readonly (string | null)[]>([]);
  const [selected, setSelected] = useState<PermissionDocument | null>(null);
  const [editorDirty, setEditorDirty] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);
  const documentsKey = useMemo(
    () =>
      [
        "web-api",
        "permissions",
        scope.orgId,
        "documents",
        appliedSearch,
        cursor,
      ] as const,
    [appliedSearch, cursor, scope.orgId],
  );

  const discardFlow = useConfirmFlow<void, void>({
    prepare: () => undefined,
    submit: () => {
      const action = pendingAction.current;
      pendingAction.current = null;
      if (action !== null) action();
    },
  });

  const guard = (action: () => void) => {
    if (editorDirty) {
      pendingAction.current = action;
      void discardFlow.request();
      return;
    }
    action();
  };

  const documentsQuery = useQuery({
    queryKey: documentsKey,
    queryFn: async (): Promise<PermissionsDocumentsListResponse> => {
      const result = await listDocuments(scope.orgId, appliedSearch, cursor);
      if (result.authorizationVersion !== scope.bundle.version) {
        throw new WebApiError({
          status: 409,
          code: VERSION_CONFLICT_CODE,
          message: "配置版本不一致",
        });
      }
      return result;
    },
    enabled: active,
    retry: false,
  });

  const selectDocument = (document: PermissionDocument) => {
    guard(() => {
      setSelected(document);
    });
  };

  const applySearch = () => {
    setAppliedSearch(searchText);
    setCursor(null);
    setStack([]);
    setSelected(null);
    setEditorDirty(false);
  };

  const goNext = () => {
    if (nextCursor === null) return;
    setStack((previous) => [...previous, cursor]);
    setCursor(nextCursor);
    setSelected(null);
    setEditorDirty(false);
  };

  const goPrevious = () => {
    if (stack.length === 0) return;
    const target = stack[stack.length - 1] ?? null;
    setStack(stack.slice(0, -1));
    setCursor(target);
    setSelected(null);
    setEditorDirty(false);
  };

  const reloadDocument = async (
    id: string,
  ): Promise<PermissionDocument | undefined> => {
    const result = await listDocuments(scope.orgId, appliedSearch, cursor);
    if (result.authorizationVersion !== scope.bundle.version) {
      throw new WebApiError({
        status: 409,
        code: VERSION_CONFLICT_CODE,
        message: "配置版本不一致",
      });
    }
    return result.documents.find((item) => item.id === id);
  };

  const documents = documentsQuery.data?.documents ?? [];
  const nextCursor = documentsQuery.data?.nextCursor ?? null;
  const loading = documentsQuery.isFetching;
  const error: unknown = documentsQuery.error;
  const rows = documents;
  const page = stack.length + 1;

  return (
    <PageSection title={t("permissions.tabs.documents")}>
      <SectionNote>{t("permissions.documentHelp")}</SectionNote>
      <SectionNote>{t("permissions.supplementHelp")}</SectionNote>
      <form
        className={styles.toolbar}
        onSubmit={(event) => {
          event.preventDefault();
          guard(applySearch);
        }}
      >
        <NameInput
          label={t("permissions.searchDocument")}
          value={searchText}
          onChange={setSearchText}
        />
        <ActionButton
          label={t("permissions.search")}
          variant="secondary"
          onRun={() => {
            guard(applySearch);
          }}
        />
      </form>

      <DataTable<PermissionDocument>
        columns={[
          {
            id: "document",
            header: t("permissions.document"),
            cell: (document) => (
              <ActionButton
                label={document.title}
                variant="ghost"
                onRun={() => {
                  selectDocument(document);
                }}
              />
            ),
          },
          {
            id: "status",
            header: t("permissions.documentStatus"),
            cell: (document) => documentStatusLabel(t, document.status),
          },
          {
            id: "category",
            header: t("permissions.documentCategory"),
            cell: (document) =>
              document.categoryId === null
                ? t("permissions.unset")
                : categoryName(t, scope.bundle, document.categoryId),
          },
          {
            id: "level",
            header: t("permissions.level"),
            cell: (document) =>
              document.fileConfidentialityLevel === null
                ? t("permissions.unset")
                : String(document.fileConfidentialityLevel),
          },
        ]}
        rows={rows}
        getRowId={(document) => document.id}
        label={t("permissions.tabs.documents")}
        loading={loading}
        emptyLabel={t("permissions.empty")}
        pagination={{
          previousCursor: stack.length === 0 ? null : PREVIOUS_PAGE,
          nextCursor,
          onPrevious: () => {
            goPrevious();
          },
          onNext: () => {
            goNext();
          },
          summary: `${t("permissions.page")}: ${page}`,
        }}
      />
      {error === null ? null : (
        <div className={styles.actions}>
          <p className={styles.error} role="alert">
            {t(permissionsErrorKey(error))}
          </p>
          <ActionButton
            label={t("permissions.reload")}
            variant="secondary"
            onRun={() => {
              void documentsQuery.refetch();
            }}
          />
        </div>
      )}

      {selected === null ? null : (
        <DocumentEditor
          key={selected.id}
          document={selected}
          onSaved={(updated) => {
            setSelected(updated);
            queryClient.setQueryData<PermissionsDocumentsListResponse>(
              documentsKey,
              (previous) =>
                previous === undefined
                  ? previous
                  : {
                      ...previous,
                      documents: previous.documents.map((item) =>
                        item.id === updated.id ? updated : item,
                      ),
                    },
            );
          }}
          onDirtyChange={setEditorDirty}
          reload={reloadDocument}
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

function NameInput({
  label,
  value,
  onChange,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (next: string) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="text"
        maxLength={256}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    </Field>
  );
}

function describeScope(
  t: Translate,
  data: LabelData,
  scope: DocumentScopeDraft,
): string {
  const business = enterpriseName(t, data, scope.enterpriseKey);
  const ownership =
    scope.ownership === "store"
      ? scope.storeName === undefined || scope.storeName === ""
        ? t("permissions.choose")
        : scope.storeName
      : scope.ownership === "group"
        ? t("permissions.group")
        : t("permissions.choose");
  const conditions = Object.entries(scope.dimensions)
    .map(
      ([dimensionId, valueId]) =>
        `${dimensionName(t, data, dimensionId)}: ${dimensionValueName(t, data, dimensionId, valueId)}`,
    )
    .join("; ");
  return `${business} · ${ownership}${conditions === "" ? "" : ` · ${conditions}`}`;
}

function DocumentEditor({
  document: record,
  onSaved,
  onDirtyChange,
  reload,
}: {
  readonly document: PermissionDocument;
  readonly onSaved: (next: PermissionDocument) => void;
  readonly onDirtyChange: (dirty: boolean) => void;
  readonly reload: (id: string) => Promise<PermissionDocument | undefined>;
}) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const saved = useMemo(() => documentToDraft(record), [record]);
  const data = scope.bundle;

  const save = useDraftSave<
    DocumentDraft,
    {
      readonly document: PermissionDocument;
      readonly authorizationVersion: string;
    }
  >({
    saved,
    expectedVersion: scope.bundle.version,
    normalize: (draft) => ({
      ...draft,
      historicalSupplementReason: draft.historicalSupplementReason.trim(),
    }),
    validate: (draft) =>
      validateDocumentDraft(
        draft,
        data.categories.find((item) => item.id === draft.categoryId),
        data,
      ),
    describe: (draft) => {
      const rule = data.categories.find((item) => item.id === draft.categoryId);
      const title = `${record.title} · ${documentStatusLabel(t, record.status)}`;
      return changeSummary(
        t,
        title,
        describeDocument(t, data, saved),
        describeDocument(t, data, draft, rule),
      );
    },
    submit: (draft, expectedVersion) =>
      scope.writes.saveDocument(
        record,
        documentUpdateBody(draft, expectedVersion),
      ),
    draftFromResult: (result) => documentToDraft(result.document),
    reload: async () => {
      const latest = await reload(record.id);
      return latest === undefined ? saved : documentToDraft(latest);
    },
    conflictFields: (draft, current) => [
      {
        key: "category",
        label: t("permissions.documentCategory"),
        serverValue:
          current.categoryId === ""
            ? t("permissions.unset")
            : categoryName(t, data, current.categoryId),
        draftValue:
          draft.categoryId === ""
            ? t("permissions.unset")
            : categoryName(t, data, draft.categoryId),
      },
      {
        key: "level",
        label: t("permissions.level"),
        serverValue:
          current.fileConfidentialityLevel === null
            ? t("permissions.unset")
            : String(current.fileConfidentialityLevel),
        draftValue:
          draft.fileConfidentialityLevel === null
            ? t("permissions.unset")
            : String(draft.fileConfidentialityLevel),
      },
      {
        key: "scopes",
        label: t("permissions.scopes"),
        serverValue: describeDocument(t, data, current),
        draftValue: describeDocument(t, data, draft),
      },
    ],
    onSaved: (result) => {
      onSaved(result.document);
    },
  });
  useRegisterDraft(save.isDirty || save.conflict);

  useEffect(() => {
    onDirtyChange(save.isDirty || save.conflict);
  }, [onDirtyChange, save.conflict, save.isDirty]);

  const category: PermissionCategory | undefined = data.categories.find(
    (item) => item.id === save.draft.categoryId,
  );
  const evidenceCategories = data.categories.filter(
    (item) => item.kind === "evidence",
  );

  return (
    <form
      className={styles.card}
      onSubmit={(event) => {
        event.preventDefault();
        save.requestSave();
      }}
    >
      <h3 className={styles.cardTitle}>{record.title}</h3>
      <p className={styles.hint}>
        {t("permissions.documentStatus")}:{" "}
        {documentStatusLabel(t, record.status)}
      </p>
      {record.valid ? null : (
        <p className={styles.error}>{t("permissions.attributesNotReady")}</p>
      )}

      <Field label={t("permissions.documentCategory")}>
        <select
          value={save.draft.categoryId}
          disabled={save.saving}
          onChange={(event) => {
            save.setDraft({
              ...save.draft,
              categoryId: event.target.value,
            });
          }}
        >
          <option value="">{t("permissions.choose")}</option>
          {evidenceCategories.map((item) => (
            <option
              key={item.id}
              value={item.id}
              disabled={item.retired && item.id !== save.draft.categoryId}
            >
              {itemLabel(t, item.name, item.retired)}
            </option>
          ))}
          {save.draft.categoryId !== "" &&
          !evidenceCategories.some(
            (item) => item.id === save.draft.categoryId,
          ) ? (
            <option value={save.draft.categoryId}>
              {t("permissions.preserved")}
            </option>
          ) : null}
        </select>
      </Field>

      <Field label={t("permissions.level")}>
        <LevelSelect
          value={save.draft.fileConfidentialityLevel}
          disabled={save.saving}
          onChange={(level) => {
            save.setDraft({ ...save.draft, fileConfidentialityLevel: level });
          }}
        />
      </Field>

      <h4 className={styles.subheading}>{t("permissions.scopes")}</h4>
      {save.draft.scopes.map((scopeDraft, index) => (
        <DocumentScopeCard
          key={index}
          scope={scopeDraft}
          category={category}
          data={data}
          disabled={save.saving}
          onChange={(next) => {
            save.setDraft({
              ...save.draft,
              scopes: save.draft.scopes.map((item, position) =>
                position === index ? next : item,
              ),
            });
          }}
          onRemove={() => {
            save.setDraft({
              ...save.draft,
              scopes: save.draft.scopes.filter(
                (_item, position) => position !== index,
              ),
            });
          }}
        />
      ))}
      <div className={styles.actions}>
        <ActionButton
          label={t("permissions.addScope")}
          variant="secondary"
          disabled={scope.busy || save.conflict}
          onRun={() => {
            save.setDraft({
              ...save.draft,
              scopes: [...save.draft.scopes, emptyDocumentScope()],
            });
          }}
        />
      </div>

      <Field
        label={t("permissions.supplementReason")}
        hint={t("permissions.supplementHelp")}
      >
        <textarea
          rows={3}
          maxLength={2048}
          value={save.draft.historicalSupplementReason}
          disabled={save.saving}
          onChange={(event) => {
            save.setDraft({
              ...save.draft,
              historicalSupplementReason: event.target.value,
            });
          }}
        />
      </Field>

      <div className={styles.actions}>
        <SaveButton save={save} />
      </div>
      <DraftFeedback save={save} />
      <DraftDialogs save={save} />
    </form>
  );
}

function describeDocument(
  t: Translate,
  data: LabelData,
  draft: DocumentDraft,
  category?: PermissionCategory | undefined,
): string {
  const heading = category === undefined ? draft.categoryId : category.name;
  const level =
    draft.fileConfidentialityLevel === null
      ? t("permissions.unset")
      : String(draft.fileConfidentialityLevel);
  const scopes =
    draft.scopes.length === 0
      ? t("permissions.empty")
      : draft.scopes.map((item) => describeScope(t, data, item)).join("\n");
  const reason = draft.historicalSupplementReason.trim();
  return `${heading} · ${t("permissions.level")}: ${level}\n${scopes}${reason === "" ? "" : `\n${t("permissions.supplementReason")}: ${reason}`}`;
}

function DocumentScopeCard({
  scope,
  category,
  data,
  disabled,
  onChange,
  onRemove,
}: {
  readonly scope: DocumentScopeDraft;
  readonly category: PermissionCategory | undefined;
  readonly data: LabelData;
  readonly disabled: boolean;
  readonly onChange: (next: DocumentScopeDraft) => void;
  readonly onRemove: () => void;
}) {
  const { t } = useText();

  const enterpriseOptions = data.enterprises.map((enterprise) => ({
    value: enterprise.enterpriseKey,
    label: enterprise.enterpriseName,
  }));
  if (
    scope.enterpriseKey !== "" &&
    !enterpriseOptions.some((option) => option.value === scope.enterpriseKey)
  ) {
    enterpriseOptions.push({
      value: scope.enterpriseKey,
      label: scope.enterpriseKey,
    });
  }

  const ownershipOptions: { value: string; label: string }[] = [
    { value: "", label: t("permissions.choose") },
  ];
  if (category?.allowStore === true || scope.ownership === "store") {
    ownershipOptions.push({ value: "store", label: t("permissions.store") });
  }
  if (category?.allowGroup === true || scope.ownership === "group") {
    ownershipOptions.push({ value: "group", label: t("permissions.group") });
  }

  const storeOptions = data.stores
    .filter((store) => store.enterpriseKey === scope.enterpriseKey)
    .map((store) => ({
      value: store.name,
      label: itemLabel(t, store.name, store.retired),
      disabled: store.retired && store.name !== scope.storeName,
    }));

  const requiredDimensions =
    category?.dimensions.map((item) => item.dimensionId) ?? [];
  const dimensionIds = new Set([
    ...requiredDimensions,
    ...Object.keys(scope.dimensions),
  ]);

  const removeScope = (
    <ConfirmAction
      label={t("permissions.removeScope")}
      title={t("permissions.removeScope")}
      description={describeScope(t, data, scope)}
      confirmLabel={t("permissions.removeScope")}
      disabled={disabled}
      onConfirm={onRemove}
    />
  );

  return (
    <div className={styles.subcard}>
      <div className={styles.row}>
        <Field label={t("permissions.enterprise")}>
          <select
            value={scope.enterpriseKey}
            disabled={disabled}
            onChange={(event) => {
              onChange({
                ...scope,
                enterpriseKey: event.target.value,
                ...(scope.ownership === "store" ? { storeName: "" } : {}),
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
            value={scope.ownership}
            disabled={disabled}
            onChange={(event) => {
              const ownership = event.target.value;
              if (ownership === "store") {
                onChange({ ...scope, ownership: "store", storeName: "" });
              } else if (ownership === "group") {
                onChange({
                  enterpriseKey: scope.enterpriseKey,
                  ownership: "group",
                  dimensions: scope.dimensions,
                });
              } else {
                onChange({
                  enterpriseKey: scope.enterpriseKey,
                  ownership: "",
                  dimensions: scope.dimensions,
                });
              }
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

      {scope.ownership === "store" ? (
        <Field label={t("permissions.storeName")}>
          <select
            value={scope.storeName ?? ""}
            disabled={disabled}
            onChange={(event) => {
              onChange({ ...scope, storeName: event.target.value });
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
            {scope.storeName !== undefined &&
            scope.storeName !== "" &&
            !storeOptions.some((option) => option.value === scope.storeName) ? (
              <option value={scope.storeName}>
                {t("permissions.preserved")}
              </option>
            ) : null}
          </select>
        </Field>
      ) : null}

      {[...dimensionIds].map((dimensionId) => {
        const dimension = data.dimensions.find(
          (item) => item.id === dimensionId,
        );
        const value = scope.dimensions[dimensionId] ?? "";
        const required = requiredDimensions.includes(dimensionId);
        const valueOptions = (dimension?.values ?? []).map((item) => ({
          value: item.id,
          label: itemLabel(t, item.name, item.retired),
          disabled: item.retired && item.id !== value,
        }));
        if (
          value !== "" &&
          !valueOptions.some((option) => option.value === value)
        ) {
          valueOptions.push({
            value,
            label: t("permissions.preserved"),
            disabled: false,
          });
        }
        return (
          <div key={dimensionId} className={styles.row}>
            <Field
              label={
                dimension === undefined
                  ? t("permissions.preserved")
                  : dimension.name
              }
            >
              <select
                value={value}
                disabled={disabled}
                onChange={(event) => {
                  const dimensions = { ...scope.dimensions };
                  if (event.target.value === "") {
                    delete dimensions[dimensionId];
                  } else {
                    dimensions[dimensionId] = event.target.value;
                  }
                  onChange({ ...scope, dimensions });
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
            {required ? null : (
              <ActionButton
                label={t("permissions.removeCondition")}
                variant="secondary"
                disabled={disabled}
                onRun={() => {
                  const dimensions = { ...scope.dimensions };
                  delete dimensions[dimensionId];
                  onChange({ ...scope, dimensions });
                }}
              />
            )}
          </div>
        );
      })}

      <div className={styles.actions}>{removeScope}</div>
    </div>
  );
}
