import { act, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { WebApiError } from "@/api/client";
import { InlineError } from "@/ui/InlineError";
import {
  errorKeyFor,
  errorKeyForCode,
  fallbackErrorKey,
  webApiErrorKeys,
} from "@/ui/errors";
import { useActionFeedback } from "@/ui/useActionFeedback";
import { TextProvider } from "@/i18n/TextProvider";
import { renderWithText } from "@/test/renderWithText";

function TextWrapper({ children }: { readonly children: ReactNode }) {
  return <TextProvider>{children}</TextProvider>;
}

afterEach(() => {
  localStorage.clear();
  document.documentElement.lang = "";
});

describe("接口错误映射", () => {
  it("已知 code 映射到稳定文案键", () => {
    expect(webApiErrorKeys.NETWORK_ERROR).toBe("errors.action.network");
    expect(errorKeyForCode("NETWORK_ERROR")).toBe("errors.action.network");
    expect(errorKeyForCode("BROWSER_SIGN_IN_REQUIRED")).toBe(
      "errors.action.sessionExpired",
    );
    expect(
      errorKeyFor(
        new WebApiError({
          status: 409,
          code: "VERSION_CONFLICT",
          message: "版本冲突",
        }),
      ),
    ).toBe("errors.action.versionConflict");
  });

  it("未知 code 与普通异常回退通用文案", () => {
    expect(errorKeyForCode("SOME_NEW_CODE")).toBe(fallbackErrorKey);
    expect(errorKeyForCode(null)).toBe(fallbackErrorKey);
    expect(errorKeyFor(new Error("raw"))).toBe(fallbackErrorKey);
  });

  it("InlineError 显示映射文案，不泄露服务端原始 message", () => {
    renderWithText(
      <InlineError
        error={
          new WebApiError({
            status: 500,
            code: "SOME_NEW_CODE",
            message: "内部数据库连接失败",
          })
        }
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("操作失败，请重试");
    expect(screen.queryByText("内部数据库连接失败")).toBeNull();
  });

  it("InlineError 跟随界面语言", () => {
    localStorage.setItem("smedc-locale", "en");
    renderWithText(<InlineError error="UNKNOWN" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The action failed. Please try again.",
    );
  });
});

describe("useActionFeedback", () => {
  it("保存/清空错误并返回当前语言的文案", () => {
    const { result } = renderHook(() => useActionFeedback(), {
      wrapper: TextWrapper,
    });

    expect(result.current.message).toBeNull();

    act(() => {
      result.current.setError(
        new WebApiError({
          status: 500,
          code: "INTERNAL_ERROR",
          message: "raw",
        }),
      );
    });

    expect(result.current.errorKey).toBe("errors.action.internal");
    expect(result.current.message).toBe("服务器暂时无法处理该操作，请稍后重试");

    act(() => {
      result.current.clear();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.message).toBeNull();
  });
});
