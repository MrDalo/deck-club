import type { ComponentProps } from 'react';
import { cn } from '#lib/utils';
import {
  TableBody as TableBodyPrimitive,
  TableCaption as TableCaptionPrimitive,
  TableCell as TableCellPrimitive,
  TableFooter as TableFooterPrimitive,
  TableHead as TableHeadPrimitive,
  TableHeader as TableHeaderPrimitive,
  Table as TablePrimitive,
  TableRow as TableRowPrimitive,
} from '#ui/table';

export type TableProps = ComponentProps<typeof TablePrimitive> & {
  /** `sticker`: framed as a sticker card. `plain`: no frame, inside a card of your own. */
  variant?: 'sticker' | 'plain';
};

/** Rows and columns of facts. Give it a caption or an `aria-label`. */
export function Table({ variant = 'sticker', className, ...props }: TableProps): React.JSX.Element {
  const table = <TablePrimitive className={cn('text-base text-ink', className)} {...props} />;
  if (variant === 'plain') return table;
  return (
    <div
      data-slot="table-frame"
      className="overflow-hidden rounded-card border-2 border-ink bg-card shadow-sticker-sm"
    >
      {table}
    </div>
  );
}

export function TableHeader({
  className,
  ...props
}: ComponentProps<typeof TableHeaderPrimitive>): React.JSX.Element {
  return (
    <TableHeaderPrimitive
      className={cn(
        'bg-paper [&_tr]:border-b-2 [&_tr]:border-ink [&_tr]:hover:bg-transparent',
        className,
      )}
      {...props}
    />
  );
}

export function TableBody(props: ComponentProps<typeof TableBodyPrimitive>): React.JSX.Element {
  return <TableBodyPrimitive {...props} />;
}

export function TableFooter({
  className,
  ...props
}: ComponentProps<typeof TableFooterPrimitive>): React.JSX.Element {
  return (
    <TableFooterPrimitive
      className={cn(
        'border-t-2 border-ink bg-paper font-bold [&_tr]:hover:bg-transparent',
        className,
      )}
      {...props}
    />
  );
}

/** A row; hover gets a Butter wash, a selected row (`data-state="selected"`) a Lilac one. */
export function TableRow({
  className,
  ...props
}: ComponentProps<typeof TableRowPrimitive>): React.JSX.Element {
  return (
    <TableRowPrimitive
      className={cn('border-line hover:bg-butter/40 data-[state=selected]:bg-lilac/30', className)}
      {...props}
    />
  );
}

export function TableHead({
  className,
  ...props
}: ComponentProps<typeof TableHeadPrimitive>): React.JSX.Element {
  return (
    <TableHeadPrimitive className={cn('h-12 px-4 font-bold text-ink', className)} {...props} />
  );
}

export function TableCell({
  className,
  ...props
}: ComponentProps<typeof TableCellPrimitive>): React.JSX.Element {
  return <TableCellPrimitive className={cn('px-4 py-3 text-ink', className)} {...props} />;
}

export function TableCaption({
  className,
  ...props
}: ComponentProps<typeof TableCaptionPrimitive>): React.JSX.Element {
  return (
    <TableCaptionPrimitive className={cn('mb-3 text-sm text-ink-soft', className)} {...props} />
  );
}
