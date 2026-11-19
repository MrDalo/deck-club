'use client';

import type { Table } from '@tanstack/react-table';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '#components/button';

/** The pager's words, translated. */
export type DataTablePaginationLabels = {
  /** Names the pager ("Pages"). */
  navigation: string;
  previous: string;
  next: string;
  /** Where you are: `(page, pageCount) => \`Page ${page} of ${pageCount}\``. */
  page: (page: number, pageCount: number) => string;
};

type DataTablePaginationProps<TData> = {
  table: Table<TData>;
  labels: DataTablePaginationLabels;
};

/** Previous and next page, and where you are, under the table. */
export function DataTablePagination<TData>({
  table,
  labels,
}: DataTablePaginationProps<TData>): React.JSX.Element {
  const page = table.getState().pagination.pageIndex + 1;
  const pageCount = Math.max(table.getPageCount(), 1);
  return (
    <nav
      aria-label={labels.navigation}
      className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink bg-paper px-4 py-3"
    >
      <p aria-live="polite" className="text-sm font-semibold text-ink-soft">
        {labels.page(page, pageCount)}
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeftIcon aria-hidden />
          {labels.previous}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {labels.next}
          <ChevronRightIcon aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
