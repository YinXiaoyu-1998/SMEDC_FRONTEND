import { fireEvent, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { DataTable, type DataTableColumn } from "@/ui/DataTable";
import { renderWithText } from "@/test/renderWithText";

interface Order {
  readonly id: string;
  readonly customer: string;
  readonly total: number;
}

const columns: readonly DataTableColumn<Order>[] = [
  { id: "customer", header: "顾客", cell: (row) => row.customer },
  {
    id: "total",
    header: "金额",
    cell: (row) => `¥${row.total}`,
    align: "end",
  },
];

const rows: readonly Order[] = [
  { id: "o-1", customer: "张三", total: 10 },
  { id: "o-2", customer: "李四", total: 20 },
  { id: "o-3", customer: "王五", total: 30 },
];

function SelectionHarness() {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  return (
    <DataTable
      label="订单列表"
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      selection={{
        selectedIds: selected,
        onChange: setSelected,
        rowLabel: (row) => row.customer,
      }}
    />
  );
}

describe("DataTable", () => {
  it("单选与全选同步 aria-selected 和复选框状态", () => {
    renderWithText(<SelectionHarness />);
    const table = screen.getByRole("table", { name: "订单列表" });
    const firstRow = within(table)
      .getByRole("checkbox", { name: "选择行 张三" })
      .closest("tr");
    expect(firstRow).toHaveAttribute("aria-selected", "false");

    fireEvent.click(
      within(table).getByRole("checkbox", { name: "选择行 张三" }),
    );
    expect(firstRow).toHaveAttribute("aria-selected", "true");
    expect(
      within(table).getByRole("checkbox", { name: "全选当前页" }),
    ).toBePartiallyChecked();

    fireEvent.click(
      within(table).getByRole("checkbox", { name: "全选当前页" }),
    );
    for (const row of rows) {
      expect(
        within(table)
          .getByRole("checkbox", { name: `选择行 ${row.customer}` })
          .closest("tr"),
      ).toHaveAttribute("aria-selected", "true");
    }

    fireEvent.click(
      within(table).getByRole("checkbox", { name: "全选当前页" }),
    );
    for (const row of rows) {
      expect(
        within(table)
          .getByRole("checkbox", { name: `选择行 ${row.customer}` })
          .closest("tr"),
      ).toHaveAttribute("aria-selected", "false");
    }
  });

  it("只对当前页做全选，不覆盖其他页已选项", () => {
    const onChange = vi.fn();
    renderWithText(
      <DataTable
        label="订单列表"
        columns={columns}
        rows={rows.slice(0, 2)}
        getRowId={(row) => row.id}
        selection={{
          selectedIds: new Set(["o-3"]),
          onChange,
          rowLabel: (row) => row.customer,
        }}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "全选当前页" }));

    const next = onChange.mock.calls[0]?.[0] as ReadonlySet<string>;
    expect([...next].sort()).toEqual(["o-1", "o-2", "o-3"]);
  });

  it("游标边界：上一页/下一页按游标禁用并传递当前游标", () => {
    const onNext = vi.fn();
    const onPrevious = vi.fn();
    const view = renderWithText(
      <DataTable
        label="订单列表"
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        pagination={{
          nextCursor: "next-1",
          previousCursor: null,
          onNext,
          onPrevious,
        }}
      />,
    );

    const previous = screen.getByRole("button", { name: "上一页" });
    const next = screen.getByRole("button", { name: "下一页" });
    expect(previous).toBeDisabled();
    expect(next).toBeEnabled();

    fireEvent.click(previous);
    expect(onPrevious).not.toHaveBeenCalled();

    fireEvent.click(next);
    expect(onNext).toHaveBeenCalledWith("next-1");

    view.unmount();
    renderWithText(
      <DataTable
        label="订单列表"
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        pagination={{
          nextCursor: null,
          previousCursor: "previous-1",
          onNext,
          onPrevious,
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "下一页" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "上一页" }));
    expect(onPrevious).toHaveBeenCalledWith("previous-1");
  });

  it("加载中显示状态、标记 aria-busy 并禁用分页", () => {
    const onNext = vi.fn();
    renderWithText(
      <DataTable
        label="订单列表"
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        loading
        pagination={{ nextCursor: "next-1", onNext }}
      />,
    );

    const table = screen.getByRole("table", { name: "订单列表" });
    expect(table).toHaveAttribute("aria-busy", "true");
    expect(within(table).getByRole("status")).toHaveTextContent("正在加载");
    expect(screen.getByRole("button", { name: "下一页" })).toBeDisabled();
  });

  it("空态显示空文案并禁用全选", () => {
    renderWithText(
      <DataTable
        label="订单列表"
        columns={columns}
        rows={[]}
        getRowId={(row) => row.id}
        selection={{
          selectedIds: new Set(),
          onChange: vi.fn(),
          rowLabel: (row) => row.customer,
        }}
      />,
    );

    expect(screen.getByText("暂无数据")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "全选当前页" })).toBeDisabled();
  });
});
