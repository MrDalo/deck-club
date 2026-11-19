'use client';

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Table as TanStackTable,
} from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { cn } from '#lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#components/table';
import { ariaSortOf } from './data-table-column-header.js';
import { DataTablePagination, type DataTablePaginationLabels } from './data-table-pagination.js';

/** Pages need translated pager words; without `pageSize` every row shows. */
type Paging =
  | { pageSize: number; pagination: DataTablePaginationLabels }
  | { pageSize?: never; pagination?: never };

export type DataTableProps<TData, TValue> = Paging & {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Names the table for screen readers, translated ("Cards in Biology exam"). */
  label: string;
  /** Shown when no row matches, translated. */
  emptyMessage: ReactNode;
  /** Above the table: filters and bulk actions, with the table's state. */
  toolbar?: (table: TanStackTable<TData>) => ReactNode;
  /** A stable id per row, so a selection survives sorting and new data. */
  getRowId?: (row: TData, index: number) => string;
  className?: string;
};

/**
 * Rows of data on a sticker card, sortable, filterable and pageable, built
 * on TanStack Table. Use `DataTableColumnHeader` for sortable headings and
 * `createSelectColumn` for checkboxes.
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  label,
  emptyMessage,
  toolbar,
  getRowId,
  pageSize,
  pagination,
  className,
}: DataTableProps<TData, TValue>): React.JSX.Element {
  // TanStack Table keeps its own state in a stable object; the React
  // Compiler must not memoize around it (react-hooks/incompatible-library).
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    ...(getRowId === undefined ? {} : { getRowId }),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(pageSize === undefined
      ? {}
      : {
          getPaginationRowModel: getPaginationRowModel(),
          initialState: { pagination: { pageSize } },
        }),
  });
  return (
    <div className={cn('grid gap-3', className)}>
      {toolbar?.(table)}
      <div className="overflow-hidden rounded-card border-2 border-ink bg-card text-ink shadow-sticker-sm">
        <Table variant="plain" aria-label={label}>
          <DataTableHead table={table} />
          <DataTableRows table={table} columnCount={columns.length} emptyMessage={emptyMessage} />
        </Table>
        {pagination !== undefined && <DataTablePagination table={table} labels={pagination} />}
      </div>
    </div>
  );
}

function DataTableHead<TData>({ table }: { table: TanStackTable<TData> }): React.JSX.Element {
  return (
    <TableHeader>
      {table.getHeaderGroups().map((group) => (
        <TableRow key={group.id}>
          {group.headers.map((header) => (
            <TableHead key={header.id} aria-sort={ariaSortOf(header.column)}>
              {header.isPlaceholder
                ? null
                : flexRender(header.column.columnDef.header, header.getContext())}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  );
}

type DataTableRowsProps<TData> = {
  table: TanStackTable<TData>;
  columnCount: number;
  emptyMessage: ReactNode;
};

function DataTableRows<TData>({
  table,
  columnCount,
  emptyMessage,
}: DataTableRowsProps<TData>): React.JSX.Element {
  const rows = table.getRowModel().rows;
  return (
    <TableBody>
      {rows.length === 0 ? (
        <TableRow className="hover:bg-transparent">
          <TableCell
            colSpan={columnCount}
            className="h-28 text-center whitespace-normal text-ink-soft"
          >
            {emptyMessage}
          </TableCell>
        </TableRow>
      ) : (
        rows.map((row) => (
          <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))
      )}
    </TableBody>
  );
}
