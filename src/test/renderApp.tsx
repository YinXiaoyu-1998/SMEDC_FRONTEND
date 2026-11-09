import { QueryClient } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { RouteObject } from "react-router";
import { RouterProvider, createMemoryRouter } from "react-router";

import { sessionQueryKey, type Session } from "@/api/session";
import { AppProviders } from "@/app/AppProviders";
import { routes } from "@/app/router";

interface RenderAppOptions {
  readonly session: Session | null;
  readonly initialEntries?: readonly string[];
  readonly routes?: readonly RouteObject[];
}

export function createTestQueryClient(session: Session | null): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  // 预置会话缓存：测试不必为每个用例重复模拟 GET /session
  queryClient.setQueryData(sessionQueryKey, session);
  return queryClient;
}

export function renderApp({
  session,
  initialEntries = ["/"],
  routes: appRoutes = routes,
}: RenderAppOptions) {
  const queryClient = createTestQueryClient(session);
  const router = createMemoryRouter([...appRoutes], {
    initialEntries: [...initialEntries],
  });

  const view = render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  );

  return { ...view, router, queryClient };
}
