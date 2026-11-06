import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  AuthFeedbackContext,
  type AuthFeedbackValue,
} from "@/app/authFeedback";

interface AuthFeedbackProviderProps {
  readonly children: ReactNode;
}

export function AuthFeedbackProvider({ children }: AuthFeedbackProviderProps) {
  const [sessionExpired, setSessionExpired] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const notifySessionExpired = useCallback(() => setSessionExpired(true), []);
  const notifyForbidden = useCallback(() => setForbidden(true), []);
  const clearSessionExpired = useCallback(() => setSessionExpired(false), []);
  const clearForbidden = useCallback(() => setForbidden(false), []);

  const value = useMemo<AuthFeedbackValue>(
    () => ({
      sessionExpired,
      forbidden,
      notifySessionExpired,
      notifyForbidden,
      clearSessionExpired,
      clearForbidden,
    }),
    [
      sessionExpired,
      forbidden,
      notifySessionExpired,
      notifyForbidden,
      clearSessionExpired,
      clearForbidden,
    ],
  );

  return (
    <AuthFeedbackContext.Provider value={value}>
      {children}
    </AuthFeedbackContext.Provider>
  );
}
