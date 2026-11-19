'use client';

import type { ComponentProps } from 'react';
import { cn } from '#lib/utils';
import {
  ChartContainer as ChartContainerPrimitive,
  ChartLegendContent as ChartLegendContentPrimitive,
  ChartLegend as ChartLegendPrimitive,
  ChartTooltipContent as ChartTooltipContentPrimitive,
} from '#ui/chart';

export { ChartTooltip, type ChartConfig } from '#ui/chart';

/** The six pastels as chart colours, for a `ChartConfig`. */
export const CHART_COLORS = {
  lilac: 'var(--color-lilac)',
  mint: 'var(--color-mint)',
  peach: 'var(--color-peach)',
  rose: 'var(--color-rose)',
  sky: 'var(--color-sky)',
  butter: 'var(--color-butter)',
} as const;

/** The review ratings in their brand colours (brand/README.md). */
export const RATING_COLORS = {
  again: CHART_COLORS.rose,
  hard: CHART_COLORS.peach,
  good: CHART_COLORS.mint,
  easy: CHART_COLORS.sky,
} as const;

/** Spread onto a Bar, Area or Pie: the sticker's 2px Ink outline. */
export const STICKER_STROKE = { stroke: 'var(--color-ink)', strokeWidth: 2 } as const;

/**
 * A responsive chart in the brand: Ink-soft axis labels, Line grid, a Butter
 * hover band. Colours come from the `config` (use `CHART_COLORS`); series
 * read them as `var(--color-<key>)`.
 */
export function ChartContainer({
  className,
  ...props
}: ComponentProps<typeof ChartContainerPrimitive>): React.JSX.Element {
  return (
    <ChartContainerPrimitive
      className={cn(
        'font-sans text-sm text-ink',
        '[&_.recharts-cartesian-axis-tick_text]:fill-ink-soft [&_.recharts-cartesian-axis-tick_text]:font-semibold',
        '[&_.recharts-cartesian-grid_line]:stroke-line [&_.recharts-polar-grid_[stroke]]:stroke-line',
        '[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-butter/60 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-ink-soft',
        '[&_.recharts-label]:fill-ink',
        className,
      )}
      {...props}
    />
  );
}

/**
 * The legend. Series stay in the order the chart draws them (Again, Hard,
 * Good, Easy); recharts would sort them by name.
 */
export function ChartLegend(props: ComponentProps<typeof ChartLegendPrimitive>): React.JSX.Element {
  return <ChartLegendPrimitive itemSorter={null} {...props} />;
}

/** The hover card: a small sticker with Ink text and Ink-soft series names. */
export function ChartTooltipContent({
  className,
  ...props
}: ComponentProps<typeof ChartTooltipContentPrimitive>): React.JSX.Element {
  return (
    <ChartTooltipContentPrimitive
      className={cn(
        'min-w-36 gap-2 rounded-xl border-2 border-ink bg-card px-3 py-2 text-sm text-ink shadow-sticker-sm [&_.font-mono]:font-sans [&_.font-mono]:font-bold [&_.text-muted-foreground]:text-ink-soft',
        className,
      )}
      {...props}
    />
  );
}

/** The key: each series' swatch in an Ink ring, its name in Ink. */
export function ChartLegendContent({
  className,
  ...props
}: ComponentProps<typeof ChartLegendContentPrimitive>): React.JSX.Element {
  return (
    <ChartLegendContentPrimitive
      className={cn(
        'flex-wrap gap-x-5 gap-y-2 font-semibold text-ink [&>div>div:first-child]:size-3 [&>div>div:first-child]:rounded-full [&>div>div:first-child]:border-[1.5px] [&>div>div:first-child]:border-ink',
        className,
      )}
      {...props}
    />
  );
}
