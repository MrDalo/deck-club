import type { ComponentProps } from 'react';
import { FOCUS_RING } from '#lib/brand';
import { cn } from '#lib/utils';
import {
  BreadcrumbEllipsis as BreadcrumbEllipsisPrimitive,
  BreadcrumbItem as BreadcrumbItemPrimitive,
  BreadcrumbLink as BreadcrumbLinkPrimitive,
  BreadcrumbList as BreadcrumbListPrimitive,
  BreadcrumbPage as BreadcrumbPagePrimitive,
  Breadcrumb as BreadcrumbPrimitive,
  BreadcrumbSeparator as BreadcrumbSeparatorPrimitive,
} from '#ui/breadcrumb';

export type BreadcrumbProps = ComponentProps<typeof BreadcrumbPrimitive> & {
  /** The landmark's name, translated ("Breadcrumb", "Navigačná cesta"…). */
  label: string;
};

/** Where you are: Decks › Biology exam › Card 12. */
export function Breadcrumb({ label, ...props }: BreadcrumbProps): React.JSX.Element {
  return <BreadcrumbPrimitive aria-label={label} {...props} />;
}

export function BreadcrumbList({
  className,
  ...props
}: ComponentProps<typeof BreadcrumbListPrimitive>): React.JSX.Element {
  return (
    <BreadcrumbListPrimitive
      className={cn('gap-1.5 text-sm text-ink-soft sm:gap-2', className)}
      {...props}
    />
  );
}

export function BreadcrumbItem(
  props: ComponentProps<typeof BreadcrumbItemPrimitive>,
): React.JSX.Element {
  return <BreadcrumbItemPrimitive {...props} />;
}

export function BreadcrumbLink({
  className,
  ...props
}: ComponentProps<typeof BreadcrumbLinkPrimitive>): React.JSX.Element {
  return (
    <BreadcrumbLinkPrimitive
      className={cn(
        'rounded-sm font-semibold text-ink-soft decoration-2 underline-offset-4 hover:text-ink hover:underline',
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}

export function BreadcrumbPage({
  className,
  ...props
}: ComponentProps<typeof BreadcrumbPagePrimitive>): React.JSX.Element {
  return <BreadcrumbPagePrimitive className={cn('font-bold text-ink', className)} {...props} />;
}

export function BreadcrumbSeparator({
  className,
  ...props
}: ComponentProps<typeof BreadcrumbSeparatorPrimitive>): React.JSX.Element {
  return (
    <BreadcrumbSeparatorPrimitive
      className={cn('text-ink-soft [&>svg]:size-4', className)}
      {...props}
    />
  );
}

/**
 * The "…" for collapsed levels. Decorative: put it inside a button that
 * opens the hidden levels and give that button the name.
 */
export function BreadcrumbEllipsis({
  className,
  ...props
}: ComponentProps<typeof BreadcrumbEllipsisPrimitive>): React.JSX.Element {
  return (
    <BreadcrumbEllipsisPrimitive className={cn('size-6 text-ink-soft', className)} {...props} />
  );
}
