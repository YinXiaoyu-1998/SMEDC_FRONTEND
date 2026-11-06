import { Navigate, Outlet, useLocation } from "react-router";

import { useSession } from "@/api/session";
import { AppShell } from "@/app/AppShell";
import { useAuthFeedback } from "@/app/authFeedback";
import { ForbiddenPage } from "@/app/ForbiddenPage";
import { LoadingSkeleton } from "@/app/LoadingSkeleton";
import { SessionErrorPage } from "@/app/SessionErrorPage";
import { buildLoginPath } from "@/app/paths";

export function SessionGate() {
  const sessionQuery = useSession();
  const location = useLocation();
  const { forbidden, clearForbidden } = useAuthFeedback();

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
    return (
      <Navigate
        to={buildLoginPath(`${location.pathname}${location.search}`)}
        replace
      />
    );
  }

  return (
    <AppShell session={session}>
      {forbidden ? <ForbiddenPage onRetry={clearForbidden} /> : <Outlet />}
    </AppShell>
  );
}
