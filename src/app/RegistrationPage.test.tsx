import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { adminSession } from "@/test/fixtures";
import { jsonResponse } from "@/test/http";
import { renderApp } from "@/test/renderApp";

afterEach(() => vi.unstubAllGlobals());

it("登录页为新企业提供官方网页入口，并给已有企业员工开户指引", () => {
  renderApp({ session: null, initialEntries: ["/login"] });
  expect(screen.getByRole("link", { name: "注册并创建企业" })).toHaveAttribute(
    "href",
    "/register",
  );
  expect(screen.getByText(/联系运维开户/)).toBeInTheDocument();
});

it("已验证邮箱的本人创建首管后进入新组织权限页", async () => {
  const email = "owner@example.com";
  const request = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input);
      if (path.endsWith("/registration/session"))
        return jsonResponse({
          status: "verified",
          email,
          siteKey: "site-key",
          csrfToken: "csrf-value",
        });
      if (path.endsWith("/registration/complete")) {
        expect(new Headers(init?.headers).get("x-csrf-token")).toBe(
          "csrf-value",
        );
        expect(JSON.parse(String(init?.body))).toEqual({
          organizationName: "晨光餐饮",
          displayName: "林经理",
          password: "testonly-strong-one",
        });
        return jsonResponse(adminSession);
      }
      return jsonResponse(adminSession);
    },
  );
  vi.stubGlobal("fetch", request);
  const { router } = renderApp({
    session: null,
    initialEntries: ["/register/verify"],
  });
  expect(await screen.findByText(email)).toBeInTheDocument();
  for (const [label, value] of [
    ["企业名称", "晨光餐饮"],
    ["本人显示名", "林经理"],
    ["密码", "testonly-strong-one"],
  ]) {
    fireEvent.change(screen.getByLabelText(label!), { target: { value } });
  }
  fireEvent.click(screen.getByRole("button", { name: "创建企业" }));
  await waitFor(() =>
    expect(router.state.location.pathname).toBe("/admin/org-1/permissions"),
  );
});

it("邮箱在运维并发开户后引导登录，不能再提交首管开户", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith("/session"))
        return jsonResponse({
          status: "verified",
          email: "owner@example.com",
          siteKey: "site-key",
          csrfToken: "csrf",
        });
      return jsonResponse(
        {
          error: { code: "REGISTRATION_EMAIL_IN_USE", message: "already used" },
        },
        409,
      );
    }),
  );
  renderApp({ session: null, initialEntries: ["/register/verify"] });
  await screen.findByText("owner@example.com");
  for (const [label, value] of [
    ["企业名称", "新企业"],
    ["本人显示名", "负责人"],
    ["密码", "testonly-strong-one"],
  ] as const) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
  fireEvent.click(screen.getByRole("button", { name: "创建企业" }));
  await screen.findByText("该邮箱已有账号。请登录或联系运维。");
  expect(screen.queryByRole("button", { name: "创建企业" })).toBeNull();
  expect(screen.getByRole("link", { name: "返回登录" })).toBeVisible();
});
