import { useState } from "react";

import { ActionButton } from "@/ui/ActionButton";
import { Field } from "@/ui/Field";

import { photoUrl } from "./employeeApi";
import {
  answerInput,
  answerOf,
  parseScalar,
  points,
  uploadIsReady,
  type Component,
  type Draft,
  type Edit,
  type Question,
  type ReusablePhoto,
  type Upload,
  type Value,
} from "./employeeDraft";
import { type EmployeeTextKey, useEmployeeText } from "./employeeText";
import styles from "./Employee.module.css";

type AnswerComponent = Exclude<Component, { kind: "sop" }>;
type QuestionEditorProps = {
  question: Question;
  edits: Record<string, Edit>;
  missing: ReadonlySet<string>;
  canFill: boolean;
  disabled: boolean;
  uploading: string | undefined;
  reusablePhotos: ReusablePhoto[];
  onPhotoError: () => void;
  onEdit: (edit: Edit, draft: Draft | undefined) => void;
  onUpload: (edit: Edit, file: File, retry?: Upload) => Promise<void>;
};

export function QuestionEditor(props: QuestionEditorProps) {
  const {
    question,
    edits,
    missing,
    canFill,
    disabled,
    uploading,
    reusablePhotos,
    onPhotoError,
    onEdit,
    onUpload,
  } = props;
  const t = useEmployeeText();
  return (
    <li className={styles.question}>
      <header>
        {question.category && (
          <p className={styles.muted}>{question.category}</p>
        )}
        <h3>{question.title}</h3>
      </header>
      {question.components.map((component) => {
        if (component.kind === "sop")
          return (
            <section key={component.componentId} className={styles.sop}>
              <h4>{component.label}</h4>
              <p className={styles.text}>{component.text}</p>
            </section>
          );

        const answer = answerOf(question, component.componentId);
        const draft = edits[component.componentId]?.draft;
        const edit = { component, answer, question };
        const flags = (
          <span className={styles.flags}>
            {component.required && <span>{t("required")}</span>}
            {missing.has(component.componentId) && (
              <span className={styles.missing}>{t("missingRequired")}</span>
            )}
            {draft && <span>{t("pending")}</span>}
          </span>
        );

        return (
          <div key={component.componentId} className={styles.answer}>
            {flags}
            {canFill ? (
              component.kind === "photo" ? (
                <PhotoEditor
                  label={component.label}
                  value={answer.value}
                  draft={draft}
                  disabled={disabled}
                  busy={uploading === component.componentId}
                  reusablePhotos={reusablePhotos}
                  onPhotoError={onPhotoError}
                  change={(value) =>
                    onEdit(
                      {
                        ...edit,
                        draft: value ?? { kind: "append", uploads: [] },
                      },
                      value,
                    )
                  }
                  upload={(file, retry) =>
                    onUpload(
                      {
                        ...edit,
                        draft: draft ?? { kind: "append", uploads: [] },
                      },
                      file,
                      retry,
                    )
                  }
                />
              ) : (
                <ScalarEditor
                  component={component}
                  value={answer.value}
                  draft={draft}
                  disabled={disabled}
                  change={(text) => {
                    const next = { kind: "scalar", text } as const;
                    onEdit(
                      { ...edit, draft: next },
                      text === answerInput(answer.value) ? undefined : next,
                    );
                  }}
                />
              )
            ) : (
              <>
                <h4>{component.label}</h4>
                <ValueDisplay component={component} value={answer.value} />
              </>
            )}
          </div>
        );
      })}
    </li>
  );
}

function ScalarEditor({
  component,
  value,
  draft,
  disabled,
  change,
}: {
  component: Exclude<AnswerComponent, { kind: "photo" }>;
  value: Value;
  draft: Draft | undefined;
  disabled: boolean;
  change: (value: string) => void;
}) {
  const t = useEmployeeText();
  const text = draft?.kind === "scalar" ? draft.text : answerInput(value);
  const range =
    component.kind === "score"
      ? t("scoreRange", {
          min: points(component.minTenths),
          max: points(component.maxTenths),
        })
      : undefined;

  return (
    <div className={styles.controlRow}>
      <Field
        label={component.label}
        {...(range && { hint: range })}
        {...(parseScalar(component, text) === undefined &&
          range && { error: range })}
      >
        {component.kind === "comment" ? (
          <textarea
            disabled={disabled}
            value={text}
            maxLength={4000}
            rows={3}
            onChange={(event) => change(event.target.value)}
          />
        ) : component.kind === "status" ? (
          <select
            disabled={disabled}
            value={text}
            onChange={(event) => change(event.target.value)}
          >
            <option value="">{t("empty")}</option>
            {component.options.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        ) : (
          <input
            disabled={disabled}
            type="text"
            inputMode="decimal"
            value={text}
            onChange={(event) => change(event.target.value.replace(",", "."))}
          />
        )}
      </Field>
      <ActionButton
        label={t("clear")}
        variant="secondary"
        disabled={disabled || !text}
        aria-label={`${t("clear")} ${component.label}`}
        onRun={() => change("")}
      />
    </div>
  );
}

function PhotoEditor({
  label,
  value,
  draft,
  disabled,
  busy,
  reusablePhotos,
  onPhotoError,
  change,
  upload,
}: {
  label: string;
  value: Value;
  draft: Draft | undefined;
  disabled: boolean;
  busy: boolean;
  reusablePhotos: ReusablePhoto[];
  onPhotoError: () => void;
  change: (value: Draft | undefined) => void;
  upload: (file: File, retry?: Upload) => Promise<void>;
}) {
  const t = useEmployeeText();
  const [fileError, setFileError] = useState<EmployeeTextKey>();
  const saved = Array.isArray(value) ? value : [];
  const pending = draft?.kind === "append" ? draft.uploads : [];
  const reused = draft?.kind === "append" ? (draft.reused ?? []) : [];
  const removed = draft?.kind === "remove" ? draft.photoIds : [];
  const pendingCount = pending.length + reused.length;
  const atLimit = saved.length + pendingCount >= 20;
  const usedIds = new Set([
    ...saved,
    ...reused.map(({ photoId }) => photoId),
    ...pending.map(({ photo }) => photo?.photoId),
  ]);
  const choices = reusablePhotos.filter(({ photoId }) => !usedIds.has(photoId));
  function changePending(uploads: Upload[], selected: ReusablePhoto[]) {
    change(
      uploads.length || selected.length
        ? { kind: "append", uploads, reused: selected }
        : undefined,
    );
  }

  return (
    <>
      <Field label={label} hint={t(atLimit ? "photoLimit" : "photoType")}>
        <input
          type="file"
          accept="image/jpeg,image/png"
          disabled={disabled || removed.length > 0 || atLimit}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            if (
              !["image/jpeg", "image/png"].includes(file.type) ||
              file.size < 1 ||
              file.size > 10 * 1024 * 1024
            ) {
              setFileError("photoType");
              return;
            }
            setFileError(undefined);
            void upload(file);
          }}
        />
      </Field>
      {choices.length > 0 && (
        <Field label={`${t("reusePhoto")} · ${label}`}>
          <select
            value=""
            disabled={disabled || removed.length > 0 || atLimit}
            onChange={(event) => {
              const photo = choices.find(
                ({ photoId }) => photoId === event.target.value,
              );
              if (photo) changePending(pending, [...reused, photo]);
            }}
          >
            <option value="">{t("choose")}</option>
            {choices.map(({ photoId, label }) => (
              <option key={photoId} value={photoId}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      )}
      {busy && <p role="status">{t("upload")}…</p>}
      {fileError && (
        <p role="alert" className={styles.missing}>
          {t(fileError)}
        </p>
      )}
      {saved.length > 0 && (
        <div className={styles.row}>
          <ActionButton
            label={t("clearPhotos")}
            variant="secondary"
            disabled={
              disabled || pendingCount > 0 || removed.length === saved.length
            }
            onRun={() => change({ kind: "remove", photoIds: saved, all: true })}
          />
          {removed.length > 0 && (
            <ActionButton
              label={t("undo")}
              variant="secondary"
              disabled={disabled}
              onRun={() => change(undefined)}
            />
          )}
        </div>
      )}
      <ul className={styles.photos}>
        {saved.map((photoId, index) => {
          const removing = removed.includes(photoId);
          const photoLabel = `${label} · ${t("photo")} ${index + 1}`;
          return (
            <li key={photoId}>
              <Photo
                photoId={photoId}
                label={photoLabel}
                onUnavailable={onPhotoError}
              />
              <ActionButton
                label={t(removing ? "undo" : "remove")}
                variant="secondary"
                aria-label={`${t(removing ? "undo" : "remove")} ${photoLabel}`}
                disabled={disabled || pendingCount > 0}
                onRun={() => {
                  const photoIds = removing
                    ? removed.filter((id) => id !== photoId)
                    : [...removed, photoId];
                  change(
                    photoIds.length
                      ? { kind: "remove", photoIds, all: false }
                      : undefined,
                  );
                }}
              />
            </li>
          );
        })}
        {reused.map((photo) => (
          <li key={photo.photoId}>
            <Photo
              photoId={photo.photoId}
              label={photo.label}
              onUnavailable={onPhotoError}
            />
            <ActionButton
              label={t("remove")}
              variant="secondary"
              aria-label={`${t("remove")} ${photo.label}`}
              disabled={disabled}
              onRun={() =>
                changePending(
                  pending,
                  reused.filter(({ photoId }) => photoId !== photo.photoId),
                )
              }
            />
          </li>
        ))}
        {pending.map((item) => (
          <li key={item.id}>
            {item.photo && uploadIsReady(item) ? (
              <Photo photoId={item.photo.photoId} label={item.file.name} />
            ) : (
              <span className={styles.text}>{item.file.name}</span>
            )}
            {item.photo && !uploadIsReady(item) && (
              <p role="alert">{t("photoExpired")}</p>
            )}
            {item.failed && <p>{t("expiredOrInvalidPhoto")}</p>}
            <div className={styles.row}>
              <ActionButton
                label={t("repairUpload")}
                disabled={disabled}
                variant="secondary"
                onRun={() => void upload(item.file, item)}
              />
              <ActionButton
                label={t("remove")}
                variant="secondary"
                disabled={disabled}
                aria-label={`${t("remove")} ${item.file.name}`}
                onRun={() => {
                  const uploads = pending.filter(({ id }) => id !== item.id);
                  changePending(uploads, reused);
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function Photo({
  photoId,
  label,
  onUnavailable,
}: {
  photoId: string;
  label: string;
  onUnavailable?: () => void;
}) {
  const t = useEmployeeText();
  const [failed, setFailed] = useState(false);
  return (
    <a
      className={styles.photo}
      href={photoUrl(photoId)}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
    >
      {failed ? (
        t("photoError")
      ) : (
        <img
          loading="lazy"
          src={photoUrl(photoId)}
          alt={label}
          onError={() => {
            setFailed(true);
            onUnavailable?.();
          }}
        />
      )}
    </a>
  );
}

export function ValueDisplay({
  component,
  value,
}: {
  component: AnswerComponent;
  value: Value;
}) {
  const t = useEmployeeText();
  if (value === null || (Array.isArray(value) && value.length === 0))
    return <span className={styles.muted}>{t("empty")}</span>;
  if (Array.isArray(value))
    return (
      <ul className={styles.photos}>
        {value.map((id, i) => (
          <li key={id}>
            <Photo
              photoId={id}
              label={`${component.label} · ${t("photo")} ${i + 1}`}
            />
          </li>
        ))}
      </ul>
    );
  const shown =
    component.kind === "status"
      ? (component.options.find((option) => option.id === value)?.label ??
        value)
      : typeof value === "number"
        ? `${points(value)} ${t("points")}`
        : value;
  return <span className={styles.text}>{shown}</span>;
}

export function DraftDisplay({
  component,
  draft,
}: Pick<Edit, "component" | "draft">) {
  const t = useEmployeeText();
  if (draft.kind === "scalar") {
    const value = parseScalar(component, draft.text);
    return value === undefined ? (
      <span className={styles.text}>{draft.text}</span>
    ) : (
      <ValueDisplay component={component} value={value} />
    );
  }
  if (draft.kind === "remove")
    return (
      <>
        <span>{t("removePhotos")}</span>
        <ValueDisplay component={component} value={draft.photoIds} />
      </>
    );
  return (
    <>
      <span>{t("append")}</span>
      <ul className={styles.photos}>
        {draft.reused?.map(({ photoId, label }) => (
          <li key={photoId}>
            <Photo photoId={photoId} label={label} />
          </li>
        ))}
        {draft.uploads.map((item) => (
          <li key={item.id}>
            {item.photo && uploadIsReady(item) ? (
              <Photo photoId={item.photo.photoId} label={item.file.name} />
            ) : (
              item.file.name
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
