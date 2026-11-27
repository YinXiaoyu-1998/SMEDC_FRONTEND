import type { ReactNode } from "react";

import { Brand } from "@/app/Brand";
import { LanguageSwitch } from "@/app/LanguageSwitch";
import { useText } from "@/i18n/useText";

import styles from "./LoginPage.module.css";

interface AuthCardProps {
  readonly title: string;
  readonly titleId?: string;
  readonly children: ReactNode;
}

export function AuthCard({
  title,
  titleId = "auth-title",
  children,
}: AuthCardProps) {
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby={titleId}>
        <div className={styles.topRow}>
          <span className={styles.brand}>
            <Brand />
          </span>
          <LanguageSwitch />
        </div>
        <h1 id={titleId} className={styles.title}>
          {title}
        </h1>
        {children}
      </section>
    </main>
  );
}

export function AuthCardLoading({ titleKey }: { titleKey: string }) {
  const { t } = useText();
  return (
    <AuthCard title={t(titleKey)}>
      <p role="status">{t("app.loading")}</p>
    </AuthCard>
  );
}
