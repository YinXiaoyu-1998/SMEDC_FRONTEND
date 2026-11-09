import { Link } from "react-router";

import { appPaths } from "@/app/paths";
import { useText } from "@/i18n/useText";

import styles from "./PageStatus.module.css";

export function NotFoundPage() {
  const { t } = useText();

  return (
    <div className={styles.page}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>{t("errors.notFound.title")}</h1>
      <p className={styles.description}>{t("errors.notFound.description")}</p>
      <div className={styles.actions}>
        <Link className={styles.homeLink} to={appPaths.home}>
          {t("errors.home")}
        </Link>
      </div>
    </div>
  );
}
