import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode, RefObject } from "react";

import { ActionButton } from "@/ui/ActionButton";
import { InlineError } from "@/ui/InlineError";
import { useBodyScrollLock } from "@/ui/scrollLock";
import type { ConfirmFlow } from "@/ui/useConfirmFlow";

import styles from "./ConfirmDialog.module.css";

export interface ConfirmDialogProps<Prepared> {
  readonly flow: ConfirmFlow<Prepared>;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  readonly children?: ReactNode;
  /** 传入时覆盖 flow.error；传 null 可隐藏弹窗内错误，改在页面区块展示 */
  readonly error?: unknown;
  readonly returnFocusRef?: RefObject<HTMLElement | null> | undefined;
}

export function ConfirmDialog<Prepared>({
  flow,
  title,
  description,
  confirmLabel,
  cancelLabel,
  children,
  error,
  returnFocusRef,
}: ConfirmDialogProps<Prepared>) {
  useBodyScrollLock(flow.open);

  const handleOpenChange = (next: boolean) => {
    // 弹窗只能由流程打开；关闭请求统一走取消，提交中则忽略
    if (next) return;
    flow.cancel();
  };

  const handleCloseAutoFocus = (event: Event) => {
    const target = returnFocusRef?.current ?? flow.returnFocusRef.current;
    if (target === null) return;

    // Radix 默认只把焦点还给 Dialog.Trigger；触发按钮在弹窗外部且没有 Trigger，
    // 这里主动接管关闭后的焦点恢复。
    event.preventDefault();
    target.focus();
  };

  const shownError = error === undefined ? flow.error : error;

  return (
    <Dialog.Root open={flow.open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          className={styles.content}
          onCloseAutoFocus={handleCloseAutoFocus}
        >
          <Dialog.Title className={styles.title}>{title}</Dialog.Title>
          <Dialog.Description className={styles.description}>
            {description}
          </Dialog.Description>
          {children === undefined ? null : (
            <div className={styles.body}>{children}</div>
          )}
          <InlineError error={shownError} />
          <div className={styles.actions}>
            <ActionButton
              label={cancelLabel}
              variant="secondary"
              disabled={flow.isSubmitting}
              onRun={flow.cancel}
            />
            <ActionButton
              label={confirmLabel}
              busy={flow.isSubmitting}
              onRun={() => void flow.confirm()}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
