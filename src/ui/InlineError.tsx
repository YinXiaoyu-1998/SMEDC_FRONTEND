import { useText } from "@/i18n/useText";
import { errorKeyFor } from "@/ui/errors";

import styles from "./InlineError.module.css";

export interface InlineErrorProps {
  readonly error: unknown;
  readonly className?: string;
}

/** 放在操作所在区块或确认弹窗内，role=alert 让读屏立即播报。 */
export function InlineError({ error, className }: InlineErrorProps) {
  const { t } = useText();
  if (error === null || error === undefined) return null;

  const classes =
    className === undefined ? styles.error : `${styles.error} ${className}`;
  return (
    <p className={classes} role="alert">
      {t(errorKeyFor(error))}
    </p>
  );
}
