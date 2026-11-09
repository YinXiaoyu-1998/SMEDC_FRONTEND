import { useNavigate } from "react-router";

import { appPaths } from "@/app/paths";
import { useText } from "@/i18n/useText";
import { Button } from "@/ui/Button";

import styles from "./ErrorBoundary.module.css";

export function RouteErrorPage() {
  const { t } = useText();
  const navigate = useNavigate();

  return (
    <main id="main-content" className={styles.page}>
      <div className={styles.content} role="alert">
        <h1 className={styles.title}>{t("errors.boundary.title")}</h1>
        <p className={styles.description}>{t("errors.boundary.description")}</p>
        <Button onClick={() => navigate(appPaths.home)}>
          {t("errors.boundary.retry")}
        </Button>
      </div>
    </main>
  );
}
