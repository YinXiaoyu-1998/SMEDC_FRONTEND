import type { ButtonHTMLAttributes } from "react";

import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly busy?: boolean;
}

export function Button({
  variant = "primary",
  busy = false,
  disabled,
  children,
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], className]
    .filter((value): value is string => value !== undefined && value !== "")
    .join(" ");

  return (
    <button
      {...rest}
      type={type}
      className={classes}
      disabled={disabled === true || busy}
      aria-busy={busy ? true : undefined}
    >
      {busy ? (
        <span
          className={styles.spinner}
          data-testid="button-spinner"
          aria-hidden="true"
        />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
