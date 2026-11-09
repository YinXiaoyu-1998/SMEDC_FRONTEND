import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";

import type {
  LedgerContextResponse,
  LedgerCoverageBody,
} from "@/api/generated/contract";
import {
  ledgerPdfUrl,
  prepareLedgerBundle,
  readLedgerContext,
  readLedgerCoverage,
  readLedgerRequest,
  requestLedgerDownloadUrl,
} from "@/features/ledger/api";
import { triggerBrowserDownload } from "@/features/ledger/download";
import {
  errorCodeOf,
  isConflictError,
  LedgerIssue,
  ledgerErrorKey,
} from "@/features/ledger/errors";
import {
  defaultFilter,
  parseScopeFilter,
  scopeKey,
  scopeToBody,
  scopeToSearchParams,
  validateFilter,
  type LedgerFilterDraft,
  type LedgerScope,
} from "@/features/ledger/filters";
import {
  displayOrder,
  isPendingTaskStatus,
  ledgerKey,
  limitIssues,
  mergeCoverage,
  reconcileSelection,
  removeSelected,
  selectPartition,
  selectPartitions,
  selectionOrder,
  summarize,
  type LedgerLimits,
  type LedgerPartition,
  type LedgerSelection,
  type PartitionRef,
  type SelectedPartition,
  type SelectionSummary,
} from "@/features/ledger/model";
import { revalidateSelection } from "@/features/ledger/revalidate";
import { useConfirmFlow, type ConfirmFlow } from "@/ui/useConfirmFlow";

const CONTEXT_QUERY_KEY = ["web-api", "ledger", "context"] as const;
const COVERAGE_QUERY_KEY = ["web-api", "ledger", "coverage"] as const;
const POLL_INTERVAL_MS = 2_500;
const EMPTY_ROWS: readonly LedgerPartition[] = [];
const FALLBACK_FILTER = defaultFilter();

export interface PreparedBundle {
  readonly selection: readonly PartitionRef[];
  readonly summary: SelectionSummary;
  readonly fingerprint: string;
  readonly idempotencyKey: string;
}

export interface BundleTask {
  readonly requestId: string;
  readonly status: string;
  readonly createdAt: number;
  readonly selection: readonly PartitionRef[];
  readonly errorCode: string | null;
  readonly expiresAt: string | null;
  readonly notice: "linkIssued" | null;
  readonly pollErrorKey: string | null;
  readonly lastPolledAt: number;
  readonly linking: boolean;
}

export interface LedgerConflict {
  readonly kind: "prepare" | "link";
  readonly code: string;
  readonly requestRef: string;
  readonly taskId: string | null;
}

export interface LedgerPreview {
  readonly item: PartitionRef;
  readonly nonce: number;
}

interface PageState {
  readonly key: string;
  readonly batch: number;
  readonly cursors: readonly (string | null)[];
}

export interface UseLedgerWorkspaceOptions {
  readonly context: LedgerContextResponse;
  readonly refreshContext: () => Promise<LedgerContextResponse>;
}

export interface LedgerWorkspace {
  readonly draft: LedgerFilterDraft;
  readonly setStoreName: (value: string) => void;
  readonly setStartDate: (value: string) => void;
  readonly setEndDate: (value: string) => void;
  readonly search: () => void;
  readonly filterIssueKey: string | null;
  readonly appliedScope: LedgerScope | null;
  readonly stores: readonly string[];
  readonly rows: readonly LedgerPartition[];
  readonly coverageLoading: boolean;
  readonly coverageErrorKey: string | null;
  readonly coverageError: unknown;
  readonly refetchCoverage: () => void;
  readonly nextCursor: string | null;
  readonly batch: number;
  readonly goPrevious: () => void;
  readonly goNext: () => void;
  readonly selected: LedgerSelection;
  readonly selectedList: readonly SelectedPartition[];
  readonly summary: SelectionSummary;
  readonly limitIssueList: ReturnType<typeof limitIssues>;
  readonly select: (item: LedgerPartition, checked: boolean) => void;
  readonly selectBatch: (
    items: readonly LedgerPartition[],
    checked: boolean,
  ) => void;
  readonly clearSelection: () => void;
  readonly removeSelectedKey: (key: string) => void;
  readonly preview: LedgerPreview | null;
  readonly previewFailed: boolean;
  readonly previewReady: boolean;
  readonly previewLoaded: () => void;
  readonly previewFailedNow: () => void;
  readonly openPreview: (item: LedgerPartition) => void;
  readonly closePreview: () => void;
  readonly retryPreview: () => void;
  readonly downloadSingle: (item: LedgerPartition) => void;
  readonly downloadedKeys: ReadonlySet<string>;
  readonly prepareFlow: ConfirmFlow<PreparedBundle>;
  readonly canPrepare: boolean;
  readonly freshPrepare: () => void;
  readonly tasks: readonly BundleTask[];
  readonly linkTask: (task: BundleTask) => void;
  readonly retryPoll: (task: BundleTask) => void;
  readonly conflict: LedgerConflict | null;
  readonly reloading: boolean;
  readonly conflictErrorKey: string | null;
  readonly reloadConflict: () => void;
  readonly resubmitConflict: () => void;
}

export function useLedgerContextQuery() {
  return useQuery({
    queryKey: CONTEXT_QUERY_KEY,
    queryFn: ({ signal }) => readLedgerContext(signal),
    retry: false,
    staleTime: 30_000,
  });
}

/**
 * 台账页的全部状态：筛选、游标分页、选择、预览、打包任务与冲突。
 * 选择只存内存；版本冲突时保留当前选择，等待用户显式处理。
 */
export function useLedgerWorkspace({
  context,
  refreshContext,
}: UseLedgerWorkspaceOptions): LedgerWorkspace {
  const limits: LedgerLimits = context.limits;
  const [searchParams, setSearchParams] = useSearchParams();
  const searchText = searchParams.toString();
  const parsed = useMemo(
    () =>
      parseScopeFilter(
        new URLSearchParams(searchText),
        limits,
        FALLBACK_FILTER,
      ),
    [searchText, limits],
  );
  const appliedSignature = useMemo(
    () => JSON.stringify(parsed.draft),
    [parsed],
  );
  const [draftState, setDraftState] = useState<{
    readonly signature: string;
    readonly draft: LedgerFilterDraft;
  }>(() => ({ signature: appliedSignature, draft: parsed.draft }));
  const draft =
    draftState.signature === appliedSignature ? draftState.draft : parsed.draft;
  const updateDraft = useCallback(
    (patch: Partial<LedgerFilterDraft>) => {
      setDraftState((previous) => {
        const current =
          previous.signature === appliedSignature
            ? previous.draft
            : parsed.draft;
        return { signature: appliedSignature, draft: { ...current, ...patch } };
      });
    },
    [appliedSignature, parsed.draft],
  );
  const setStoreName = useCallback(
    (value: string) => updateDraft({ storeName: value }),
    [updateDraft],
  );
  const setStartDate = useCallback(
    (value: string) => updateDraft({ startDate: value }),
    [updateDraft],
  );
  const setEndDate = useCallback(
    (value: string) => updateDraft({ endDate: value }),
    [updateDraft],
  );

  const [filterIssueKey, setFilterIssueKey] = useState<string | null>(null);
  const [searchNonce, setSearchNonce] = useState(0);
  const scope = parsed.scope;

  const coverageKeyBase =
    scope === null ? "none" : `${scopeKey(scope)}|${searchNonce}`;
  const [pageState, setPageState] = useState<PageState>(() => ({
    key: coverageKeyBase,
    batch: 0,
    cursors: [null],
  }));
  const effectivePage: PageState =
    pageState.key === coverageKeyBase
      ? pageState
      : { key: coverageKeyBase, batch: 0, cursors: [null] };
  const cursor = effectivePage.cursors[effectivePage.batch] ?? null;

  const coverageQuery = useQuery({
    queryKey: [...COVERAGE_QUERY_KEY, coverageKeyBase, cursor],
    enabled: scope !== null,
    retry: false,
    staleTime: 30_000,
    queryFn: ({ signal }) => {
      const body: LedgerCoverageBody = {
        ...(scope === null ? {} : { scope: scopeToBody(scope) }),
        ...(cursor === null ? {} : { cursor }),
      };
      return readLedgerCoverage(body, context.csrfToken, signal);
    },
  });

  const rows = coverageQuery.data?.partitions ?? EMPTY_ROWS;
  const nextCursor = coverageQuery.data?.nextCursor ?? null;
  const coverageErrorKey =
    coverageQuery.error === null || coverageQuery.error === undefined
      ? null
      : ledgerErrorKey(coverageQuery.error);

  const [storeHistory, setStoreHistory] = useState<readonly string[]>([]);
  const rememberStores = useCallback(() => {
    setStoreHistory((previous) => {
      const names = new Set(previous);
      let changed = false;
      for (const row of rows) {
        if (!names.has(row.storeName)) {
          names.add(row.storeName);
          changed = true;
        }
      }
      return changed ? [...names].sort() : previous;
    });
  }, [rows]);

  const search = useCallback(() => {
    const validation = validateFilter(draft, limits);
    if (!validation.ok) {
      setFilterIssueKey(validation.code);
      return;
    }
    setFilterIssueKey(null);
    rememberStores();
    const entries = scopeToSearchParams(validation.scope);
    const params = new URLSearchParams({ from: entries.from, to: entries.to });
    if (entries.store !== undefined) params.set("store", entries.store);
    setSearchParams(params, { replace: true });
    setSearchNonce((value) => value + 1);
  }, [draft, limits, rememberStores, setSearchParams]);

  const refetchCoverage = useCallback(() => {
    void coverageQuery.refetch();
  }, [coverageQuery]);

  const goPrevious = useCallback(() => {
    rememberStores();
    setPageState((previous) => {
      const base =
        previous.key === coverageKeyBase
          ? previous
          : { key: coverageKeyBase, batch: 0, cursors: [null] };
      if (base.batch === 0) return base;
      return { ...base, batch: base.batch - 1 };
    });
  }, [coverageKeyBase, rememberStores]);

  const goNext = useCallback(() => {
    if (nextCursor === null) return;
    rememberStores();
    setPageState((previous) => {
      const base =
        previous.key === coverageKeyBase
          ? previous
          : { key: coverageKeyBase, batch: 0, cursors: [null] };
      const cursors = [...base.cursors];
      cursors[base.batch + 1] = nextCursor;
      return { key: coverageKeyBase, batch: base.batch + 1, cursors };
    });
  }, [coverageKeyBase, nextCursor, rememberStores]);

  const stores = useMemo(() => {
    const names = new Set(storeHistory);
    for (const row of rows) names.add(row.storeName);
    return [...names].sort();
  }, [rows, storeHistory]);

  // 已选清单是草稿：服务端新返回的状态与大小只用于展示，提交前会整单复核
  const [selectionBase, setSelectionBase] = useState<LedgerSelection>(
    () => new Map(),
  );
  const selected = useMemo(
    () => mergeCoverage(selectionBase, rows),
    [selectionBase, rows],
  );
  const summary = useMemo(
    () => summarize(selected.values(), limits),
    [selected, limits],
  );
  const limitIssueList = useMemo(
    () => limitIssues(summary, limits),
    [summary, limits],
  );
  const selectedList = useMemo(
    () => displayOrder(selected.values()),
    [selected],
  );

  const select = useCallback(
    (item: LedgerPartition, checked: boolean) => {
      setSelectionBase(selectPartition(selected, item, checked));
    },
    [selected],
  );
  const selectBatch = useCallback(
    (items: readonly LedgerPartition[], checked: boolean) => {
      setSelectionBase(selectPartitions(selected, items, checked));
    },
    [selected],
  );
  const clearSelection = useCallback(() => {
    setSelectionBase(new Map());
  }, []);
  const removeSelectedKey = useCallback(
    (key: string) => {
      setSelectionBase(removeSelected(selected, key));
    },
    [selected],
  );

  const [preview, setPreview] = useState<LedgerPreview | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const openPreview = useCallback((item: LedgerPartition) => {
    setPreview({
      item: { storeName: item.storeName, purchaseDate: item.purchaseDate },
      nonce: 0,
    });
    setPreviewFailed(false);
    setPreviewReady(false);
  }, []);
  const closePreview = useCallback(() => {
    // 卸载 iframe 即释放本次预览，不保留 blob 地址或跨域内容
    setPreview(null);
    setPreviewFailed(false);
    setPreviewReady(false);
  }, []);
  const retryPreview = useCallback(() => {
    setPreview((previous) =>
      previous === null ? null : { ...previous, nonce: previous.nonce + 1 },
    );
    setPreviewFailed(false);
    setPreviewReady(false);
  }, []);
  const previewLoaded = useCallback(() => {
    setPreviewFailed(false);
    setPreviewReady(true);
  }, []);
  const previewFailedNow = useCallback(() => {
    setPreviewReady(false);
    setPreviewFailed(true);
  }, []);

  const [downloadedKeys, setDownloadedKeys] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const downloadSingle = useCallback((item: LedgerPartition) => {
    triggerBrowserDownload(ledgerPdfUrl(item, "attachment"));
    setDownloadedKeys((previous) => {
      const key = ledgerKey(item);
      if (previous.has(key)) return previous;
      const next = new Set(previous);
      next.add(key);
      return next;
    });
  }, []);

  const [tasks, setTasks] = useState<readonly BundleTask[]>([]);
  const updateTask = useCallback(
    (requestId: string, update: (task: BundleTask) => BundleTask) => {
      setTasks((previous) =>
        previous.map((task) =>
          task.requestId === requestId ? update(task) : task,
        ),
      );
    },
    [],
  );

  const pollTask = useCallback(
    async (requestId: string, signal: AbortSignal) => {
      try {
        const result = await readLedgerRequest(requestId, signal);
        if (signal.aborted) return;
        updateTask(requestId, (task) => ({
          ...task,
          status: result.status,
          errorCode: result.errorCode ?? null,
          lastPolledAt: Date.now(),
          pollErrorKey: null,
        }));
      } catch (error) {
        if (signal.aborted) return;
        updateTask(requestId, (task) => ({
          ...task,
          lastPolledAt: Date.now(),
          pollErrorKey: ledgerErrorKey(error),
        }));
      }
    },
    [updateTask],
  );

  // 轮询只在排队/打包中出现；终态、查询失败与页面卸载都会停止下一次调度。
  // 依赖只取“最早待查任务”的标识与时间，其他任务的状态变化不会打断在途请求。
  const dueTask = tasks
    .filter(
      (task) => isPendingTaskStatus(task.status) && task.pollErrorKey === null,
    )
    .reduce<BundleTask | null>((earliest, task) => {
      if (earliest === null) return task;
      return task.lastPolledAt < earliest.lastPolledAt ? task : earliest;
    }, null);
  const dueRequestId = dueTask?.requestId ?? null;
  const dueLastPolledAt = dueTask?.lastPolledAt ?? 0;

  useEffect(() => {
    if (dueRequestId === null) return;
    const controller = new AbortController();
    const delay =
      dueLastPolledAt === 0
        ? 0
        : Math.max(0, dueLastPolledAt + POLL_INTERVAL_MS - Date.now());
    const timer = window.setTimeout(() => {
      void pollTask(dueRequestId, controller.signal);
    }, delay);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [dueLastPolledAt, dueRequestId, pollTask]);

  const [conflict, setConflict] = useState<LedgerConflict | null>(null);
  const [reloading, setReloading] = useState(false);
  const [conflictErrorKey, setConflictErrorKey] = useState<string | null>(null);

  const submitBundle = useCallback(
    async (prepared: PreparedBundle): Promise<void> => {
      try {
        const response = await prepareLedgerBundle(
          {
            selection: prepared.selection.map((item) => ({
              storeName: item.storeName,
              purchaseDate: item.purchaseDate,
            })),
            idempotencyKey: prepared.idempotencyKey,
          },
          context.csrfToken,
        );
        const task: BundleTask = {
          requestId: response.requestId,
          status: response.status,
          createdAt: Date.now(),
          selection: prepared.selection,
          errorCode: null,
          expiresAt: null,
          notice: null,
          pollErrorKey: null,
          lastPolledAt: 0,
          linking: false,
        };
        setTasks((previous) => {
          const index = previous.findIndex(
            (item) => item.requestId === task.requestId,
          );
          if (index === -1) return [task, ...previous];
          const next = [...previous];
          const existing = next[index];
          next[index] =
            existing === undefined
              ? task
              : { ...task, createdAt: existing.createdAt };
          return next;
        });
      } catch (error) {
        if (isConflictError(error)) {
          setConflict({
            kind: "prepare",
            code: errorCodeOf(error) ?? "VERSION_CONFLICT",
            requestRef: prepared.idempotencyKey,
            taskId: null,
          });
          return;
        }
        throw error;
      }
    },
    [context.csrfToken],
  );

  const linkTask = useCallback(
    async (task: BundleTask): Promise<void> => {
      if (task.linking) return;
      updateTask(task.requestId, (previous) => ({
        ...previous,
        linking: true,
        errorCode: null,
      }));
      try {
        const result = await requestLedgerDownloadUrl(
          task.requestId,
          context.csrfToken,
        );
        updateTask(task.requestId, (previous) => ({
          ...previous,
          linking: false,
          expiresAt: result.expiresAt,
          notice: "linkIssued",
        }));
        triggerBrowserDownload(result.downloadUrl);
      } catch (error) {
        if (isConflictError(error)) {
          updateTask(task.requestId, (previous) => ({
            ...previous,
            linking: false,
          }));
          setConflict({
            kind: "link",
            code: errorCodeOf(error) ?? "VERSION_CONFLICT",
            requestRef: task.requestId,
            taskId: task.requestId,
          });
          return;
        }
        updateTask(task.requestId, (previous) => ({
          ...previous,
          linking: false,
          errorCode: errorCodeOf(error) ?? "INTERNAL_ERROR",
        }));
      }
    },
    [context.csrfToken, updateTask],
  );

  const retryPoll = useCallback(
    (task: BundleTask) => {
      updateTask(task.requestId, (previous) => ({
        ...previous,
        pollErrorKey: null,
        lastPolledAt: 0,
      }));
    },
    [updateTask],
  );

  const attemptRef = useRef<{ fingerprint: string; key: string } | null>(null);

  const prepare = useCallback(async (): Promise<PreparedBundle> => {
    const snapshot = [...selected.values()];
    if (snapshot.length === 0) throw new LedgerIssue("LEDGER_SELECTION_EMPTY");
    const partitions = await revalidateSelection(snapshot, limits, {
      csrfToken: context.csrfToken,
    });
    const reconciled = reconcileSelection(selected, partitions);
    setSelectionBase(reconciled);
    const nextSummary = summarize(reconciled.values(), limits);
    if (!nextSummary.allowed) throw new LedgerIssue("LEDGER_SELECTION_INVALID");
    const ordered = selectionOrder(reconciled.values());
    const refs = ordered.map((item) => ({
      storeName: item.storeName,
      purchaseDate: item.purchaseDate,
    }));
    const fingerprint = JSON.stringify(refs);
    const existing = attemptRef.current;
    const idempotencyKey =
      existing !== null && existing.fingerprint === fingerprint
        ? existing.key
        : createIdempotencyKey();
    attemptRef.current = { fingerprint, key: idempotencyKey };
    return {
      selection: refs,
      summary: nextSummary,
      fingerprint,
      idempotencyKey,
    };
  }, [context.csrfToken, limits, selected]);

  const prepareFlow = useConfirmFlow<PreparedBundle, void>({
    prepare,
    submit: submitBundle,
  });

  const freshPrepare = useCallback(() => {
    attemptRef.current = null;
    void prepareFlow.request();
  }, [prepareFlow]);

  const reloadConflict = useCallback(async () => {
    if (conflict === null || reloading) return;
    setReloading(true);
    setConflictErrorKey(null);
    try {
      const nextContext = await refreshContext();
      const snapshot = [...selected.values()];
      if (snapshot.length > 0) {
        const partitions = await revalidateSelection(snapshot, limits, {
          csrfToken: nextContext.csrfToken,
        });
        setSelectionBase(reconcileSelection(selected, partitions));
      }
      await coverageQuery.refetch();
      attemptRef.current = null;
      setConflict(null);
    } catch (error) {
      setConflictErrorKey(ledgerErrorKey(error));
    } finally {
      setReloading(false);
    }
  }, [conflict, coverageQuery, limits, refreshContext, reloading, selected]);

  const resubmitConflict = useCallback(() => {
    const current = conflict;
    if (current === null) return;
    if (current.kind === "prepare") {
      setConflict(null);
      attemptRef.current = null;
      void prepareFlow.request();
      return;
    }
    const task = tasks.find((item) => item.requestId === current.taskId);
    setConflict(null);
    if (task !== undefined) void linkTask(task);
  }, [conflict, linkTask, prepareFlow, tasks]);

  const canPrepare = summary.allowed && conflict === null;

  return {
    draft,
    setStoreName,
    setStartDate,
    setEndDate,
    search,
    filterIssueKey,
    appliedScope: scope,
    stores,
    rows,
    coverageLoading: scope !== null && coverageQuery.isPending,
    coverageErrorKey,
    coverageError: coverageQuery.error,
    refetchCoverage,
    nextCursor,
    batch: effectivePage.batch,
    goPrevious,
    goNext,
    selected,
    selectedList,
    summary,
    limitIssueList,
    select,
    selectBatch,
    clearSelection,
    removeSelectedKey,
    preview,
    previewFailed,
    previewReady,
    previewLoaded,
    previewFailedNow,
    openPreview,
    closePreview,
    retryPreview,
    downloadSingle,
    downloadedKeys,
    prepareFlow,
    canPrepare,
    freshPrepare,
    tasks,
    linkTask: (task) => {
      void linkTask(task);
    },
    retryPoll,
    conflict,
    reloading,
    conflictErrorKey,
    reloadConflict: () => {
      void reloadConflict();
    },
    resubmitConflict,
  };
}

function createIdempotencyKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `ledger-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
