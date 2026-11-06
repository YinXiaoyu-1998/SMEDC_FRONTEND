import type { RouteObject } from "react-router";
import { createBrowserRouter } from "react-router";

import { AppShell } from "@/app/AppShell";
import { PlaceholderPage } from "@/app/pages/PlaceholderPage";

// 路由表独立导出：浏览器用 createBrowserRouter，测试用 createMemoryRouter 复用同一份定义
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppShell />,
    children: [{ index: true, element: <PlaceholderPage /> }],
  },
];

export const router = createBrowserRouter(routes);
