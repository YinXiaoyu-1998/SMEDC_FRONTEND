import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ActionButton } from "@/ui/ActionButton";
import { renderWithText } from "@/test/renderWithText";

afterEach(() => {
  localStorage.clear();
  document.documentElement.lang = "";
});

describe("ActionButton", () => {
  it("空闲时点击只触发一次 onRun", () => {
    const onRun = vi.fn();
    renderWithText(<ActionButton label="保存任务设置" onRun={onRun} />);

    const button = screen.getByRole("button", { name: "保存任务设置" });
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute("aria-busy");

    fireEvent.click(button);
    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it("busy 时保留原文案、显示指示器、禁用并阻止重复触发", () => {
    const onRun = vi.fn();
    renderWithText(<ActionButton label="保存任务设置" busy onRun={onRun} />);

    const button = screen.getByRole("button", { name: "保存任务设置" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.getByTestId("button-spinner")).toBeInTheDocument();

    fireEvent.click(button);
    fireEvent.keyDown(button, { key: "Enter" });
    fireEvent.keyUp(button, { key: "Enter" });

    expect(onRun).not.toHaveBeenCalled();

    button.focus();
    expect(button).not.toHaveFocus();
  });

  it("disabledReason 只进入 aria-describedby，按钮内不出现提示文案", () => {
    const onRun = vi.fn();
    renderWithText(
      <ActionButton
        label="新增授权"
        disabled
        disabledReason="请先选择有效范围"
        onRun={onRun}
      />,
    );

    const button = screen.getByRole("button", { name: "新增授权" });
    expect(button).toHaveAccessibleDescription("请先选择有效范围");
    expect(button).toHaveTextContent(/^新增授权$/);

    const reason = screen.getByText("请先选择有效范围");
    expect(reason).toHaveClass("visually-hidden");
    expect(button).not.toContainElement(reason);

    fireEvent.click(button);
    expect(onRun).not.toHaveBeenCalled();
  });

  it("没有 disabledReason 时不挂 aria-describedby", () => {
    renderWithText(<ActionButton label="暂停任务" onRun={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: "暂停任务" }),
    ).not.toHaveAttribute("aria-describedby");
  });

  it("文案元组跟随当前界面语言", () => {
    localStorage.setItem("smedc-locale", "en");
    renderWithText(
      <ActionButton
        label={{ zh: "保存", en: "Save" }}
        disabledReason={{ zh: "没有改动", en: "No changes" }}
        disabled
        onRun={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAccessibleDescription("No changes");
  });
});
