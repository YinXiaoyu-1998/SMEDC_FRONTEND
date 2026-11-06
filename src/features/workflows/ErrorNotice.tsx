import { useWorkflowText } from "@/features/workflows/text";
import { workflowErrorKeyFor } from "@/features/workflows/errors";

import styles from "@/features/workflows/Page.module.css";

export interface ErrorNoticeProps {
  readonly error: unknown;
}

/** 只显示稳定的映射文案，不把服务端原始 message 直接透出。 */
export function ErrorNotice({ error }: ErrorNoticeProps) {
  const { t, w } = useWorkflowText();
  if (error === null || error === undefined) return null;

  const localized = workflowErrorKeyFor(error);
  const message =
    localized.source === "workflow" ? w(localized.key) : t(localized.key);

  return (
    <p className={styles.error} role="alert">
      {message}
    </p>
  );
}
