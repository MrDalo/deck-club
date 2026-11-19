'use client';

import { useRef, useState, type ComponentProps } from 'react';
import type { DateRange, DayPickerLocale } from 'react-day-picker';
import { Calendar } from '#components/calendar';
import { SURFACE } from '#lib/brand';
import { useControllableState } from '#lib/use-controllable-state';
import { cn } from '#lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '#ui/popover';
import { DateFieldTrigger } from './date-field-trigger.js';
import { monthToShow, type PickerCalendarOptions } from './date-picker.js';
import { formatDateRange } from './format-date.js';

export type { DateRange } from 'react-day-picker';

export type DateRangePickerProps = Omit<
  ComponentProps<'button'>,
  'value' | 'defaultValue' | 'onChange'
> & {
  /** The chosen range; `null` for none. Leave out to let the picker keep it. */
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onValueChange?: (range: DateRange | null) => void;
  /** Shown before a range is chosen, translated ("Pick dates"). */
  placeholder: string;
  locale?: DayPickerLocale;
  formatOptions?: Intl.DateTimeFormatOptions;
  /** Months side by side; 2 by default. */
  numberOfMonths?: number;
  calendar?: Omit<PickerCalendarOptions, 'numberOfMonths'>;
};

/**
 * A form field that picks a start and an end date. The first pick after
 * opening starts a range (react-day-picker makes it a one-day range), the
 * second ends it and closes the picker.
 */
export function DateRangePicker({
  value,
  defaultValue = null,
  onValueChange,
  placeholder,
  locale,
  formatOptions,
  numberOfMonths = 2,
  calendar,
  ...props
}: DateRangePickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useControllableState({ value, defaultValue, onChange: onValueChange });
  const picks = useRef(0);
  const changeOpen = (next: boolean): void => {
    if (next) picks.current = 0;
    setOpen(next);
  };
  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <DateFieldTrigger
          valueText={formatDateRange(range, locale?.code, formatOptions)}
          placeholder={placeholder}
          {...props}
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn(SURFACE, 'w-auto p-0')}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Calendar
          {...calendar}
          framed={false}
          mode="range"
          locale={locale}
          numberOfMonths={numberOfMonths}
          selected={range ?? undefined}
          {...monthToShow(range?.from ?? calendar?.defaultMonth)}
          autoFocus
          onSelect={(next) => {
            setRange(next ?? null);
            picks.current += 1;
            if (picks.current >= 2 && next?.to !== undefined) setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
