import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { adminSession } from "@/test/fixtures";
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
