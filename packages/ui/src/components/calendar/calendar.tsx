'use client';

import type { ComponentProps } from 'react';
import { getDefaultClassNames } from 'react-day-picker';
import { buttonVariants } from '#components/button';
import { FOCUS_RING } from '#lib/brand';
import { cn } from '#lib/utils';
import { CalendarDayButton, Calendar as CalendarPrimitive } from '#ui/calendar';

/**
 * A day: a round button. Selected days (and both ends of a range) fill Lilac
 * inside an Ink outline, so the selection reads without the pastel; days
 * inside a range sit on a Lilac wash.
 */
const DAY_BUTTON = cn(
  'rounded-full text-base font-semibold text-ink hover:bg-butter hover:text-ink',
  'group-data-[focused=true]/day:ring-0',
  'data-[selected-single=true]:border-2 data-[selected-single=true]:border-ink data-[selected-single=true]:bg-lilac data-[selected-single=true]:font-bold data-[selected-single=true]:text-ink',
  'data-[range-start=true]:rounded-full data-[range-start=true]:border-2 data-[range-start=true]:border-ink data-[range-start=true]:bg-lilac data-[range-start=true]:text-ink',
  'data-[range-end=true]:rounded-full data-[range-end=true]:border-2 data-[range-end=true]:border-ink data-[range-end=true]:bg-lilac data-[range-end=true]:text-ink',
  'data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-transparent data-[range-middle=true]:text-ink',
  FOCUS_RING,
);

function DayButton({
  className,
  ...props
}: ComponentProps<typeof CalendarDayButton>): React.JSX.Element {
  return <CalendarDayButton className={cn(className, DAY_BUTTON)} {...props} />;
}

const FULL_DATE_EN = new Intl.DateTimeFormat('en-US', { dateStyle: 'full' });

/**
 * English names for day buttons with the day as a plain number: "Sunday,
 * November 1, 2026". react-day-picker's English label writes "1st", so the
 * visible "1" is not part of the name and speech input ("click 1") misses it
 * (WCAG 2.5.3). Other locales bring translated labels that already contain it.
 * @param date - the day
 * @param modifiers - the day's state
 * @returns the button's accessible name
 */
function labelEnglishDay(date: Date, modifiers: Record<string, boolean>): string {
  let label = FULL_DATE_EN.format(date);
  if (modifiers.today) label = `Today, ${label}`;
  if (modifiers.selected) label = `${label}, selected`;
  return label;
}

export type CalendarProps = ComponentProps<typeof CalendarPrimitive> & {
  /** Draw the calendar on its own sticker card; off inside a popover. */
  framed?: boolean;
};

/**
 * A month view. Pass `locale` (`import { sk } from 'react-day-picker/locale'`)
 * for month and weekday names and the first day of the week.
 */
export function Calendar({
  framed = true,
  captionLayout = 'label',
  className,
  classNames,
  components,
  formatters,
  ...props
}: CalendarProps): React.JSX.Element {
  const defaults = getDefaultClassNames();
  const navButton = cn(
    buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
    'size-(--cell-size) aria-disabled:opacity-40',
  );
  return (
    <CalendarPrimitive
      captionLayout={captionLayout}
      className={cn(
        'p-3 text-ink [--cell-size:--spacing(10)]',
        framed && 'rounded-card border-2 border-ink bg-card shadow-sticker-sm',
        className,
      )}
      classNames={{
        button_previous: cn(navButton, defaults.button_previous),
        button_next: cn(navButton, defaults.button_next),
        caption_label: cn(
          'font-display font-bold select-none',
          captionLayout === 'label'
            ? 'text-base'
            : 'flex h-8 items-center gap-1 rounded-md pr-1 pl-2 text-sm [&>svg]:size-3.5',
          defaults.caption_label,
        ),
        dropdown_root: cn(
          'relative rounded-lg border-2 border-ink/80 has-focus:outline-3 has-focus:outline-offset-2 has-focus:outline-focus has-focus:outline-solid',
          defaults.dropdown_root,
        ),
        weekday: cn(
          'flex-1 rounded-md text-[0.8rem] font-semibold text-ink-soft select-none',
          defaults.weekday,
        ),
        today: cn(
          'rounded-full bg-butter text-ink data-[selected=true]:bg-transparent',
          defaults.today,
        ),
        range_start: cn('rounded-l-full bg-lilac/40', defaults.range_start),
        range_middle: cn('rounded-none bg-lilac/40', defaults.range_middle),
        range_end: cn('rounded-r-full bg-lilac/40', defaults.range_end),
        outside: cn('text-ink-soft/70 aria-selected:text-ink-soft', defaults.outside),
        ...classNames,
      }}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString(props.locale?.code, { month: 'short' }),
        ...formatters,
      }}
      components={{ DayButton, ...components }}
      {...(props.locale?.code === undefined || props.locale.code.startsWith('en')
        ? { labels: { labelDayButton: labelEnglishDay } }
        : {})}
      {...props}
    />
  );
}
