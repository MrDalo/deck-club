import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '#components/button';
import { Spinner } from '.';

const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  args: { label: 'Loading cards' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <Spinner {...args} size="sm" />
      <Spinner {...args} size="md" />
      <Spinner {...args} size="lg" />
    </div>
  ),
};

export const InButton: Story = {
  render: () => (
    <Button disabled>
      <Spinner label="Saving" size="sm" />
      Saving…
    </Button>
  ),
};

export const WithText: Story = {
  render: (args) => (
    <p className="flex items-center gap-2 font-semibold text-ink-soft">
      <Spinner {...args} size="sm" />
      Claude is adding cards…
    </p>
  ),
};
