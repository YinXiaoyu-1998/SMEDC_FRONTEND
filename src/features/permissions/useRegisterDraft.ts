import { useEffect, useId } from "react";

import { usePermissionsScope } from "./scope";

/** 把表单的未保存状态登记到页面，供“重新读取配置”和补齐类别判断前置条件。 */
export function useRegisterDraft(dirty: boolean): void {
  const { registerDraft } = usePermissionsScope();
  const id = useId();
  useEffect(() => {
    registerDraft(id, dirty);
    return () => {
      registerDraft(id, false);
    };
  }, [dirty, id, registerDraft]);
}
