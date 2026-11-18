import { useId, useRef, useState } from "react";
import type { ReactNode } from "react";

import { WorkflowEditDialog } from "@/features/workflows/WorkflowEditDialog";
import type {
  RecordOperation,
  SubmitWorkflowEdit,
  WorkflowEdit,
} from "@/features/workflows/recordEdits";
import { useWorkflowText } from "@/features/workflows/text";
import { ActionButton } from "@/ui/ActionButton";
import { AdminIcon } from "@/ui/AdminIcon";
import { stableSerialize } from "@/ui/stableSerialize";

import styles from "@/features/workflows/WorkflowRecords.module.css";

export function RecordDetails({
  fields,
}: {
  readonly fields: readonly {
    readonly label: string;
    readonly value: ReactNode;
  }[];
}) {
  return (
    <dl className={styles.details}>
      {fields.map(({ label, value }) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>
            {value === null || value === undefined || value === ""
              ? "—"
              : value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export interface WorkflowRecordListProps<T> {
  readonly title: string;
  readonly items: readonly T[];
  readonly keyFor: (item: T) => string;
  readonly labelFor: (item: T) => string;
  readonly details: (item: T) => ReactNode;
  readonly create: () => T;
  readonly fields: (
    item: T,
    onChange: (item: T) => void,
    original: T | undefined,
  ) => ReactNode;
  readonly editFor: (operation: RecordOperation<T>) => WorkflowEdit;
  readonly submitEdit: SubmitWorkflowEdit;
  readonly validate?: (item: T, original: T | undefined) => string | undefined;
  readonly addBlockedReason?: string | undefined;
  readonly removeBlockedReason?: (item: T) => string | undefined;
  readonly canEdit?: (item: T) => boolean;
  readonly canRemove?: (item: T) => boolean;
  readonly removeLabel?: string;
  readonly removeConfirmLabel?: string;
  readonly removeHelp?: string;
  readonly disabled?: boolean;
}

export function WorkflowRecordList<T>({
  title,
  items,
  keyFor,
  labelFor,
  details,
  create,
  fields,
  editFor,
  submitEdit,
  validate,
  addBlockedReason,
  removeBlockedReason,
  canEdit,
  canRemove,
  removeLabel,
  removeConfirmLabel,
  removeHelp,
  disabled = false,
}: WorkflowRecordListProps<T>) {
  const { w } = useWorkflowText();
  const titleId = useId();
  const section = useRef<HTMLElement | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const [operation, setOperation] = useState<RecordOperation<T> | null>(null);
  const removeText = removeLabel ?? w("remove");

  const open = (operation: RecordOperation<T>) => {
    trigger.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setOperation(operation);
  };

  const original = operation?.kind === "edit" ? operation.original : undefined;
  const invalid =
    operation === null || operation.kind === "remove"
      ? undefined
      : validate?.(operation.value, original);
  const unchanged =
    operation?.kind === "edit" &&
    stableSerialize(operation.original) === stableSerialize(operation.value);

  return (
    <section
      ref={section}
      tabIndex={-1}
      aria-labelledby={titleId}
      className={styles.list}
    >
      <div className={styles.heading}>
        <h3 id={titleId}>{title}</h3>
        <ActionButton
          label={w("add")}
          icon={<AdminIcon name="plus" />}
          variant="secondary"
          disabled={disabled || addBlockedReason !== undefined}
          onRun={() => open({ kind: "add", value: create() })}
        />
      </div>
      {addBlockedReason === undefined ? null : (
        <p className={styles.hint}>{addBlockedReason}</p>
      )}
      {items.length === 0 ? (
        <p className={styles.hint}>{w("empty")}</p>
      ) : (
        <ul className={styles.items}>
          {items.map((item) => (
            <li key={keyFor(item)} className={styles.row}>
              {details(item)}
              <div className={styles.rowActions}>
                {canEdit?.(item) === false ? null : (
                  <ActionButton
                    label={w("recordEdit")}
                    aria-label={`${w("recordEdit")} ${labelFor(item)}`}
                    variant="secondary"
                    disabled={disabled}
                    onRun={() =>
                      open({ kind: "edit", original: item, value: item })
                    }
                  />
                )}
                {canRemove?.(item) === false ? null : (
                  <ActionButton
                    label={removeText}
                    aria-label={`${removeText} ${labelFor(item)}`}
                    className={styles.remove}
                    variant="ghost"
                    disabled={disabled}
                    onRun={() => open({ kind: "remove", original: item })}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {operation === null ? null : (
        <WorkflowEditDialog
          title={`${operation.kind === "add" ? w("add") : operation.kind === "edit" ? w("recordEdit") : removeText} · ${title}`}
          actionLabel={
            operation.kind === "remove"
              ? (removeConfirmLabel ?? w("recordConfirmRemove"))
              : w("recordSave")
          }
          disabled={
            operation.kind === "remove"
              ? removeBlockedReason?.(operation.original) !== undefined
              : invalid !== undefined || unchanged
          }
          onClose={() => setOperation(null)}
          onSubmit={() => submitEdit(editFor(operation))}
          fallbackFocus={() =>
            trigger.current?.isConnected ? trigger.current : section.current
          }
        >
          {operation.kind === "remove" ? (
            <div className={styles.list}>
              {details(operation.original)}
              <p>
                {removeBlockedReason?.(operation.original) ??
                  removeHelp ??
                  w("recordRemoveHelp")}
              </p>
            </div>
          ) : (
            <>
              {fields(
                operation.value,
                (value) => setOperation({ ...operation, value }),
                original,
              )}
              {invalid === undefined ? null : (
                <p className={styles.hint}>{invalid}</p>
              )}
            </>
          )}
        </WorkflowEditDialog>
      )}
    </section>
  );
}
