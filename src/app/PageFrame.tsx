import type { ReactNode } from "react";

import { AdminIcon } from "@/ui/AdminIcon";
import { useText } from "@/i18n/useText";

import styles from "./PageFrame.module.css";

interface PageFrameProps {
  readonly title?: string;
  readonly subtitle?: string;
  readonly actions?: ReactNode;
  readonly icon?: "building" | "tasks";
  readonly children?: ReactNode;
}

export function PageFrame({
  title,
  subtitle,
  actions,
  icon,
  children,
}: PageFrameProps) {
  const { t } = useText();

  return (
    <div className={styles.page}>
      {title === undefined ? null : (
        <header className={styles.header}>
          <div className={styles.heading}>
            {icon === undefined ? null : (
              <span className={styles.icon}>
                <AdminIcon name={icon} />
              </span>
            )}
            <div>
              <h1 className={styles.title}>{title}</h1>
              {subtitle === undefined ? null : (
                <p className={styles.subtitle}>{subtitle}</p>
              )}
            </div>
          </div>
          {actions === undefined ? null : (
            <div className={styles.actions}>{actions}</div>
          )}
        </header>
      )}
      <section className={styles.panel} aria-label={t("pages.content")}>
        {children}
      </section>
    </div>
  );
}
