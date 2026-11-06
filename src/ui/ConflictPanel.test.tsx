import { fireEvent, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { ConflictPanel } from "@/ui/ConflictPanel";
import { canSaveDraft, useDraft } from "@/ui/useDraft";
import { renderWithText } from "@/test/renderWithText";

interface HarnessProps {
  readonly onReload: () => void;
  readonly onResubmit: () => void;
}

function ConflictHarness({ onReload, onResubmit }: HarnessProps) {
  const saved = { name: "A", enabled: true };
  const [draft, setDraft] = useState({ name: "B", enabled: false });
  const state = useDraft(saved, draft, (value) => value);

  const handleReload = () => {
    setDraft(saved);
    state.reset();
    onReload();
  };

  const handleResubmit = () => {
    state.acknowledgeConflict();
    onResubmit();
  };

  return (
    <>
      <button type="button" disabled={!canSaveDraft(state.status)}>
        保存
      </button>
      <button type="button" onClick={state.markConflicting}>
        标记冲突
      </button>
      <output data-testid="status">{state.status}</output>
      <output data-testid="draft">{draft.name}</output>
      {state.status === "conflicting" ? (
        <ConflictPanel
          fields={[
            {
              key: "name",
              label: "任务名称",
              serverValue: "A",
              draftValue: "B",
            },
            {
              key: "enabled",
              label: "启用",
              serverValue: "是",
              draftValue: "否",
            },
          ]}
          onReload={handleReload}
          onResubmit={handleResubmit}
        />
      ) : null}
    </>
  );
}

function setConflict() {
  fireEvent.click(screen.getByRole("button", { name: "标记冲突" }));
  return screen.getByRole("alert", { name: "版本冲突" });
}

describe("ConflictPanel", () => {
  it("冲突期间保存不可用，且不会自动覆盖或重试", () => {
    const onReload = vi.fn();
    const onResubmit = vi.fn();
    renderWithText(
      <ConflictHarness onReload={onReload} onResubmit={onResubmit} />,
    );

    expect(screen.getByRole("button", { name: "保存" })).toBeEnabled();
    const panel = setConflict();

    expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();
    expect(screen.getByTestId("status")).toHaveTextContent("conflicting");
    expect(screen.getByTestId("draft")).toHaveTextContent("B");
    expect(within(panel).getByText("A")).toBeInTheDocument();
    expect(within(panel).getByText("B")).toBeInTheDocument();
    expect(onReload).not.toHaveBeenCalled();
    expect(onResubmit).not.toHaveBeenCalled();
  });

  it("显式选择用我的改动重新提交后恢复保存并保留草稿", () => {
    const onReload = vi.fn();
    const onResubmit = vi.fn();
    renderWithText(
      <ConflictHarness onReload={onReload} onResubmit={onResubmit} />,
    );

    setConflict();
    fireEvent.click(screen.getByRole("button", { name: "用我的改动重新提交" }));

    expect(onResubmit).toHaveBeenCalledTimes(1);
    expect(onReload).not.toHaveBeenCalled();
    expect(screen.getByTestId("status")).toHaveTextContent("dirty");
    expect(screen.getByTestId("draft")).toHaveTextContent("B");
    expect(screen.getByRole("button", { name: "保存" })).toBeEnabled();
    expect(screen.queryByRole("alert", { name: "版本冲突" })).toBeNull();
  });

  it("显式选择重新加载后回到服务端值并保持保存不可用", () => {
    const onReload = vi.fn();
    const onResubmit = vi.fn();
    renderWithText(
      <ConflictHarness onReload={onReload} onResubmit={onResubmit} />,
    );

    setConflict();
    fireEvent.click(screen.getByRole("button", { name: "重新加载" }));

    expect(onReload).toHaveBeenCalledTimes(1);
    expect(onResubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId("status")).toHaveTextContent("pristine");
    expect(screen.getByTestId("draft")).toHaveTextContent("A");
    expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();
  });
});
