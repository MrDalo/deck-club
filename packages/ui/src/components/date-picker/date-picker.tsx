'use client';

import { useState, type ComponentProps } from 'react';
import type { DayPickerLocale } from 'react-day-picker';
import { Calendar, type CalendarProps } from '#components/calendar';
import { SURFACE } from '#lib/brand';
import { useControllableState } from '#lib/use-controllable-state';
import { cn } from '#lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '#ui/popover';
import { DateFieldTrigger } from './date-field-trigger.js';
import { formatDate } from './format-date.js';

/** Calendar options a picker passes through: limits, disabled days, dropdowns. */
export type PickerCalendarOptions = Omit<
  CalendarProps,
  'mode' | 'selected' | 'onSelect' | 'required' | 'locale' | 'framed'
>;

export type DatePickerProps = Omit<
  ComponentProps<'button'>,
  'value' | 'defaultValue' | 'onChange'
> & {
  /** The chosen date; `null` for none. Leave out to let the picker keep it. */
  value?: Date | null;
  defaultValue?: Date | null;
  onValueChange?: (date: Date | null) => void;
  /** Shown before a date is chosen, translated ("Pick a date"). */
  placeholder: string;
  /** Month names, weekdays, week start and the date format (`react-day-picker/locale`). */
  locale?: DayPickerLocale;
  /** How the chosen date is written; `{ dateStyle: 'long' }` by default. */
  formatOptions?: Intl.DateTimeFormatOptions;
  calendar?: PickerCalendarOptions;
};

/**
 * Opens the calendar on the chosen date's month, else on the caller's
 * `defaultMonth`, else on today's.
 * @param month - the month to open on, if any
 * @returns the calendar prop, or nothing
 */
export function monthToShow(month: Date | undefined): { defaultMonth?: Date } {
  return month === undefined ? {} : { defaultMonth: month };
}

/** A form field that picks one date from a calendar popover. */
export function DatePicker({
  value,
  defaultValue = null,
  onValueChange,
  placeholder,
  locale,
  formatOptions,
  calendar,
  ...props
}: DatePickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useControllableState({ value, defaultValue, onChange: onValueChange });
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <DateFieldTrigger
          valueText={date === null ? undefined : formatDate(date, locale?.code, formatOptions)}
          placeholder={placeholder}
          {...props}
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn(SURFACE, 'w-auto p-0')}
        // The calendar focuses the chosen day (or today) itself.
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Calendar
          {...calendar}
          framed={false}
          mode="single"
          locale={locale}
          selected={date ?? undefined}
          {...monthToShow(date ?? calendar?.defaultMonth)}
          autoFocus
          onSelect={(next) => {
            setDate(next ?? null);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
