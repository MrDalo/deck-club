import type { ComponentProps } from 'react';
import type { Pastel } from '#lib/brand';
import { progressAttributes } from '#lib/progress-attributes';
import { cn } from '#lib/utils';
import { Progress as ProgressPrimitive } from '#ui/progress';

/** The bar's fill, written out in full so Tailwind generates each one. */
const FILL: Record<Pastel, string> = {
  lilac: '[&>[data-slot=progress-indicator]]:bg-lilac',
  mint: '[&>[data-slot=progress-indicator]]:bg-mint',
  peach: '[&>[data-slot=progress-indicator]]:bg-peach',
  rose: '[&>[data-slot=progress-indicator]]:bg-rose',
  sky: '[&>[data-slot=progress-indicator]]:bg-sky',
  butter: '[&>[data-slot=progress-indicator]]:bg-butter',
};

const SIZES = { sm: 'h-2.5', md: 'h-3.5', lg: 'h-5' } as const;

export type ProgressProps = ComponentProps<typeof ProgressPrimitive> & {
  tone?: Pastel;
  size?: keyof typeof SIZES;
};

/**
 * How far along: cards reviewed today, an upload. An Ink-outlined bar whose
 * fill ends in an Ink edge. With no `value` it slides, for work of unknown
 * length. Name it with `aria-label` or `aria-labelledby`.
 */
export function Progress({
  tone = 'lilac',
  size = 'md',
  className,
  value,
  max,
  ...props
}: ProgressProps): React.JSX.Element {
  return (
    <ProgressPrimitive
      value={value}
      {...progressAttributes(value, max)}
      className={cn(
        'rounded-full border-2 border-ink bg-card',
        SIZES[size],
        FILL[tone],
        '[&>[data-slot=progress-indicator]]:border-r-2 [&>[data-slot=progress-indicator]]:border-ink',
        '[&[data-state=indeterminate]>[data-slot=progress-indicator]]:w-2/5 [&[data-state=indeterminate]>[data-slot=progress-indicator]]:animate-progress-indeterminate [&[data-state=indeterminate]>[data-slot=progress-indicator]]:rounded-full [&[data-state=indeterminate]>[data-slot=progress-indicator]]:border-x-2',
        className,
      )}
      {...props}
    />
  );
}
