import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { buttonVariants } from '#components/button';
import { cn } from '#lib/utils';
import {
  PaginationContent as PaginationContentPrimitive,
  PaginationEllipsis as PaginationEllipsisPrimitive,
  PaginationLink as PaginationLinkPrimitive,
  Pagination as PaginationPrimitive,
} from '#ui/pagination';

export { PaginationItem } from '#ui/pagination';

export type PaginationProps = ComponentProps<typeof PaginationPrimitive> & {
  /** Names the pager, translated ("Pages", "Stránky"). */
  label: string;
};

/** A pager for long lists: cards in a deck, search results. */
export function Pagination({ label, ...props }: PaginationProps): React.JSX.Element {
  return <PaginationPrimitive aria-label={label} {...props} />;
}

export function PaginationContent({
  className,
  ...props
}: ComponentProps<typeof PaginationContentPrimitive>): React.JSX.Element {
  return <PaginationContentPrimitive className={cn('gap-1.5', className)} {...props} />;
}

type PaginationLinkProps = Omit<ComponentProps<typeof PaginationLinkPrimitive>, 'size'>;

/** A page. The current one (`isActive`) is a Lilac sticker and reads as the current page. */
export function PaginationLink({
  isActive = false,
  className,
  ...props
}: PaginationLinkProps): React.JSX.Element {
  return (
    <PaginationLinkPrimitive
      isActive={isActive}
      className={cn(
        buttonVariants({ variant: isActive ? 'primary' : 'ghost', size: 'icon-sm' }),
        'font-bold tabular-nums',
        className,
      )}
      {...props}
    />
  );
}

type PaginationStepProps = PaginationLinkProps & {
  /** The word, translated ("Previous", "Next"); it also names the link where only the arrow shows. */
  label: string;
};

export function PaginationPrevious({
  label,
  className,
  ...props
}: PaginationStepProps): React.JSX.Element {
  return (
    <PaginationLink aria-label={label} className={cn('w-auto gap-1 px-3', className)} {...props}>
      <ChevronLeftIcon aria-hidden />
      <span className="hidden sm:block">{label}</span>
    </PaginationLink>
  );
}

export function PaginationNext({
  label,
  className,
  ...props
}: PaginationStepProps): React.JSX.Element {
  return (
    <PaginationLink aria-label={label} className={cn('w-auto gap-1 px-3', className)} {...props}>
      <span className="hidden sm:block">{label}</span>
      <ChevronRightIcon aria-hidden />
    </PaginationLink>
  );
}

/** The "…" where pages are skipped. Decorative. */
export function PaginationEllipsis({
  className,
  ...props
}: ComponentProps<typeof PaginationEllipsisPrimitive>): React.JSX.Element {
  return <PaginationEllipsisPrimitive className={cn('text-ink-soft', className)} {...props} />;
}
