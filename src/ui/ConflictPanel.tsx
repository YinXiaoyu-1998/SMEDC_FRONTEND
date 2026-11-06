import { useId } from "react";
import type { ReactNode } from "react";

import { useText } from "@/i18n/useText";
import { ActionButton } from "@/ui/ActionButton";

import styles from "./ConflictPanel.module.css";

export interface ConflictField {
  readonly key: string;
  readonly label: string;
  readonly serverValue: ReactNode;
  readonly draftValue: ReactNode;
}

export interface ConflictPanelProps {
  readonly fields: readonly ConflictField[];
  readonly onReload: () => void;
  readonly onResubmit: () => void;
  readonly reloading?: boolean;
  readonly resubmitting?: boolean;
  readonly disabled?: boolean;
  readonly title?: string;
  readonly description?: string;
}

/**
 * 版本冲突只提供两条显式路径：重新加载服务端值，或确认后用本地草稿重新提交。
 * 面板本身不自动覆盖、不自动重试，保存动作必须等用户做出选择。
 */
export function ConflictPanel({
  fields,
  onReload,
  onResubmit,
  reloading = false,
  resubmitting = false,
  disabled = false,
  title,
  description,
}: ConflictPanelProps) {
  const { t } = useText();
  const titleId = useId();

  return (
    <section className={styles.panel} role="alert" aria-labelledby={titleId}>
      <h2 className={styles.title} id={titleId}>
        {title ?? t("ui.conflict.title")}
      </h2>
      <p className={styles.description}>
        {description ?? t("ui.conflict.description")}
      </p>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">{t("ui.conflict.field")}</th>
              <th scope="col">{t("ui.conflict.server")}</th>
              <th scope="col">{t("ui.conflict.draft")}</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => (
              <tr key={field.key}>
                <th scope="row">{field.label}</th>
                <td>{field.serverValue}</td>
                <td>{field.draftValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.actions}>
        <ActionButton
          label={t("ui.conflict.reload")}
          variant="secondary"
          busy={reloading}
          disabled={disabled || resubmitting}
          onRun={onReload}
        />
        <ActionButton
          label={t("ui.conflict.resubmit")}
          busy={resubmitting}
          disabled={disabled || reloading}
          onRun={onResubmit}
        />
      </div>
    </section>
  );
}
