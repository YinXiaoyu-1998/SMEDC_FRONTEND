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
import { InlineError } from "@/ui/InlineError";
import { useConfirmFlow } from "@/ui/useConfirmFlow";

import { DraftFeedback } from "./components";
import type { Confirmation } from "./diff";
import {
  describeScope,
  documentDiff,
  documentToDraft,
  documentUpdateBody,
  rebaseDocument,
  validateDocumentDraft,
  type DocumentDraft,
} from "./document-draft";
import { DocumentScopeEditor } from "./DocumentScopeEditor";
import { permissionsErrorKey } from "./errorKeys";
import {
  categoryName,
  documentStatusLabel,
  levelLabel,
  type LabelData,
} from "./labels";
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
import { useDraftSave, type DraftBaseline } from "./useDraftSave";
import { useRegisterDraft } from "./useRegisterDraft";

const NEW_SCOPE = "\u0000new";

export function DocumentsSection({ active }: { readonly active: boolean }) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [stack, setStack] = useState<readonly (string | null)[]>([]);
  const [selected, setSelected] = useState<{
    readonly document: PermissionDocument;
    readonly version: string;
  } | null>(null);
  const [dirty, setDirty] = useState(false);
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

  const discardFlow = useConfirmFlow<void, void>({
    prepare: () => undefined,
    submit: () => {
      const action = pendingAction.current;
      pendingAction.current = null;
      setDirty(false);
      if (action !== null) action();
    },
  });

  const guard = (action: () => void) => {
    if (!dirty) {
      action();
      return;
    }
    pendingAction.current = action;
    void discardFlow.request();
  };

  const applySearch = () => {
    guard(() => {
      setAppliedSearch(searchText.trim());
      setCursor(null);
      setStack([]);
      setSelected(null);
    });
  };

  const documents = documentsQuery.data?.documents ?? [];
  const nextCursor = documentsQuery.data?.nextCursor ?? null;
  const page = stack.length + 1;
  const error: unknown = documentsQuery.error;

  const goNext = () => {
    if (nextCursor === null) return;
    guard(() => {
      setStack((previous) => [...previous, cursor]);
      setCursor(nextCursor);
      setSelected(null);
    });
  };

  const goPrevious = () => {
    if (stack.length === 0) return;
    guard(() => {
      const target = stack[stack.length - 1] ?? null;
      setStack(stack.slice(0, -1));
      setCursor(target);
      setSelected(null);
    });
  };

  const backToFirstPage = () => {
    setStack([]);
    setCursor(null);
    setSelected(null);
    setDirty(false);
    scope.setNotice("permissions.documentCursorReset");
  };

  const reloadDocument = async (
    id: string,
  ): Promise<DraftBaseline<DocumentDraft> | null> => {
    const result = await listDocuments(scope.orgId, appliedSearch, cursor);
    if (result.authorizationVersion !== scope.bundle.version) {
      throw new WebApiError({
        status: 409,
        code: VERSION_CONFLICT_CODE,
        message: "配置版本不一致",
      });
    }
    const latest = result.documents.find((item) => item.id === id);
    if (latest === undefined) return null;
    return {
      snapshot: documentToDraft(latest),
      version: result.authorizationVersion,
    };
  };

  const openDocument = (document: PermissionDocument) => {
    const version = documentsQuery.data?.authorizationVersion;
    if (version === undefined) return;
    guard(() => {
      setSelected({ document, version });
    });
  };

  return (
    <>
      <ListHeader
        title={t("permissions.tabs.documents")}
        description={t("permissions.documentListHint")}
      />
      <form
        className={styles.toolbar}
        onSubmit={(event) => {
          event.preventDefault();
          applySearch();
        }}
      >
        <Field label={t("permissions.searchDocument")}>
          <input
            type="search"
            maxLength={256}
            value={searchText}
            autoComplete="off"
            onChange={(event) => {
              setSearchText(event.target.value);
            }}
          />
        </Field>
        <ActionButton
          label={t("permissions.search")}
          variant="secondary"
          onRun={applySearch}
        />
      </form>

      <DataTable<PermissionDocument>
        columns={[
          {
            id: "document",
            header: t("permissions.document"),
            cell: (document) => (
              <>
                <strong>{document.title}</strong>
                <br />
                <span className={styles.muted}>{document.id}</span>
              </>
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
            cell: (document) => (
              <span className={styles.levelBadge}>
                {levelLabel(t, document.fileConfidentialityLevel)}
              </span>
            ),
          },
          {
            id: "actions",
            header: t("permissions.actions"),
            align: "end",
            cell: (document) => (
              <ActionButton
                label={t("permissions.edit")}
                variant="secondary"
                busy={documentsQuery.isFetching}
                onRun={() => {
                  openDocument(document);
                }}
              />
            ),
          },
        ]}
        rows={documents}
        getRowId={(document) => document.id}
        label={t("permissions.tabs.documents")}
        loading={documentsQuery.isFetching}
        emptyLabel={t("permissions.documentNoResults")}
      />

      <div className={styles.tableFoot}>
        <span className={styles.countText}>
          {t("permissions.page")}: {page}
        </span>
        <div className={styles.pager}>
          <ActionButton
            label={t("ui.table.previous")}
            variant="secondary"
            disabled={stack.length === 0 || documentsQuery.isFetching}
            onRun={goPrevious}
          />
          <ActionButton
            label={t("ui.table.next")}
            variant="secondary"
            disabled={nextCursor === null || documentsQuery.isFetching}
            onRun={goNext}
          />
        </div>
      </div>

      {error === null || error === undefined ? null : (
        <div className={styles.actions}>
          <p className={styles.error} role="alert">
            {t(permissionsErrorKey(error))}
          </p>
          {cursor === null ? null : (
            <ActionButton
              label={t("permissions.backToFirstPage")}
              variant="secondary"
              onRun={backToFirstPage}
            />
          )}
        </div>
      )}

      {selected === null ? null : (
        <DocumentPanel
          key={selected.document.id}
          record={selected.document}
          version={selected.version}
          onClose={() => {
            setSelected(null);
            setDirty(false);
          }}
          onDirtyChange={setDirty}
          onSaved={(updated, authorizationVersion) => {
            setSelected({ document: updated, version: authorizationVersion });
            queryClient.setQueryData<PermissionsDocumentsListResponse>(
              documentsKey,
              (previous) =>
                previous === undefined
                  ? previous
                  : {
                      ...previous,
                      authorizationVersion,
                      documents: previous.documents.map((item) =>
                        item.id === updated.id ? updated : item,
                      ),
                    },
            );
          }}
          reload={reloadDocument}
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

function DocumentPanel({
  record,
  version,
  onClose,
  onDirtyChange,
  onSaved,
  reload,
}: {
  readonly record: PermissionDocument;
  readonly version: string;
  readonly onClose: () => void;
  readonly onDirtyChange: (dirty: boolean) => void;
  readonly onSaved: (
    document: PermissionDocument,
    authorizationVersion: string,
  ) => void;
  readonly reload: (id: string) => Promise<DraftBaseline<DocumentDraft> | null>;
}) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const data = scope.bundle;
  const baseline = useMemo(
    () => ({ snapshot: documentToDraft(record), version }),
    [record, version],
  );

  const save = useDraftSave<
    DocumentDraft,
    {
      readonly document: PermissionDocument;
      readonly authorizationVersion: string;
    }
  >({
    baseline,
    validate: (draft, base) =>
      validateDocumentDraft(
        draft,
        base,
        data.categories.find((item) => item.id === draft.categoryId),
        data,
      ),
    confirmation: (draft, base) => ({
      subject: `${record.title} · ${documentStatusLabel(t, record.status)}`,
      diff: documentDiff(t, data, draft, base),
      impact: t("permissions.documentSaveImpact"),
      fullBefore: describeDocument(t, data, base),
      fullAfter: describeDocument(t, data, draft),
    }),
    submit: (draft, expectedVersion) =>
      scope.writes.saveDocument(
        record,
        documentUpdateBody(draft, expectedVersion),
      ),
    nextBaseline: (result) => documentToDraft(result.document),
    reload: async () => {
      const latest = await reload(record.id);
      if (latest === null) {
        throw new WebApiError({
          status: 409,
          code: "RESOURCE_NOT_FOUND",
          message: "文档已不可用",
        });
      }
      return latest;
    },
    rebase: (input) => rebaseDocument(t, input),
    onSaved: (result) => {
      scope.setNotice("permissions.documentSaved");
      onSaved(result.document, result.authorizationVersion);
    },
  });
  useRegisterDraft(save.isDirty || save.conflict);

  useEffect(() => {
    onDirtyChange(save.isDirty || save.conflict);
  }, [onDirtyChange, save.conflict, save.isDirty]);

  const [editingScope, setEditingScope] = useState<string | null>(null);
  const pendingScope = useRef<string | null>(null);

  const removeFlow = useConfirmFlow<{ confirmation: Confirmation }, void>({
    prepare: () => {
      const scopeDraft = save.draft.scopes.find(
        (item) => item.id === pendingScope.current,
      );
      return {
        confirmation: {
          subject: record.title,
          diff:
            scopeDraft === undefined
              ? []
              : [
                  {
                    kind: "removed" as const,
                    label: t("permissions.scopes"),
                    before: describeScope(t, data, scopeDraft),
                  },
                ],
          impact: t("permissions.scopeRemoveImpact"),
        },
      };
    },
    submit: () => {
      const id = pendingScope.current;
      pendingScope.current = null;
      if (id === null) return;
      save.setDraft((previous) => ({
        ...previous,
        scopes: previous.scopes.filter((scopeDraft) => scopeDraft.id !== id),
      }));
    },
  });

  const requestRemoveScope = (id: string) => {
    pendingScope.current = id;
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

  const category: PermissionCategory | undefined = data.categories.find(
    (item) => item.id === save.draft.categoryId,
  );
  const evidenceCategories = data.categories.filter(
    (item) => item.kind === "evidence",
  );
  const editedScope =
    editingScope === null || editingScope === NEW_SCOPE
      ? null
      : (save.draft.scopes.find((item) => item.id === editingScope) ?? null);
  return (
    <>
      <Panel
        open
        title={t("permissions.editDocument")}
        subtitle={`${record.title} · ${documentStatusLabel(t, record.status)}`}
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
        <p className={styles.inlineNote}>
          {t("permissions.documentPanelHint")}
        </p>
        {record.valid ? null : (
          <p className={styles.error} role="alert">
            {t("permissions.attributesNotReady")}
          </p>
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
                {item.retired
                  ? `${item.name}${t("permissions.retiredLabel")}`
                  : item.name}
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
          <select
            value={
              save.draft.fileConfidentialityLevel === null
                ? ""
                : String(save.draft.fileConfidentialityLevel)
            }
            disabled={save.saving}
            onChange={(event) => {
              save.setDraft({
                ...save.draft,
                fileConfidentialityLevel:
                  event.target.value === "" ? null : Number(event.target.value),
              });
            }}
          >
            <option value="">{t("permissions.unset")}</option>
            {[0, 1, 2, 3].map((level) => (
              <option key={level} value={String(level)}>
                {level}
              </option>
            ))}
          </select>
        </Field>

        <ObjectListHead
          title={t("permissions.scopes")}
          action={
            <ActionButton
              label={t("permissions.addDocumentScope")}
              variant="secondary"
              disabled={save.saving || save.conflict}
              onRun={() => {
                setEditingScope(NEW_SCOPE);
              }}
            />
          }
        />
        {save.draft.scopes.length === 0 ? (
          <p className={styles.emptyEditor}>{t("permissions.scopeRequired")}</p>
        ) : (
          <div className={styles.stack}>
            {save.draft.scopes.map((scopeDraft) => (
              <ObjectRow
                key={scopeDraft.id}
                title={describeScope(t, data, scopeDraft)}
                actions={
                  <>
                    <ActionButton
                      label={t("permissions.edit")}
                      variant="ghost"
                      disabled={save.saving}
                      onRun={() => {
                        setEditingScope(scopeDraft.id);
                      }}
                    />
                    <ActionButton
                      label={t("permissions.remove")}
                      variant="ghost"
                      disabled={save.saving}
                      onRun={() => {
                        requestRemoveScope(scopeDraft.id);
                      }}
                    />
                  </>
                }
              />
            ))}
          </div>
        )}

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

      <DocumentScopeEditor
        key={editingScope ?? "closed"}
        open={editingScope !== null}
        initial={editedScope}
        category={category}
        data={data}
        documentTitle={record.title}
        onComplete={(next) => {
          if (editingScope === NEW_SCOPE) {
            save.setDraft((previous) => ({
              ...previous,
              scopes: [...previous.scopes, next],
            }));
          } else {
            save.setDraft((previous) => ({
              ...previous,
              scopes: previous.scopes.map((item) =>
                item.id === next.id ? next : item,
              ),
            }));
          }
          setEditingScope(null);
        }}
        onCancel={() => {
          setEditingScope(null);
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
        title={t("permissions.removeScope")}
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

function describeDocument(
  t: (key: string) => string,
  data: LabelData,
  draft: DocumentDraft,
): string {
  const heading =
    draft.categoryId === ""
      ? t("permissions.unset")
      : categoryName(t, data, draft.categoryId);
  const level = levelLabel(t, draft.fileConfidentialityLevel);
  const scopes =
    draft.scopes.length === 0
      ? t("permissions.empty")
      : draft.scopes.map((item) => describeScope(t, data, item)).join("\n");
  const reason = draft.historicalSupplementReason.trim();
  return `${heading} · ${t("permissions.level")}: ${level}\n${scopes}${reason === "" ? "" : `\n${t("permissions.supplementReason")}: ${reason}`}`;
}
