import type { Meta, StoryObj } from '@storybook/react-vite';
import { Separator } from '.';

const meta = {
  title: 'Components/Separator',
  component: Separator,
  argTypes: {
    variant: { control: 'inline-radio', options: ['line', 'ink', 'dashed'] },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
  },
  render: (args) => (
    <div className="max-w-sm">
      <p className="font-display text-lg font-bold">Biology exam</p>
      <p className="text-ink-soft">42 cards</p>
      <Separator {...args} className="my-4" />
      <p>Cells, genetics and evolution.</p>
    </div>
  ),
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Line: Story = {};
export const Ink: Story = { args: { variant: 'ink' } };
export const Dashed: Story = { args: { variant: 'dashed' } };

export const Vertical: Story = {
  render: (args) => (
    <div className="flex h-6 items-center gap-4 font-semibold">
      <span>Decks</span>
      <Separator {...args} orientation="vertical" />
      <span>Clubs</span>
      <Separator {...args} orientation="vertical" />
      <span>Stats</span>
    </div>
  ),
};
