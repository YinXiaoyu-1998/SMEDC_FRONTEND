import * as Dialog from "@radix-ui/react-dialog";
import { useId, type ReactNode, type RefObject } from "react";

import { useText } from "@/i18n/useText";
import { ActionButton } from "@/ui/ActionButton";
import type { ButtonVariant } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { InlineError } from "@/ui/InlineError";
import { useBodyScrollLock } from "@/ui/scrollLock";
import { useConfirmFlow, type ConfirmFlow } from "@/ui/useConfirmFlow";

import type {
  Confirmation,
  DiffEntry,
  RebaseChoice,
  RebaseDecision,
} from "./diff";
import styles from "./Permissions.module.css";

/**
 * 右侧编辑面板：桌面从右侧滑入，窄屏占满宽度。
 * 关闭请求交给调用方处理（有草稿时先确认），面板本身不丢弃草稿。
 */
export interface PanelProps {
  readonly open: boolean;
  readonly variant?: "drawer" | "modal";
  readonly title: string;
  readonly subtitle?: string;
  readonly onRequestClose: () => void;
  readonly footer?: ReactNode;
  readonly children: ReactNode;
  readonly returnFocusRef?: RefObject<HTMLElement | null>;
}

export function Panel({
  open,
  variant = "drawer",
  title,
  subtitle,
  onRequestClose,
  footer,
  children,
  returnFocusRef,
}: PanelProps) {
  const { t } = useText();
  useBodyScrollLock(open);
  const titleId = useId();

  const handleCloseAutoFocus = (event: Event) => {
    const target = returnFocusRef?.current;
    if (target === null || target === undefined) return;
    event.preventDefault();
    target.focus();
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onRequestClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={styles.panelOverlay} />
        <Dialog.Content
          className={
            variant === "modal"
              ? `${styles.panel} ${styles.panelModal}`
              : `${styles.panel} ${styles.panelDrawer}`
          }
          aria-labelledby={titleId}
          onCloseAutoFocus={handleCloseAutoFocus}
        >
          <div className={styles.panelHead}>
            <div className={styles.panelHeadings}>
              <Dialog.Title className={styles.panelTitle} id={titleId}>
                {title}
              </Dialog.Title>
              {subtitle === undefined ? null : (
                <Dialog.Description className={styles.panelSubtitle}>
                  {subtitle}
                </Dialog.Description>
              )}
            </div>
            <button
              type="button"
              className={styles.panelClose}
              aria-label={t("permissions.closePanel")}
              onClick={onRequestClose}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <div className={styles.panelBody}>{children}</div>
          {footer === undefined ? null : (
            <div className={styles.panelFooter}>{footer}</div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ConfirmationDetails({
  confirmation,
}: {
  readonly confirmation: Confirmation;
}) {
  const { t } = useText();
  return (
    <>
      <div className={styles.deltaList}>
        {confirmation.diff.map((entry, index) => (
          <DeltaEntry entry={entry} key={`${entry.kind}-${index}`} />
        ))}
      </div>
      {confirmation.impact === undefined ? null : (
        <p className={styles.impact}>{confirmation.impact}</p>
      )}
      {confirmation.fullBefore === undefined &&
      confirmation.fullAfter === undefined ? null : (
        <details className={styles.fullConfig}>
          <summary>{t("permissions.fullConfig")}</summary>
          <pre className={styles.fullConfigData}>
            {`${t("permissions.before")}\n${confirmation.fullBefore ?? ""}\n\n${t("permissions.after")}\n${confirmation.fullAfter ?? ""}`}
          </pre>
        </details>
      )}
    </>
  );
}

function DeltaEntry({ entry }: { readonly entry: DiffEntry }) {
  const { t } = useText();
  const label =
    entry.kind === "added"
      ? t("permissions.diff.addedItem").replace("{label}", entry.label)
      : entry.kind === "removed"
        ? t("permissions.diff.removedItem").replace("{label}", entry.label)
        : entry.label;
  return (
    <div
      className={styles.delta}
      data-testid="diff-entry"
      data-diff-kind={entry.kind}
    >
      <strong className={styles.deltaLabel}>{label}</strong>
      <p className={styles.deltaLine}>
        {entry.kind === "added" ? null : (
          <span className={styles.deltaBefore}>{entry.before}</span>
        )}
        {entry.kind === "changed" ? (
          <span className={styles.deltaArrow} aria-hidden="true">
            →
          </span>
        ) : null}
        {entry.kind === "removed" ? null : (
          <span className={styles.deltaAfter}>{entry.after}</span>
        )}
      </p>
      <span className="visually-hidden">
        {t(
          entry.kind === "added"
            ? "permissions.diff.added"
            : entry.kind === "removed"
              ? "permissions.diff.removed"
              : "permissions.diff.changed",
        )}
      </span>
    </div>
  );
}

interface PreparedConfirmation {
  readonly confirmation: Confirmation;
}

export function PermissionConfirmDialog<Prepared extends PreparedConfirmation>({
  flow,
  title,
  confirmLabel,
  cancelLabel,
  returnFocusRef,
  error,
}: {
  readonly flow: ConfirmFlow<Prepared>;
  readonly title: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  readonly returnFocusRef?: RefObject<HTMLElement | null>;
  readonly error?: unknown;
}) {
  const confirmation = flow.prepared?.confirmation;
  return (
    <ConfirmDialog<Prepared>
      flow={flow}
      title={title}
      description={confirmation?.subject ?? ""}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      {...(returnFocusRef === undefined ? {} : { returnFocusRef })}
      {...(error === undefined ? {} : { error })}
    >
      {confirmation === undefined ? null : (
        <ConfirmationDetails confirmation={confirmation} />
      )}
    </ConfirmDialog>
  );
}

/** 非保存类确认（停用、删除条目、启用）统一走同一套差异弹窗与焦点恢复。 */
export function ConfirmAction({
  label,
  title,
  prepare,
  onConfirm,
  confirmLabel,
  variant = "secondary",
  disabled = false,
  disabledReason,
  className,
}: {
  readonly label: string;
  readonly title: string;
  readonly prepare: () => Confirmation;
  readonly onConfirm: () => void;
  readonly confirmLabel: string;
  readonly variant?: ButtonVariant;
  readonly disabled?: boolean;
  readonly disabledReason?: string;
  readonly className?: string;
}) {
  const { t } = useText();
  const flow = useConfirmFlow<PreparedConfirmation, void>({
    prepare: () => ({ confirmation: prepare() }),
    submit: () => {
      onConfirm();
    },
  });

  return (
    <>
      <ActionButton
        label={label}
        variant={variant}
        disabled={disabled}
        {...(disabledReason === undefined ? {} : { disabledReason })}
        {...(className === undefined ? {} : { className })}
        onRun={() => {
          void flow.request();
        }}
      />
      <PermissionConfirmDialog
        flow={flow}
        title={title}
        confirmLabel={confirmLabel}
        cancelLabel={t("permissions.cancel")}
      />
    </>
  );
}

export interface DraftConflictProps {
  readonly confirmation: Confirmation;
  readonly choices: readonly RebaseChoice[];
  readonly selected: Readonly<Record<string, RebaseDecision>>;
  readonly onSelect: (key: string, decision: RebaseDecision) => void;
  readonly canApply: boolean;
  readonly applyReason?: string;
  readonly onLoadServer: () => void;
  readonly onApplyMine: () => void;
  readonly reloading?: boolean;
  readonly error?: unknown;
}

/**
 * 版本冲突：保留草稿，展示与服务器最新值的差异；
 * 用户要么载入服务器值放弃草稿，要么以最新快照为基线重新应用自己的改动，
 * 同一条在两边都被改动时必须先做出选择。
 */
export function DraftConflict({
  confirmation,
  choices,
  selected,
  onSelect,
  canApply,
  applyReason,
  onLoadServer,
  onApplyMine,
  reloading = false,
  error,
}: DraftConflictProps) {
  const { t } = useText();
  const titleId = useId();

  return (
    <section className={styles.conflict} role="alert" aria-labelledby={titleId}>
      <h3 className={styles.conflictTitle} id={titleId}>
        {t("ui.conflict.title")}
      </h3>
      <p className={styles.hint}>{t("ui.conflict.description")}</p>
      <ConfirmationDetails confirmation={confirmation} />
      {choices.length === 0 ? null : (
        <fieldset className={styles.fieldset}>
          <legend>{t("permissions.conflict.choose")}</legend>
          {choices.map((choice) => (
            <div className={styles.conflictChoice} key={choice.key}>
              <p className={styles.conflictChoiceTitle}>{choice.label}</p>
              <label className={styles.check}>
                <input
                  type="radio"
                  name={`conflict-${choice.key}`}
                  checked={selected[choice.key] === "server"}
                  onChange={() => {
                    onSelect(choice.key, "server");
                  }}
                />
                <span>
                  {t("permissions.conflict.keepServer")}: {choice.serverValue}
                </span>
              </label>
              <label className={styles.check}>
                <input
                  type="radio"
                  name={`conflict-${choice.key}`}
                  checked={selected[choice.key] === "draft"}
                  onChange={() => {
                    onSelect(choice.key, "draft");
                  }}
                />
                <span>
                  {t("permissions.conflict.keepDraft")}: {choice.draftValue}
                </span>
              </label>
            </div>
          ))}
        </fieldset>
      )}
      <div className={styles.actions}>
        <ActionButton
          label={t("permissions.conflict.loadServer")}
          variant="secondary"
          busy={reloading}
          onRun={onLoadServer}
        />
        <ActionButton
          label={t("permissions.conflict.applyMine")}
          busy={false}
          disabled={!canApply}
          {...(applyReason === undefined
            ? {}
            : { disabledReason: applyReason })}
          onRun={onApplyMine}
        />
      </div>
      <InlineError error={error} />
    </section>
  );
}

export function ListHeader({
  title,
  description,
  action,
}: {
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
}) {
  return (
    <div className={styles.listHeader}>
      <div>
        <h2 className={styles.listTitle}>{title}</h2>
        {description === undefined ? null : (
          <p className={styles.listDescription}>{description}</p>
        )}
      </div>
      {action === undefined ? null : (
        <div className={styles.listHeaderAction}>{action}</div>
      )}
    </div>
  );
}

export function ObjectRow({
  title,
  description,
  actions,
  highlight = false,
}: {
  readonly title: string;
  readonly description?: string;
  readonly actions?: ReactNode;
  readonly highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? `${styles.objectRow} ${styles.objectRowDraft}`
          : styles.objectRow
      }
    >
      <div className={styles.objectRowText}>
        <strong>{title}</strong>
        {description === undefined ? null : <span>{description}</span>}
      </div>
      {actions === undefined ? null : (
        <div className={styles.objectActions}>{actions}</div>
      )}
    </div>
  );
}

export function ObjectListHead({
  title,
  action,
}: {
  readonly title: string;
  readonly action?: ReactNode;
}) {
  return (
    <div className={styles.objectListHead}>
      <h3 className={styles.objectListTitle}>{title}</h3>
      {action}
    </div>
  );
}

export function EmptyList({ children }: { readonly children: ReactNode }) {
  return <p className={styles.emptyEditor}>{children}</p>;
}
