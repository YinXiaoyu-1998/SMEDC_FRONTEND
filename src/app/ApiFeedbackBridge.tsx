import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { onForbidden, onUnauthorized } from "@/api/client";
import { sessionQueryKey, type Session } from "@/api/session";
import { useAuthFeedback } from "@/app/authFeedback";

function isSessionQueryKey(queryKey: readonly unknown[]): boolean {
  return (
    queryKey.length >= 2 &&
    queryKey[0] === sessionQueryKey[0] &&
    queryKey[1] === sessionQueryKey[1]
  );
}

/**
 * 接口层只广播 401/403，这里统一清缓存与标记状态。
 * 登录接口自身失败的 401 不代表会话过期，因此仅在已有会话时处理。
 */
export function ApiFeedbackBridge() {
  const queryClient = useQueryClient();
  const { notifySessionExpired, notifyForbidden } = useAuthFeedback();

  useEffect(() => {
    const hasSession = (): boolean => {
      const current = queryClient.getQueryData<Session | null>(sessionQueryKey);
      return current !== null && current !== undefined;
    };

    const unsubscribeUnauthorized = onUnauthorized(() => {
      if (!hasSession()) return;

      queryClient.setQueryData<Session | null>(sessionQueryKey, null);
      // 缓存里可能还有上一个身份的业务数据，跳登录前必须清掉
      queryClient.removeQueries({
        predicate: (query) => !isSessionQueryKey(query.queryKey),
      });
      notifySessionExpired();
    });

    const unsubscribeForbidden = onForbidden(() => {
      if (!hasSession()) return;
      notifyForbidden();
    });

    return () => {
      unsubscribeUnauthorized();
      unsubscribeForbidden();
    };
  }, [queryClient, notifySessionExpired, notifyForbidden]);

  return null;
}
