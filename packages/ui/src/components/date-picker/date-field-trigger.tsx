import { CalendarIcon } from 'lucide-react';
import { useId, type ComponentProps } from 'react';
import { FIELD, FOCUS_RING } from '#lib/brand';
import { cn } from '#lib/utils';

type DateFieldTriggerProps = ComponentProps<'button'> & {
  /** The chosen date, formatted; `undefined` shows the placeholder. */
  valueText: string | undefined;
  placeholder: string;
};

/**
 * The field that opens a date picker. Labelled with `aria-labelledby`, its
 * name is the label followed by the date ("Exam date, 18 November 2026"), so
 * the value is announced, not only the label.
 */
export function DateFieldTrigger({
  valueText,
  placeholder,
  className,
  'aria-labelledby': labelledBy,
  ...props
}: DateFieldTriggerProps): React.JSX.Element {
  const valueId = useId();
  return (
    <button
      type="button"
      aria-labelledby={labelledBy === undefined ? undefined : `${labelledBy} ${valueId}`}
      data-empty={valueText === undefined}
      className={cn(FIELD, FOCUS_RING, 'justify-between', className)}
      {...props}
    >
      <span id={valueId} className={cn('truncate', valueText === undefined && 'text-ink-soft')}>
        {valueText ?? placeholder}
      </span>
      <CalendarIcon aria-hidden className="size-5 shrink-0 text-ink" />
    </button>
  );
}
