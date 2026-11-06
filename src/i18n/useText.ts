import { useContext } from "react";

import { TextContext, type TextContextValue } from "@/i18n/text";

export function useText(): TextContextValue {
  const value = useContext(TextContext);
  if (value === null) {
    throw new Error("useText 必须在 TextProvider 内使用");
  }
  return value;
}
