import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { adminSession, employeeSession } from "@/test/fixtures";
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

describe("登录表单", () => {
  it("提交前校验邮箱格式与密码长度", () => {
    renderApp({ session: null, initialEntries: ["/login"] });

    fireEvent.click(screen.getByRole("button", { name: "登录" }));

    expect(screen.getByText("请输入邮箱")).toBeInTheDocument();
    expect(screen.getByText("请输入密码")).toBeInTheDocument();

    fillCredentials("not-an-email", "a".repeat(129));
    fireEvent.click(screen.getByRole("button", { name: "登录" }));

    expect(screen.getByText("请输入有效的邮箱地址")).toBeInTheDocument();
    expect(screen.getByText("密码长度不能超过 128 个字符")).toBeInTheDocument();
  });

  it("已注册的首位管理员可使用 128 个 Unicode 码点的密码登录", async () => {
    const password = "𠀋".repeat(128);
    const fetchMock = vi.fn<FetchFunction>(async () =>
      jsonResponse(adminSession),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { router } = renderApp({ session: null, initialEntries: ["/login"] });
    fillCredentials("owner@example.com", password);
    fireEvent.click(screen.getByRole("button", { name: "登录" }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/admin/org-1/permissions");
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/^\/api\/web\/v1\/session(?:\?|$)/),
        expect.objectContaining({
          body: JSON.stringify({ email: "owner@example.com", password }),
        }),
      );
    });
  });

  it("请求中按钮禁用并保留文案，失败时显示统一错误", async () => {
    let resolveRequest: ((response: Response) => void) | null = null;
    const fetchMock = vi.fn<FetchFunction>(
      () =>
        new Promise<Response>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderApp({ session: null, initialEntries: ["/login"] });
    fillCredentials("zhangsan@example.com", "secret-123");

    fireEvent.click(screen.getByRole("button", { name: "登录" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const submit = screen.getByRole("button", { name: "登录" });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute("aria-busy", "true");
    expect(submit).toHaveTextContent("登录");
    expect(screen.getByTestId("button-spinner")).toBeInTheDocument();

    await act(async () => {
      resolveRequest?.(
        jsonResponse(
          {
            error: {
              code: "BROWSER_INVALID_CREDENTIALS",
              message: "凭据无效",
            },
          },
          401,
        ),
      );
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "邮箱或密码不正确，请重试",
      );
    });

    const idleSubmit = screen.getByRole("button", { name: "登录" });
    expect(idleSubmit).not.toBeDisabled();
    expect(idleSubmit).not.toHaveAttribute("aria-busy");
  });

  it("登录成功后跳转到 next 指定的站内路径", async () => {
    const fetchMock = vi.fn<FetchFunction>(async () =>
      jsonResponse(adminSession),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { router } = renderApp({
      session: null,
      initialEntries: ["/login?next=%2Fadmin%2Forg-1%2Fworkflows"],
    });
    fillCredentials("zhangsan@example.com", "secret-123");

    fireEvent.click(screen.getByRole("button", { name: "登录" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/admin/org-1/workflows");
    });
  });

  it.each([
    {
      scenario: "换组织管理员登录",
      session: adminSession,
      previousPath: "/admin/org-previous/permissions",
      homePath: "/admin/org-1/permissions",
    },
    {
      scenario: "普通员工登录",
      session: employeeSession,
      previousPath: "/admin/org-1/permissions",
      homePath: "/ledger",
    },
  ])(
    "$scenario后跳过旧管理页，进入当前账号首页",
    async ({ session, previousPath, homePath }) => {
      vi.stubGlobal(
        "fetch",
        vi.fn<FetchFunction>(async () => jsonResponse(session)),
      );
      const { router } = renderApp({
        session: null,
        initialEntries: [previousPath],
      });
      await screen.findByRole("heading", { name: "登录企业智脑" });
      expect(
        new URLSearchParams(router.state.location.search).get("next"),
      ).toBe(previousPath);
      fillCredentials(session.identity.email, "secret-123");
      fireEvent.click(screen.getByRole("button", { name: "登录" }));
      await waitFor(() => {
        expect(router.state.location.pathname).toBe(homePath);
      });
    },
  );

  it("登录成功后忽略站外 next，按角色跳转", async () => {
    const fetchMock = vi.fn<FetchFunction>(async () =>
      jsonResponse(adminSession),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { router } = renderApp({
      session: null,
      initialEntries: ["/login?next=https%3A%2F%2Fevil.example%2Fsteal"],
    });
    fillCredentials("zhangsan@example.com", "secret-123");

    fireEvent.click(screen.getByRole("button", { name: "登录" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/admin/org-1/permissions");
    });
  });
});
