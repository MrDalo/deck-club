import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilterIcon } from 'lucide-react';
import { Button } from '#components/button';
import { CheckboxField } from '#components/checkbox';
import { Field, FieldLabel } from '#components/field';
import { Input } from '#components/input';
import { Popover, PopoverContent, PopoverTrigger } from '.';

const meta = {
  title: 'Components/Popover',
  component: Popover,
  argTypes: { defaultOpen: { control: 'boolean' } },
  decorators: [
    (Story) => (
      <div className="min-h-64">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filters: Story = {
  render: (args) => (
    <Popover {...args}>
      <PopoverTrigger asChild>
        <Button variant="secondary">
          <FilterIcon aria-hidden />
          Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" aria-label="Filter cards" className="grid gap-3">
        <p className="font-display text-lg font-bold">Show cards</p>
        <CheckboxField label="Due today" defaultChecked />
        <CheckboxField label="Added by Claude" />
        <CheckboxField label="Suspended" />
      </PopoverContent>
    </Popover>
  ),
};

export const QuickEdit: Story = {
  render: (args) => (
    <Popover {...args}>
      <PopoverTrigger asChild>
        <Button>Rename</Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Rename deck" className="grid gap-3">
        <Field>
          <FieldLabel htmlFor="popover-name">Deck name</FieldLabel>
          <Input id="popover-name" defaultValue="Biology exam" />
        </Field>
        <Button size="sm" className="justify-self-end">
          Save
        </Button>
      </PopoverContent>
    </Popover>
  ),
};

export const Open: Story = { ...Filters, args: { defaultOpen: true } };
