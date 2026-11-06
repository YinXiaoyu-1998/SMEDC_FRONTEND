import type { ReactNode } from "react";

import { useText } from "@/i18n/useText";
import { ActionButton } from "@/ui/ActionButton";
import type { ButtonVariant } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { ConflictPanel } from "@/ui/ConflictPanel";
import { Field } from "@/ui/Field";
import { useConfirmFlow } from "@/ui/useConfirmFlow";

import styles from "./Permissions.module.css";
import { usePermissionsScope } from "./scope";
import type { DraftSave } from "./useDraftSave";

export interface LevelOption {
  readonly value: number | null;
  readonly label: string;
}

interface LevelSelectProps {
  readonly value: number | null;
  readonly onChange: (next: number | null) => void;
  readonly disabled?: boolean;
  readonly id?: string;
}

export function LevelSelect({
  value,
  onChange,
  disabled = false,
  id,
}: LevelSelectProps) {
  const { t } = useText();
  return (
    <select
      id={id}
      value={value === null ? "" : String(value)}
      disabled={disabled}
      onChange={(event) => {
        onChange(event.target.value === "" ? null : Number(event.target.value));
      }}
    >
      <option value="">{t("permissions.unset")}</option>
      {[0, 1, 2, 3].map((level) => (
        <option key={level} value={String(level)}>
          {level}
        </option>
      ))}
    </select>
  );
}

export interface ChecklistOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

interface ChecklistProps {
  readonly legend: string;
  readonly options: readonly ChecklistOption[];
  readonly selected: readonly string[];
  readonly onChange: (next: string[]) => void;
  readonly disabled?: boolean;
}

export function Checklist({
  legend,
  options,
  selected,
  onChange,
  disabled = false,
}: ChecklistProps) {
  const toggle = (value: string, checked: boolean) => {
    onChange(
      checked
        ? [...selected, value]
        : selected.filter((item) => item !== value),
    );
  };

  return (
    <fieldset className={styles.fieldset} disabled={disabled}>
      <legend>{legend}</legend>
      {options.length === 0 ? (
        <p className={styles.hint}>{legend}</p>
      ) : (
        options.map((option) => (
          <label className={styles.check} key={option.value}>
            <input
              type="checkbox"
              value={option.value}
              checked={selected.includes(option.value)}
              disabled={option.disabled === true}
              onChange={(event) => {
                toggle(option.value, event.target.checked);
              }}
            />
            <span>{option.label}</span>
          </label>
        ))
      )}
    </fieldset>
  );
}

interface RetireCheckboxProps {
  readonly checked: boolean;
  readonly onChange: (next: boolean) => void;
  readonly disabled?: boolean;
}

export function RetireCheckbox({
  checked,
  onChange,
  disabled = false,
}: RetireCheckboxProps) {
  const { t } = useText();
  return (
    <label className={styles.check}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.checked);
        }}
      />
      <span>{t("permissions.retire")}</span>
    </label>
  );
}

interface NameFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly hint?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly maxLength?: number;
}

export function NameField({
  label,
  value,
  onChange,
  hint,
  required = false,
  disabled = false,
  maxLength = 255,
}: NameFieldProps) {
  return (
    <Field
      label={label}
      {...(hint === undefined ? {} : { hint })}
      required={required}
    >
      <input
        type="text"
        maxLength={maxLength}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    </Field>
  );
}

interface DraftFeedbackProps {
  readonly save: Pick<
    DraftSave<unknown>,
    "errorMessage" | "savedNotice" | "validationError" | "isDirty"
  >;
}

export function DraftFeedback({ save }: DraftFeedbackProps) {
  return (
    <div className={styles.feedback}>
      {save.validationError !== null && save.isDirty ? (
        <p className={styles.error} role="status">
          {save.validationError}
        </p>
      ) : null}
      {save.errorMessage !== null ? (
        <p className={styles.error} role="alert">
          {save.errorMessage}
        </p>
      ) : null}
      {save.savedNotice !== null ? (
        <p className={styles.status} role="status">
          {save.savedNotice}
        </p>
      ) : null}
    </div>
  );
}

interface SaveButtonProps<Draft> {
  readonly save: DraftSave<Draft>;
  readonly label?: string;
  readonly disabled?: boolean;
  readonly disabledReason?: string;
}

export function SaveButton<Draft>({
  save,
  label,
  disabled = false,
  disabledReason,
}: SaveButtonProps<Draft>) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const reason = disabledReason ?? save.disabledReason;
  return (
    <ActionButton
      label={label ?? t("permissions.save")}
      busy={save.saving}
      disabled={disabled || scope.busy || !save.canSave}
      {...(reason === undefined ? {} : { disabledReason: reason })}
      onRun={save.requestSave}
    />
  );
}

interface DraftDialogsProps<Draft> {
  readonly save: DraftSave<Draft>;
  readonly title?: string;
}

export function DraftDialogs<Draft>({ save, title }: DraftDialogsProps<Draft>) {
  const { t } = useText();
  return (
    <>
      <ConfirmDialog
        flow={save.flow}
        title={title ?? t("permissions.confirm.title")}
        description={save.flow.prepared ?? ""}
        confirmLabel={t("permissions.confirm.action")}
        cancelLabel={t("permissions.cancel")}
      />
      {save.conflict ? (
        <ConflictPanel
          fields={save.conflictFields}
          onReload={save.reloadFromServer}
          onResubmit={save.resubmit}
          reloading={save.conflictReloading}
        />
      ) : null}
    </>
  );
}

interface ConfirmActionProps {
  readonly label: string;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly onConfirm: () => void;
  readonly variant?: ButtonVariant;
  readonly disabled?: boolean;
  readonly disabledReason?: string;
  readonly className?: string;
}

/** 非保存类确认（撤权、删范围、切换文档）统一走同一套弹窗与焦点恢复。 */
export function ConfirmAction({
  label,
  title,
  description,
  confirmLabel,
  onConfirm,
  variant = "secondary",
  disabled = false,
  disabledReason,
  className,
}: ConfirmActionProps) {
  const { t } = useText();
  const flow = useConfirmFlow<void, void>({
    prepare: () => undefined,
    submit: () => {
      onConfirm();
    },
  });

  return (
    <>
      <ActionButton
        label={label}
        variant={variant}
        disabled={disabled}
        {...(disabledReason === undefined ? {} : { disabledReason })}
        {...(className === undefined ? {} : { className })}
        onRun={() => {
          void flow.request();
        }}
      />
      <ConfirmDialog
        flow={flow}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        cancelLabel={t("permissions.cancel")}
      />
    </>
  );
}

export function SectionNote({ children }: { readonly children: ReactNode }) {
  return <p className={styles.hint}>{children}</p>;
}
