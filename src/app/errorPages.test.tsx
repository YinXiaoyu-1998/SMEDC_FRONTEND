import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppErrorBoundary } from "@/app/ErrorBoundary";
import { ForbiddenPage } from "@/app/ForbiddenPage";
import { TextProvider } from "@/i18n/TextProvider";
import { employeeSession } from "@/test/fixtures";
import { renderApp } from "@/test/renderApp";

let shouldThrow = true;

function FlakyView() {
  if (shouldThrow) {
    throw new Error("渲染失败");
  }
  return <p>已恢复</p>;
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("失败状态页", () => {
  it("403 页面展示无访问权限并可重试", () => {
    const onRetry = vi.fn();

    render(
      <TextProvider>
        <ForbiddenPage onRetry={onRetry} />
      </TextProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "无访问权限" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("404 页面嵌在应用外壳内", () => {
    renderApp({
      session: employeeSession,
      initialEntries: ["/missing-page"],
    });

    expect(
      screen.getByRole("heading", { name: "页面不存在" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "返回首页" })).toBeInTheDocument();
  });
});

describe("全局错误边界", () => {
  it("显示稳定文案并在重试后恢复", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    shouldThrow = true;

    render(
      <TextProvider>
        <AppErrorBoundary>
          <FlakyView />
        </AppErrorBoundary>
      </TextProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "页面暂时无法显示" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("渲染失败")).not.toBeInTheDocument();
    expect(screen.queryByText(/at FlakyView/)).not.toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: "重试" }));

    expect(screen.getByText("已恢复")).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
