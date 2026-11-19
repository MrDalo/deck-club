import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from '#components/checkbox';
import { Input } from '#components/input';
import { Label } from '.';

const meta = {
  title: 'Components/Label',
  component: Label,
  args: { children: 'Deck title' },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithInput: Story = {
  render: (args) => (
    <div className="grid max-w-xs gap-1.5">
      <Label {...args} htmlFor="deck-title" />
      <Input id="deck-title" placeholder="Biology exam" />
    </div>
  ),
};

export const WithCheckbox: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="shuffle" />
      <Label htmlFor="shuffle">Shuffle cards</Label>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="hints" disabled className="peer" />
      <Label htmlFor="hints">Show hints</Label>
    </div>
  ),
};
