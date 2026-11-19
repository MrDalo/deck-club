import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CHART_COLORS,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  RATING_COLORS,
  STICKER_STROKE,
  type ChartConfig,
} from '.';

const WEEK = [
  { day: 'Mon', reviews: 42, again: 4, hard: 8, good: 24, easy: 6 },
  { day: 'Tue', reviews: 35, again: 3, hard: 6, good: 20, easy: 6 },
  { day: 'Wed', reviews: 58, again: 7, hard: 10, good: 32, easy: 9 },
  { day: 'Thu', reviews: 21, again: 2, hard: 4, good: 12, easy: 3 },
  { day: 'Fri', reviews: 49, again: 5, hard: 9, good: 27, easy: 8 },
  { day: 'Sat', reviews: 12, again: 1, hard: 2, good: 7, easy: 2 },
  { day: 'Sun', reviews: 30, again: 3, hard: 5, good: 17, easy: 5 },
];

const RATINGS_CONFIG = {
  again: { label: 'Again', color: RATING_COLORS.again },
  hard: { label: 'Hard', color: RATING_COLORS.hard },
  good: { label: 'Good', color: RATING_COLORS.good },
  easy: { label: 'Easy', color: RATING_COLORS.easy },
} satisfies ChartConfig;

const meta = {
  title: 'Components/Chart',
  decorators: [
    (Story) => (
      <div className="max-w-xl rounded-card border-2 border-ink bg-card p-4 shadow-sticker-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const ReviewsPerDay: Story = {
  render: () => (
    <ChartContainer
      config={{ reviews: { label: 'Reviews', color: CHART_COLORS.lilac } }}
      className="h-64 w-full"
    >
      <BarChart data={WEEK} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="reviews" fill="var(--color-reviews)" radius={8} {...STICKER_STROKE} />
      </BarChart>
    </ChartContainer>
  ),
};

export const RatingsStacked: Story = {
  render: () => (
    <ChartContainer config={RATINGS_CONFIG} className="h-64 w-full">
      <BarChart data={WEEK} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {(['again', 'hard', 'good', 'easy'] as const).map((rating) => (
          <Bar
            key={rating}
            dataKey={rating}
            stackId="ratings"
            fill={`var(--color-${rating})`}
            {...STICKER_STROKE}
          />
        ))}
      </BarChart>
    </ChartContainer>
  ),
};

export const Retention: Story = {
  render: () => (
    <ChartContainer
      config={{ retention: { label: 'Retention', color: CHART_COLORS.mint } }}
      className="h-64 w-full"
    >
      <AreaChart
        data={[
          { month: 'Jun', retention: 78 },
          { month: 'Jul', retention: 82 },
          { month: 'Aug', retention: 80 },
          { month: 'Sep', retention: 86 },
          { month: 'Oct', retention: 89 },
          { month: 'Nov', retention: 91 },
        ]}
        accessibilityLayer
      >
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis domain={[60, 100]} tickLine={false} axisLine={false} width={44} unit="%" />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Area
          dataKey="retention"
          type="monotone"
          fill="var(--color-retention)"
          fillOpacity={0.7}
          {...STICKER_STROKE}
        />
      </AreaChart>
    </ChartContainer>
  ),
};

export const RatingMix: Story = {
  render: () => {
    const totals = (['again', 'hard', 'good', 'easy'] as const).map((rating) => ({
      rating,
      count: WEEK.reduce((sum, day) => sum + day[rating], 0),
    }));
    return (
      <ChartContainer config={RATINGS_CONFIG} className="mx-auto h-72 w-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="rating" hideLabel />} />
          <ChartLegend content={<ChartLegendContent nameKey="rating" />} />
          <Pie data={totals} dataKey="count" nameKey="rating" innerRadius={56} {...STICKER_STROKE}>
            {totals.map(({ rating }) => (
              <Cell key={rating} fill={`var(--color-${rating})`} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
    );
  },
};
