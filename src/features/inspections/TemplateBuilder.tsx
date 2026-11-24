import { useState, type PointerEvent } from "react";

import type { ContextItem } from "@/api/inspection-templates";
import { ActionButton } from "@/ui/ActionButton";
import { Field } from "@/ui/Field";

import {
  componentKinds,
  copyQuestion,
  newComponent,
  newQuestion,
  type ComponentInput,
  type QuestionInput,
  type TemplateDraft,
} from "./templateDraft";
import styles from "./Templates.module.css";
import { useTemplateText } from "./templatesText";
import { useQuestionDrag } from "./useQuestionDrag";

export type TemplateStore = Extract<ContextItem, { kind: "store" }>;

export function TemplateBuilder({
  draft,
  stores,
  onChange,
  disabled,
}: {
  draft: TemplateDraft;
  stores: readonly TemplateStore[];
  onChange: (draft: TemplateDraft) => void;
  disabled: boolean;
}) {
  const t = useTemplateText();
  const [expanded, setExpanded] = useState(() => new Set<string>());
  const drag = useQuestionDrag((id, target) => {
    const destination = draft.questions.findIndex(
      ({ questionId }) => questionId === target.id,
    );
    if (destination < 0) return;
    const from = draft.questions.findIndex(
      ({ questionId }) => questionId === id,
    );
    const insertion = destination + (target.before ? 0 : 1);
    move(id, insertion - (from < insertion ? 1 : 0));
  });

  const patched = (patch: Partial<TemplateDraft>) =>
    onChange({ ...draft, ...patch });
  const choices = [
    ...stores.filter(
      (store) => !store.retired || draft.storeIds.includes(store.storeId),
    ),
    ...draft.storeIds
      .filter((id) => !stores.some((store) => store.storeId === id))
      .map((storeId) => ({ storeId, officialName: storeId, retired: true })),
  ];

  function append(question: QuestionInput) {
    patched({ questions: [...draft.questions, question] });
    setExpanded((old) => new Set(old).add(question.questionId));
  }

  function move(id: string, to: number) {
    const from = draft.questions.findIndex(
      ({ questionId }) => questionId === id,
    );
    if (from < 0 || to < 0 || to >= draft.questions.length || from === to)
      return;
    const questions = [...draft.questions];
    const [question] = questions.splice(from, 1);
    questions.splice(to, 0, question!);
    patched({ questions });
  }

  return (
    <fieldset ref={drag.builder} className={styles.builder} disabled={disabled}>
      <div className={styles.row}>
        <Field label={t("title")}>
          <input
            maxLength={120}
            value={draft.title}
            onChange={(e) => patched({ title: e.currentTarget.value })}
          />
        </Field>
        <Field label={t("mode")}>
          <select
            value={draft.copyMode ?? ""}
            onChange={(e) =>
              patched({
                copyMode: (e.currentTarget.value ||
                  null) as TemplateDraft["copyMode"],
              })
            }
          >
            <option value="">{t("noMode")}</option>
            <option value="single">{t("single")}</option>
            <option value="multiple">{t("multiple")}</option>
          </select>
        </Field>
      </div>
      <fieldset className={styles.storeChoices}>
        <legend>{t("stores")}</legend>
        {choices.map((store) => (
          <label key={store.storeId} className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={draft.storeIds.includes(store.storeId)}
              disabled={
                !draft.storeIds.includes(store.storeId) &&
                (store.retired || draft.storeIds.length >= 200)
              }
              onChange={(e) =>
                patched({
                  storeIds: e.currentTarget.checked
                    ? [...draft.storeIds, store.storeId]
                    : draft.storeIds.filter((id) => id !== store.storeId),
                })
              }
            />
            {store.officialName}
            {store.retired ? ` · ${t("retired")}` : ""}
          </label>
        ))}
      </fieldset>
      <div className={styles.toolbar}>
        <h2>{t("questions")}</h2>
        <ActionButton
          label={t("addQuestion")}
          variant="secondary"
          disabled={disabled || draft.questions.length >= 200}
          onRun={() => append(newQuestion())}
        />
      </div>
      <p className={styles.note}>{t("manual")}</p>
      {draft.questions.map((question, index) => {
        const id = question.questionId;
        return (
          <div
            key={id}
            className={styles.questionSlot}
            data-question-id={id}
            data-dragging={drag.dragged === id || undefined}
            data-drop={
              drag.target?.id === id
                ? drag.target.before
                  ? "before"
                  : "after"
                : undefined
            }
          >
            <QuestionEditor
              question={question}
              index={index}
              count={draft.questions.length}
              expanded={expanded.has(id)}
              onToggle={() =>
                setExpanded((old) => {
                  const next = new Set(old);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                })
              }
              onDragStart={(event) => drag.start(id, event)}
              onDragMove={drag.move}
              onDrop={(event) => drag.finish(event, true)}
              onCancelDrag={(event) => drag.finish(event, false)}
              onMove={(shift) => move(id, index + shift)}
              onChange={(next) =>
                patched({
                  questions: draft.questions.map((item) =>
                    item.questionId === id ? next : item,
                  ),
                })
              }
              onCopy={() => append(copyQuestion(question))}
              onRemove={() => {
                setExpanded((old) => {
                  const next = new Set(old);
                  next.delete(id);
                  return next;
                });
                patched({
                  questions: draft.questions.filter(
                    (item) => item.questionId !== id,
                  ),
                });
              }}
            />
          </div>
        );
      })}
    </fieldset>
  );
}

function QuestionEditor({
  question,
  index,
  count,
  expanded,
  onToggle,
  onDragStart,
  onDragMove,
  onDrop,
  onCancelDrag,
  onChange,
  onCopy,
  onMove,
  onRemove,
}: {
  question: QuestionInput;
  index: number;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  onDragStart: (event: PointerEvent<HTMLButtonElement>) => void;
  onDragMove: (event: PointerEvent<HTMLButtonElement>) => void;
  onDrop: (event: PointerEvent<HTMLButtonElement>) => void;
  onCancelDrag: (event: PointerEvent<HTMLButtonElement>) => void;
  onChange: (next: QuestionInput) => void;
  onCopy: () => void;
  onMove: (shift: -1 | 1) => void;
  onRemove: () => void;
}) {
  const t = useTemplateText();
  const [kind, setKind] = useState<ComponentInput["kind"]>("score");
  const components = (next: ComponentInput[]) =>
    onChange({ ...question, components: next });
  return (
    <section className={styles.question} data-question-card>
      <div className={styles.questionHeader}>
        {count > 1 ? (
          <button
            type="button"
            className={styles.dragHandle}
            aria-label={
              t("dragQuestion") + " · " + (question.title || String(index + 1))
            }
            title={t("dragHint")}
            onPointerDown={onDragStart}
            onPointerMove={onDragMove}
            onPointerUp={onDrop}
            onLostPointerCapture={onCancelDrag}
            onPointerCancel={onCancelDrag}
            onKeyDown={(event) => {
              if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
              event.preventDefault();
              onMove(event.key === "ArrowUp" ? -1 : 1);
            }}
          >
            <span aria-hidden="true">⠿</span>
          </button>
        ) : null}
        <button
          type="button"
          className={styles.questionToggle}
          aria-expanded={expanded}
          onClick={onToggle}
        >
          <span aria-hidden="true">{expanded ? "▾" : "▸"}</span>
          {question.title || t("questionTitle") + " " + String(index + 1)}
        </button>
        <ActionButton
          variant="ghost"
          label={t("copy")}
          disabled={count >= 200}
          onRun={onCopy}
        />
        <ActionButton
          variant="ghost"
          label={t("removeQuestion")}
          onRun={onRemove}
        />
      </div>
      {expanded ? (
        <div className={styles.stack}>
          <Field label={t("questionTitle")}>
            <input
              maxLength={120}
              value={question.title}
              onChange={(event) =>
                onChange({ ...question, title: event.currentTarget.value })
              }
            />
          </Field>
          {question.components.map((component, i) => (
            <fieldset key={component.componentId} className={styles.component}>
              <legend>
                {t(component.kind)} {i + 1}
              </legend>
              <ComponentEditor
                component={component}
                onChange={(next) =>
                  components(
                    question.components.map((item, j) =>
                      j === i ? next : item,
                    ),
                  )
                }
              />
              <div className={styles.toolbar}>
                <ActionButton
                  variant="ghost"
                  label={t("remove")}
                  onRun={() =>
                    components(question.components.filter((_, j) => i !== j))
                  }
                />
              </div>
            </fieldset>
          ))}
          <div className={styles.toolbar}>
            <Field label={t("kind")}>
              <select
                value={kind}
                onChange={(e) =>
                  setKind(e.currentTarget.value as ComponentInput["kind"])
                }
              >
                {componentKinds.map((value) => (
                  <option key={value} value={value}>
                    {t(value)}
                  </option>
                ))}
              </select>
            </Field>
            <ActionButton
              label={t("add")}
              variant="secondary"
              disabled={question.components.length >= 12}
              onRun={() =>
                components([...question.components, newComponent(kind)])
              }
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ComponentEditor({
  component,
  onChange,
}: {
  component: ComponentInput;
  onChange: (next: ComponentInput) => void;
}) {
  const t = useTemplateText();
  return (
    <>
      <Field label={t("label")}>
        <input
          maxLength={120}
          value={component.label}
          onChange={(e) =>
            onChange({ ...component, label: e.currentTarget.value })
          }
        />
      </Field>
      {component.kind === "sop" ? (
        <Field label={t("sopText")}>
          <textarea
            maxLength={4000}
            rows={4}
            value={component.text}
            onChange={(e) =>
              onChange({ ...component, text: e.currentTarget.value })
            }
          />
        </Field>
      ) : (
        <label className={styles.checkLabel}>
          <input
            type="checkbox"
            checked={component.required}
            onChange={(e) =>
              onChange({ ...component, required: e.currentTarget.checked })
            }
          />
          {t("required")}
        </label>
      )}
      {component.kind === "score" ? (
        <div className={styles.row}>
          <Field label={t("min")} hint={t("scoreHint")}>
            <input
              inputMode="decimal"
              value={component.min}
              onChange={(e) =>
                onChange({ ...component, min: e.currentTarget.value })
              }
            />
          </Field>
          <Field label={t("max")} hint={t("scoreHint")}>
            <input
              inputMode="decimal"
              value={component.max}
              onChange={(e) =>
                onChange({ ...component, max: e.currentTarget.value })
              }
            />
          </Field>
        </div>
      ) : null}
      {component.kind === "status" ? (
        <>
          {(component.options ?? []).map((option, index, options) => (
            <div key={option.id} className={styles.toolbar}>
              <Field label={t("option")}>
                <input
                  value={option.label}
                  maxLength={120}
                  onChange={(e) => {
                    const label = e.currentTarget.value;
                    onChange({
                      ...component,
                      options: options.map((item, i) =>
                        index === i ? { ...item, label } : item,
                      ),
                    });
                  }}
                />
              </Field>
              <ActionButton
                variant="ghost"
                label={t("removeOption")}
                onRun={() =>
                  onChange({
                    ...component,
                    options: options.filter((item) => item.id !== option.id),
                  })
                }
              />
            </div>
          ))}
          <ActionButton
            variant="secondary"
            label={t("addOption")}
            disabled={(component.options?.length ?? 0) >= 32}
            onRun={() =>
              onChange({
                ...component,
                options: [
                  ...(component.options ?? []),
                  { id: crypto.randomUUID(), label: "" },
                ],
              })
            }
          />
        </>
      ) : null}
    </>
  );
}
