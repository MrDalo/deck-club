import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox, CheckboxField } from '.';

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  args: { 'aria-label': 'Shuffle cards' },
  argTypes: {
    checked: { control: 'inline-radio', options: [false, true, 'indeterminate'] },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const Indeterminate: Story = { args: { checked: 'indeterminate' } };
export const Disabled: Story = {
  render: () => (
    <div className="flex gap-4">
      <Checkbox aria-label="Off" disabled />
      <Checkbox aria-label="On" disabled defaultChecked />
    </div>
  ),
};
export const Invalid: Story = { args: { 'aria-invalid': true } };

export const WithLabel: Story = {
  render: () => <CheckboxField label="Shuffle cards" defaultChecked />,
};

export const WithDescription: Story = {
  render: () => (
    <div className="grid max-w-sm gap-5">
      <CheckboxField
        label="Daily reminder"
        description="An email at 8:00 when cards are due."
        defaultChecked
      />
      <CheckboxField
        label="Show hints"
        description="Reveal the first letter of the answer."
        disabled
      />
    </div>
  ),
};
