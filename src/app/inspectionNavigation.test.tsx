import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  adminSession,
  employeeSession,
  inspectingEmployeeSession,
  inspectionLeadSession,
  inspectionViewerSession,
  templateMaintainerSession,
} from "@/test/fixtures";
import { jsonResponse } from "@/test/http";
import { renderApp } from "@/test/renderApp";

type FetchFunction = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

function fillCredentials(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("邮箱"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText("密码"), {
    target: { value: password },
  });
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("巡检导航与路由", () => {
  it("有看卷权限的员工看到巡检入口", () => {
    renderApp({
      session: inspectionViewerSession,
      initialEntries: ["/ledger"],
    });

    expect(screen.getByRole("link", { name: "巡检" })).toHaveAttribute(
      "href",
      "/inspections",
    );
    expect(
      screen.queryByRole("link", { name: "巡检模板" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "管理设置" }),
    ).not.toBeInTheDocument();
  });

  it("可填写的员工同样只看到巡检入口", () => {
    renderApp({
      session: inspectingEmployeeSession,
      initialEntries: ["/ledger"],
    });

    expect(screen.getByRole("link", { name: "巡检" })).toHaveAttribute(
      "href",
      "/inspections",
    );
    expect(
      screen.queryByRole("link", { name: "巡检模板" }),
    ).not.toBeInTheDocument();
  });

  it("有巡检能力的员工访问根路径时进入巡检", async () => {
    const { router } = renderApp({
      session: inspectionViewerSession,
      initialEntries: ["/"],
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/inspections");
    });
    expect(screen.getByRole("heading", { name: "巡检" })).toBeInTheDocument();
  });

  it("仅模板维护账号看到独立的巡检模板入口", async () => {
    const { router } = renderApp({
      session: templateMaintainerSession,
      initialEntries: ["/ledger"],
    });

    expect(screen.getByRole("link", { name: "巡检模板" })).toHaveAttribute(
      "href",
      "/inspections/templates",
    );
    expect(
      screen.queryByRole("link", { name: "巡检" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "管理设置" }),
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/ledger");
    });
  });

  it("仅模板维护账号访问根路径时进入巡检模板", async () => {
    const { router } = renderApp({
      session: templateMaintainerSession,
      initialEntries: ["/"],
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/inspections/templates");
    });
    expect(
      screen.getByRole("heading", { name: "巡检模板" }),
    ).toBeInTheDocument();
  });

  it("旧账号没有巡检字段时保持原有导航与首页", async () => {
    const employeeView = renderApp({
      session: employeeSession,
      initialEntries: ["/"],
    });

    await waitFor(() => {
      expect(employeeView.router.state.location.pathname).toBe("/ledger");
    });
    expect(
      screen.queryByRole("link", { name: "巡检" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "巡检模板" }),
    ).not.toBeInTheDocument();
    employeeView.unmount();

    const adminView = renderApp({
      session: adminSession,
      initialEntries: ["/"],
    });

    await waitFor(() => {
      expect(adminView.router.state.location.pathname).toBe(
        "/admin/org-1/permissions",
      );
    });
    expect(
      screen.queryByRole("link", { name: "巡检" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "巡检模板" }),
    ).not.toBeInTheDocument();
  });

  it("巡检入口使用中英双语标签", () => {
    renderApp({
      session: inspectionLeadSession,
      initialEntries: ["/inspections"],
    });

    expect(screen.getByRole("heading", { name: "巡检" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "English" }));

    expect(
      screen.getByRole("heading", { name: "Inspections" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Inspections" })).toHaveAttribute(
      "href",
      "/inspections",
    );
    expect(
      screen.getByRole("link", { name: "Inspection templates" }),
    ).toHaveAttribute("href", "/inspections/templates");
  });
});

describe("巡检深链登录", () => {
  it("未登录访问巡检深链时保留查询参数到登录页", async () => {
    const { router } = renderApp({
      session: null,
      initialEntries: ["/inspections?date=2026-11-23"],
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });

    expect(new URLSearchParams(router.state.location.search).get("next")).toBe(
      "/inspections?date=2026-11-23",
    );
  });

  it("未登录访问巡检模板深链时保留到登录页", async () => {
    const { router } = renderApp({
      session: null,
      initialEntries: ["/inspections/templates"],
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });
    expect(new URLSearchParams(router.state.location.search).get("next")).toBe(
      "/inspections/templates",
    );
  });

  it("登录后回到巡检深链而不是默认首页", async () => {
    const fetchMock = vi.fn<FetchFunction>(async (_input, init) =>
      (init?.method ?? "GET") === "POST"
        ? jsonResponse(inspectingEmployeeSession)
        : jsonResponse(
            {
              error: {
                code: "BROWSER_SIGN_IN_REQUIRED",
                message: "请先登录",
              },
            },
            401,
          ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { router } = renderApp({
      session: null,
      initialEntries: ["/login?next=%2Finspections%3Fdate%3D2026-11-23"],
    });
    fillCredentials("zhangsan@example.com", "secret-123");

    fireEvent.click(screen.getByRole("button", { name: "登录" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/inspections");
    });
    expect(router.state.location.search).toBe("?date=2026-11-23");
  });
});
