import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Slider } from '.';

const meta = {
  title: 'Components/Slider',
  component: Slider,
  args: { thumbLabels: 'New cards a day', defaultValue: [20], max: 50, className: 'max-w-sm' },
  argTypes: { disabled: { control: 'boolean' }, step: { control: 'number' } },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Steps: Story = { args: { step: 5 } };
export const Range: Story = {
  args: { thumbLabels: ['Shortest interval', 'Longest interval'], defaultValue: [3, 30], max: 60 },
};
export const Disabled: Story = { args: { disabled: true } };

export const WithValue: Story = {
  render: (args) => {
    const [value, setValue] = useState([20]);
    return (
      <div className="grid max-w-sm gap-3">
        <div className="flex justify-between text-sm font-semibold">
          <span>New cards a day</span>
          <span className="tabular-nums">{value[0]}</span>
        </div>
        <Slider {...args} value={value} onValueChange={setValue} />
      </div>
    );
  },
};

export const Vertical: Story = {
  args: { orientation: 'vertical', className: 'h-48' },
};
