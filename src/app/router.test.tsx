import { QueryClient } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppProviders } from "@/app/AppProviders";
import { routes } from "@/app/router";
import { adminSession, employeeSession } from "@/test/fixtures";
import { jsonResponse } from "@/test/http";
import { renderApp } from "@/test/renderApp";

type FetchFunction = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("会话守卫", () => {
  it("未登录访问受保护路由时跳到登录页并带上 next", async () => {
    const { router } = renderApp({
      session: null,
      initialEntries: ["/admin/org-9/workflows"],
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });

    const next = new URLSearchParams(router.state.location.search).get("next");
    expect(next).toBe("/admin/org-9/workflows");
    expect(
      screen.getByRole("heading", { name: "登录 SMEDC" }),
    ).toBeInTheDocument();
  });

  it("已登录访问登录页时跳回首页", async () => {
    const { router } = renderApp({
      session: adminSession,
      initialEntries: ["/login"],
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/admin/org-1/permissions");
    });
    expect(
      screen.getByRole("heading", { name: "权限设置" }),
    ).toBeInTheDocument();
  });

  it("加载会话期间显示骨架而不是登录页", () => {
    const fetchMock = vi.fn(() => new Promise<Response>(() => {}));
    vi.stubGlobal("fetch", fetchMock);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const router = createMemoryRouter(routes, {
      initialEntries: ["/ledger"],
    });

    render(
      <AppProviders queryClient={queryClient}>
        <RouterProvider router={router} />
      </AppProviders>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "登录 SMEDC" }),
    ).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/ledger");
  });

  it("管理员访问根路径时按角色跳到权限设置", async () => {
    const { router } = renderApp({
      session: adminSession,
      initialEntries: ["/"],
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/admin/org-1/permissions");
    });
  });

  it("员工访问根路径时跳到台账下载中心", async () => {
    const { router } = renderApp({
      session: employeeSession,
      initialEntries: ["/"],
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/ledger");
    });
    expect(
      screen.getByRole("heading", { name: "台账下载中心" }),
    ).toBeInTheDocument();
  });
});

describe("主导航", () => {
  it("管理员看到管理设置与台账下载中心", () => {
    renderApp({ session: adminSession, initialEntries: ["/ledger"] });

    expect(screen.getByRole("link", { name: "管理设置" })).toHaveAttribute(
      "href",
      "/admin/org-1/permissions",
    );
    expect(screen.getByRole("link", { name: "台账下载中心" })).toHaveAttribute(
      "href",
      "/ledger",
    );
    expect(screen.getByText("示例企业 · 张三")).toBeInTheDocument();
  });

  it("员工只看到台账下载中心", () => {
    renderApp({ session: employeeSession, initialEntries: ["/ledger"] });

    expect(
      screen.queryByRole("link", { name: "管理设置" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "台账下载中心" })).toHaveAttribute(
      "href",
      "/ledger",
    );
  });

  it("移动端导航按钮可切换展开状态", () => {
    renderApp({ session: employeeSession, initialEntries: ["/ledger"] });

    const toggle = screen.getByRole("button", { name: "展开导航" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);

    expect(screen.getByRole("button", { name: "收起导航" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("退出登录后回到登录页", async () => {
    const fetchMock = vi.fn<FetchFunction>(async (_input, init) => {
      if ((init?.method ?? "GET") === "DELETE") {
        return jsonResponse({ signedOut: true });
      }
      return jsonResponse(
        { error: { code: "BROWSER_SIGN_IN_REQUIRED", message: "请先登录" } },
        401,
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const { router } = renderApp({
      session: adminSession,
      initialEntries: ["/ledger"],
    });

    fireEvent.click(screen.getByRole("button", { name: "退出登录" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });
  });
});

describe("管理设置二级导航", () => {
  it("深链直接打开 workflows 时选中自动任务并保留 orgId", () => {
    renderApp({
      session: adminSession,
      initialEntries: ["/admin/x/workflows"],
    });

    const workflowsLink = screen.getByRole("link", { name: "自动任务" });
    expect(workflowsLink).toHaveAttribute("aria-current", "page");
    expect(workflowsLink).toHaveAttribute("href", "/admin/x/workflows");

    const permissionsLink = screen.getByRole("link", { name: "权限设置" });
    expect(permissionsLink).not.toHaveAttribute("aria-current");
    expect(permissionsLink).toHaveAttribute("href", "/admin/x/permissions");
  });

  it("深链指定业务企业时仍选中自动任务", () => {
    renderApp({
      session: adminSession,
      initialEntries: ["/admin/x/workflows/enterprise-1"],
    });

    expect(screen.getByRole("link", { name: "自动任务" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

describe("错误页", () => {
  it("未知路径渲染 404 页面", () => {
    renderApp({
      session: employeeSession,
      initialEntries: ["/does-not-exist"],
    });

    expect(
      screen.getByRole("heading", { name: "页面不存在" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "返回首页" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
