import { useText } from "@/i18n/useText";
import type { Locale } from "@/i18n/text";

import styles from "./LanguageSwitch.module.css";

const options: readonly {
  readonly locale: Locale;
  readonly labelKey: string;
}[] = [
  { locale: "zh", labelKey: "language.zh" },
  { locale: "en", labelKey: "language.en" },
];

export function LanguageSwitch() {
  const { locale, setLocale, t } = useText();

  return (
    <div className={styles.group} role="group" aria-label={t("language.label")}>
      {options.map((option) => {
        const active = option.locale === locale;
        return (
          <button
            key={option.locale}
            type="button"
            className={
              active ? `${styles.option} ${styles.active}` : styles.option
            }
            aria-pressed={active}
            lang={option.locale === "zh" ? "zh-CN" : "en"}
            onClick={() => setLocale(option.locale)}
          >
            {t(option.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
