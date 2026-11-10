import type { RouteObject } from "react-router";
import { createBrowserRouter } from "react-router";

import { HomeRedirect } from "@/app/HomeRedirect";
import { LoginPage } from "@/app/LoginPage";
import { NotFoundPage } from "@/app/NotFoundPage";
import { RouteErrorPage } from "@/app/RouteErrorPage";
import { SessionGate } from "@/app/SessionGate";
import { DirectoryPage } from "@/features/directory/Page";
import { LedgerPage } from "@/features/ledger/Page";
import { PermissionsPage } from "@/features/permissions/Page";
import { WorkflowsPage } from "@/features/workflows/Page";

// 路由表独立导出：浏览器用 createBrowserRouter，测试用 createMemoryRouter 复用同一份定义
export const routes: RouteObject[] = [
  {
    element: <SessionGate />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomeRedirect /> },
      { path: "admin/:orgId/directory", element: <DirectoryPage /> },
      { path: "admin/:orgId/permissions", element: <PermissionsPage /> },
      { path: "admin/:orgId/workflows", element: <WorkflowsPage /> },
      {
        path: "admin/:orgId/workflows/:enterpriseKey",
        element: <WorkflowsPage />,
      },
      { path: "ledger", element: <LedgerPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <RouteErrorPage />,
  },
];

export const router = createBrowserRouter(routes);
