import { useText } from "@/i18n/useText";
import { Button } from "@/ui/Button";

import styles from "./PageStatus.module.css";

interface ForbiddenPageProps {
  readonly onRetry?: (() => void) | undefined;
}

export function ForbiddenPage({ onRetry }: ForbiddenPageProps) {
  const { t } = useText();

  return (
    <div className={styles.page}>
      <p className={styles.code}>403</p>
      <h1 className={styles.title}>{t("errors.forbidden.title")}</h1>
      <p className={styles.description}>{t("errors.forbidden.description")}</p>
      {onRetry === undefined ? null : (
        <div className={styles.actions}>
          <Button onClick={onRetry}>{t("errors.forbidden.retry")}</Button>
        </div>
      )}
    </div>
  );
}
