import { QueryClient } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";

import { AppProviders } from "@/app/AppProviders";
import { AppErrorBoundary } from "@/app/ErrorBoundary";
import { router } from "@/app/router";
import "@/styles/tokens.css";
import "@/styles/global.css";

const queryClient = new QueryClient();

const container = document.getElementById("root");
if (!container) {
  throw new Error("缺少 #root 挂载节点");
}

createRoot(container).render(
  <StrictMode>
    <AppProviders queryClient={queryClient}>
      <AppErrorBoundary>
        <RouterProvider router={router} />
      </AppErrorBoundary>
    </AppProviders>
  </StrictMode>,
);
