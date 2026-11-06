import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { canSaveDraft, useDraft } from "@/ui/useDraft";

interface Sample {
  readonly name: string;
  readonly tags: readonly string[];
  readonly meta: { readonly order: number; readonly label: string };
}

const saved: Sample = {
  name: "A",
  tags: ["x", "y"],
  meta: { order: 1, label: "z" },
};

const identity = (value: Sample): unknown => value;
const sortedTags = (value: Sample): unknown => ({
  ...value,
  tags: [...value.tags].sort(),
});

describe("useDraft", () => {
  it("未改动时为 pristine", () => {
    const { result } = renderHook(() => useDraft(saved, saved, identity));

    expect(result.current.status).toBe("pristine");
    expect(result.current.isDirty).toBe(false);
    expect(canSaveDraft(result.current.status)).toBe(false);
  });

  it("改动后 dirty，改回已保存值后重新 pristine", () => {
    const { result } = renderHook(() => useDraft(saved, saved, identity));

    act(() => {
      result.current.setDraft({ ...saved, name: "B" });
    });
    expect(result.current.status).toBe("dirty");
    expect(result.current.isDirty).toBe(true);
    expect(canSaveDraft(result.current.status)).toBe(true);

    act(() => {
      result.current.setDraft({ ...saved });
    });
    expect(result.current.status).toBe("pristine");
    expect(result.current.isDirty).toBe(false);
  });

  it("仅对象字段顺序变化视为未改动", () => {
    const { result } = renderHook(() => useDraft(saved, saved, identity));

    act(() => {
      result.current.setDraft({
        meta: { label: "z", order: 1 },
        tags: ["x", "y"],
        name: "A",
      });
    });

    expect(result.current.status).toBe("pristine");
  });

  it("normalize 排序后的数组顺序变化视为未改动", () => {
    const { result } = renderHook(() => useDraft(saved, saved, sortedTags));

    act(() => {
      result.current.setDraft({ ...saved, tags: ["y", "x"] });
    });

    expect(result.current.status).toBe("pristine");
  });

  it("normalize 未处理时数组顺序变化仍然 dirty", () => {
    const { result } = renderHook(() => useDraft(saved, saved, identity));

    act(() => {
      result.current.setDraft({ ...saved, tags: ["y", "x"] });
    });

    expect(result.current.status).toBe("dirty");
  });

  it("冲突状态优先于 dirty，显式确认后才回到比较结果", () => {
    const { result } = renderHook(() => useDraft(saved, saved, identity));

    act(() => {
      result.current.setDraft({ ...saved, name: "B" });
    });
    act(() => {
      result.current.markConflicting();
    });

    expect(result.current.status).toBe("conflicting");
    expect(canSaveDraft(result.current.status)).toBe(false);
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.setDraft({ ...saved });
    });
    // 冲突期间即使用户把草稿改回原值，也必须先显式选择处理方式
    expect(result.current.status).toBe("conflicting");

    act(() => {
      result.current.acknowledgeConflict();
    });
    expect(result.current.status).toBe("pristine");
    expect(canSaveDraft(result.current.status)).toBe(false);
  });

  it("reset 丢弃草稿并清除冲突", () => {
    const { result } = renderHook(() => useDraft(saved, saved, identity));

    act(() => {
      result.current.setDraft({ ...saved, name: "B" });
      result.current.markConflicting();
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.draft).toStrictEqual(saved);
    expect(result.current.status).toBe("pristine");
    expect(result.current.isDirty).toBe(false);
  });

  it("支持函数式更新", () => {
    const { result } = renderHook(() => useDraft(saved, saved, identity));

    act(() => {
      result.current.setDraft((previous) => ({
        ...previous,
        meta: { ...previous.meta, order: 2 },
      }));
    });

    expect(result.current.draft.meta.order).toBe(2);
    expect(result.current.status).toBe("dirty");
  });
});
