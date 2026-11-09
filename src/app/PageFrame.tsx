import type { ReactNode } from "react";

import { AdminSectionNav } from "@/app/AdminSectionNav";
import { useText } from "@/i18n/useText";

import styles from "./PageFrame.module.css";

interface PageFrameProps {
  readonly title: string;
  readonly orgId?: string | undefined;
  readonly children?: ReactNode;
}

export function PageFrame({ title, orgId, children }: PageFrameProps) {
  const { t } = useText();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      {orgId === undefined ? null : <AdminSectionNav orgId={orgId} />}
      <section className={styles.panel} aria-label={t("pages.content")}>
        {children}
      </section>
    </div>
  );
}
