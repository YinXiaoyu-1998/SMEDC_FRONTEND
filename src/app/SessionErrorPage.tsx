import { useText } from "@/i18n/useText";
import { Button } from "@/ui/Button";

import styles from "./PageStatus.module.css";

interface SessionErrorPageProps {
  readonly retrying: boolean;
  readonly onRetry: () => void;
}

export function SessionErrorPage({ retrying, onRetry }: SessionErrorPageProps) {
  const { t } = useText();

  return (
    <main id="main-content" className={styles.fullPage}>
      <div className={styles.page}>
        <h1 className={styles.title}>{t("errors.session.title")}</h1>
        <p className={styles.description}>{t("errors.session.description")}</p>
        <div className={styles.actions}>
          <Button busy={retrying} onClick={onRetry}>
            {t("errors.session.retry")}
          </Button>
        </div>
      </div>
    </main>
  );
}
