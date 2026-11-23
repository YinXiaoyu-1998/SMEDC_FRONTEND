import { useEffect, useRef, useState } from "react";

import {
  isTemplateConflict,
  previewTemplate,
  setTemplateActivation,
  writeTemplate,
  type TemplatePreview,
} from "@/api/inspection-templates";
import { useText } from "@/i18n/useText";
import { ActionButton } from "@/ui/ActionButton";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { InlineError } from "@/ui/InlineError";
import { useConfirmFlow } from "@/ui/useConfirmFlow";

import {
  completeDefinition,
  draftFromPreview,
  sameDraft,
  restoreRemovedItems,
  type TemplateDraft,
} from "./templateDraft";
import { TemplateBuilder, type TemplateStore } from "./TemplateBuilder";
import styles from "./Templates.module.css";
import { useTemplateText } from "./templatesText";

export function TemplateEditor({
  initial,
  enterpriseKey,
  templateId,
  stores,
  csrfToken,
  onState,
  onSaved,
}: {
  initial: TemplatePreview | null;
  enterpriseKey: string;
  templateId: string;
  stores: TemplateStore[];
  csrfToken: string;
  onState: (state: { dirty: boolean; busy: boolean }) => void;
  onSaved: () => void;
}) {
  const t = useTemplateText();
  const { locale } = useText();
  const [baseline, setBaseline] = useState(() => draftFromPreview(initial));
  const [draft, setDraft] = useState(baseline);
  const [serverStatus, setServerStatus] = useState<Pick<
    TemplatePreview,
    "draftRevision" | "activeTemplateVersionId" | "activeRevision"
  > | null>(initial);
  const [preview, setPreview] = useState(initial);
  const [conflict, setConflict] = useState(false);
  const [latest, setLatest] = useState<TemplatePreview | null>(null);
  const [busy, setBusy] = useState<"save" | "read" | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [saved, setSaved] = useState(false);
  const action = useRef(true);

  const dirty = !sameDraft(draft, baseline);
  const revision = serverStatus?.draftRevision ?? null;
  const definition = completeDefinition(draft);
  const validSize =
    definition !== null &&
    new TextEncoder().encode(
      JSON.stringify({
        enterpriseKey,
        definition,
        ...(revision === null
          ? { templateId }
          : { expectedDraftRevision: revision }),
      }),
    ).length <=
      512 * 1024;
  const blocked = conflict || busy !== null;

  function adopt(data: TemplatePreview, keepDraft = false) {
    const value = draftFromPreview(data);
    setPreview(data);
    setServerStatus(data);
    setBaseline(value);
    if (!keepDraft) setDraft(value);
    setConflict(false);
    setLatest(null);
  }

  async function readPreview(expected: number | null, keepDraft: boolean) {
    const current = await previewTemplate(enterpriseKey, templateId);
    if (current.draftRevision !== expected || conflict) {
      setConflict(true);
      setLatest(current);
      return;
    }
    adopt(current, keepDraft);
  }

  async function save() {
    if (!definition || !validSize || !dirty || blocked) return;
    setBusy("save");
    setError(null);
    setSaved(false);
    try {
      const committed = await writeTemplate(
        enterpriseKey,
        templateId,
        definition,
        revision,
        csrfToken,
      );
      setServerStatus(committed);
      setPreview(null);
      setBaseline(draft);
      setSaved(true);
      onSaved();
      await readPreview(committed.draftRevision, false);
    } catch (failure) {
      if (isTemplateConflict(failure)) setConflict(true);
      else setError(failure);
    } finally {
      setBusy(null);
    }
  }

  const activation = useConfirmFlow({
    prepare: () => ({ revision: revision!, activate: action.current }),
    submit: async ({ revision, activate }) => {
      setError(null);
      setSaved(false);
      try {
        const result = await setTemplateActivation(
          enterpriseKey,
          templateId,
          revision,
          activate,
          csrfToken,
        );
        setServerStatus(result);
        setPreview(null);
        onSaved();
        await readPreview(result.draftRevision, false);
      } catch (failure) {
        if (isTemplateConflict(failure)) setConflict(true);
        else setError(failure);
      }
    },
  });
  const running = busy !== null || activation.isSubmitting;
  useEffect(() => {
    onState({ dirty: dirty || conflict, busy: running });
  }, [dirty, conflict, running, onState]);

  const active = serverStatus?.activeTemplateVersionId != null;
  const canActivate =
    !dirty &&
    !blocked &&
    preview !== null &&
    preview.issues.length === 0 &&
    (!active || serverStatus.activeRevision !== revision);
  const canDeactivate = !dirty && !blocked && active;
  const openActivation = (activate: boolean) => {
    action.current = activate;
    void activation.request();
  };

  const reload = async () => {
    setBusy("read");
    setError(null);
    try {
      await readPreview(revision, dirty);
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={styles.stack}>
      <TemplateBuilder
        draft={draft}
        stores={stores}
        disabled={running}
        onChange={(next) => {
          setSaved(false);
          setDraft(next);
        }}
      />
      {definition === null ? (
        <p role="alert" className={styles.error}>
          {t("invalidScore")}
        </p>
      ) : !validSize ? (
        <p role="alert" className={styles.error}>
          {t("oversize")}
        </p>
      ) : null}
      <div className={styles.toolbar}>
        <ActionButton
          label={t("save")}
          busy={busy === "save"}
          disabled={!dirty || !validSize || blocked || activation.isSubmitting}
          onRun={() => void save()}
        />
        <ActionButton
          label={t("activate")}
          variant="secondary"
          disabled={!canActivate || activation.isSubmitting}
          onRun={() => openActivation(true)}
        />
        <ActionButton
          label={t("deactivate")}
          variant="secondary"
          disabled={!canDeactivate || activation.isSubmitting}
          onRun={() => openActivation(false)}
        />
      </div>
      <InlineError error={error} />
      {saved ? <p role="status">{t("saved")}</p> : null}
      {revision !== null ? (
        <section aria-label={t("checks")} className={styles.review}>
          <h2>{t("checks")}</h2>
          <dl className={styles.facts}>
            <div>
              <dt>{t("draftRevision")}</dt>
              <dd>{revision}</dd>
            </div>
            <div>
              <dt>{t("activeRevision")}</dt>
              <dd>{active ? serverStatus.activeRevision : t("inactive")}</dd>
            </div>
            <div>
              <dt>{t("maxScore")}</dt>
              <dd>
                {preview?.staticMaxTenths == null
                  ? t("unscored")
                  : new Intl.NumberFormat(locale).format(
                      preview.staticMaxTenths / 10,
                    )}
              </dd>
            </div>
          </dl>
          {preview === null ? (
            <p>{t("savedNeedsPreview")}</p>
          ) : preview.issues.length === 0 ? (
            <p>{t("ready")}</p>
          ) : (
            <ul>
              {preview.issues.map((issue, index) => (
                <li key={index}>
                  {issue.field} · {issue.message}
                </li>
              ))}
            </ul>
          )}
          {preview === null || conflict ? (
            <ActionButton
              label={t("reload")}
              variant="secondary"
              busy={busy === "read"}
              disabled={activation.isSubmitting}
              onRun={() => void reload()}
            />
          ) : null}
        </section>
      ) : null}
      {conflict ? (
        <section className={styles.review} aria-label={t("conflict")}>
          <p role="alert">{t("conflict")}</p>
          {revision === null && !latest ? (
            <ActionButton
              variant="secondary"
              label={t("reload")}
              busy={busy === "read"}
              onRun={() => void reload()}
            />
          ) : null}
          {latest ? (
            <>
              <div className={styles.row}>
                <DraftSummary
                  title={t("server")}
                  draft={draftFromPreview(latest)}
                  stores={stores}
                />
                <DraftSummary
                  title={t("local")}
                  draft={draft}
                  stores={stores}
                />
              </div>
              <p>{t("conflictHint")}</p>
              <div className={styles.toolbar}>
                <ActionButton
                  label={t("useServer")}
                  variant="secondary"
                  onRun={() => adopt(latest)}
                />
                <ActionButton
                  label={t("keepMine")}
                  variant="secondary"
                  onRun={() => {
                    const restored = restoreRemovedItems(
                      draft,
                      baseline,
                      draftFromPreview(latest),
                    );
                    adopt(latest, true);
                    setDraft(restored);
                  }}
                />
              </div>
            </>
          ) : null}
        </section>
      ) : null}
      <ConfirmDialog
        flow={activation}
        title={t(
          activation.prepared?.activate === false ? "deactivate" : "activate",
        )}
        description={t(
          activation.prepared?.activate === false
            ? "deactivateHint"
            : "activateHint",
        )}
        confirmLabel={t(
          activation.prepared?.activate === false ? "deactivate" : "activate",
        )}
        cancelLabel={t("cancel")}
      >
        <p>
          {t("draftRevision")} {activation.prepared?.revision}
        </p>
      </ConfirmDialog>
    </div>
  );
}

function DraftSummary({
  draft,
  title,
  stores,
}: {
  draft: TemplateDraft;
  title: string;
  stores: TemplateStore[];
}) {
  const t = useTemplateText();
  return (
    <details>
      <summary>
        {title} · {draft.title || t("unnamed")}
      </summary>
      <p>
        {draft.copyMode ? t(draft.copyMode) : t("noMode")} ·{" "}
        {draft.storeIds
          .map(
            (id) =>
              stores.find((store) => store.storeId === id)?.officialName ?? id,
          )
          .join(", ")}
      </p>
      {draft.questions.map((question, index) => (
        <details key={question.questionId}>
          <summary>
            {index + 1}. {question.title || t("questionTitle")} ·{" "}
            {question.category}
          </summary>
          <ul>
            {question.components.map((component) => (
              <li key={component.componentId}>
                {t(component.kind)} · {component.label}
                {component.kind === "sop" ? (
                  <p>{component.text}</p>
                ) : component.required ? (
                  ` · ${t("required")}`
                ) : null}
                {component.kind === "score"
                  ? ` · ${component.min}–${component.max}`
                  : null}
                {component.kind === "status"
                  ? ` · ${component.options?.map((option) => option.label).join(", ") ?? ""}`
                  : null}
              </li>
            ))}
          </ul>
        </details>
      ))}
    </details>
  );
}
