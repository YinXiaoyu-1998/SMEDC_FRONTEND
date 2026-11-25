import { useEffect, useState } from "react";

import { ActionButton } from "@/ui/ActionButton";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { useConfirmFlow } from "@/ui/useConfirmFlow";

import {
  beginWrite,
  canReplay,
  isConflict,
  previewReplacement,
  replaceSheet,
  voidSheet,
  type Sheet,
} from "./employeeApi";
import {
  errorText,
  useEmployeeText,
  type EmployeeTextKey,
} from "./employeeText";
import { SheetTarget } from "./SheetTarget";
import styles from "./Employee.module.css";

export function SheetActions({
  sheet,
  csrfToken,
  disabled,
  onBusy,
  onChange,
  onVoid,
  onError,
}: {
  sheet: Sheet;
  csrfToken: string;
  disabled: boolean;
  onBusy: (busy: boolean) => void;
  onChange: () => void;
  onVoid: () => void;
  onError: (error: unknown) => void;
}) {
  const t = useEmployeeText();
  const [problem, setProblem] = useState<EmployeeTextKey>();
  const [stale, setStale] = useState(false);
  const replace = useConfirmFlow({
    prepare: async () => {
      try {
        const preview = await previewReplacement(sheet.sheetId);
        if (
          preview.expectedSheetRevision !== sheet.sheetRevision ||
          preview.sourceTemplateVersionId !== sheet.templateVersionId ||
          preview.sheetId !== sheet.sheetId
        ) {
          setProblem("stalePreview");
          onChange();
          return null;
        }
        const titles = new Map(
          preview.questionTitles?.map((item) => [item.questionId, item]),
        );
        if (
          preview.clearedQuestionIds.some(
            (id) =>
              !titles.get(id)?.sourceTitle || !titles.get(id)?.targetTitle,
          ) ||
          preview.addedQuestionIds.some((id) => !titles.get(id)?.targetTitle) ||
          preview.removedQuestionIds.some((id) => !titles.get(id)?.sourceTitle)
        ) {
          setProblem("replacementTitlesUnavailable");
          return null;
        }
        return { preview, ...beginWrite(), titles, questions: sheet.questions };
      } catch (error) {
        setProblem(isConflict(error) ? "noReplacement" : errorText(error));
        onError(error);
        return null;
      }
    },
    submit: async (prepared) => {
      if (prepared === null) return false;
      const { preview, requestId, startedAt } = prepared;
      const {
        sourceTemplateVersionId,
        targetTemplateVersionId,
        expectedActiveRevision,
        expectedSheetRevision,
      } = preview;
      if (!canReplay(startedAt)) {
        setStale(true);
        return false;
      }
      try {
        await replaceSheet(
          preview.sheetId,
          {
            sourceTemplateVersionId,
            targetTemplateVersionId,
            expectedActiveRevision,
            expectedSheetRevision,
            requestId,
          },
          csrfToken,
        );
        return true;
      } catch (error) {
        onError(error);
        if (!isConflict(error)) throw error;
        setStale(true);
        return false;
      }
    },
    onSuccess: (applied) => {
      if (applied) onChange();
    },
  });
  const voidFlow = useConfirmFlow({
    prepare: () => ({
      sheetId: sheet.sheetId,
      expectedSheetRevision: sheet.sheetRevision,
      ...beginWrite(),
    }),
    submit: async ({ sheetId, startedAt, ...body }) => {
      if (!canReplay(startedAt)) {
        setStale(true);
        return false;
      }
      try {
        await voidSheet(sheetId, body, csrfToken);
        return true;
      } catch (error) {
        onError(error);
        if (!isConflict(error)) throw error;
        setStale(true);
        return false;
      }
    },
    onSuccess: (applied) => {
      if (applied) onVoid();
    },
  });

  const working = replace.status !== "idle" || voidFlow.status !== "idle";
  useEffect(() => onBusy(working), [onBusy, working]);
  useEffect(() => {
    if (replace.isReviewing && replace.prepared === null) replace.cancel();
  }, [replace]);

  const prepared = replace.prepared;
  const groups =
    prepared &&
    ([
      ["retained", prepared.preview.retainedQuestionIds],
      ["cleared", prepared.preview.clearedQuestionIds],
      ["added", prepared.preview.addedQuestionIds],
      ["removed", prepared.preview.removedQuestionIds],
    ] as const);
  return (
    <>
      <div className={styles.row}>
        <ActionButton
          label={t("replace")}
          variant="secondary"
          disabled={disabled || working || stale}
          busy={replace.isPreparing}
          onRun={() => {
            setProblem(undefined);
            void replace.request();
          }}
        />
        <ActionButton
          label={t("void")}
          variant="secondary"
          disabled={disabled || working || stale}
          onRun={() => {
            setProblem(undefined);
            void voidFlow.request();
          }}
        />
        {stale && (
          <ActionButton
            label={t("refresh")}
            variant="secondary"
            onRun={() => {
              setStale(false);
              onChange();
            }}
          />
        )}
      </div>
      {problem && <p role="alert">{t(problem)}</p>}
      {stale && <p role="alert">{t("stalePreview")}</p>}
      {prepared && (
        <ConfirmDialog
          flow={replace}
          title={`${t("replace")} · ${sheet.templateTitle}`}
          description={t("replaceDescription")}
          confirmLabel={t("confirmReplace")}
          cancelLabel={t("cancel")}
          error={replace.error ? new Error(t(errorText(replace.error))) : null}
        >
          <SheetTarget sheet={sheet} />
          <p className={styles.identifier}>
            {t("sheetId")} <code>{sheet.sheetId}</code>
          </p>
          <div className={styles.columns}>
            {groups?.map(([label, ids]) => (
              <div key={label}>
                <h3>{t(label)}</h3>
                {ids.length === 0 ? (
                  <p>{t("noItems")}</p>
                ) : (
                  <ul>
                    {ids.map((id) => {
                      const titles = prepared.titles.get(id);
                      const local = prepared.questions.find(
                        (question) => question.questionId === id,
                      )?.title;
                      const title =
                        titles?.sourceTitle &&
                        titles.targetTitle &&
                        titles.sourceTitle !== titles.targetTitle
                          ? `${titles.sourceTitle} → ${titles.targetTitle}`
                          : (titles?.targetTitle ??
                            titles?.sourceTitle ??
                            local ??
                            t("unnamedQuestion"));
                      return <li key={id}>{title}</li>;
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </ConfirmDialog>
      )}
      <ConfirmDialog
        flow={voidFlow}
        title={`${t("void")} · ${sheet.templateTitle}`}
        description={t("voidDescription")}
        confirmLabel={t("confirmVoid")}
        cancelLabel={t("cancel")}
        error={voidFlow.error ? new Error(t(errorText(voidFlow.error))) : null}
      >
        <SheetTarget sheet={sheet} />
        <p className={styles.identifier}>
          {t("sheetId")} <code>{sheet.sheetId}</code>
        </p>
      </ConfirmDialog>
    </>
  );
}
