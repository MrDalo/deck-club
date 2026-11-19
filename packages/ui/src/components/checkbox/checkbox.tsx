import { useId, type ComponentProps, type ReactNode } from 'react';
import { FOCUS_RING } from '#lib/brand';
import { cn } from '#lib/utils';
import { Checkbox as CheckboxPrimitive } from '#ui/checkbox';
import { Label } from '#ui/label';

export type CheckboxProps = ComponentProps<typeof CheckboxPrimitive>;

/**
 * A 2px Ink box. Checked, it fills Lilac with an Ink check: the state reads
 * from the outline and the mark, not from the pastel (WCAG 1.4.11).
 * Indeterminate shows a dash, never a check.
 */
export function Checkbox({ className, ...props }: CheckboxProps): React.JSX.Element {
  return (
    <CheckboxPrimitive
      className={cn(
        'grid size-5 place-content-center rounded-[0.3125rem] border-2 border-ink bg-card text-ink shadow-none',
        'data-[state=checked]:border-ink data-[state=checked]:bg-lilac data-[state=checked]:text-ink',
        '[&_svg]:size-3.5 [&_svg]:stroke-[3.5]',
        "data-[state=indeterminate]:bg-lilac data-[state=indeterminate]:[&_svg]:hidden data-[state=indeterminate]:after:h-0.5 data-[state=indeterminate]:after:w-2.5 data-[state=indeterminate]:after:rounded-full data-[state=indeterminate]:after:bg-ink data-[state=indeterminate]:after:content-['']",
        'aria-invalid:border-danger aria-invalid:bg-rose/30',
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}

export type CheckboxFieldProps = CheckboxProps & {
  label: ReactNode;
  /** Helper text under the label, linked with `aria-describedby`. */
  description?: ReactNode;
};

/**
 * A checkbox with its label and optional description, wired together. When
 * disabled, the box and the label dim; the description stays readable.
 */
export function CheckboxField({
  label,
  description,
  id,
  className,
  ...props
}: CheckboxFieldProps): React.JSX.Element {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;
  const labelId = `${checkboxId}-label`;
  const descriptionId = `${checkboxId}-description`;
  return (
    <div
      data-disabled={props.disabled === true ? 'true' : undefined}
      className={cn('group flex items-start gap-3', className)}
    >
      {/* The box is a button, and a <label for> does not name a button in every
          browser (HTML-AAM): aria-labelledby does, everywhere. */}
      <Checkbox
        id={checkboxId}
        aria-labelledby={labelId}
        aria-describedby={description === undefined ? undefined : descriptionId}
        className="mt-0.5"
        {...props}
      />
      <div className="grid gap-1">
        <Label
          id={labelId}
          htmlFor={checkboxId}
          className="text-base leading-snug font-semibold text-ink"
        >
          {label}
        </Label>
        {description !== undefined && (
          <p id={descriptionId} className="text-sm text-ink-soft">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
