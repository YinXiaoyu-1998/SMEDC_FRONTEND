import { useEffect } from "react";

let lockCount = 0;
let previousOverflow = "";

/**
 * 多条浮层同时打开时用引用计数管理滚动锁，只有最后一个释放才恢复原始值。
 */
export function lockBodyScroll(): () => void {
  if (typeof document === "undefined") return () => {};

  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      document.body.style.overflow = previousOverflow;
      previousOverflow = "";
    }
  };
}

export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return undefined;
    return lockBodyScroll();
  }, [active]);
}
