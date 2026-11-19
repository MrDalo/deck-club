import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { cs, sk } from 'react-day-picker/locale';
import { Calendar, type CalendarProps } from '.';

/** The props every selection mode shares; each story adds its mode. */
type StoryArgs = Omit<CalendarProps, 'mode' | 'selected' | 'onSelect' | 'required'>;

const NOVEMBER = new Date(2026, 10, 1);

const meta = {
  title: 'Components/Calendar',
  component: Calendar,
  args: { defaultMonth: NOVEMBER },
  argTypes: {
    framed: { control: 'boolean' },
    captionLayout: {
      control: 'inline-radio',
      options: ['label', 'dropdown', 'dropdown-months', 'dropdown-years'],
    },
    showWeekNumber: { control: 'boolean' },
  },
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<StoryArgs>;

export const Single: Story = {
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>(new Date(2026, 10, 18));
    return <Calendar {...args} mode="single" selected={date} onSelect={setDate} />;
  },
};

export const Range: Story = {
  render: (args) => {
    const [range, setRange] = useState<DateRange | undefined>({
      from: new Date(2026, 10, 16),
      to: new Date(2026, 10, 20),
    });
    return (
      <Calendar {...args} mode="range" numberOfMonths={2} selected={range} onSelect={setRange} />
    );
  },
};

export const Multiple: Story = {
  render: (args) => {
    const [days, setDays] = useState<Date[] | undefined>([
      new Date(2026, 10, 3),
      new Date(2026, 10, 10),
      new Date(2026, 10, 17),
    ]);
    return <Calendar {...args} mode="multiple" selected={days} onSelect={setDays} />;
  },
};

export const MonthAndYearDropdowns: Story = {
  args: {
    captionLayout: 'dropdown',
    startMonth: new Date(1940, 0),
    endMonth: new Date(2026, 11),
  },
  render: (args) => <Calendar {...args} mode="single" />,
};

export const DisabledDays: Story = {
  render: (args) => (
    <Calendar
      {...args}
      mode="single"
      disabled={[{ before: new Date(2026, 10, 10) }, { dayOfWeek: [0, 6] }]}
    />
  ),
};

export const WeekNumbers: Story = {
  args: { showWeekNumber: true },
  render: (args) => <Calendar {...args} mode="single" />,
};

export const Slovak: Story = {
  args: { locale: sk, captionLayout: 'dropdown' },
  render: (args) => <Calendar {...args} mode="single" selected={new Date(2026, 10, 18)} />,
};

export const Czech: Story = {
  args: { locale: cs },
  render: (args) => <Calendar {...args} mode="single" selected={new Date(2026, 10, 18)} />,
};

export const Unframed: Story = {
  args: { framed: false },
  render: (args) => <Calendar {...args} mode="single" />,
};
