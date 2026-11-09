import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import { useText } from "@/i18n/useText";
import { Button } from "@/ui/Button";

import styles from "./DataTable.module.css";

export interface DataTableColumn<Row> {
  readonly id: string;
  readonly header: string;
  readonly cell: (row: Row) => ReactNode;
  readonly align?: "start" | "end";
  readonly width?: string;
}

export interface DataTableSelection<Row> {
  readonly selectedIds: ReadonlySet<string>;
  readonly onChange: (next: ReadonlySet<string>) => void;
  readonly disabled?: boolean;
  readonly rowLabel?: (row: Row) => string;
}

export interface DataTablePagination {
  readonly nextCursor?: string | null;
  readonly previousCursor?: string | null;
  readonly onNext?: (cursor: string) => void;
  readonly onPrevious?: (cursor: string) => void;
  readonly summary?: string;
}

export interface DataTableProps<Row> {
  readonly columns: readonly DataTableColumn<Row>[];
  readonly rows: readonly Row[];
  readonly getRowId: (row: Row) => string;
  readonly label: string;
  readonly loading?: boolean;
  readonly loadingLabel?: string;
  readonly emptyLabel?: string;
  readonly selection?: DataTableSelection<Row>;
  readonly pagination?: DataTablePagination;
  readonly className?: string;
}

/**
 * 只渲染调用方给的当前窗口数据；游标由调用方维护，
 * 避免用页码推算偏移量导致数据变化时重复或漏行。
 */
export function DataTable<Row>({
  columns,
  rows,
  getRowId,
  label,
  loading = false,
  loadingLabel,
  emptyLabel,
  selection,
  pagination,
  className,
}: DataTableProps<Row>) {
  const { t } = useText();
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const pageRowIds = rows.map((row) => getRowId(row));
  const selectedOnPage =
    selection === undefined
      ? []
      : pageRowIds.filter((id) => selection.selectedIds.has(id));
  const allSelected =
    pageRowIds.length > 0 && selectedOnPage.length === pageRowIds.length;
  const someSelected = selectedOnPage.length > 0 && !allSelected;

  useEffect(() => {
    if (headerCheckboxRef.current !== null) {
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const columnCount = columns.length + (selection === undefined ? 0 : 1);
  const selectionDisabled =
    selection === undefined ||
    selection.disabled === true ||
    loading ||
    rows.length === 0;

  const toggleAll = () => {
    if (selection === undefined || selectionDisabled) return;
    const next = new Set(selection.selectedIds);
    if (allSelected) {
      for (const id of pageRowIds) next.delete(id);
    } else {
      for (const id of pageRowIds) next.add(id);
    }
    selection.onChange(next);
  };

  const toggleRow = (id: string) => {
    if (selection === undefined || selection.disabled === true || loading)
      return;
    const next = new Set(selection.selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    selection.onChange(next);
  };

  const previousCursor = pagination?.previousCursor ?? null;
  const nextCursor = pagination?.nextCursor ?? null;
  const showPagination =
    pagination !== undefined &&
    (pagination.onPrevious !== undefined || pagination.onNext !== undefined);

  const wrapperClasses =
    className === undefined ? styles.wrapper : `${styles.wrapper} ${className}`;

  return (
    <div className={wrapperClasses}>
      <div className={styles.tableWrapper}>
        <table className={styles.table} aria-label={label} aria-busy={loading}>
          <thead>
            <tr>
              {selection === undefined ? null : (
                <th className={styles.selectionCell} scope="col">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={allSelected}
                    disabled={selectionDisabled}
                    onChange={toggleAll}
                    aria-label={t("ui.table.selectAll")}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={
                    column.align === "end" ? styles.alignEnd : undefined
                  }
                  style={
                    column.width === undefined
                      ? undefined
                      : { width: column.width }
                  }
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading || rows.length === 0 ? (
              <tr>
                <td className={styles.statusCell} colSpan={columnCount}>
                  {loading ? (
                    <span role="status">
                      {loadingLabel ?? t("ui.table.loading")}
                    </span>
                  ) : (
                    <span>{emptyLabel ?? t("ui.table.empty")}</span>
                  )}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const id = getRowId(row);
                const selected = selection?.selectedIds.has(id) === true;
                const rowName = selection?.rowLabel?.(row) ?? id;
                return (
                  <tr
                    key={id}
                    aria-selected={
                      selection === undefined ? undefined : selected
                    }
                  >
                    {selection === undefined ? null : (
                      <td className={styles.selectionCell}>
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={selection.disabled === true || loading}
                          onChange={() => toggleRow(id)}
                          aria-label={`${t("ui.table.selectRow")} ${rowName}`}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={
                          column.align === "end" ? styles.alignEnd : undefined
                        }
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showPagination && pagination !== undefined ? (
        <nav
          className={styles.pagination}
          aria-label={t("ui.table.pagination")}
        >
          {pagination.summary === undefined ? null : (
            <span className={styles.summary}>{pagination.summary}</span>
          )}
          {pagination.onPrevious === undefined ? null : (
            <Button
              variant="secondary"
              disabled={previousCursor === null || loading}
              onClick={() => {
                if (previousCursor !== null) {
                  pagination.onPrevious?.(previousCursor);
                }
              }}
            >
              {t("ui.table.previous")}
            </Button>
          )}
          {pagination.onNext === undefined ? null : (
            <Button
              variant="secondary"
              disabled={nextCursor === null || loading}
              onClick={() => {
                if (nextCursor !== null) {
                  pagination.onNext?.(nextCursor);
                }
              }}
            >
              {t("ui.table.next")}
            </Button>
          )}
        </nav>
      ) : null}
    </div>
  );
}
