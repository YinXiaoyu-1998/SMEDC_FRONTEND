import { useText } from "@/i18n/useText";

import styles from "./LoadingSkeleton.module.css";

export function LoadingSkeleton() {
  const { t } = useText();

  return (
    <div
      className={styles.page}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="visually-hidden">{t("app.loading")}</span>
      <div className={styles.header} aria-hidden="true">
        <span className={styles.logo} />
        <span className={styles.navItem} />
        <span className={styles.navItem} />
      </div>
      <div className={styles.main} aria-hidden="true">
        <span className={styles.title} />
        <span className={styles.line} />
        <span className={styles.block} />
      </div>
    </div>
  );
}
