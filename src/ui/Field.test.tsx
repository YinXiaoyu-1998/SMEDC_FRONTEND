import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Field, FormField } from "@/ui/Field";
import { renderWithText } from "@/test/renderWithText";

describe("Field", () => {
  it("把 label/hint/error 与 aria-describedby、aria-invalid 绑定", () => {
    renderWithText(
      <Field label="门店名称" hint="用于列表展示" error="名称不能为空" required>
        <input />
      </Field>,
    );

    const input = screen.getByRole("textbox", { name: "门店名称" });
    const hint = screen.getByText("用于列表展示");
    const error = screen.getByText("名称不能为空");

    expect(input).toBeRequired();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", `${hint.id} ${error.id}`);
    expect(hint.id).not.toBe("");
    expect(error.id).not.toBe("");
    expect(error).toHaveAttribute("role", "alert");
  });

  it("没有错误时不设置 aria-invalid，只绑定提示", () => {
    renderWithText(
      <Field label="门店名称" hint="用于列表展示">
        <input />
      </Field>,
    );

    const input = screen.getByLabelText("门店名称");
    const hint = screen.getByText("用于列表展示");

    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).toHaveAttribute("aria-describedby", hint.id);
  });

  it("没有提示与错误时不挂 aria-describedby", () => {
    renderWithText(
      <Field label="门店名称">
        <input />
      </Field>,
    );

    expect(screen.getByLabelText("门店名称")).not.toHaveAttribute(
      "aria-describedby",
    );
  });

  it("保留控件已有 id 与 aria-describedby 并合并新的描述", () => {
    renderWithText(
      <>
        <p id="external-hint">外部说明</p>
        <Field label="备注" hint="补充说明">
          <textarea id="note" aria-describedby="external-hint" />
        </Field>
      </>,
    );

    const input = screen.getByLabelText("备注");
    const hint = screen.getByText("补充说明");
    expect(input).toHaveAttribute("id", "note");
    expect(input).toHaveAttribute(
      "aria-describedby",
      `external-hint ${hint.id}`,
    );
  });

  it("FormField 与 Field 行为一致", () => {
    renderWithText(
      <FormField label="邮箱" error="请输入邮箱">
        <input type="email" />
      </FormField>,
    );

    const input = screen.getByLabelText("邮箱");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("请输入邮箱");
  });
});
