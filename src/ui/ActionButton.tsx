import { useContext, useId } from "react";
import type { ButtonHTMLAttributes } from "react";

import { TextContext } from "@/i18n/text";
import { Button, type ButtonVariant } from "@/ui/Button";

export type ActionLabel = string | { readonly zh: string; readonly en: string };

export interface ActionButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | "children"
  | "onClick"
  | "disabled"
  | "type"
  | "aria-busy"
  | "aria-describedby"
> {
  readonly label: ActionLabel;
  readonly busy?: boolean;
  readonly disabled?: boolean;
  readonly disabledReason?: ActionLabel;
  readonly onRun: () => void;
  readonly type?: "button" | "submit" | "reset";
  readonly variant?: ButtonVariant;
}

/**
 * 动作按钮：busy 时保留原文案、禁用并带无障碍忙碌状态。
 * disabledReason 只进入 aria-describedby，不渲染可见提示（Issue #319 明确要求）。
 */
export function ActionButton({
  label,
  busy = false,
  disabled = false,
  disabledReason,
  onRun,
  type = "button",
  variant = "primary",
  className,
  ...rest
}: ActionButtonProps) {
  const text = useActionLabel(label);
  const reason = useActionLabel(disabledReason);
  const reasonId = useId();
  const blocked = busy || disabled;

  const handleClick = () => {
    // 浏览器不会为用户点击派发 disabled 按钮，但程序化事件仍可能绕过，
    // 这里再挡一次，保证 busy 期间鼠标与键盘都不会重复触发。
    if (blocked) return;
    onRun();
  };

  return (
    <>
      <Button
        {...rest}
        type={type}
        variant={variant}
        className={className}
        busy={busy}
        disabled={disabled}
        aria-describedby={reason === undefined ? undefined : reasonId}
        onClick={handleClick}
      >
        {text}
      </Button>
      {reason === undefined ? null : (
        <span id={reasonId} className="visually-hidden">
          {reason}
        </span>
      )}
    </>
  );
}

function useActionLabel(value: ActionLabel | undefined): string | undefined {
  const text = useContext(TextContext);
  if (value === undefined) return undefined;
  if (typeof value === "string") return value;
  return text?.locale === "en" ? value.en : value.zh;
}
