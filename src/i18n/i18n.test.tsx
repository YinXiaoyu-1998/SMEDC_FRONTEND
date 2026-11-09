import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { baseMessages } from "@/i18n/messages";
import { mergeText, resolveText } from "@/i18n/text";
import { renderApp } from "@/test/renderApp";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  document.documentElement.lang = "";
});

describe("界面语言", () => {
  it("默认中文，切换英文后文案变化并写入 localStorage", () => {
    renderApp({ session: null, initialEntries: ["/login"] });

    expect(
      screen.getByRole("heading", { name: "登录 SMEDC" }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("zh-CN");

    fireEvent.click(screen.getByRole("button", { name: "English" }));

    expect(
      screen.getByRole("heading", { name: "Sign in to SMEDC" }),
    ).toBeInTheDocument();
    expect(localStorage.getItem("smedc-locale")).toBe("en");
    expect(document.documentElement.lang).toBe("en");

    fireEvent.click(screen.getByRole("button", { name: "中文" }));

    expect(
      screen.getByRole("heading", { name: "登录 SMEDC" }),
    ).toBeInTheDocument();
    expect(localStorage.getItem("smedc-locale")).toBe("zh");
    expect(document.documentElement.lang).toBe("zh-CN");
  });

  it("读取已存储的语言偏好", () => {
    localStorage.setItem("smedc-locale", "en");

    renderApp({ session: null, initialEntries: ["/login"] });

    expect(
      screen.getByRole("heading", { name: "Sign in to SMEDC" }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("en");
  });

  it("mergeText 允许业务字典补充与覆盖文案", () => {
    const merged = mergeText(baseMessages, {
      "pages.ledger.title": ["对账中心", "Reconciliation"],
    });

    expect(resolveText(merged, "zh", "pages.ledger.title")).toBe("对账中心");
    expect(resolveText(merged, "en", "pages.ledger.title")).toBe(
      "Reconciliation",
    );
    expect(resolveText(merged, "en", "login.submit")).toBe("Sign in");
    expect(resolveText(merged, "zh", "missing.key")).toBe("missing.key");
  });
});
