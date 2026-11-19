import { render, screen } from '@testing-library/react';
import { cloneElement, isValidElement, type ReactNode } from 'react';
import type * as Recharts from 'recharts';
import { Bar, BarChart, XAxis } from 'recharts';
import { describe, expect, it, vi } from 'vitest';
import {
  CHART_COLORS,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltipContent,
  RATING_COLORS,
  STICKER_STROKE,
  type ChartConfig,
} from '.';

// jsdom has no layout, so recharts' ResponsiveContainer measures 0×0 and
// draws nothing. Give it a fixed size instead.
vi.mock('recharts', async (importOriginal) => {
  const recharts = await importOriginal<typeof Recharts>();
  return {
    ...recharts,
    ResponsiveContainer: ({ children }: { children: ReactNode }) =>
      isValidElement(children)
        ? cloneElement(children as React.ReactElement<{ width: number; height: number }>, {
            width: 400,
            height: 200,
          })
        : children,
  };
});

const CONFIG = {
  reviews: { label: 'Reviews', color: CHART_COLORS.lilac },
  good: { label: 'Good', color: RATING_COLORS.good },
} satisfies ChartConfig;

describe('ChartContainer', () => {
  it('turns the config into per-chart colour variables', () => {
    const { container } = render(
      <ChartContainer id="week" config={CONFIG}>
        <BarChart data={[{ day: 'Mon', reviews: 12 }]}>
          <Bar dataKey="reviews" />
        </BarChart>
      </ChartContainer>,
    );
    const css = container.querySelector('style')?.textContent ?? '';

    expect(css).toContain('[data-chart=chart-week]');
    expect(css).toContain('--color-reviews: var(--color-lilac);');
    expect(css).toContain('--color-good: var(--color-mint);');
  });

  it('draws bars with the sticker outline in brand colours', () => {
    const { container } = render(
      <ChartContainer config={CONFIG}>
        <BarChart
          data={[
            { day: 'Mon', reviews: 12 },
            { day: 'Tue', reviews: 8 },
          ]}
        >
          <XAxis dataKey="day" />
          <Bar
            dataKey="reviews"
            fill="var(--color-reviews)"
            {...STICKER_STROKE}
            isAnimationActive={false}
          />
        </BarChart>
      </ChartContainer>,
    );
    const bar = container.querySelector('.recharts-bar-rectangle path');

    expect(bar).toHaveAttribute('fill', 'var(--color-reviews)');
    expect(bar).toHaveAttribute('stroke', 'var(--color-ink)');
    expect(container.querySelector('.recharts-cartesian-axis-tick-value')).toHaveTextContent('Mon');
  });
});

describe('ChartTooltipContent', () => {
  it('names series from the config on a sticker card', () => {
    const { container } = render(
      <ChartContainer config={CONFIG}>
        <ChartTooltipContent
          active
          label="Monday"
          payload={[
            {
              dataKey: 'reviews',
              name: 'reviews',
              value: 1234,
              color: 'var(--color-reviews)',
              payload: {},
              graphicalItemId: 'reviews',
            },
          ]}
        />
      </ChartContainer>,
    );

    expect(screen.getByText('Reviews')).toHaveClass('text-muted-foreground');
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(container.querySelector('.shadow-sticker-sm')).toHaveClass('border-ink', 'rounded-xl');
  });

  it('shows nothing while inactive', () => {
    const { container } = render(
      <ChartContainer config={CONFIG}>
        <ChartTooltipContent active={false} payload={[]} />
      </ChartContainer>,
    );
    expect(container.querySelector('.shadow-sticker-sm')).toBeNull();
  });
});

describe('ChartLegendContent', () => {
  it('labels each series from the config', () => {
    render(
      <ChartContainer config={CONFIG}>
        <ChartLegendContent
          payload={[
            { value: 'reviews', dataKey: 'reviews', color: 'var(--color-reviews)', type: 'rect' },
            { value: 'good', dataKey: 'good', color: 'var(--color-good)', type: 'rect' },
          ]}
        />
      </ChartContainer>,
    );

    expect(screen.getByText('Reviews')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
  });
});

describe('ChartLegend', () => {
  it('keeps the series in drawing order, not sorted by name', () => {
    const ratings = {
      again: { label: 'Again', color: RATING_COLORS.again },
      hard: { label: 'Hard', color: RATING_COLORS.hard },
      good: { label: 'Good', color: RATING_COLORS.good },
      easy: { label: 'Easy', color: RATING_COLORS.easy },
    } satisfies ChartConfig;
    const { container } = render(
      <ChartContainer config={ratings}>
        <BarChart data={[{ day: 'Mon', again: 1, hard: 2, good: 3, easy: 4 }]}>
          <ChartLegend content={<ChartLegendContent />} />
          {(['again', 'hard', 'good', 'easy'] as const).map((key) => (
            <Bar key={key} dataKey={key} stackId="ratings" isAnimationActive={false} />
          ))}
        </BarChart>
      </ChartContainer>,
    );

    const labels = Array.from(container.querySelectorAll('.recharts-legend-wrapper div > div'))
      .map((item) => item.textContent)
      .filter((text) => text !== '');
    expect(labels).toEqual(['Again', 'Hard', 'Good', 'Easy']);
  });
});
