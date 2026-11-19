import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '.';

const meta = {
  title: 'Components/Toggle Group',
  component: ToggleGroup,
  args: { type: 'single', defaultValue: 'medium', 'aria-label': 'Card size' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['ghost', 'outline'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="small">Small</ToggleGroupItem>
      <ToggleGroupItem value="medium">Medium</ToggleGroupItem>
      <ToggleGroupItem value="large">Large</ToggleGroupItem>
    </ToggleGroup>
  ),
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ghost: Story = {};
export const Outline: Story = { args: { variant: 'outline' } };
export const Small: Story = { args: { variant: 'outline', size: 'sm' } };

export const Multiple: Story = {
  args: {
    type: 'multiple',
    defaultValue: ['due', 'ai'],
    'aria-label': 'Show cards',
    variant: 'outline',
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="due">Due</ToggleGroupItem>
      <ToggleGroupItem value="new">New</ToggleGroupItem>
      <ToggleGroupItem value="ai">From Claude</ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Icons: Story = {
  args: { 'aria-label': 'Text alignment', defaultValue: 'left', variant: 'outline' },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeftIcon aria-hidden />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align centre">
        <AlignCenterIcon aria-hidden />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRightIcon aria-hidden />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};
