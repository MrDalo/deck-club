'use client';

import type { Column } from '@tanstack/react-table';
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon, type LucideIcon } from 'lucide-react';
import { FOCUS_RING } from '#lib/brand';
import { cn } from '#lib/utils';

const SORT_ICONS: Record<'asc' | 'desc' | 'none', LucideIcon> = {
  asc: ArrowUpIcon,
  desc: ArrowDownIcon,
  none: ChevronsUpDownIcon,
};

type DataTableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>;
  /** The column's name, translated. */
  title: string;
  className?: string;
};

/**
 * A column heading that sorts its column when pressed. The sort order is
 * announced by the header cell's `aria-sort`, which DataTable sets.
 */
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>): React.JSX.Element {
  if (!column.getCanSort()) return <span className={className}>{title}</span>;
  const SortIcon = SORT_ICONS[column.getIsSorted() || 'none'];
  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className={cn(
        '-ml-2 inline-flex h-8 items-center gap-1.5 rounded-full px-2 font-bold text-ink hover:bg-line/60',
        FOCUS_RING,
        className,
      )}
    >
      {title}
      <SortIcon aria-hidden className="size-4" />
    </button>
  );
}

/**
 * The header cell's `aria-sort` for a column: only sortable columns have one.
 * @param column - the column
 * @returns `ascending`, `descending`, `none`, or nothing for a fixed column
 */
export function ariaSortOf<TData>(
  column: Column<TData>,
): 'ascending' | 'descending' | 'none' | undefined {
  if (!column.getCanSort()) return undefined;
  const sorted = column.getIsSorted();
  if (sorted === 'asc') return 'ascending';
  if (sorted === 'desc') return 'descending';
  return 'none';
}
