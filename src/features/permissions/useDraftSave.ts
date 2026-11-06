import { useEffect, useRef, useState } from "react";

import { isVersionConflict } from "@/api/permissions";
import { useText } from "@/i18n/useText";
import type { ConflictField } from "@/ui/ConflictPanel";
import { useConfirmFlow, type ConfirmFlow } from "@/ui/useConfirmFlow";
import { canSaveDraft, useDraft, type DraftStatus } from "@/ui/useDraft";
import { stableSerialize } from "@/ui/stableSerialize";

import { permissionsErrorKey } from "./errorKeys";

export interface DraftWriteResult {
  readonly authorizationVersion: string;
}

export interface DraftSaveOptions<Draft, Result extends DraftWriteResult> {
  readonly saved: Draft;
  readonly expectedVersion: string;
  readonly normalize: (value: Draft) => unknown;
  readonly validate: (draft: Draft) => string | null;
  readonly describe: (draft: Draft) => string;
  readonly submit: (draft: Draft, expectedVersion: string) => Promise<Result>;
  readonly draftFromResult: (result: Result, draft: Draft) => Draft;
  readonly reload: () => Promise<Draft>;
  readonly conflictFields: (
    draft: Draft,
    saved: Draft,
  ) => readonly ConflictField[];
  readonly onSaved?: ((result: Result) => void) | undefined;
}

export interface DraftSave<Draft> {
  readonly draft: Draft;
  readonly setDraft: (next: Draft | ((previous: Draft) => Draft)) => void;
  readonly status: DraftStatus;
  readonly isDirty: boolean;
  readonly validationError: string | null;
  readonly canSave: boolean;
  readonly disabledReason: string | undefined;
  readonly error: unknown;
  readonly errorMessage: string | null;
  readonly saving: boolean;
  readonly conflict: boolean;
  readonly conflictFields: readonly ConflictField[];
  readonly conflictReloading: boolean;
  readonly savedNotice: string | null;
  readonly flow: ConfirmFlow<string>;
  readonly requestSave: () => void;
  readonly reloadFromServer: () => void;
  readonly resubmit: () => void;
}

/**
 * 单个表单的“准备 → 摘要 → 确认 → 提交”状态机。
 *
 * - 草稿只在内存；保存按钮只由 dirty + 校验通过决定。
 * - 版本冲突不会重试：先保留草稿，冲突面板要求用户在“重新加载”与“用我的改动重新提交”间明确选择。
 * - 重新提交前重新读取服务端并让用户再次确认摘要，避免把旧版本号或旧差异直接写回。
 */
export function useDraftSave<Draft, Result extends DraftWriteResult>(
  options: DraftSaveOptions<Draft, Result>,
): DraftSave<Draft> {
  const { t } = useText();
  const state = useDraft<Draft>(
    options.saved,
    options.saved,
    options.normalize,
  );
  const [error, setError] = useState<unknown>(null);
  const [conflict, setConflict] = useState(false);
  const [conflictReloading, setConflictReloading] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [resubmitToken, setResubmitToken] = useState(0);
  const pendingResubmit = useRef(false);
  const keepDraft = useRef(false);
  // 用归一化后的值而不是对象引用判断“服务端快照是否变化”：
  // 调用方每次渲染都会生成结构相同的新对象，按引用比较会造成无限重置。
  const savedSnapshot = stableSerialize(options.normalize(options.saved));
  const previousSaved = useRef(savedSnapshot);

  const validationKey = options.validate(state.draft);
  const validationError = validationKey === null ? null : t(validationKey);

  // 服务端快照更新时同步比较基线；冲突期间绝不覆盖用户草稿。
  useEffect(() => {
    if (previousSaved.current === savedSnapshot) return;
    previousSaved.current = savedSnapshot;
    if (keepDraft.current) {
      keepDraft.current = false;
      return;
    }
    if (conflict) return;
    state.reset();
  }, [savedSnapshot, conflict, state]);

  const flow = useConfirmFlow<string, Result | null>({
    prepare: () => options.describe(state.draft),
    submit: async () => {
      setError(null);
      setSavedNotice(null);
      try {
        const result = await options.submit(
          state.draft,
          options.expectedVersion,
        );
        const nextDraft = options.draftFromResult(result, state.draft);
        state.setDraft(nextDraft);
        options.onSaved?.(result);
        setSavedNotice(t("permissions.saved"));
        return result;
      } catch (caught) {
        if (isVersionConflict(caught)) {
          state.markConflicting();
          setConflict(true);
          try {
            await options.reload();
          } catch (reloadError) {
            setError(reloadError);
          }
          return null;
        }
        setError(caught);
        return null;
      }
    },
    onSuccess: () => undefined,
  });

  const requestSave = () => {
    if (flow.status !== "idle") return;
    if (conflict) return;
    if (validationKey !== null) return;
    if (!canSaveDraft(state.status)) return;
    setError(null);
    setSavedNotice(null);
    void flow.request();
  };

  const reloadFromServer = () => {
    if (conflictReloading) return;
    setConflictReloading(true);
    setError(null);
    void options
      .reload()
      .then((latest) => {
        state.setDraft(latest);
        state.acknowledgeConflict();
        setConflict(false);
      })
      .catch((caught: unknown) => {
        setError(caught);
      })
      .finally(() => {
        setConflictReloading(false);
      });
  };

  const resubmit = () => {
    if (!conflict || conflictReloading) return;
    pendingResubmit.current = true;
    keepDraft.current = true;
    setConflictReloading(true);
    setError(null);
    void options
      .reload()
      .then(() => {
        state.acknowledgeConflict();
        setConflict(false);
        setResubmitToken((token) => token + 1);
      })
      .catch((caught: unknown) => {
        pendingResubmit.current = false;
        keepDraft.current = false;
        setError(caught);
      })
      .finally(() => {
        setConflictReloading(false);
      });
  };

  useEffect(() => {
    if (!pendingResubmit.current) return;
    pendingResubmit.current = false;
    // 重新读取后再走一遍确认，保证用户看到的是新版本下的摘要
    void flow.request();
  }, [flow, resubmitToken]);

  const canSave =
    !conflict && canSaveDraft(state.status) && validationKey === null;
  const disabledReason = conflict
    ? t("permissions.saveBlocked.conflict")
    : state.status !== "dirty"
      ? t("permissions.noChange")
      : (validationError ?? undefined);

  return {
    draft: state.draft,
    setDraft: state.setDraft,
    status: state.status,
    isDirty: state.isDirty,
    validationError,
    canSave,
    disabledReason,
    error,
    errorMessage: error === null ? null : t(permissionsErrorKey(error)),
    saving: flow.isSubmitting,
    conflict,
    conflictFields: conflict
      ? options.conflictFields(state.draft, options.saved)
      : [],
    conflictReloading,
    savedNotice,
    flow,
    requestSave,
    reloadFromServer,
    resubmit,
  };
}
