import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

import {
  listTemplates,
  previewTemplate,
  templateContext,
} from "@/api/inspection-templates";
import { useSession } from "@/api/session";
import { useText } from "@/i18n/useText";
import { ActionButton } from "@/ui/ActionButton";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Field } from "@/ui/Field";
import { InlineError } from "@/ui/InlineError";
import { useConfirmFlow } from "@/ui/useConfirmFlow";

import { isAccessError } from "./employeeApi";
import { InspectionFrame } from "./InspectionFrame";
import { TemplateEditor } from "./TemplateEditor";
import type { TemplateStore } from "./TemplateBuilder";
import styles from "./Templates.module.css";
import { useTemplateText } from "./templatesText";

interface OpenTemplate {
  id: string;
  isNew: boolean;
}
interface View {
  enterpriseKey: string;
  template: OpenTemplate | null;
}

export function InspectionTemplatesPage() {
  const { t } = useText();
  const labels = useTemplateText();
  const session = useSession().data;
  const accountId = session?.identity.userAccountId;
  const orgId = session?.identity.orgId;
  const canManage = session?.canManageInspectionTemplates === true;
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>({ enterpriseKey: "", template: null });
  const [editor, setEditor] = useState({ dirty: false, busy: false });
  const onState = useCallback((state: typeof editor) => setEditor(state), []);
  const nextView = useRef<View | null>(null);
  const [failedEdit, setFailedEdit] = useState<{
    scopeKey: string;
    error: unknown;
  }>();

  const select = (next: View) => {
    if (next.template && !next.template.isNew) {
      queryClient.removeQueries({
        queryKey: [
          "inspection-templates",
          orgId,
          accountId,
          next.enterpriseKey,
          "preview",
          next.template.id,
        ],
        exact: true,
      });
    }
    setView(next);
    setEditor({ dirty: false, busy: false });
  };

  const discard = useConfirmFlow({
    prepare: () => nextView.current,
    submit: (next) => {
      if (next) select(next);
    },
  });

  const context = useQuery({
    queryKey: ["inspection-template-context", orgId, accountId],
    queryFn: ({ signal }) => templateContext(signal),
    enabled: canManage,
    retry: false,
  });
  const items =
    canManage && !isAccessError(context.error) ? (context.data ?? []) : [];
  const enterprises = [
    ...new Map(
      items
        .filter((item) => item.kind === "enterprise")
        .map((item) => [item.enterpriseKey, item.enterpriseName]),
    ),
  ];
  const enterpriseKey = enterprises.some(([key]) => key === view.enterpriseKey)
    ? view.enterpriseKey
    : (enterprises[0]?.[0] ?? "");
  const stores = items.filter(
    (item): item is TemplateStore =>
      item.kind === "store" && item.enterpriseKey === enterpriseKey,
  );
  const listKey = [
    "inspection-templates",
    orgId,
    accountId,
    enterpriseKey,
  ] as const;
  const templates = useInfiniteQuery({
    queryKey: listKey,
    queryFn: ({ pageParam, signal }) =>
      listTemplates(enterpriseKey, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled: canManage && enterpriseKey !== "",
    retry: false,
    gcTime: 0,
  });
  const opened = view.enterpriseKey === enterpriseKey ? view.template : null;
  const details = useQuery({
    queryKey: [...listKey, "preview", opened?.id],
    queryFn: ({ signal }) => previewTemplate(enterpriseKey, opened!.id, signal),
    enabled: canManage && !!opened && !opened.isNew && enterpriseKey !== "",
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
  const scopeKey = JSON.stringify([orgId, accountId, enterpriseKey]);
  const actionError =
    failedEdit?.scopeKey === scopeKey ? failedEdit.error : undefined;
  const blocked =
    isAccessError(details.error) ||
    isAccessError(templates.error) ||
    !!actionError;
  const editorVisible =
    !blocked && !!opened && (opened.isNew || !!details.data);
  const editorBusy = editorVisible && editor.busy;
  const choose = (next: View) => {
    if (
      editorBusy ||
      (next.enterpriseKey === enterpriseKey && next.template?.id === opened?.id)
    )
      return;
    if (editorVisible && editor.dirty) {
      nextView.current = next;
      void discard.request();
    } else {
      select(next);
    }
  };

  return (
    <InspectionFrame title={t("pages.inspectionTemplates.title")}>
      {!canManage ? (
        <p>{labels("unavailable")}</p>
      ) : (
        <div className={styles.stack}>
          {context.isPending ? <p role="status">{labels("loading")}</p> : null}
          <InlineError error={context.error} />
          {context.isError ? (
            <ActionButton
              label={labels("retry")}
              variant="secondary"
              busy={context.isFetching}
              onRun={() => void context.refetch()}
            />
          ) : null}
          {enterprises.length > 0 ? (
            <div className={styles.toolbar}>
              <Field label={labels("enterprise")}>
                <select
                  value={enterpriseKey}
                  disabled={editorBusy}
                  onChange={(e) =>
                    choose({
                      enterpriseKey: e.currentTarget.value,
                      template: null,
                    })
                  }
                >
                  {enterprises.map(([key, name]) => (
                    <option key={key} value={key}>
                      {name}
                    </option>
                  ))}
                </select>
              </Field>
              <ActionButton
                label={labels("create")}
                disabled={editorBusy || blocked}
                onRun={() =>
                  choose({
                    enterpriseKey,
                    template: { id: crypto.randomUUID(), isNew: true },
                  })
                }
              />
            </div>
          ) : context.isSuccess ? (
            <p>{labels("empty")}</p>
          ) : null}
          {enterpriseKey !== "" && !blocked ? (
            <section aria-label={labels("templates")} className={styles.list}>
              {templates.data?.pages
                .flatMap((page) => page.items)
                .map((template) => (
                  <ActionButton
                    key={template.templateId}
                    disabled={editorBusy}
                    label={`${template.title || labels("unnamed")} · ${labels(template.activeTemplateVersionId ? "active" : "inactive")}`}
                    aria-pressed={opened?.id === template.templateId}
                    variant={
                      opened?.id === template.templateId
                        ? "primary"
                        : "secondary"
                    }
                    onRun={() =>
                      choose({
                        enterpriseKey,
                        template: { id: template.templateId, isNew: false },
                      })
                    }
                  />
                ))}
              {templates.hasNextPage ? (
                <ActionButton
                  label={labels("more")}
                  busy={templates.isFetchingNextPage}
                  variant="ghost"
                  onRun={() => void templates.fetchNextPage()}
                />
              ) : null}
              {templates.isPending ? (
                <p role="status">{labels("loading")}</p>
              ) : null}
              {templates.isSuccess &&
              templates.data.pages.every((page) => page.items.length === 0) ? (
                <p>{labels("empty")}</p>
              ) : null}
            </section>
          ) : null}
          <InlineError error={templates.error} />
          {templates.isError ? (
            <ActionButton
              label={labels("retry")}
              variant="secondary"
              busy={templates.isFetching}
              onRun={() => void templates.refetch()}
            />
          ) : null}
          {opened && !opened.isNew && details.isPending ? (
            <p role="status">{labels("loading")}</p>
          ) : null}
          <InlineError error={details.error ?? actionError} />
          {actionError ? (
            <ActionButton
              label={labels("retry")}
              variant="secondary"
              onRun={() =>
                void context.refetch().then((result) => {
                  if (!result.isSuccess) return;
                  select({ enterpriseKey, template: null });
                  setFailedEdit(undefined);
                })
              }
            />
          ) : null}
          {details.isError ? (
            <ActionButton
              label={labels("retry")}
              variant="secondary"
              busy={details.isFetching}
              onRun={() => void details.refetch()}
            />
          ) : null}
          {session && opened && editorVisible ? (
            <TemplateEditor
              key={JSON.stringify([orgId, accountId, enterpriseKey, opened.id])}
              initial={opened.isNew ? null : details.data!}
              enterpriseKey={enterpriseKey}
              templateId={opened.id}
              stores={stores}
              csrfToken={session.csrfToken}
              onState={onState}
              onAccessError={(error) => setFailedEdit({ scopeKey, error })}
              onSaved={() =>
                void queryClient.invalidateQueries({
                  queryKey: listKey,
                  exact: true,
                })
              }
            />
          ) : null}
        </div>
      )}
      <ConfirmDialog
        flow={discard}
        title={labels("discard")}
        description={labels("discardHint")}
        confirmLabel={labels("discardAction")}
        cancelLabel={labels("cancel")}
      />
    </InspectionFrame>
  );
}
