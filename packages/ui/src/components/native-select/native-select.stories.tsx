import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from '#components/label';
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from '.';

const meta = {
  title: 'Components/Native Select',
  component: NativeSelect,
  args: { 'aria-label': 'Deck language', defaultValue: 'en', className: 'max-w-xs' },
  argTypes: { disabled: { control: 'boolean' }, 'aria-invalid': { control: 'boolean' } },
  render: (args) => (
    <NativeSelect {...args}>
      <NativeSelectOption value="en">English</NativeSelectOption>
      <NativeSelectOption value="sk">Slovenčina</NativeSelectOption>
      <NativeSelectOption value="cs">Čeština</NativeSelectOption>
      <NativeSelectOption value="de">Deutsch</NativeSelectOption>
    </NativeSelect>
  ),
} satisfies Meta<typeof NativeSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Placeholder: Story = {
  args: { defaultValue: '' },
  render: (args) => (
    <NativeSelect {...args}>
      <NativeSelectOption value="" disabled>
        Choose a language
      </NativeSelectOption>
      <NativeSelectOption value="en">English</NativeSelectOption>
      <NativeSelectOption value="sk">Slovenčina</NativeSelectOption>
    </NativeSelect>
  ),
};

export const Groups: Story = {
  render: (args) => (
    <NativeSelect {...args}>
      <NativeSelectOptGroup label="Most used">
        <NativeSelectOption value="en">English</NativeSelectOption>
        <NativeSelectOption value="sk">Slovenčina</NativeSelectOption>
        <NativeSelectOption value="cs">Čeština</NativeSelectOption>
      </NativeSelectOptGroup>
      <NativeSelectOptGroup label="More languages">
        <NativeSelectOption value="de">Deutsch</NativeSelectOption>
        <NativeSelectOption value="es">Español</NativeSelectOption>
      </NativeSelectOptGroup>
    </NativeSelect>
  ),
};

export const Invalid: Story = { args: { 'aria-invalid': true } };
export const Disabled: Story = { args: { disabled: true } };

export const WithLabel: Story = {
  render: (args) => (
    <div className="grid max-w-xs gap-1.5">
      <Label htmlFor="language">Deck language</Label>
      <NativeSelect {...args} id="language" aria-label={undefined} className="">
        <NativeSelectOption value="en">English</NativeSelectOption>
        <NativeSelectOption value="sk">Slovenčina</NativeSelectOption>
      </NativeSelect>
    </div>
  ),
};
