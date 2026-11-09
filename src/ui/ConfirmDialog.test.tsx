import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { WebApiError } from "@/api/client";
import { ActionButton } from "@/ui/ActionButton";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { InlineError } from "@/ui/InlineError";
import { useConfirmFlow } from "@/ui/useConfirmFlow";
import { renderWithText } from "@/test/renderWithText";

interface HarnessProps {
  readonly prepare: () => Promise<string>;
  readonly submit: (prepared: string) => Promise<void>;
}

function Harness({ prepare, submit }: HarnessProps) {
  const flow = useConfirmFlow({ prepare, submit });
  const [draft, setDraft] = useState("原始草稿");

  return (
    <>
      <ActionButton
        label="保存"
        busy={flow.isPreparing}
        onRun={() => void flow.request()}
      />
      <p data-testid="draft">{draft}</p>
      <button type="button" onClick={() => setDraft("修改后的草稿")}>
        修改草稿
      </button>
      <InlineError error={flow.error} />
      <ConfirmDialog
        flow={flow}
        title="确认保存"
        description="请核对摘要与影响范围"
        confirmLabel="确认保存"
        cancelLabel="取消"
      >
        <p data-testid="summary">影响 {flow.prepared ?? "无"}</p>
      </ConfirmDialog>
    </>
  );
}

async function openDialog() {
  const trigger = screen.getByRole("button", { name: "保存" });
  trigger.focus();
  fireEvent.click(trigger);
  return screen.findByRole("dialog", { name: "确认保存" });
}

describe("确认流", () => {
  it("等待用户选择时不显示 loading，取消不提交且保留草稿", async () => {
    const submit = vi.fn(async () => {});
    renderWithText(<Harness prepare={async () => "2 条"} submit={submit} />);

    fireEvent.click(screen.getByRole("button", { name: "修改草稿" }));
    expect(screen.getByTestId("draft")).toHaveTextContent("修改后的草稿");

    const dialog = await openDialog();
    expect(screen.getByTestId("summary")).toHaveTextContent("影响 2 条");
    expect(submit).not.toHaveBeenCalled();

    const confirm = within(dialog).getByRole("button", {
      name: "确认保存",
    });
    expect(confirm).not.toHaveAttribute("aria-busy");
    expect(
      within(dialog).queryByTestId("button-spinner"),
    ).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "取消" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByTestId("draft")).toHaveTextContent("修改后的草稿");
    expect(screen.getByRole("button", { name: "保存" })).toHaveFocus();
  });

  it("确认只提交一次，提交中保留原文案并显示 loading", async () => {
    let resolveSubmit: () => void = () => {};
    const submit = vi.fn(
      (prepared: string) =>
        new Promise<void>((resolve) => {
          expect(prepared).toBe("2 条");
          resolveSubmit = resolve;
        }),
    );

    renderWithText(<Harness prepare={async () => "2 条"} submit={submit} />);
    const dialog = await openDialog();
    const confirm = within(dialog).getByRole("button", { name: "确认保存" });

    fireEvent.click(confirm);
    fireEvent.click(confirm);

    expect(submit).toHaveBeenCalledTimes(1);
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveAttribute("aria-busy", "true");
    expect(confirm).toHaveTextContent(/^确认保存$/);
    expect(within(dialog).getByTestId("button-spinner")).toBeInTheDocument();

    await act(async () => {
      resolveSubmit();
    });

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("准备期间在触发按钮上 loading，重复触发只准备一次", async () => {
    let resolvePrepare: (value: string) => void = () => {};
    const prepare = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolvePrepare = resolve;
        }),
    );
    renderWithText(<Harness prepare={prepare} submit={async () => {}} />);

    const trigger = screen.getByRole("button", { name: "保存" });
    fireEvent.click(trigger);
    fireEvent.click(trigger);

    expect(prepare).toHaveBeenCalledTimes(1);
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await act(async () => {
      resolvePrepare("2 条");
    });

    const dialog = await screen.findByRole("dialog", { name: "确认保存" });
    expect(trigger).not.toHaveAttribute("aria-busy");
    expect(within(dialog).getByTestId("summary")).toHaveTextContent(
      "影响 2 条",
    );
  });

  it("准备失败时在操作区块显示稳定文案，不打开弹窗", async () => {
    const prepare = vi.fn(async () => {
      throw new WebApiError({
        status: 0,
        code: "NETWORK_ERROR",
        message: "原始网络错误",
      });
    });
    renderWithText(<Harness prepare={prepare} submit={async () => {}} />);

    const trigger = screen.getByRole("button", { name: "保存" });
    fireEvent.click(trigger);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "无法连接服务器，请检查网络后重试",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toBeEnabled());
    expect(trigger).not.toHaveAttribute("aria-busy");
  });

  it("提交失败后弹窗保持打开、恢复到可确认状态并允许显式重试", async () => {
    const submit = vi
      .fn<(prepared: string) => Promise<void>>()
      .mockRejectedValueOnce(
        new WebApiError({
          status: 500,
          code: "INTERNAL_ERROR",
          message: "原始内部错误",
        }),
      )
      .mockResolvedValueOnce(undefined);

    renderWithText(<Harness prepare={async () => "2 条"} submit={submit} />);
    const dialog = await openDialog();
    const confirm = within(dialog).getByRole("button", { name: "确认保存" });

    fireEvent.click(confirm);

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "服务器暂时无法处理该操作，请稍后重试",
    );
    expect(
      screen.getByRole("dialog", { name: "确认保存" }),
    ).toBeInTheDocument();
    expect(confirm).toBeEnabled();
    expect(confirm).not.toHaveAttribute("aria-busy");

    fireEvent.click(confirm);
    expect(submit).toHaveBeenCalledTimes(2);

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("弹窗有可访问名称/描述，Esc 关闭后焦点回到触发按钮", async () => {
    const submit = vi.fn(async () => {});
    renderWithText(<Harness prepare={async () => "2 条"} submit={submit} />);

    const trigger = screen.getByRole("button", { name: "保存" });
    const dialog = await openDialog();
    expect(dialog).toHaveAccessibleDescription("请核对摘要与影响范围");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(submit).not.toHaveBeenCalled();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
