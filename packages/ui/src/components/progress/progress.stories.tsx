import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from '.';

const meta = {
  title: 'Components/Progress',
  component: Progress,
  args: { value: 60, 'aria-label': 'Cards reviewed today', className: 'max-w-sm' },
  argTypes: {
    tone: { control: 'select', options: ['lilac', 'mint', 'peach', 'rose', 'sky', 'butter'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    value: { control: { type: 'range', min: 0, max: 100 } },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { value: 0 } };
export const Complete: Story = { args: { value: 100, tone: 'mint' } };
export const Indeterminate: Story = { args: { value: null, 'aria-label': 'Importing your deck' } };

export const Sizes: Story = {
  render: (args) => (
    <div className="grid max-w-sm gap-4">
      <Progress {...args} size="sm" />
      <Progress {...args} size="md" />
      <Progress {...args} size="lg" />
    </div>
  ),
};

export const Tones: Story = {
  render: (args) => (
    <div className="grid max-w-sm gap-4">
      {(['lilac', 'mint', 'peach', 'rose', 'sky', 'butter'] as const).map((tone, index) => (
        <Progress
          key={tone}
          {...args}
          tone={tone}
          value={20 + index * 14}
          aria-label={`${tone} progress`}
        />
      ))}
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid max-w-sm gap-2">
      <div className="flex justify-between text-sm font-semibold">
        <span id="today-label">Today</span>
        <span className="text-ink-soft">18 of 30 cards</span>
      </div>
      <Progress aria-labelledby="today-label" value={60} />
    </div>
  ),
};
