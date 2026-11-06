import { useCallback, useState } from "react";

import { useText } from "@/i18n/useText";
import { errorKeyFor } from "@/ui/errors";

export interface ActionFeedback {
  readonly error: unknown;
  readonly errorKey: string | null;
  readonly message: string | null;
  readonly setError: (error: unknown) => void;
  readonly clear: () => void;
}

/** 把一次操作的失败收拢成可渲染文案，便于显示在操作所在区块。 */
export function useActionFeedback(): ActionFeedback {
  const { t } = useText();
  const [error, setErrorState] = useState<unknown>(null);

  const setError = useCallback((next: unknown) => {
    setErrorState(next);
  }, []);

  const clear = useCallback(() => {
    setErrorState(null);
  }, []);

  const hasError = error !== null && error !== undefined;
  const errorKey = hasError ? errorKeyFor(error) : null;

  return {
    error,
    errorKey,
    message: errorKey === null ? null : t(errorKey),
    setError,
    clear,
  };
}
