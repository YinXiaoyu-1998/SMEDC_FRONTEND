import { createContext, useContext } from "react";

export interface AuthFeedbackValue {
  readonly sessionExpired: boolean;
  readonly forbidden: boolean;
  readonly notifySessionExpired: () => void;
  readonly notifyForbidden: () => void;
  readonly clearSessionExpired: () => void;
  readonly clearForbidden: () => void;
}

export const AuthFeedbackContext = createContext<AuthFeedbackValue | null>(
  null,
);

export function useAuthFeedback(): AuthFeedbackValue {
  const value = useContext(AuthFeedbackContext);
  if (value === null) {
    throw new Error("useAuthFeedback 必须在 AuthFeedbackProvider 内使用");
  }
  return value;
}
