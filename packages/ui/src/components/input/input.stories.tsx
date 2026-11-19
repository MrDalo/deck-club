import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from '#components/label';
import { Input } from '.';

const meta = {
  title: 'Components/Input',
  component: Input,
  args: { 'aria-label': 'Deck title', placeholder: 'Biology exam' },
  argTypes: {
    type: { control: 'select', options: ['text', 'email', 'password', 'number', 'search', 'file'] },
    disabled: { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithValue: Story = { args: { defaultValue: 'Spanish verbs' } };
export const Invalid: Story = { args: { 'aria-invalid': true, defaultValue: 'x' } };
export const Disabled: Story = { args: { disabled: true, defaultValue: 'Biology exam' } };
export const Email: Story = {
  args: { type: 'email', 'aria-label': 'Email', placeholder: 'you@example.com' },
};
export const Password: Story = {
  args: { type: 'password', 'aria-label': 'Password', placeholder: '' },
};
export const File: Story = {
  args: { type: 'file', 'aria-label': 'Import a deck', accept: '.csv,.apkg' },
};
export const WithLabel: Story = {
  render: (args) => (
    <div className="grid gap-1.5">
      <Label htmlFor="title">Deck title</Label>
      <Input {...args} id="title" aria-label={undefined} />
    </div>
  ),
};
