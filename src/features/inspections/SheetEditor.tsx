import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { WebApiError } from "@/api/client";
import { ActionButton } from "@/ui/ActionButton";

import {
  beginWrite,
  canReplay,
  isAccessError,
  isConflict,
  isUncertain,
  readSheet,
  save,
  uploadPhoto,
  type Patch,
  type Scope,
  type Sheet,
} from "./employeeApi";
import {
  changeFor,
  latestAnswer,
  parseScalar,
  points,
  uploadIsReady,
  type Draft,
  type Edit,
  type ReusablePhoto,
  type Upload,
} from "./employeeDraft";
import {
  errorText,
  useEmployeeText,
  type EmployeeTextKey,
} from "./employeeText";
import { DraftDisplay, QuestionEditor, ValueDisplay } from "./QuestionEditor";
import { SheetActions } from "./SheetActions";
import styles from "./Employee.module.css";

const QUESTIONS_PER_SECTION = 20;

export function Summary({
  data,
}: {
  data: Pick<Sheet, "progress" | "scoreSummary">;
}) {
  const t = useEmployeeText();
  const score = data.scoreSummary;
  return (
    <div className={styles.row}>
      <span className={styles.pill}>{t(data.progress)}</span>
      {score && (
        <span className={styles.muted}>
          {t("subtotal")} {points(score.earnedTenths)} /{" "}
          {points(score.maxTenths)} {t("points")}
          {score.rate !== null && ` · ${Math.round(score.rate * 100)}%`}
          {` · ${t("scored")} ${score.scoredCount} / ${score.scoreCount}`}
        </span>
      )}
    </div>
  );
}

export function SheetEditor({
  sheetId,
  identityKey,
  scope,
  canFill,
  canReusePhotos,
  reusablePhotos,
  rememberPhotos,
  forgetPhotos,
  csrfToken,
  onClose,
  onChange,
  onVoid,
}: {
  sheetId: string;
  identityKey: string;
  scope: Scope;
  canFill: boolean;
  canReusePhotos: boolean;
  reusablePhotos: ReusablePhoto[];
  rememberPhotos: (sheet: Sheet) => void;
  forgetPhotos: () => void;
  csrfToken: string;
  onClose: () => void;
  onChange: () => void;
  onVoid: () => void;
}) {
  const t = useEmployeeText();
  const remote = useQuery({
    queryKey: [
      "inspection-employee",
      identityKey,
      "sheet",
      scope,
      sheetId,
      canFill,
    ],
    queryFn: ({ signal }) => readSheet(sheetId, signal),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    gcTime: 0,
    retry: false,
  });
  const [visible, setVisible] = useState(QUESTIONS_PER_SECTION);
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [orphaned, setOrphaned] = useState<Edit[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string>();
  const [error, setError] = useState<unknown>();
  const [review, setReview] = useState<"stale" | "compare">();
  const [notice, setNotice] = useState<EmployeeTextKey>();
  const [attempt, setAttempt] = useState<{ patch: Patch; startedAt: number }>();
  const [actionBusy, setActionBusy] = useState(false);
  const flight = useRef(false);
  const sheet = remote.data;
  const entries = Object.values(edits);
  const changes = entries.flatMap((edit) => changeFor(edit) ?? []);
  const blocked = isAccessError(error) || isAccessError(remote.error);
  const disabled =
    busy || uploading !== undefined || actionBusy || remote.isFetching;
  const showPhotosError =
    error instanceof WebApiError &&
    (error.code === "INSPECTION_PHOTO_NOT_AVAILABLE" ||
      (error.code === "INSPECTION_INVALID" &&
        entries.some(({ draft }) => draft.kind === "append")));
  const invalid = entries.some(
    ({ draft, component }) =>
      (draft.kind === "scalar" &&
        parseScalar(component, draft.text) === undefined) ||
      (draft.kind === "append" &&
        draft.uploads.some((item) => !uploadIsReady(item))),
  );
  const isSameScope =
    sheet &&
    sheet.enterpriseKey === scope.enterpriseKey &&
    sheet.storeId === scope.storeId &&
    sheet.inspectionDate === scope.inspectionDate;

  const photoScopeUncertain =
    !!remote.error ||
    blocked ||
    showPhotosError ||
    isUncertain(error) ||
    isConflict(error);
  useEffect(() => {
    if (photoScopeUncertain || (sheet && !isSameScope)) {
      forgetPhotos();
    } else if (canReusePhotos && sheet && isSameScope) {
      rememberPhotos(sheet);
    }
  }, [
    photoScopeUncertain,
    canReusePhotos,
    isSameScope,
    sheet,
    forgetPhotos,
    rememberPhotos,
  ]);

  function updateEdit(edit: Edit, draft: Draft | undefined) {
    const id = edit.component.componentId;
    setEdits((previous) => {
      const next = { ...previous };
      if (draft) next[id] = { ...edit, draft };
      else delete next[id];
      return next;
    });
    setNotice(undefined);
    setError(undefined);
  }

  async function upload(edit: Edit, file: File, previous?: Upload) {
    if (flight.current || disabled || review || attempt) return;
    flight.current = true;
    setUploading(edit.component.componentId);
    const previousDraft =
      edit.draft.kind === "append"
        ? edit.draft
        : { kind: "append" as const, uploads: [] };
    const existing = previousDraft.uploads;
    const request =
      previous?.failed && canReplay(previous.startedAt)
        ? previous
        : { id: crypto.randomUUID(), file, startedAt: new Date().getTime() };
    let result: Upload = { ...request, failed: false };
    try {
      result = {
        ...result,
        photo: await uploadPhoto(scope, request.id, file, csrfToken),
      };
    } catch (caught) {
      result = { ...result, failed: isUncertain(caught) };
      updateEdit(edit, {
        ...previousDraft,
        uploads: [...existing.filter(({ id }) => id !== previous?.id), result],
      });
      if (caught instanceof WebApiError && caught.status === 404) {
        const current = await remote.refetch();
        if (!isAccessError(current.error)) {
          setError(unavailablePhotoError());
          if (current.data?.sheetRevision !== sheet?.sheetRevision)
            setReview("stale");
          onChange();
          return;
        }
      }
      setError(caught);
      if (isAccessError(caught)) onChange();
      return;
    } finally {
      setUploading(undefined);
      flight.current = false;
    }
    updateEdit(edit, {
      ...previousDraft,
      uploads: [...existing.filter(({ id }) => id !== previous?.id), result],
    });
  }

  async function saveDraft() {
    if (!sheet || flight.current || disabled || review || blocked) return;
    const { requestId, startedAt } = beginWrite();
    const request = attempt ?? {
      patch: {
        sheetId,
        templateVersionId: sheet.templateVersionId,
        changes,
        requestId,
      },
      startedAt,
    };
    if (!canReplay(request.startedAt)) {
      setAttempt(undefined);
      setReview("stale");
      return;
    }
    if (!attempt && (invalid || changes.length === 0 || changes.length > 50))
      return;
    flight.current = true;
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    setAttempt(request);
    try {
      await save(request.patch, csrfToken);
      setAttempt(undefined);
      setEdits({});
      setNotice("saved");
      await remote.refetch();
      onChange();
    } catch (caught) {
      if (!isUncertain(caught)) setAttempt(undefined);
      if (isConflict(caught)) setReview("stale");
      // The same generic 404 covers an expired attachment and an inaccessible sheet.
      // Read the selected sheet before treating this failure as lost access.
      if (
        caught instanceof WebApiError &&
        caught.status === 404 &&
        request.patch.changes.some((change) => change.op === "appendPhotos")
      ) {
        const current = await remote.refetch();
        if (!isAccessError(current.error)) {
          setError(unavailablePhotoError());
          if (current.data?.sheetRevision !== sheet.sheetRevision)
            setReview("stale");
          onChange();
          return;
        }
      }
      setError(caught);
      if (isAccessError(caught)) {
        setEdits({});
        setOrphaned([]);
        onChange();
      }
    } finally {
      setBusy(false);
      flight.current = false;
    }
  }

  async function reload() {
    setError(undefined);
    const result = await remote.refetch();
    if (result.isSuccess) {
      setAttempt(undefined);
      setReview(entries.length ? "compare" : undefined);
    }
  }

  function reconcile() {
    if (!sheet) return;
    const next: Record<string, Edit> = {};
    const unmatched: Edit[] = [];
    for (const edit of entries) {
      const current = latestAnswer(edit, sheet);
      if (current === undefined) {
        unmatched.push(edit);
        continue;
      }
      const updated = { ...edit, answer: current };
      if (
        updated.draft.kind === "scalar" &&
        parseScalar(updated.component, updated.draft.text) === current.value
      )
        continue;
      if (updated.draft.kind === "remove") {
        const saved = Array.isArray(current.value) ? current.value : [];
        if (!updated.draft.photoIds.some((id) => saved.includes(id))) continue;
      }
      next[edit.component.componentId] = updated;
    }
    setOrphaned((previous) => [...previous, ...unmatched]);
    setEdits(next);
    setReview(undefined);
  }

  function discardDraft() {
    setEdits({});
    setOrphaned([]);
    setAttempt(undefined);
    setError(undefined);
    setReview(undefined);
  }

  return (
    <section className={styles.editor}>
      <div className={styles.row}>
        <ActionButton
          label={t("close")}
          variant="secondary"
          disabled={busy || (actionBusy && !blocked)}
          onRun={onClose}
        />
        {!canFill && <span className={styles.pill}>{t("readOnly")}</span>}
      </div>
      {blocked ? (
        <p role="alert">{t("blocked")}</p>
      ) : remote.isPending ? (
        <p role="status">{t("loading")}</p>
      ) : !sheet || !isSameScope ? (
        <div className={styles.row}>
          <p role="alert">
            {t(remote.error ? errorText(remote.error) : "unavailable")}
          </p>
          <ActionButton
            label={t("retry")}
            variant="secondary"
            busy={remote.isFetching}
            onRun={() => void reload()}
          />
        </div>
      ) : (
        <>
          <header className={styles.sheetHeader}>
            <div>
              <h2>{sheet.name ?? sheet.templateTitle}</h2>
              {sheet.name !== null && <p>{sheet.templateTitle}</p>}
              <Summary data={sheet} />
              {sheet.missingRequiredCount > 0 && (
                <p className={styles.missing}>
                  {t("missing", { count: sheet.missingRequiredCount })}
                </p>
              )}
            </div>
            <dl className={styles.metadata}>
              <dt>{t("sheetId")}</dt>
              <dd>
                <code>{sheet.sheetId}</code>
              </dd>
              <dt>{t("templateVersion")}</dt>
              <dd>
                <code>{sheet.templateVersionId}</code>
              </dd>
              <dt>{t("sheetRevision")}</dt>
              <dd>{sheet.sheetRevision}</dd>
            </dl>
          </header>

          {canFill && (
            <SheetActions
              sheet={sheet}
              csrfToken={csrfToken}
              disabled={
                disabled ||
                entries.length > 0 ||
                orphaned.length > 0 ||
                !!review ||
                !!remote.error
              }
              onBusy={setActionBusy}
              onChange={() => {
                void reload();
                onChange();
              }}
              onVoid={onVoid}
              onError={(caught) => {
                if (isAccessError(caught)) {
                  setError(caught);
                  onChange();
                }
              }}
            />
          )}
          {review && <p role="alert">{t("conflict")}</p>}
          {!review && error != null && (
            <p role="alert">
              {t(showPhotosError ? "expiredOrInvalidPhoto" : errorText(error))}
            </p>
          )}
          {remote.error && <p role="alert">{t(errorText(remote.error))}</p>}
          {notice && <p role="status">{t(notice)}</p>}
          {review === "stale" || remote.error || (!review && error != null) ? (
            <ActionButton
              label={t("refresh")}
              variant="secondary"
              busy={remote.isFetching}
              onRun={() => void reload()}
            />
          ) : null}
          {review === "compare" && (
            <section className={styles.review}>
              {entries.map((edit) => {
                const current = latestAnswer(edit, sheet);
                return (
                  <div
                    className={styles.answer}
                    key={edit.component.componentId}
                  >
                    <h3>
                      {edit.question.title} · {edit.component.label}
                    </h3>
                    {current ? (
                      <div className={styles.columns}>
                        <div>
                          <h4>{t("current")}</h4>
                          <ValueDisplay
                            component={edit.component}
                            value={current.value}
                          />
                        </div>
                        <div>
                          <h4>{t("proposed")}</h4>
                          <DraftDisplay
                            component={edit.component}
                            draft={edit.draft}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <p>{t("revisedQuestion")}</p>
                        <DraftDisplay
                          component={edit.component}
                          draft={edit.draft}
                        />
                      </>
                    )}
                  </div>
                );
              })}
              <ActionButton label={t("reconcile")} onRun={reconcile} />
            </section>
          )}
          {orphaned.length > 0 && (
            <section className={styles.review}>
              <h3>{t("proposed")}</h3>
              <p>{t("revisedQuestion")}</p>
              {orphaned.map((edit, index) => (
                <div
                  key={`${edit.component.componentId}:${index}`}
                  className={styles.answer}
                >
                  <h4>
                    {edit.question.title} · {edit.component.label}
                  </h4>
                  <DraftDisplay component={edit.component} draft={edit.draft} />
                  <ActionButton
                    label={t("releaseDraft")}
                    variant="secondary"
                    onRun={() =>
                      setOrphaned((previous) =>
                        previous.filter((_, i) => i !== index),
                      )
                    }
                  />
                </div>
              ))}
            </section>
          )}
          {canFill && (
            <div className={styles.row}>
              <ActionButton
                label={t("save")}
                busy={busy}
                disabled={
                  disabled ||
                  !!review ||
                  !!remote.error ||
                  (!attempt &&
                    (invalid || changes.length === 0 || changes.length > 50))
                }
                onRun={() => void saveDraft()}
              />
              {entries.length > 0 && !attempt && (
                <ActionButton
                  label={t("discard")}
                  disabled={disabled}
                  variant="secondary"
                  onRun={discardDraft}
                />
              )}
              {changes.length > 50 && (
                <p className={styles.missing}>{t("changesLimit")}</p>
              )}
            </div>
          )}
          <ol className={styles.questions}>
            {sheet.questions.slice(0, visible).map((question) => (
              <QuestionEditor
                key={question.questionId}
                question={question}
                edits={edits}
                missing={
                  new Set(
                    sheet.missingRequired
                      .filter((item) => item.questionId === question.questionId)
                      .map((item) => item.componentId),
                  )
                }
                canFill={canFill}
                disabled={disabled || !!review || !!attempt || !!remote.error}
                uploading={uploading}
                reusablePhotos={photoScopeUncertain ? [] : reusablePhotos}
                onPhotoError={forgetPhotos}
                onEdit={updateEdit}
                onUpload={upload}
              />
            ))}
          </ol>
          {visible < sheet.questions.length && (
            <ActionButton
              label={t("moreQuestions")}
              variant="secondary"
              onRun={() => setVisible((count) => count + QUESTIONS_PER_SECTION)}
            />
          )}
        </>
      )}
    </section>
  );
}

function unavailablePhotoError() {
  return new WebApiError({
    status: 400,
    code: "INSPECTION_PHOTO_NOT_AVAILABLE",
    message: "A pending photo is unavailable",
  });
}
