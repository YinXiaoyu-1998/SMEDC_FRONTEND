import { useId } from "react";
import type { ReactNode } from "react";

import styles from "./PageSection.module.css";

export interface PageSectionProps {
  readonly title: string;
  readonly description?: string;
  readonly actions?: ReactNode;
  readonly children?: ReactNode;
  readonly className?: string;
}

/** 三个业务页共用的版式：标题、说明与内容槽。 */
export function PageSection({
  title,
  description,
  actions,
  children,
  className,
}: PageSectionProps) {
  const titleId = useId();
  const classes =
    className === undefined ? styles.section : `${styles.section} ${className}`;

  return (
    <section className={classes} aria-labelledby={titleId}>
      <header className={styles.header}>
        <div className={styles.headings}>
          <h2 className={styles.title} id={titleId}>
            {title}
          </h2>
          {description === undefined ? null : (
            <p className={styles.description}>{description}</p>
          )}
        </div>
        {actions === undefined ? null : (
          <div className={styles.actions}>{actions}</div>
        )}
      </header>
      <div className={styles.content}>{children}</div>
    </section>
  );
}
