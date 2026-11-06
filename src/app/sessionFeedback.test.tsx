import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { RouteObject } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { requestWebApi } from "@/api/client";
import { sessionQueryKey } from "@/api/session";
import { useAuthFeedback } from "@/app/authFeedback";
import { LoginPage } from "@/app/LoginPage";
import { SessionGate } from "@/app/SessionGate";
import { adminSession } from "@/test/fixtures";
import { jsonResponse } from "@/test/http";
import { renderApp } from "@/test/renderApp";

type FetchFunction = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

function UnauthorizedProbe() {
  return (
    <button
      type="button"
      onClick={() => {
        void requestWebApi({ method: "GET", path: "/probe" }).catch(() => {});
      }}
    >
      触发 401
    </button>
  );
}

function ForbiddenProbe() {
  const { notifyForbidden } = useAuthFeedback();
  return (
    <button type="button" onClick={notifyForbidden}>
      触发 403
    </button>
  );
}

const probeRoutes: RouteObject[] = [
  {
    element: <SessionGate />,
    children: [
      { path: "probe", element: <UnauthorizedProbe /> },
      { path: "forbidden", element: <ForbiddenProbe /> },
    ],
  },
  { path: "/login", element: <LoginPage /> },
];

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("接口反馈", () => {
  it("401 清空业务缓存、带 next 跳登录并提示会话过期", async () => {
    const fetchMock = vi.fn<FetchFunction>(async () =>
      jsonResponse(
        { error: { code: "BROWSER_SIGN_IN_REQUIRED", message: "请先登录" } },
        401,
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { router, queryClient } = renderApp({
      session: adminSession,
      initialEntries: ["/probe"],
      routes: probeRoutes,
    });
    queryClient.setQueryData(["business", "data"], { secret: true });

    fireEvent.click(screen.getByRole("button", { name: "触发 401" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });

    expect(new URLSearchParams(router.state.location.search).get("next")).toBe(
      "/probe",
    );
    expect(queryClient.getQueryData(sessionQueryKey)).toBeNull();
    expect(queryClient.getQueryData(["business", "data"])).toBeUndefined();
    expect(screen.getByRole("status")).toHaveTextContent("登录状态已过期");
  });

  it("403 显示无访问权限页并可重试恢复", async () => {
    renderApp({
      session: adminSession,
      initialEntries: ["/forbidden"],
      routes: probeRoutes,
    });

    fireEvent.click(screen.getByRole("button", { name: "触发 403" }));

    expect(
      screen.getByRole("heading", { name: "无访问权限" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "重试" }));

    expect(
      screen.getByRole("button", { name: "触发 403" }),
    ).toBeInTheDocument();
  });
});
