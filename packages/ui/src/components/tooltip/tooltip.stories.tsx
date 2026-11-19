import type { Meta, StoryObj } from '@storybook/react-vite';
import { ShuffleIcon } from 'lucide-react';
import { Button } from '#components/button';
import { Kbd } from '#components/kbd';
import { Tooltip, TooltipContent, TooltipTrigger } from '.';

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  argTypes: { defaultOpen: { control: 'boolean' } },
  decorators: [
    (Story) => (
      <div className="p-12">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const IconButton: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger asChild>
        <Button size="icon" variant="secondary" aria-label="Shuffle">
          <ShuffleIcon aria-hidden />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Shuffle the deck</TooltipContent>
    </Tooltip>
  ),
};

export const WithShortcut: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger asChild>
        <Button variant="secondary">Flip</Button>
      </TooltipTrigger>
      <TooltipContent className="flex items-center gap-2">
        Flip the card <Kbd>Space</Kbd>
      </TooltipContent>
    </Tooltip>
  ),
};

export const Sides: Story = {
  render: () => (
    <div className="flex gap-4">
      {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
        <Tooltip key={side} defaultOpen>
          <TooltipTrigger asChild>
            <Button size="sm" variant="secondary">
              {side}
            </Button>
          </TooltipTrigger>
          <TooltipContent side={side}>Hint on the {side}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
};

export const Open: Story = { ...IconButton, args: { defaultOpen: true } };
