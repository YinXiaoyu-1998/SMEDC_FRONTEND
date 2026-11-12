import type { ReactNode } from "react";

import { AdminSectionNav } from "@/app/AdminSectionNav";
import { useText } from "@/i18n/useText";

import styles from "./PageFrame.module.css";

interface PageFrameProps {
  readonly title?: string;
  readonly subtitle?: string;
  readonly actions?: ReactNode;
  readonly orgId?: string | undefined;
  readonly children?: ReactNode;
}

/**
 * 管理区外壳：桌面把管理导航放在左侧，窄屏退回内容上方；
 * 页面标题可由调用方省略，用于需要自己渲染标题栏的页面（如权限设置）。
 */
export function PageFrame({
  title,
  subtitle,
  actions,
  orgId,
  children,
}: PageFrameProps) {
  const { t } = useText();

  return (
    <div
      className={
        orgId === undefined ? styles.page : `${styles.page} ${styles.withNav}`
      }
    >
      {orgId === undefined ? null : <AdminSectionNav orgId={orgId} />}
      <div className={styles.content}>
        {title === undefined ? null : (
          <header className={styles.header}>
            <div>
              <h1 className={styles.title}>{title}</h1>
              {subtitle === undefined ? null : (
                <p className={styles.subtitle}>{subtitle}</p>
              )}
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
    </div>
  );
}
