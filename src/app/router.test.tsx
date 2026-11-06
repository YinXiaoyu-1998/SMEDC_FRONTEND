import { render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { routes } from "@/app/router";

describe("路由表", () => {
  it("根路径渲染出占位页", () => {
    // jsdom 下用内存路由，避免依赖真实的浏览器 history
    const router = createMemoryRouter(routes, { initialEntries: ["/"] });

    render(<RouterProvider router={router} />);

    expect(screen.getByTestId("placeholder")).toBeInTheDocument();
  });
});
