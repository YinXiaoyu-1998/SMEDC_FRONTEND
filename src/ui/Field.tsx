import { Children, cloneElement, isValidElement, useId } from "react";
import type { ReactNode } from "react";

import styles from "./Field.module.css";

interface FieldControlProps {
  readonly id?: string;
  readonly "aria-describedby"?: string;
  readonly "aria-invalid"?: boolean | "false" | "true";
  readonly required?: boolean;
}

export interface FieldProps {
  readonly label: string;
  readonly hint?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly id?: string;
  readonly children: ReactNode;
  readonly className?: string;
}

/**
 * 只接受单个表单控件，并把 label/hint/error 的 id 与 aria 属性真正挂到控件上。
 * 错误文案由调用方传入，内核不生成业务校验信息。
 */
export function Field({
  label,
  hint,
  error,
  required = false,
  id,
  children,
  className,
}: FieldProps) {
  const generatedId = useId();
  const child = Children.only(children);
  if (!isValidElement<FieldControlProps>(child)) {
    throw new Error("Field 需要一个可接收 id 与 aria 属性的单个表单控件");
  }

  const controlId = id ?? child.props.id ?? generatedId;
  const hintId = hint === undefined ? undefined : `${controlId}-hint`;
  const errorId = error === undefined ? undefined : `${controlId}-error`;
  const describedBy = [child.props["aria-describedby"], hintId, errorId]
    .filter((value): value is string => value !== undefined && value !== "")
    .join(" ");

  const injected: FieldControlProps = {
    id: controlId,
    ...(describedBy === "" ? {} : { "aria-describedby": describedBy }),
    ...(error === undefined ? {} : { "aria-invalid": true }),
    ...(required ? { required: true } : {}),
  };
  const control = cloneElement(child, injected);

  const classes =
    className === undefined ? styles.field : `${styles.field} ${className}`;

  return (
    <div className={classes}>
      <label className={styles.label} htmlFor={controlId}>
        {label}
        {required ? (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {hint === undefined || hintId === undefined ? null : (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      )}
      <div className={styles.control}>{control}</div>
      {error === undefined || errorId === undefined ? null : (
        <p className={styles.error} id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormField(props: FieldProps) {
  return <Field {...props} />;
}
