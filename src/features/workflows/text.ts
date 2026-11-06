import { useCallback } from "react";

import { resolveText } from "@/i18n/text";
import { useText } from "@/i18n/useText";
import { workflowMessages } from "@/features/workflows/messages";

export interface WorkflowText {
  readonly locale: "zh" | "en";
  readonly t: (key: string) => string;
  readonly w: (key: string) => string;
}

/**
 * 自动任务页的文案来自本功能自己的元组字典，仍使用全局 locale，
 * 因此切换语言时与页面其余部分同步更新，不需要额外订阅。
 */
export function useWorkflowText(): WorkflowText {
  const { locale, t } = useText();
  const w = useCallback(
    (key: string) => resolveText(workflowMessages, locale, key),
    [locale],
  );
  return { locale, t, w };
}
