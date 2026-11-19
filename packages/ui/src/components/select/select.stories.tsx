import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from '#components/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '.';

const meta = {
  title: 'Components/Select',
  component: Select,
  argTypes: { disabled: { control: 'boolean' } },
  decorators: [
    (Story) => (
      <div className="grid max-w-xs gap-1.5">
        <Label id="language-label">Deck language</Label>
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <Select {...args}>
      <SelectTrigger aria-labelledby="language-label">
        <SelectValue placeholder="Choose a language" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Most used</SelectLabel>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="sk">Slovenčina</SelectItem>
          <SelectItem value="cs">Čeština</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>More languages</SelectLabel>
          <SelectItem value="de">Deutsch</SelectItem>
          <SelectItem value="es">Español</SelectItem>
          <SelectItem value="la" disabled>
            Latina (coming soon)
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Placeholder: Story = {};
export const Chosen: Story = { args: { defaultValue: 'sk' } };
export const Disabled: Story = { args: { disabled: true, defaultValue: 'en' } };
/**
 * Open from the start. While the list is open Radix hides the rest of the
 * page from assistive technology and keeps focus in the list, so axe's
 * aria-hidden-focus finding on this story (the trigger behind it) is expected.
 */
export const Open: Story = { args: { defaultOpen: true, defaultValue: 'en' } };

export const Small: Story = {
  render: (args) => (
    <Select {...args} defaultValue="due">
      <SelectTrigger size="sm" aria-labelledby="language-label" className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="due">Due first</SelectItem>
        <SelectItem value="new">New first</SelectItem>
      </SelectContent>
    </Select>
  ),
};
