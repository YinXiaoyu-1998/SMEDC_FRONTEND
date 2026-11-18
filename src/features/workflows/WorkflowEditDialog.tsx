import * as Dialog from "@radix-ui/react-dialog";
import { useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { ErrorNotice } from "@/features/workflows/ErrorNotice";
import { Summary } from "@/features/workflows/Summary";
import {
  WorkflowEditError,
  type WorkflowEditResult,
} from "@/features/workflows/recordEdits";
import { useWorkflowText } from "@/features/workflows/text";
import theme from "@/styles/AdminTheme.module.css";
import { Button } from "@/ui/Button";
import dialog from "@/ui/ConfirmDialog.module.css";
import styles from "@/features/workflows/WorkflowRecords.module.css";

export function WorkflowEditDialog({
  title,
  description,
  actionLabel,
  disabled = false,
  onClose,
  onSubmit,
  trigger,
  fallbackFocus,
  children,
}: {
  readonly title: string;
  readonly description?: ReactNode;
  readonly actionLabel: string;
  readonly disabled?: boolean;
  readonly onClose: () => void;
  readonly onSubmit: () => Promise<WorkflowEditResult>;
  readonly trigger?: HTMLElement | null;
  readonly fallbackFocus?: () => HTMLElement | null;
  readonly children: ReactNode;
}) {
  const { w } = useWorkflowText();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<Exclude<
    WorkflowEditResult,
    { status: "saved" }
  > | null>(null);
  const [error, setError] = useState<unknown>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending.current || (review === null && disabled)) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await (review?.confirm ?? onSubmit)();
      if (result.status === "saved") onClose();
      else setReview(result);
    } catch (caught) {
      setError(caught);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !pending.current) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={dialog.overlay} />
        <Dialog.Content
          className={`${theme.theme} ${dialog.content} ${styles.dialog}`}
          aria-describedby={undefined}
          onInteractOutside={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => {
            const destination = trigger?.isConnected
              ? trigger
              : fallbackFocus?.();
            if (destination?.isConnected) {
              event.preventDefault();
              destination.focus();
            }
          }}
        >
          <Dialog.Title className={dialog.title}>{title}</Dialog.Title>
          {description === undefined ? null : (
            <div className={dialog.description}>{description}</div>
          )}
          <form
            className={dialog.body}
            onSubmit={(event) => void submit(event)}
          >
            <fieldset
              className={styles.fields}
              disabled={busy}
              hidden={review !== null}
            >
              {children}
            </fieldset>
            {review === null ? null : (
              <section className={styles.review} aria-live="polite">
                <p>
                  {w(
                    review.status === "conflict"
                      ? "conflict"
                      : "recordImpactReview",
                  )}
                </p>
                <h3>{w(review.status === "conflict" ? "latest" : "before")}</h3>
                <Summary value={review.before} />
                <h3>{w(review.status === "conflict" ? "draft" : "after")}</h3>
                <Summary value={review.after} />
                {review.impact === undefined ? null : (
                  <>
                    <h3>{w("impact")}</h3>
                    <Summary value={review.impact} />
                  </>
                )}
              </section>
            )}
            {error instanceof WorkflowEditError ? (
              <p role="alert" className={styles.error}>
                {w(error.message)}
              </p>
            ) : (
              <ErrorNotice error={error} />
            )}
            <div className={dialog.actions}>
              <Dialog.Close asChild>
                <Button variant="secondary" disabled={busy}>
                  {w("cancel")}
                </Button>
              </Dialog.Close>
              {review === null ? null : (
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    setReview(null);
                    setError(null);
                  }}
                >
                  {w("recordBackToEdit")}
                </Button>
              )}
              <Button
                type="submit"
                disabled={review === null && disabled}
                busy={busy}
              >
                {review === null ? actionLabel : w("confirm")}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
