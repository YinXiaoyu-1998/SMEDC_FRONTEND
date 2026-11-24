import { Navigate } from "react-router";

import { useSession } from "@/api/session";
import { LoadingSkeleton } from "@/app/LoadingSkeleton";
import { LoginPage } from "@/app/LoginPage";
import { SessionErrorPage } from "@/app/SessionErrorPage";
import { resolveHomePath } from "@/app/paths";

export function HomePage() {
  const sessionQuery = useSession();

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

  return sessionQuery.data === null ? (
    <LoginPage />
  ) : (
    <Navigate to={resolveHomePath(sessionQuery.data)} replace />
  );
}
