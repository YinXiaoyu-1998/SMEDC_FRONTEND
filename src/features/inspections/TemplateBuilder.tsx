import { useState } from "react";

import type { ContextItem } from "@/api/inspection-templates";
import { ActionButton } from "@/ui/ActionButton";
import { Field } from "@/ui/Field";

import {
  componentKinds,
  copyQuestion,
  newComponent,
  newQuestion,
  rearrange,
  type ComponentInput,
  type QuestionInput,
  type TemplateDraft,
} from "./templateDraft";
import styles from "./Templates.module.css";
import { useTemplateText } from "./templatesText";

export type TemplateStore = Extract<ContextItem, { kind: "store" }>;
const PAGE_SIZE = 20;

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
  const [pageInput, setPage] = useState(0);
  const lastPage = Math.max(
    0,
    Math.ceil(draft.questions.length / PAGE_SIZE) - 1,
  );
  const page = Math.min(pageInput, lastPage);
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
    setPage(Math.floor(draft.questions.length / PAGE_SIZE));
  }

  return (
    <fieldset className={styles.builder} disabled={disabled}>
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
      {draft.questions
        .slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
        .map((question, offset) => {
          const index = page * PAGE_SIZE + offset;
          return (
            <QuestionEditor
              key={question.questionId}
              question={question}
              index={index}
              count={draft.questions.length}
              onChange={(next) =>
                patched({
                  questions: draft.questions.map((item, i) =>
                    i === index ? next : item,
                  ),
                })
              }
              onMove={(shift) => {
                patched({
                  questions: rearrange(draft.questions, index, shift),
                });
                setPage(Math.floor((index + shift) / PAGE_SIZE));
              }}
              onCopy={() => append(copyQuestion(question))}
              onRemove={() =>
                patched({
                  questions: draft.questions.filter(
                    (item) => item.questionId !== question.questionId,
                  ),
                })
              }
            />
          );
        })}
      {lastPage > 0 ? (
        <div className={styles.toolbar}>
          <ActionButton
            label={t("prev")}
            variant="secondary"
            disabled={page === 0}
            onRun={() => setPage(page - 1)}
          />
          <span>
            {page + 1} / {lastPage + 1}
          </span>
          <ActionButton
            label={t("next")}
            variant="secondary"
            disabled={page === lastPage}
            onRun={() => setPage(page + 1)}
          />
        </div>
      ) : null}
    </fieldset>
  );
}

function QuestionEditor({
  question,
  index,
  count,
  onChange,
  onCopy,
  onMove,
  onRemove,
}: {
  question: QuestionInput;
  index: number;
  count: number;
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
    <fieldset className={styles.question}>
      <legend>
        {t("questions")} {index + 1}
        {question.title ? ` · ${question.title}` : ""}
      </legend>
      <div className={styles.toolbar}>
        <ActionButton
          variant="ghost"
          label={t("up")}
          disabled={index === 0}
          onRun={() => onMove(-1)}
        />
        <ActionButton
          variant="ghost"
          label={t("down")}
          disabled={index + 1 >= count}
          onRun={() => onMove(1)}
        />
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
      <div className={styles.row}>
        <Field label={t("questionTitle")}>
          <input
            maxLength={120}
            value={question.title}
            onChange={(e) =>
              onChange({ ...question, title: e.currentTarget.value })
            }
          />
        </Field>
        <Field label={t("category")}>
          <input
            maxLength={120}
            value={question.category}
            onChange={(e) =>
              onChange({ ...question, category: e.currentTarget.value })
            }
          />
        </Field>
      </div>
      {question.components.map((component, i) => (
        <fieldset key={component.componentId} className={styles.component}>
          <legend>
            {t(component.kind)} {i + 1}
          </legend>
          <ComponentEditor
            component={component}
            onChange={(next) =>
              components(
                question.components.map((item, j) => (j === i ? next : item)),
              )
            }
          />
          <div className={styles.toolbar}>
            <ActionButton
              variant="ghost"
              label={t("up")}
              disabled={i === 0}
              onRun={() => components(rearrange(question.components, i, -1))}
            />
            <ActionButton
              variant="ghost"
              label={t("down")}
              disabled={i === question.components.length - 1}
              onRun={() => components(rearrange(question.components, i, 1))}
            />
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
          onRun={() => components([...question.components, newComponent(kind)])}
        />
      </div>
    </fieldset>
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
                label={t("up")}
                disabled={index === 0}
                onRun={() =>
                  onChange({
                    ...component,
                    options: rearrange(options, index, -1),
                  })
                }
              />
              <ActionButton
                variant="ghost"
                label={t("down")}
                disabled={index === options.length - 1}
                onRun={() =>
                  onChange({
                    ...component,
                    options: rearrange(options, index, 1),
                  })
                }
              />
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
