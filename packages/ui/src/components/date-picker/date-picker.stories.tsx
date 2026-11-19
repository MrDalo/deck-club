import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { cs, sk } from 'react-day-picker/locale';
import { DatePicker, DateRangePicker, type DateRange } from '.';

const meta = {
  title: 'Components/Date Picker',
  component: DatePicker,
  args: { placeholder: 'Pick a date', 'aria-labelledby': 'date-label' },
  argTypes: { disabled: { control: 'boolean' }, 'aria-invalid': { control: 'boolean' } },
  decorators: [
    (Story) => (
      <div className="grid max-w-xs gap-1.5">
        <span id="date-label" className="text-sm font-semibold">
          Exam date
        </span>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const WithDate: Story = { args: { defaultValue: new Date(2026, 10, 18) } };
export const Controlled: Story = {
  render: (args) => {
    const [date, setDate] = useState<Date | null>(new Date(2026, 10, 18));
    return <DatePicker {...args} value={date} onValueChange={setDate} />;
  },
};
export const ShortFormat: Story = {
  args: { defaultValue: new Date(2026, 10, 18), formatOptions: { dateStyle: 'medium' } },
};
export const DateOfBirth: Story = {
  args: {
    placeholder: 'Your birthday',
    calendar: {
      captionLayout: 'dropdown',
      startMonth: new Date(1930, 0),
      endMonth: new Date(2020, 11),
      defaultMonth: new Date(2000, 0),
    },
  },
};
export const FutureOnly: Story = {
  args: {
    calendar: { disabled: { before: new Date(2026, 10, 18) }, defaultMonth: new Date(2026, 10) },
  },
};
export const Invalid: Story = { args: { 'aria-invalid': true } };
export const Disabled: Story = { args: { disabled: true, defaultValue: new Date(2026, 10, 18) } };
export const Slovak: Story = {
  args: { locale: sk, placeholder: 'Vyber dátum', defaultValue: new Date(2026, 10, 18) },
};
export const Czech: Story = {
  args: { locale: cs, placeholder: 'Vyber datum', defaultValue: new Date(2026, 10, 18) },
};

export const Range: Story = {
  render: () => {
    const [range, setRange] = useState<DateRange | null>({
      from: new Date(2026, 10, 16),
      to: new Date(2026, 10, 20),
    });
    return (
      <DateRangePicker
        aria-labelledby="date-label"
        placeholder="Pick dates"
        value={range}
        onValueChange={setRange}
      />
    );
  },
};

export const RangeEmpty: Story = {
  render: () => <DateRangePicker aria-labelledby="date-label" placeholder="Pick dates" />,
};
