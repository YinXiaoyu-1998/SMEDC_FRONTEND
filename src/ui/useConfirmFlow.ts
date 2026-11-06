import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

export type ConfirmFlowStatus =
  "idle" | "preparing" | "reviewing" | "submitting";

export interface ConfirmFlowOptions<Prepared, Result = void> {
  readonly prepare: () => Prepared | Promise<Prepared>;
  readonly submit: (prepared: Prepared) => Result | Promise<Result>;
  readonly onSuccess?: ((result: Result) => void) | undefined;
}

export interface ConfirmFlow<Prepared> {
  readonly status: ConfirmFlowStatus;
  readonly open: boolean;
  readonly prepared: Prepared | null;
  readonly error: unknown;
  readonly isPreparing: boolean;
  readonly isReviewing: boolean;
  readonly isSubmitting: boolean;
  readonly returnFocusRef: RefObject<HTMLElement | null>;
  readonly request: () => Promise<void>;
  readonly confirm: () => Promise<void>;
  readonly cancel: () => void;
  readonly reset: () => void;
  readonly clearError: () => void;
}

/**
 * 准备（只读）→ 等待用户确认 → 提交一次。
 * 状态与提交锁用 ref 同步维护：双击或连按回车时，第二次触发会在重新渲染前被挡下。
 */
export function useConfirmFlow<Prepared, Result = void>(
  options: ConfirmFlowOptions<Prepared, Result>,
): ConfirmFlow<Prepared> {
  const [status, setStatus] = useState<ConfirmFlowStatus>("idle");
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [error, setError] = useState<unknown>(null);

  const statusRef = useRef<ConfirmFlowStatus>("idle");
  const preparedRef = useRef<{ readonly value: Prepared } | null>(null);
  const generationRef = useRef(0);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const optionsRef = useLatest(options);

  const applyStatus = useCallback((next: ConfirmFlowStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const clearPrepared = useCallback(() => {
    preparedRef.current = null;
    setPrepared(null);
  }, []);

  const request = useCallback(async () => {
    if (statusRef.current !== "idle") return;

    // 记录触发按钮：准备期间按钮会 disabled，焦点可能移走，关闭弹窗后要能还回去
    const active = document.activeElement;
    if (active instanceof HTMLElement) {
      returnFocusRef.current = active;
    }

    const generation = generationRef.current + 1;
    generationRef.current = generation;
    setError(null);
    applyStatus("preparing");

    try {
      const value = await optionsRef.current.prepare();
      if (generation !== generationRef.current) return;
      preparedRef.current = { value };
      setPrepared(value);
      applyStatus("reviewing");
    } catch (caught) {
      if (generation !== generationRef.current) return;
      setError(caught);
      applyStatus("idle");
    }
  }, [applyStatus, optionsRef]);

  const confirm = useCallback(async () => {
    if (statusRef.current !== "reviewing") return;
    const entry = preparedRef.current;
    if (entry === null) return;

    applyStatus("submitting");
    setError(null);

    let result: Result;
    try {
      result = await optionsRef.current.submit(entry.value);
    } catch (caught) {
      // 失败后回到可确认状态，让用户看到错误并可显式重试
      setError(caught);
      applyStatus("reviewing");
      return;
    }

    clearPrepared();
    applyStatus("idle");

    try {
      optionsRef.current.onSuccess?.(result);
    } catch {
      // 提交已经成功，成功回调的异常不应把流程重新变成失败
    }
  }, [applyStatus, clearPrepared, optionsRef]);

  const cancel = useCallback(() => {
    if (statusRef.current === "submitting") return;
    generationRef.current += 1;
    clearPrepared();
    setError(null);
    applyStatus("idle");
  }, [applyStatus, clearPrepared]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(
    () => () => {
      // 卸载后让所有未完成的 prepare 结果失效
      generationRef.current += 1;
    },
    [],
  );

  const isPreparing = status === "preparing";
  const isReviewing = status === "reviewing";
  const isSubmitting = status === "submitting";

  return {
    status,
    open: isReviewing || isSubmitting,
    prepared,
    error,
    isPreparing,
    isReviewing,
    isSubmitting,
    returnFocusRef,
    request,
    confirm,
    cancel,
    reset: cancel,
    clearError,
  };
}

function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef<T>(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
