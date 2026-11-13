import { useId, useState } from "react";
import type { ReactNode } from "react";

import { AdminIcon } from "@/ui/AdminIcon";
import { ActionButton } from "@/ui/ActionButton";
import { Field } from "@/ui/Field";
import type {
  MailConfiguration,
  SourceAccount,
  SourceIdentity,
  WorkflowStore,
} from "@/features/workflows/model";
import { selectVisible } from "@/features/workflows/model";
import {
  storeOptions,
  withMail,
  withSource,
} from "@/features/workflows/formValues";
import { useWorkflowText } from "@/features/workflows/text";

import styles from "@/features/workflows/Page.module.css";

function fieldExtras(props: {
  readonly hint?: string | undefined;
  readonly error?: string | undefined;
  readonly required?: boolean | undefined;
}): { hint?: string; error?: string; required?: boolean } {
  return {
    ...(props.hint === undefined ? {} : { hint: props.hint }),
    ...(props.error === undefined ? {} : { error: props.error }),
    ...(props.required === true ? { required: true } : {}),
  };
}

export interface TextFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly hint?: string | undefined;
  readonly error?: string | undefined;
  readonly required?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly maxLength?: number | undefined;
  readonly multiline?: boolean | undefined;
  readonly rows?: number | undefined;
  readonly type?: "text" | "number" | undefined;
  readonly min?: number | undefined;
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  error,
  required,
  disabled = false,
  maxLength,
  multiline = false,
  rows = 4,
  type = "text",
  min,
}: TextFieldProps) {
  const control = multiline ? (
    <textarea
      value={value}
      rows={rows}
      disabled={disabled}
      {...(maxLength === undefined ? {} : { maxLength })}
      onChange={(event) => onChange(event.target.value)}
    />
  ) : (
    <input
      type={type}
      value={value}
      disabled={disabled}
      {...(maxLength === undefined ? {} : { maxLength })}
      {...(min === undefined ? {} : { min })}
      onChange={(event) => onChange(event.target.value)}
    />
  );

  return (
    <Field label={label} {...fieldExtras({ hint, error, required })}>
      {control}
    </Field>
  );
}

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

export interface SelectFieldProps {
  readonly label: string;
  readonly value: string;
  readonly options: readonly SelectOption[];
  readonly onChange: (value: string) => void;
  readonly placeholder?: string | undefined;
  readonly hint?: string | undefined;
  readonly error?: string | undefined;
  readonly disabled?: boolean | undefined;
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
  hint,
  error,
  disabled = false,
}: SelectFieldProps) {
  return (
    <Field label={label} {...fieldExtras({ hint, error })}>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {placeholder === undefined ? null : (
          <option value="">{placeholder}</option>
        )}
        {options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export interface ChecklistProps {
  readonly legend: string;
  readonly options: readonly SelectOption[];
  readonly selected: readonly string[];
  readonly onChange: (next: string[]) => void;
  readonly disabled?: boolean | undefined;
  readonly error?: string | undefined;
}

export function Checklist({
  legend,
  options,
  selected,
  onChange,
  disabled = false,
  error,
}: ChecklistProps) {
  const errorId = useId();
  const visible = options.map((option) => option.value);

  return (
    <fieldset
      className={styles.checkboxList}
      {...(error === undefined ? {} : { "aria-describedby": errorId })}
    >
      <legend>{legend}</legend>
      {error === undefined ? null : (
        <p className={styles.fieldError} id={errorId} role="alert">
          {error}
        </p>
      )}
      {options.map((option) => {
        const checked = selected.includes(option.value);
        return (
          <label className={styles.check} key={option.value}>
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={(event) =>
                onChange(
                  selectVisible(
                    selected,
                    visible,
                    event.target.checked
                      ? [
                          ...selected.filter((name) => name !== option.value),
                          option.value,
                        ]
                      : selected.filter((name) => name !== option.value),
                  ),
                )
              }
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}

export interface StoreChecklistProps {
  readonly legend: string;
  readonly stores: readonly WorkflowStore[];
  readonly selected: readonly string[];
  readonly onChange: (next: string[]) => void;
  readonly disabled?: boolean | undefined;
  readonly error?: string | undefined;
}

export function StoreChecklist({
  legend,
  stores,
  selected,
  onChange,
  disabled,
  error,
}: StoreChecklistProps) {
  return (
    <Checklist
      legend={legend}
      options={storeOptions(stores, selected)}
      selected={selected}
      onChange={onChange}
      disabled={disabled}
      error={error}
    />
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly disabled?: boolean | undefined;
}) {
  return (
    <label className={styles.check}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function parseRecipients(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter((value) => value !== "");
}

function sameStrings(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

export interface RecipientsFieldProps {
  readonly value: readonly string[];
  readonly onChange: (next: string[]) => void;
  readonly error?: string | undefined;
  readonly disabled?: boolean | undefined;
  readonly rows?: number | undefined;
}

/**
 * 收件人按行编辑：本地保留原始文本，避免受控输入把换行吃掉，
 * 每次输入同时把解析后的数组写回草稿。
 */
export function RecipientsField({
  value,
  onChange,
  error,
  disabled = false,
  rows = 4,
}: RecipientsFieldProps) {
  const { w } = useWorkflowText();
  const [text, setText] = useState(() => value.join("\n"));
  const [lastValue, setLastValue] = useState<readonly string[]>(value);

  // 外部（保存后/冲突重载）改变了收件人时，同步本地文本；输入中的换行不会被吃掉。
  if (!sameStrings(lastValue, value)) {
    setLastValue(value);
    setText(value.join("\n"));
  }

  return (
    <Field label={w("recipients")} {...fieldExtras({ error })}>
      <textarea
        value={text}
        rows={rows}
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.value;
          const parsed = parseRecipients(next);
          setText(next);
          setLastValue(parsed);
          onChange(parsed);
        }}
      />
    </Field>
  );
}

export interface MailFieldsProps {
  readonly title: string;
  readonly mail: MailConfiguration;
  readonly onChange: (next: MailConfiguration) => void;
  readonly errors: {
    readonly recipients?: string | undefined;
    readonly allowedSender?: string | undefined;
  };
  readonly disabled?: boolean | undefined;
}

export function MailFields({
  title,
  mail,
  onChange,
  errors,
  disabled = false,
}: MailFieldsProps) {
  const { w } = useWorkflowText();

  return (
    <div className={styles.stack}>
      <h3 className={styles.subheading}>{title}</h3>
      <CheckboxField
        label={w("mailEnabled")}
        checked={mail.enabled}
        disabled={disabled}
        onChange={(enabled) => onChange(withMail(mail, { enabled }))}
      />
      <RecipientsField
        value={mail.recipients}
        error={errors.recipients}
        disabled={disabled}
        onChange={(recipients) => onChange(withMail(mail, { recipients }))}
      />
      <TextField
        label={w("allowedSender")}
        value={mail.allowedSender ?? ""}
        error={errors.allowedSender}
        disabled={disabled}
        maxLength={254}
        onChange={(allowedSender) =>
          onChange(withMail(mail, { allowedSender }))
        }
      />
    </div>
  );
}

export interface EditableListProps<Item> {
  readonly title: string;
  readonly items: readonly Item[];
  readonly maximum: number;
  readonly disabled?: boolean | undefined;
  readonly create: () => Item;
  readonly onChange: (items: Item[]) => void;
  readonly renderItem: (item: Item, update: (next: Item) => void) => ReactNode;
}

export function EditableList<Item>({
  title,
  items,
  maximum,
  disabled = false,
  create,
  onChange,
  renderItem,
}: EditableListProps<Item>) {
  const { w } = useWorkflowText();

  return (
    <div className={styles.stack}>
      <div className={styles.listHeading}>
        <h3 className={styles.subheading}>{title}</h3>
        <ActionButton
          label={w("add")}
          icon={<AdminIcon name="plus" />}
          variant="secondary"
          disabled={disabled || items.length >= maximum}
          onRun={() => onChange([...items, create()])}
        />
      </div>
      {items.map((item, index) => (
        <div className={styles.subpanel} key={index}>
          {renderItem(item, (next) =>
            onChange(
              items.map((current, position) =>
                position === index ? next : current,
              ),
            ),
          )}
          <div className={styles.actionsRow}>
            <ActionButton
              label={w("remove")}
              variant="ghost"
              className={styles.removeAction}
              disabled={disabled}
              onRun={() =>
                onChange(
                  items.filter((_current, position) => position !== index),
                )
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export interface SourceFieldsProps {
  readonly source: SourceIdentity;
  readonly accounts: readonly SourceAccount[];
  readonly reviewsOnly: boolean;
  readonly disabled?: boolean | undefined;
  readonly onChange: (next: SourceIdentity) => void;
}

export function SourceFields({
  source,
  accounts,
  reviewsOnly,
  disabled = false,
  onChange,
}: SourceFieldsProps) {
  const { w } = useWorkflowText();
  const productOptions: SelectOption[] = reviewsOnly
    ? [{ value: "meituan_reviews", label: w("meituan_reviews") }]
    : [
        { value: "meituan_erp", label: w("meituan_erp") },
        { value: "meituan_reviews", label: w("meituan_reviews") },
      ];
  const channelOptions: SelectOption[] =
    source.product === "meituan_erp"
      ? [{ value: "erp", label: w("erp") }]
      : [
          { value: "meituan", label: w("meituan") },
          { value: "dianping", label: w("dianping") },
        ];
  const accountOptions = accounts
    .filter((account) => account.product === source.product)
    .map((account) => ({
      value: account.accountRef,
      label: account.displayName,
    }));
  const preservedAccount =
    source.accountRef !== "" &&
    !accountOptions.some((option) => option.value === source.accountRef)
      ? [
          ...accountOptions,
          { value: source.accountRef, label: source.accountRef },
        ]
      : accountOptions;

  return (
    <div className={styles.stack}>
      <div className={styles.row}>
        <SelectField
          label={w("product")}
          value={source.product}
          options={productOptions}
          disabled={disabled}
          onChange={(value) =>
            onChange(
              withSource(source, {
                product:
                  value === "meituan_erp" ? "meituan_erp" : "meituan_reviews",
                channel: value === "meituan_erp" ? "erp" : "meituan",
              }),
            )
          }
        />
        <SelectField
          label={w("channel")}
          value={source.channel}
          options={channelOptions}
          disabled={disabled}
          onChange={(value) =>
            onChange(
              withSource(source, {
                channel:
                  value === "erp"
                    ? "erp"
                    : value === "dianping"
                      ? "dianping"
                      : "meituan",
              }),
            )
          }
        />
      </div>
      <SelectField
        label={w("sourceAccounts")}
        value={source.accountRef}
        options={preservedAccount}
        placeholder={w("choose")}
        disabled={disabled}
        onChange={(accountRef) => onChange(withSource(source, { accountRef }))}
      />
      <TextField
        label={w("sourceStoreName")}
        value={source.sourceStoreName}
        disabled={disabled}
        maxLength={255}
        onChange={(sourceStoreName) =>
          onChange(withSource(source, { sourceStoreName }))
        }
      />
      <TextField
        label={w("sourceStoreId")}
        value={source.sourceStoreId ?? ""}
        disabled={disabled}
        maxLength={255}
        onChange={(sourceStoreId) =>
          onChange(withSource(source, { sourceStoreId }))
        }
      />
    </div>
  );
}
