import type { Meta, StoryObj } from '@storybook/react-vite';
import { BoldIcon, LightbulbIcon } from 'lucide-react';
import { Toggle } from '.';

const meta = {
  title: 'Components/Toggle',
  component: Toggle,
  args: { children: 'Only due cards' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['ghost', 'outline'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ghost: Story = {};
export const GhostOn: Story = { args: { defaultPressed: true } };
export const Outline: Story = { args: { variant: 'outline' } };
export const OutlineOn: Story = { args: { variant: 'outline', defaultPressed: true } };

export const IconOnly: Story = {
  render: (args) => (
    <div className="flex gap-3">
      <Toggle {...args} aria-label="Bold">
        <BoldIcon aria-hidden />
      </Toggle>
      <Toggle {...args} variant="outline" aria-label="Show hints" defaultPressed>
        <LightbulbIcon aria-hidden />
      </Toggle>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Toggle {...args} variant="outline" size="sm">
        Small
      </Toggle>
      <Toggle {...args} variant="outline" size="md">
        Medium
      </Toggle>
      <Toggle {...args} variant="outline" size="lg">
        Large
      </Toggle>
    </div>
  ),
};

export const Disabled: Story = { args: { disabled: true } };
