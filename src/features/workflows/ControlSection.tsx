import { useId } from "react";

import { ActionButton } from "@/ui/ActionButton";
import { PageSection } from "@/ui/PageSection";
import { TextField } from "@/features/workflows/Fields";
import type { WorkflowView } from "@/features/workflows/model";
import { useWorkflowText } from "@/features/workflows/text";

import styles from "@/features/workflows/Page.module.css";

type ControlState = WorkflowView["controlState"];

export interface ControlSectionProps {
  readonly view: WorkflowView | undefined;
  readonly reason: string;
  readonly onReasonChange: (reason: string) => void;
  readonly showOrderScopeHelp: boolean;
  readonly onRequest: (state: ControlState) => void;
}

export function ControlSection({
  view,
  reason,
  onReasonChange,
  showOrderScopeHelp,
  onRequest,
}: ControlSectionProps) {
  const { w } = useWorkflowText();
  const reasonId = useId();
  const reasonMissing = reason.trim() === "";

  if (view === undefined) {
    return (
      <PageSection title={w("control")}>
        <p className={styles.hint}>{w("notConfigured")}</p>
        <p className={styles.hint}>{w("controlUnavailable")}</p>
      </PageSection>
    );
  }

  const currentState = view.controlState;

  const targets: readonly {
    readonly state: ControlState;
    readonly label: string;
    readonly variant: "primary" | "secondary";
  }[] = [
    {
      state: "active",
      label: w("activate"),
      variant: "primary",
    },
    {
      state: "paused",
      label: w("pause"),
      variant: "secondary",
    },
    {
      state: "revoked",
      label: w("revokeControl"),
      variant: "secondary",
    },
  ];

  return (
    <PageSection title={w("control")}>
      <p className={styles.notice}>
        {w("state")}: {w(currentState)}
      </p>
      <p className={styles.hint}>{w("activateHelp")}</p>
      {showOrderScopeHelp ? (
        <p className={styles.hint}>{w("activateOrderScopeHelp")}</p>
      ) : null}

      <div id={reasonId}>
        <TextField
          label={w("reason")}
          value={reason}
          multiline
          rows={3}
          maxLength={2000}
          hint={reasonMissing ? w("reasonRequired") : w("reasonHint")}
          onChange={onReasonChange}
        />
      </div>

      <div className={styles.actionsRow}>
        {targets.map((target) => {
          const unchanged = currentState === target.state;
          const unavailable = reasonMissing || unchanged;
          const disabledReason = reasonMissing
            ? w("reasonRequired")
            : unchanged
              ? w("controlUnchanged")
              : undefined;
          return (
            <ActionButton
              key={target.state}
              label={target.label}
              variant={target.variant}
              className={target.state === "revoked" ? styles.danger : undefined}
              disabled={unavailable}
              {...(disabledReason === undefined
                ? {}
                : { disabledReason, title: disabledReason })}
              onRun={() => onRequest(target.state)}
            />
          );
        })}
      </div>
    </PageSection>
  );
}
