import { useId, type ComponentProps, type ReactNode } from 'react';
import { FOCUS_RING } from '#lib/brand';
import { cn } from '#lib/utils';
import {
  RadioGroupItem as RadioGroupItemPrimitive,
  RadioGroup as RadioGroupPrimitive,
} from '#ui/radio-group';
import { Label } from '#components/label';

/** One choice from a few, all visible. Name the group with `aria-label` or `aria-labelledby`. */
export function RadioGroup({
  className,
  ...props
}: ComponentProps<typeof RadioGroupPrimitive>): React.JSX.Element {
  return <RadioGroupPrimitive className={cn('gap-3', className)} {...props} />;
}

/**
 * A 2px Ink circle. Chosen, it fills Lilac around an Ink dot: the choice
 * reads from the dot, not from the pastel.
 */
export function RadioGroupItem({
  className,
  ...props
}: ComponentProps<typeof RadioGroupItemPrimitive>): React.JSX.Element {
  return (
    <RadioGroupItemPrimitive
      className={cn(
        'size-5 border-2 border-ink bg-card text-ink shadow-none data-[state=checked]:bg-lilac',
        '[&_svg]:size-2.5 [&_svg]:fill-ink [&_svg]:text-ink',
        'aria-invalid:border-danger aria-invalid:bg-rose/30',
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}

export type RadioFieldProps = ComponentProps<typeof RadioGroupItem> & {
  label: ReactNode;
  description?: ReactNode;
};

/**
 * A choice with its label and description. The circle is a button, and a
 * `<label>` does not name a button in every browser, so it is named with
 * `aria-labelledby`.
 */
export function RadioField({
  label,
  description,
  id,
  className,
  ...props
}: RadioFieldProps): React.JSX.Element {
  const generatedId = useId();
  const itemId = id ?? generatedId;
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <RadioGroupItem
        id={itemId}
        aria-labelledby={`${itemId}-label`}
        aria-describedby={description === undefined ? undefined : `${itemId}-description`}
        className="mt-0.5"
        {...props}
      />
      <div className="grid gap-1">
        <Label id={`${itemId}-label`} htmlFor={itemId} className="text-base">
          {label}
        </Label>
        {description !== undefined && (
          <p id={`${itemId}-description`} className="text-sm text-ink-soft">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
