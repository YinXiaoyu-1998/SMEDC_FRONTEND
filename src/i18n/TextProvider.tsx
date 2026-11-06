import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { baseMessages } from "@/i18n/messages";
import {
  mergeText,
  readStoredLocale,
  resolveText,
  storeLocale,
  TextContext,
  toHtmlLang,
  type Locale,
  type TextContextValue,
  type TextDictionary,
} from "@/i18n/text";

interface TextProviderProps {
  readonly children: ReactNode;
  readonly messages?: TextDictionary | undefined;
}

export function TextProvider({
  children,
  messages: extraMessages,
}: TextProviderProps) {
  const [locale, setLocale] = useState<Locale>(readStoredLocale);

  const messages = useMemo(
    () =>
      extraMessages === undefined
        ? baseMessages
        : mergeText(baseMessages, extraMessages),
    [extraMessages],
  );

  // 语言偏好与 <html lang> 必须同时更新，否则读屏软件会用错误的发音规则
  useEffect(() => {
    storeLocale(locale);
    document.documentElement.lang = toHtmlLang(locale);
  }, [locale]);

  const value = useMemo<TextContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key: string) => resolveText(messages, locale, key),
    }),
    [locale, messages],
  );

  return <TextContext.Provider value={value}>{children}</TextContext.Provider>;
}
