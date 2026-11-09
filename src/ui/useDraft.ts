import { useCallback, useMemo, useState } from "react";

import { stableSerialize } from "@/ui/stableSerialize";

export type DraftStatus = "pristine" | "dirty" | "conflicting";

export interface UseDraftResult<T> {
  readonly draft: T;
  readonly setDraft: (next: T | ((previous: T) => T)) => void;
  readonly reset: () => void;
  readonly isDirty: boolean;
  readonly status: DraftStatus;
  readonly markConflicting: () => void;
  readonly acknowledgeConflict: () => void;
}

/**
 * 保存按钮只在 dirty 时可用；conflicting 必须先由用户显式选择处理方式，
 * 避免把冲突状态误当成普通草稿直接提交。
 */
export function canSaveDraft(status: DraftStatus): boolean {
  return status === "dirty";
}

export function useDraft<T>(
  saved: T,
  draft: T,
  normalize: (value: T) => unknown,
): UseDraftResult<T> {
  const [current, setCurrent] = useState<T>(draft);
  const [conflicting, setConflicting] = useState(false);

  const savedSnapshot = useMemo(
    () => stableSerialize(normalize(saved)),
    [normalize, saved],
  );
  const draftSnapshot = useMemo(
    () => stableSerialize(normalize(current)),
    [current, normalize],
  );

  const isDirty = savedSnapshot !== draftSnapshot;
  const status: DraftStatus = conflicting
    ? "conflicting"
    : isDirty
      ? "dirty"
      : "pristine";

  const setDraft = useCallback((next: T | ((previous: T) => T)) => {
    setCurrent((previous) =>
      typeof next === "function" ? (next as (value: T) => T)(previous) : next,
    );
  }, []);

  const reset = useCallback(() => {
    // saved prop 变化只更新比较基线，不覆盖用户草稿；丢弃草稿必须显式 reset
    setCurrent(saved);
    setConflicting(false);
  }, [saved]);

  const markConflicting = useCallback(() => {
    setConflicting(true);
  }, []);

  const acknowledgeConflict = useCallback(() => {
    setConflicting(false);
  }, []);

  return {
    draft: current,
    setDraft,
    reset,
    isDirty,
    status,
    markConflicting,
    acknowledgeConflict,
  };
}
