import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from '.';

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  args: { className: 'h-4 w-48' },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Line: Story = {};

export const DeckTile: Story = {
  render: () => (
    <div
      aria-busy="true"
      className="grid w-72 gap-4 rounded-card border-2 border-ink bg-card p-5 shadow-sticker-sm"
    >
      <span className="sr-only">Loading your decks</span>
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-11 w-32 rounded-full" />
    </div>
  ),
};

export const MemberList: Story = {
  render: () => (
    <ul aria-busy="true" aria-label="Loading members" className="grid w-72 gap-3">
      {[0, 1, 2].map((row) => (
        <li key={row} className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="grid flex-1 gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </li>
      ))}
    </ul>
  ),
};
