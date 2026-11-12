import { useEffect, useRef, useState } from "react";

import { isVersionConflict } from "@/api/permissions";
import { useText } from "@/i18n/useText";
import { useConfirmFlow, type ConfirmFlow } from "@/ui/useConfirmFlow";

import type {
  Confirmation,
  RebaseChoice,
  RebaseDecision,
  RebaseInput,
  RebaseOutcome,
} from "./diff";
import { permissionsErrorKey } from "./errorKeys";

export interface DraftWriteResult {
  readonly authorizationVersion: string;
}

export interface DraftBaseline<Draft> {
  readonly snapshot: Draft;
  readonly version: string;
}

export interface PreparedSave<Draft> {
  readonly confirmation: Confirmation;
  readonly draft: Draft;
  readonly expectedVersion: string;
}

export interface DraftSaveOptions<Draft, Result extends DraftWriteResult> {
  /** 打开对象时冻结的快照与版本；编辑期间不随后台刷新替换 */
  readonly baseline: DraftBaseline<Draft>;
  readonly validate: (draft: Draft, baseline: Draft) => string | null;
  /** 语义差异；同时决定保存按钮是否可用与确认弹窗内容 */
  readonly confirmation: (draft: Draft, baseline: Draft) => Confirmation;
  readonly submit: (draft: Draft, expectedVersion: string) => Promise<Result>;
  /** 保存成功后作为新基线的草稿（通常来自服务端响应） */
  readonly nextBaseline: (result: Result, draft: Draft) => Draft;
  readonly reload: () => Promise<DraftBaseline<Draft>>;
  /** 版本冲突时把本地改动重新应用到最新快照；缺省表示整体以草稿为准 */
  readonly rebase?: (input: RebaseInput<Draft>) => RebaseOutcome<Draft>;
  readonly onSaved?: (result: Result, draft: Draft) => void;
}

export interface DraftSave<Draft> {
  readonly draft: Draft;
  readonly setDraft: (next: Draft | ((previous: Draft) => Draft)) => void;
  readonly baseline: Draft;
  readonly isDirty: boolean;
  readonly validationError: string | null;
  readonly canSave: boolean;
  readonly disabledReason: string | undefined;
  readonly error: unknown;
  readonly errorMessage: string | null;
  readonly saving: boolean;
  readonly conflict: boolean;
  readonly conflictConfirmation: Confirmation | null;
  readonly conflictChoices: readonly RebaseChoice[];
  readonly conflictDecisions: Readonly<Record<string, RebaseDecision>>;
  readonly conflictCanApply: boolean;
  readonly conflictApplyReason: string | undefined;
  readonly chooseConflict: (key: string, decision: RebaseDecision) => void;
  readonly loadServer: () => void;
  readonly applyMine: () => void;
  readonly conflictReloading: boolean;
  readonly conflictError: unknown;
  readonly retryConflict: () => void;
  readonly savedNotice: string | null;
  readonly flow: ConfirmFlow<PreparedSave<Draft>>;
  readonly requestSave: () => void;
  readonly reset: () => void;
}

/**
 * 单个表单的「冻结基线 → 语义差异 → 确认 → 提交一次」状态机。
 *
 * - 基线固定在打开对象时读取的快照与版本；后台刷新不会替换正在编辑的草稿，
 *   也不会把新版本号偷偷带进旧载荷。
 * - 确认时捕获摘要、完整草稿与 expectedVersion，提交只使用该次捕获。
 * - 409 不重试、不覆盖：保留草稿，读取最新快照，用户要么载入服务器值，
 *   要么以最新快照为基线重新应用自己的改动，再生成一次新确认。
 */
export function useDraftSave<Draft, Result extends DraftWriteResult>(
  options: DraftSaveOptions<Draft, Result>,
): DraftSave<Draft> {
  const { t } = useText();
  const optionsRef = useRef(options);
  // 最新一次渲染的选项只在下一次事件/提交时读取，写入 ref 放到 effect 里，
  // 避免在渲染期间修改 ref。
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const [draftState, setDraftState] = useState<Draft>(
    options.baseline.snapshot,
  );
  const [baseline, setBaseline] = useState<DraftBaseline<Draft>>(
    options.baseline,
  );
  const [error, setError] = useState<unknown>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [conflictPending, setConflictPending] = useState(false);
  const [conflictServer, setConflictServer] =
    useState<DraftBaseline<Draft> | null>(null);
  const [conflictError, setConflictError] = useState<unknown>(null);
  const [conflictReloading, setConflictReloading] = useState(false);
  const [conflictChoices, setConflictChoices] = useState<
    readonly RebaseChoice[]
  >([]);
  const [conflictDecisions, setConflictDecisions] = useState<
    Readonly<Record<string, RebaseDecision>>
  >({});

  const draftRef = useRef(draftState);
  const baselineRef = useRef(baseline);
  const overrideRef = useRef<Draft | null>(null);
  const notesRef = useRef<readonly string[]>([]);

  const applyDraft = (next: Draft) => {
    draftRef.current = next;
    setDraftState(next);
  };

  const applyBaseline = (next: DraftBaseline<Draft>) => {
    baselineRef.current = next;
    setBaseline(next);
  };

  const setDraft = (next: Draft | ((previous: Draft) => Draft)) => {
    const value =
      typeof next === "function"
        ? (next as (previous: Draft) => Draft)(draftRef.current)
        : next;
    applyDraft(value);
  };

  const buildConfirmation = (draft: Draft, base: Draft): Confirmation => {
    const confirmation = optionsRef.current.confirmation(draft, base);
    const notes = notesRef.current;
    notesRef.current = [];
    if (notes.length === 0) return confirmation;
    return {
      ...confirmation,
      impact:
        confirmation.impact === undefined
          ? notes.join(" ")
          : `${confirmation.impact} ${notes.join(" ")}`,
    };
  };

  const flow = useConfirmFlow<PreparedSave<Draft>, Result | null>({
    prepare: () => {
      const draft = overrideRef.current ?? draftRef.current;
      overrideRef.current = null;
      const base = baselineRef.current;
      return {
        confirmation: buildConfirmation(draft, base.snapshot),
        draft,
        expectedVersion: base.version,
      };
    },
    submit: async (prepared) => {
      setError(null);
      setSavedNotice(null);
      try {
        const result = await optionsRef.current.submit(
          prepared.draft,
          prepared.expectedVersion,
        );
        const nextDraft = optionsRef.current.nextBaseline(
          result,
          prepared.draft,
        );
        applyDraft(nextDraft);
        applyBaseline({
          snapshot: nextDraft,
          version: result.authorizationVersion,
        });
        setConflictPending(false);
        setConflictServer(null);
        setConflictChoices([]);
        setConflictDecisions({});
        setConflictError(null);
        setSavedNotice(t("permissions.saved"));
        optionsRef.current.onSaved?.(result, nextDraft);
        return result;
      } catch (caught) {
        if (!isVersionConflict(caught)) {
          setError(caught);
          return null;
        }
        setConflictPending(true);
        setConflictChoices([]);
        setConflictDecisions({});
        setConflictError(null);
        try {
          const server = await optionsRef.current.reload();
          setConflictServer(server);
        } catch (reloadError) {
          setConflictError(reloadError);
        }
        return null;
      }
    },
  });

  const confirmation = options.confirmation(draftState, baseline.snapshot);
  const isDirty = confirmation.diff.length > 0;
  const validationKey = options.validate(draftState, baseline.snapshot);
  const validationError = validationKey === null ? null : t(validationKey);
  const conflict = conflictPending;
  const conflictConfirmation =
    conflictServer === null
      ? null
      : options.confirmation(draftState, conflictServer.snapshot);
  const conflictReady = conflictChoices.every(
    (choice) => conflictDecisions[choice.key] !== undefined,
  );

  const requestSave = () => {
    if (flow.status !== "idle") return;
    if (conflict) return;
    if (validationKey !== null) return;
    if (!isDirty) return;
    setError(null);
    setSavedNotice(null);
    void flow.request();
  };

  const readLatest = async () => {
    setConflictReloading(true);
    setConflictError(null);
    try {
      const server = await optionsRef.current.reload();
      setConflictServer(server);
      setConflictPending(true);
    } catch (caught) {
      setConflictError(caught);
    } finally {
      setConflictReloading(false);
    }
  };

  const retryConflict = () => {
    if (conflictReloading) return;
    void readLatest();
  };

  const loadServer = () => {
    if (conflictServer === null) return;
    applyBaseline(conflictServer);
    applyDraft(conflictServer.snapshot);
    setConflictPending(false);
    setConflictServer(null);
    setConflictChoices([]);
    setConflictDecisions({});
    setConflictError(null);
    notesRef.current = [];
    flow.cancel();
    setSavedNotice(t("permissions.conflict.loaded"));
  };

  const chooseConflict = (key: string, decision: RebaseDecision) => {
    setConflictDecisions((previous) => ({ ...previous, [key]: decision }));
  };

  const applyMine = () => {
    const server = conflictServer;
    if (server === null) return;
    if (optionsRef.current.rebase === undefined) {
      applyBaseline(server);
      setConflictPending(false);
      setConflictServer(null);
      setConflictChoices([]);
      setConflictDecisions({});
      notesRef.current = [];
      overrideRef.current = draftRef.current;
      void flow.request();
      return;
    }
    const outcome = optionsRef.current.rebase({
      draft: draftRef.current,
      baseline: baselineRef.current.snapshot,
      server: server.snapshot,
      decisions: conflictDecisions,
    });
    if (outcome.kind === "choice") {
      setConflictChoices(outcome.choices);
      return;
    }
    applyBaseline(server);
    applyDraft(outcome.draft);
    setConflictPending(false);
    setConflictServer(null);
    setConflictChoices([]);
    setConflictDecisions({});
    setConflictError(null);
    notesRef.current = outcome.notes;
    const merged = optionsRef.current.confirmation(
      outcome.draft,
      server.snapshot,
    );
    if (merged.diff.length === 0) {
      notesRef.current = [];
      setSavedNotice(t("permissions.conflict.nothingApplied"));
      return;
    }
    overrideRef.current = outcome.draft;
    void flow.request();
  };

  const reset = () => {
    applyDraft(baselineRef.current.snapshot);
    setConflictPending(false);
    setConflictServer(null);
    setConflictChoices([]);
    setConflictDecisions({});
    setConflictError(null);
    notesRef.current = [];
  };

  const canSave =
    !conflict && isDirty && validationKey === null && flow.status === "idle";
  const disabledReason = conflict
    ? t("permissions.saveBlocked.conflict")
    : !isDirty
      ? t("permissions.noChange")
      : (validationError ?? undefined);

  return {
    draft: draftState,
    setDraft,
    baseline: baseline.snapshot,
    isDirty,
    validationError,
    canSave,
    disabledReason,
    error,
    errorMessage: error === null ? null : t(permissionsErrorKey(error)),
    saving: flow.isSubmitting,
    conflict,
    conflictConfirmation,
    conflictChoices,
    conflictDecisions,
    conflictCanApply: conflictReady,
    conflictApplyReason: conflictReady
      ? undefined
      : t("permissions.conflict.decideFirst"),
    chooseConflict,
    loadServer,
    applyMine,
    conflictReloading,
    conflictError,
    retryConflict,
    savedNotice,
    flow,
    requestSave,
    reset,
  };
}
