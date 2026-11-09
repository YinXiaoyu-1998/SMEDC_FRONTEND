import { Navigate } from "react-router";

import { useSession } from "@/api/session";
import { LoadingSkeleton } from "@/app/LoadingSkeleton";
import { appPaths, resolveHomePath } from "@/app/paths";

export function HomeRedirect() {
  const sessionQuery = useSession();
  const session = sessionQuery.data;

  if (sessionQuery.isPending) {
    return <LoadingSkeleton />;
  }

  if (session === null || session === undefined) {
    return <Navigate to={appPaths.login} replace />;
  }

  return <Navigate to={resolveHomePath(session)} replace />;
}
