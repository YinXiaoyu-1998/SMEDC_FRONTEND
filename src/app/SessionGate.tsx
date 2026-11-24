import { Navigate, Outlet, useLocation } from "react-router";

import { useLogout, useSession } from "@/api/session";
import { AppShell } from "@/app/AppShell";
import { useAuthFeedback } from "@/app/authFeedback";
import { ForbiddenPage } from "@/app/ForbiddenPage";
import { LoadingSkeleton } from "@/app/LoadingSkeleton";
import { SessionErrorPage } from "@/app/SessionErrorPage";
import { appPaths, buildLoginPath } from "@/app/paths";

export function SessionGate() {
  const sessionQuery = useSession();
  const logout = useLogout();
  const location = useLocation();
  const { forbidden, clearForbidden } = useAuthFeedback();

  if (logout.isSuccess) return <Navigate to={appPaths.home} replace />;

  if (sessionQuery.isPending) {
    return <LoadingSkeleton />;
  }

  if (sessionQuery.isError) {
    return (
      <SessionErrorPage
        retrying={sessionQuery.isFetching}
        onRetry={() => {
          void sessionQuery.refetch();
        }}
      />
    );
  }

  const session = sessionQuery.data;
  if (session === null || session === undefined) {
    // The logout request may clear the cached session before its mutation settles.
    if (logout.isPending) return <LoadingSkeleton />;
    return (
      <Navigate
        to={
          logout.isError
            ? appPaths.home
            : buildLoginPath(`${location.pathname}${location.search}`)
        }
        replace
      />
    );
  }

  return (
    <AppShell
      session={session}
      onLogout={() => logout.mutate(session.csrfToken)}
      logoutPending={logout.isPending}
      logoutFailed={logout.isError}
    >
      {forbidden ? <ForbiddenPage onRetry={clearForbidden} /> : <Outlet />}
    </AppShell>
  );
}
