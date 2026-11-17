import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

import { useText } from "@/i18n/useText";
import theme from "@/styles/AdminTheme.module.css";
import { AdminIcon } from "@/ui/AdminIcon";
import { Button } from "@/ui/Button";
import dialogStyles from "@/ui/ConfirmDialog.module.css";

import styles from "./Page.module.css";

export function CreateDialog({
  title,
  open,
  onOpenChange,
  onSubmit,
  saveDisabled,
  triggerDisabled,
  submitting,
  checking = false,
  children,
}: {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  saveDisabled: boolean;
  triggerDisabled: boolean;
  submitting: boolean;
  checking?: boolean;
  children: ReactNode;
}) {
  const { locale } = useText();
  const L = ([zh, en]: readonly [string, string]) =>
    locale === "en" ? en : zh;
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!submitting) onOpenChange(next);
      }}
    >
      <Dialog.Trigger asChild>
        <Button className={styles.createTrigger} disabled={triggerDisabled}>
          <AdminIcon name="plus" />
          {title}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={dialogStyles.overlay} />
        <Dialog.Content
          className={`${theme.theme} ${dialogStyles.content}`}
          aria-describedby={undefined}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <Dialog.Title className={dialogStyles.title}>{title}</Dialog.Title>
          <form
            className={dialogStyles.body}
            onSubmit={(event) => {
              event.preventDefault();
              if (!saveDisabled && !submitting && !checking) onSubmit();
            }}
          >
            {children}
            <div className={dialogStyles.actions}>
              <Dialog.Close asChild>
                <Button variant="secondary" disabled={submitting}>
                  {L(["取消", "Cancel"])}
                </Button>
              </Dialog.Close>
              <Button
                type="submit"
                busy={submitting || checking}
                disabled={saveDisabled}
              >
                {L(["保存", "Save"])}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
