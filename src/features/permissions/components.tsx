import type { ReactNode } from "react";

import { useText } from "@/i18n/useText";
import { ActionButton } from "@/ui/ActionButton";
import { Field } from "@/ui/Field";

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
  const { t } = useText();
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
        <p className={styles.hint}>{t("permissions.empty")}</p>
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

interface SearchInputProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly placeholder?: string;
}

export function SearchInput({
  label,
  value,
  onChange,
  placeholder,
}: SearchInputProps) {
  return (
    <div className={styles.searchField}>
      <Field label={label}>
        <input
          type="search"
          value={value}
          maxLength={256}
          autoComplete="off"
          {...(placeholder === undefined ? {} : { placeholder })}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />
      </Field>
    </div>
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

export function SaveButton<Draft>({
  save,
  label,
  disabled = false,
  disabledReason,
}: {
  readonly save: DraftSave<Draft>;
  readonly label?: string;
  readonly disabled?: boolean;
  readonly disabledReason?: string;
}) {
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

export function SectionNote({ children }: { readonly children: ReactNode }) {
  return <p className={styles.sectionNote}>{children}</p>;
}
