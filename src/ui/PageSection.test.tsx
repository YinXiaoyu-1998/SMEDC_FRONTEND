import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageSection } from "@/ui/PageSection";
import { renderWithText } from "@/test/renderWithText";

describe("PageSection", () => {
  it("以标题命名 region 并渲染说明、操作与内容槽", () => {
    renderWithText(
      <PageSection
        title="任务设置"
        description="维护来源与执行条件"
        actions={<button type="button">保存任务设置</button>}
      >
        <p>任务内容</p>
      </PageSection>,
    );

    const region = screen.getByRole("region", { name: "任务设置" });
    expect(region).toHaveTextContent("维护来源与执行条件");
    expect(region).toHaveTextContent("任务内容");
    expect(
      screen.getByRole("button", { name: "保存任务设置" }),
    ).toBeInTheDocument();
  });

  it("没有说明与操作时只保留内容槽", () => {
    renderWithText(
      <PageSection title="来源设置">
        <p>来源内容</p>
      </PageSection>,
    );

    expect(screen.getByRole("region", { name: "来源设置" })).toHaveTextContent(
      "来源内容",
    );
  });
});
