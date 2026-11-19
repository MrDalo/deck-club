'use client';

import type { Table } from '@tanstack/react-table';
import { SearchIcon } from 'lucide-react';
import { FIELD, FOCUS_RING } from '#lib/brand';
import { cn } from '#lib/utils';

type DataTableFilterProps<TData> = {
  table: Table<TData>;
  /** The column whose text it filters. */
  columnId: string;
  /** The field's name, translated ("Search cards"). */
  label: string;
  placeholder?: string;
  className?: string;
};

/** A search field above the table that filters one column as you type. */
export function DataTableFilter<TData>({
  table,
  columnId,
  label,
  placeholder,
  className,
}: DataTableFilterProps<TData>): React.JSX.Element {
  const column = table.getColumn(columnId);
  const value = column?.getFilterValue();
  return (
    <label
      className={cn(
        FIELD,
        'max-w-xs has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus has-focus-visible:outline-solid',
        className,
      )}
    >
      <SearchIcon aria-hidden className="size-5 shrink-0 text-ink-soft" />
      <input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => column?.setFilterValue(event.target.value)}
        className={cn(
          'h-full w-full min-w-0 bg-transparent text-ink placeholder:text-ink-soft',
          FOCUS_RING,
          'focus-visible:outline-none',
        )}
      />
    </label>
  );
}
