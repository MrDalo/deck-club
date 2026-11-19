import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch, SwitchField } from '.';

const meta = {
  title: 'Components/Switch',
  component: Switch,
  args: { 'aria-label': 'Sound effects' },
  argTypes: { disabled: { control: 'boolean' } },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};
export const On: Story = { args: { defaultChecked: true } };
export const Disabled: Story = {
  render: () => (
    <div className="flex gap-4">
      <Switch aria-label="Off" disabled />
      <Switch aria-label="On" disabled defaultChecked />
    </div>
  ),
};

export const Settings: Story = {
  render: () => (
    <div className="grid max-w-md gap-5 rounded-card border-2 border-ink bg-card p-5 shadow-sticker-sm">
      <SwitchField
        label="Daily reminder"
        description="An email at 8:00 when cards are due."
        defaultChecked
      />
      <SwitchField label="Sound effects" description="A soft click when you rate a card." />
      <SwitchField
        label="Let my AI add cards"
        description="Claude and ChatGPT, through MCP."
        defaultChecked
      />
    </div>
  ),
};
