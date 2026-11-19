import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { PASTEL_FILL, type Pastel } from '#lib/brand';
import { cn } from '#lib/utils';
import {
  EmptyContent as EmptyContentPrimitive,
  EmptyDescription as EmptyDescriptionPrimitive,
  EmptyHeader as EmptyHeaderPrimitive,
  EmptyMedia as EmptyMediaPrimitive,
  Empty as EmptyPrimitive,
  EmptyTitle as EmptyTitlePrimitive,
} from '#ui/empty';

const emptyVariants = cva('gap-5 rounded-card p-8 text-ink md:p-10', {
  variants: {
    variant: {
      /** A dashed outline where something will be: an empty deck list. */
      dashed: 'border-2 border-dashed border-ink/40',
      /** A blank index card. */
      ruled: 'ruled border-2 border-ink shadow-sticker-sm',
      plain: 'border-0',
    },
  },
  defaultVariants: { variant: 'dashed' },
});

export type EmptyProps = ComponentProps<typeof EmptyPrimitive> & VariantProps<typeof emptyVariants>;

/** What a screen shows when it has nothing yet, and what to do about it. */
export function Empty({ variant, className, ...props }: EmptyProps): React.JSX.Element {
  return <EmptyPrimitive className={cn(emptyVariants({ variant }), className)} {...props} />;
}

export function EmptyHeader(props: ComponentProps<typeof EmptyHeaderPrimitive>): React.JSX.Element {
  return <EmptyHeaderPrimitive {...props} />;
}

type EmptyMediaProps = Omit<ComponentProps<typeof EmptyMediaPrimitive>, 'variant'> & {
  /** `icon`: the icon in a pastel sticker circle. `default`: as given (an illustration). */
  variant?: 'icon' | 'default';
  tone?: Pastel;
};

export function EmptyMedia({
  variant = 'icon',
  tone = 'butter',
  className,
  ...props
}: EmptyMediaProps): React.JSX.Element {
  return (
    <EmptyMediaPrimitive
      variant={variant}
      aria-hidden
      className={cn(
        variant === 'icon' &&
          cn(
            'size-14 rounded-full border-2 border-ink text-ink shadow-sticker-sm [&_svg:not([class*=size-])]:size-7',
            PASTEL_FILL[tone],
          ),
        className,
      )}
      {...props}
    />
  );
}

export function EmptyTitle({
  level = 2,
  className,
  ...props
}: ComponentProps<typeof EmptyTitlePrimitive> & { level?: 2 | 3 | 4 }): React.JSX.Element {
  return (
    <EmptyTitlePrimitive
      role="heading"
      aria-level={level}
      className={cn('font-display text-xl font-bold tracking-tight', className)}
      {...props}
    />
  );
}

export function EmptyDescription({
  className,
  ...props
}: ComponentProps<typeof EmptyDescriptionPrimitive>): React.JSX.Element {
  return (
    <EmptyDescriptionPrimitive
      className={cn(
        'text-base text-ink-soft [&>a]:font-semibold [&>a]:text-ink [&>a]:decoration-2 [&>a:hover]:text-ink [&>a:hover]:decoration-focus',
        className,
      )}
      {...props}
    />
  );
}

export function EmptyContent({
  className,
  ...props
}: ComponentProps<typeof EmptyContentPrimitive>): React.JSX.Element {
  return (
    <EmptyContentPrimitive
      className={cn('flex-row flex-wrap justify-center', className)}
      {...props}
    />
  );
}
