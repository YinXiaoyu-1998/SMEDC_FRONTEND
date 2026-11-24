import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { adminSession } from "@/test/fixtures";
import { jsonResponse } from "@/test/http";
import { renderApp } from "@/test/renderApp";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

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
          captcha: { prefix: "synthetic", sceneId: "registration-scene" },
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
    ["组织名称", "晨光餐饮"],
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
          captcha: { prefix: "synthetic", sceneId: "registration-scene" },
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
    ["组织名称", "新企业"],
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

it("发信失败后恢复浏览器绑定，等待冷却后在当前页重试", async () => {
  const email = "owner@example.com";
  const baseTime = Date.now();
  let bound = false;
  const sendHeaders: Headers[] = [];
  vi.stubGlobal(
    "initAliyunCaptcha",
    (options: {
      button: string;
      captchaVerifyCallback: (
        token: string,
      ) => Promise<{ captchaResult: boolean; bizResult: boolean }>;
      onBizResultCallback: (success: boolean) => void;
      getInstance: (instance: object) => void;
    }) => {
      document.querySelector(options.button)?.addEventListener("click", () => {
        void options.captchaVerifyCallback("human-proof").then((result) => {
          options.onBizResultCallback(result.bizResult);
        });
      });
      options.getInstance({});
    },
  );
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input);
      if (path.endsWith("/registration/session"))
        return jsonResponse(
          bound
            ? {
                status: "sent",
                email,
                captcha: { prefix: "synthetic", sceneId: "registration-scene" },
                csrfToken: "recovered-csrf",
                expiresAt: new Date(baseTime + 600_000).toISOString(),
                resendAvailableAt: new Date(baseTime + 60_000).toISOString(),
              }
            : {
                status: "start",
                captcha: { prefix: "synthetic", sceneId: "registration-scene" },
              },
        );
      if (path.endsWith("/registration/send-code")) {
        sendHeaders.push(new Headers(init?.headers));
        bound = true;
        return jsonResponse(
          {
            error: {
              code: "REGISTRATION_DELIVERY_FAILED",
              message: "try again",
            },
          },
          503,
        );
      }
      return jsonResponse(null);
    }),
  );
  const { router } = renderApp({
    session: null,
    initialEntries: ["/register"],
  });
  const input = await screen.findByRole("textbox", { name: "邮箱" });
  fireEvent.change(input, { target: { value: email } });
  const send = screen.getByRole("button", { name: "发送验证码" });
  await waitFor(() => expect(send).toBeEnabled());
  vi.useFakeTimers({ now: baseTime });
  fireEvent.click(send);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
  expect(sendHeaders).toHaveLength(1);
  expect(sendHeaders[0]!.get("x-csrf-token")).toBeNull();
  expect(screen.getByRole("alert")).toHaveTextContent("邮件发送失败");
  const resend = screen.getByRole("button", { name: /发送验证码/ });
  expect(resend).toBeDisabled();
  expect(resend).toHaveTextContent("60 秒后可重发");
  expect(input).toHaveValue(email);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60_000);
  });
  expect(resend).toBeEnabled();
  fireEvent.click(resend);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
  expect(sendHeaders).toHaveLength(2);
  expect(sendHeaders[1]!.get("x-csrf-token")).toBe("recovered-csrf");
  expect(router.state.location.pathname).toBe("/register");
});
