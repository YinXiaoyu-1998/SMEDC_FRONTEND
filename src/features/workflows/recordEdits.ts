import type { WorkflowBundle } from "@/features/workflows/api";
import type { WorkflowChange } from "@/features/workflows/model";

export type RecordOperation<T> =
  | { readonly kind: "add"; readonly value: T }
  | { readonly kind: "edit"; readonly original: T; readonly value: T }
  | { readonly kind: "remove"; readonly original: T };

export interface WorkflowEdit {
  readonly before: unknown;
  readonly after: unknown;
  readonly current: (bundle: WorkflowBundle) => unknown;
  readonly change: (bundle: WorkflowBundle) => WorkflowChange;
  readonly review?: (bundle: WorkflowBundle) => {
    readonly before: unknown;
    readonly after: unknown;
  };
}

export type WorkflowEditResult =
  | { readonly status: "saved" }
  | {
      readonly status: "conflict" | "impact";
      readonly before: unknown;
      readonly after: unknown;
      readonly impact?: unknown;
      readonly confirm: () => Promise<WorkflowEditResult>;
    };

export type SubmitWorkflowEdit = (
  edit: WorkflowEdit,
) => Promise<WorkflowEditResult>;

export class WorkflowEditError extends Error {
  readonly details?: string;

  constructor(message: string, details?: string) {
    super(message);
    if (details !== undefined) this.details = details;
  }
}

export function listWorkflowEdit<T>({
  operation,
  keyFor,
  itemsFor,
  changeFor,
}: {
  readonly operation: RecordOperation<T>;
  readonly keyFor: (item: T) => string;
  readonly itemsFor: (bundle: WorkflowBundle) => readonly T[];
  readonly changeFor: (bundle: WorkflowBundle, items: T[]) => WorkflowChange;
}): WorkflowEdit {
  const original = operation.kind === "add" ? null : operation.original;
  const value = operation.kind === "remove" ? null : operation.value;
  const targetKey = keyFor(
    operation.kind === "add" ? operation.value : operation.original,
  );

  return {
    before: original,
    after: value,
    current: (bundle) =>
      itemsFor(bundle).find((item) => keyFor(item) === targetKey) ?? null,
    change: (bundle) => {
      const items = itemsFor(bundle);
      const index = items.findIndex((item) => keyFor(item) === targetKey);
      if (operation.kind !== "add" && index === -1) {
        throw new WorkflowEditError("recordMissing");
      }
      if (
        value !== null &&
        items.some(
          (item, position) =>
            keyFor(item) === keyFor(value) &&
            (operation.kind === "add" || position !== index),
        )
      ) {
        throw new WorkflowEditError("recordDuplicate");
      }
      const next = [...items];
      if (operation.kind === "remove") next.splice(index, 1);
      else if (operation.kind === "edit") next[index] = operation.value;
      else next.push(operation.value);
      return changeFor(bundle, next);
    },
  };
}
