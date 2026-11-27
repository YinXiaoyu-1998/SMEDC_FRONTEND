import { RegistrationPage } from "@/features/registration/Page";
import type { RouteObject } from "react-router";
import { createBrowserRouter } from "react-router";

import { AuthCardLoading } from "@/app/AuthCard";
import {
  deviceVerificationPath,
  passwordSetupFormPath,
  passwordSetupPath,
} from "@/features/browser-auth/api";
import { DeviceVerificationPage } from "@/features/browser-auth/DeviceVerificationPage";
import {
  loadDeviceVerification,
  loadPasswordSetupForm,
  loadPasswordSetupLink,
} from "@/features/browser-auth/loaders";
import {
  PasswordSetupLinkPage,
  PasswordSetupPage,
} from "@/features/browser-auth/PasswordSetupPage";
import { HomePage } from "@/app/HomePage";
import { LoginPage } from "@/app/LoginPage";
import { NotFoundPage } from "@/app/NotFoundPage";
import { RouteErrorPage } from "@/app/RouteErrorPage";
import { SessionGate } from "@/app/SessionGate";
import { DirectoryPage } from "@/features/directory/Page";
import { InspectionsPage } from "@/features/inspections/Page";
import { InspectionTemplatesPage } from "@/features/inspections/TemplatesPage";
import { LedgerPage } from "@/features/ledger/Page";
import { PermissionsPage } from "@/features/permissions/Page";
import { WorkflowsPage } from "@/features/workflows/Page";

// 路由表独立导出：浏览器用 createBrowserRouter，测试用 createMemoryRouter 复用同一份定义
export const routes: RouteObject[] = [
  { path: "/", element: <HomePage />, errorElement: <RouteErrorPage /> },
  {
    path: passwordSetupPath,
    loader: loadPasswordSetupLink,
    element: <PasswordSetupLinkPage />,
    hydrateFallbackElement: <AuthCardLoading titleKey="passwordSetup.title" />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: passwordSetupFormPath,
    loader: loadPasswordSetupForm,
    element: <PasswordSetupPage />,
    hydrateFallbackElement: <AuthCardLoading titleKey="passwordSetup.title" />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: deviceVerificationPath,
    loader: loadDeviceVerification,
    element: <DeviceVerificationPage />,
    hydrateFallbackElement: <AuthCardLoading titleKey="login.title" />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: "/register",
    element: <RegistrationPage verifyPage={false} />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: "/register/verify",
    element: <RegistrationPage verifyPage />,
    errorElement: <RouteErrorPage />,
  },
  {
    element: <SessionGate />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: "admin/:orgId/directory", element: <DirectoryPage /> },
      { path: "admin/:orgId/permissions", element: <PermissionsPage /> },
      { path: "admin/:orgId/workflows", element: <WorkflowsPage /> },
      {
        path: "admin/:orgId/workflows/:enterpriseKey",
        element: <WorkflowsPage />,
      },
      { path: "inspections", element: <InspectionsPage /> },
      { path: "inspections/templates", element: <InspectionTemplatesPage /> },
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
