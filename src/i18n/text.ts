import { createContext } from "react";

export type Locale = "zh" | "en";

/** 元组顺序固定为 [中文, English]，新增文案只加一行，避免两份字典漂移 */
export type TextTuple = readonly [zh: string, en: string];

export type TextDictionary = Readonly<Record<string, TextTuple>>;

export const LOCALE_STORAGE_KEY = "smedc-locale";

export const DEFAULT_LOCALE: Locale = "zh";

export interface TextContextValue {
  readonly locale: Locale;
  readonly setLocale: (locale: Locale) => void;
  readonly t: (key: string) => string;
}

export const TextContext = createContext<TextContextValue | null>(null);

export function isLocale(value: string | null): value is Locale {
  return value === "zh" || value === "en";
}

export function readStoredLocale(): Locale {
  try {
    const stored = globalThis.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(stored) ? stored : DEFAULT_LOCALE;
  } catch {
    // 隐私模式下 localStorage 可能不可用，读取失败时退回默认语言
    return DEFAULT_LOCALE;
  }
}

export function storeLocale(locale: Locale): void {
  try {
    globalThis.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // 写入失败不应阻断语言切换，界面仍按内存中的地区渲染
  }
}

export function toHtmlLang(locale: Locale): "zh-CN" | "en" {
  return locale === "zh" ? "zh-CN" : "en";
}

/** 后传入的字典覆盖先传入的同名键，供各业务批次补充自己的文案 */
export function mergeText(
  ...dictionaries: readonly TextDictionary[]
): TextDictionary {
  return Object.assign({}, ...dictionaries) as TextDictionary;
}

export function resolveText(
  dictionary: TextDictionary,
  locale: Locale,
  key: string,
): string {
  const tuple = dictionary[key];
  if (tuple === undefined) return key;
  return locale === "zh" ? tuple[0] : tuple[1];
}
