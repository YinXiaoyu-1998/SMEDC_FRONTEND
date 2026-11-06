import { beforeEach, describe, expect, it } from "vitest";

import { lockBodyScroll } from "@/ui/scrollLock";

beforeEach(() => {
  document.body.style.overflow = "";
});

describe("body 滚动锁", () => {
  it("引用计数归零后才恢复滚动", () => {
    const releaseFirst = lockBodyScroll();
    const releaseSecond = lockBodyScroll();
    expect(document.body.style.overflow).toBe("hidden");

    releaseFirst();
    expect(document.body.style.overflow).toBe("hidden");

    releaseSecond();
    expect(document.body.style.overflow).toBe("");
  });

  it("重复释放不会破坏计数", () => {
    const release = lockBodyScroll();
    release();
    release();
    expect(document.body.style.overflow).toBe("");
  });
});
