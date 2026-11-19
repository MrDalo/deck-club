import type { ComponentProps } from 'react';
import { cn } from '#lib/utils';
import {
  FieldDescription as FieldDescriptionPrimitive,
  FieldError as FieldErrorPrimitive,
  FieldLabel as FieldLabelPrimitive,
  FieldLegend as FieldLegendPrimitive,
  Field as FieldPrimitive,
  FieldSeparator as FieldSeparatorPrimitive,
  FieldSet as FieldSetPrimitive,
  FieldTitle as FieldTitlePrimitive,
} from '#ui/field';

export { FieldContent, FieldGroup } from '#ui/field';

/**
 * One form field: label, control, description, error. Set `data-invalid`
 * when it fails validation: the error shows in Danger, the label stays Ink.
 */
export function Field({
  className,
  ...props
}: ComponentProps<typeof FieldPrimitive>): React.JSX.Element {
  return (
    <FieldPrimitive className={cn('gap-2 data-[invalid=true]:text-ink', className)} {...props} />
  );
}

/** Related fields under a legend: "Study settings". */
export function FieldSet({
  className,
  ...props
}: ComponentProps<typeof FieldSetPrimitive>): React.JSX.Element {
  return <FieldSetPrimitive className={cn('text-ink', className)} {...props} />;
}

export function FieldLegend({
  className,
  ...props
}: ComponentProps<typeof FieldLegendPrimitive>): React.JSX.Element {
  return (
    <FieldLegendPrimitive
      className={cn(
        'font-display font-bold tracking-tight text-ink data-[variant=label]:font-sans data-[variant=label]:font-semibold data-[variant=legend]:text-lg',
        className,
      )}
      {...props}
    />
  );
}

/**
 * The field's label. Wrapping a whole `Field` in it makes a choice card:
 * an Ink-outlined card that washes Lilac and lifts when its box is checked. Name a
 * checkbox or radio inside with `aria-labelledby` (its FieldTitle's id):
 * they are buttons, and a label does not name a button in every browser.
 */
export function FieldLabel({
  className,
  ...props
}: ComponentProps<typeof FieldLabelPrimitive>): React.JSX.Element {
  return (
    <FieldLabelPrimitive
      className={cn(
        'text-sm font-semibold text-ink',
        'has-[>[data-slot=field]]:rounded-2xl has-[>[data-slot=field]]:border-2 has-[>[data-slot=field]]:border-ink has-[>[data-slot=field]]:bg-card',
        // Checked reads twice: a Lilac wash and the sticker shadow, not colour alone.
        'has-data-[state=checked]:border-ink has-data-[state=checked]:bg-lilac/50 has-data-[state=checked]:shadow-sticker-sm',
        className,
      )}
      {...props}
    />
  );
}

export function FieldTitle({
  className,
  ...props
}: ComponentProps<typeof FieldTitlePrimitive>): React.JSX.Element {
  return (
    <FieldTitlePrimitive className={cn('text-base font-semibold text-ink', className)} {...props} />
  );
}

/** Help under the control. Link it from the control with `aria-describedby`. */
export function FieldDescription({
  className,
  ...props
}: ComponentProps<typeof FieldDescriptionPrimitive>): React.JSX.Element {
  return (
    <FieldDescriptionPrimitive
      className={cn(
        'text-ink-soft [&>a]:font-semibold [&>a]:text-ink [&>a]:decoration-2 [&>a:hover]:text-ink [&>a:hover]:decoration-focus',
        className,
      )}
      {...props}
    />
  );
}

/** What is wrong, in Danger, announced as it appears. Takes react-hook-form's `errors`. */
export function FieldError({
  className,
  ...props
}: ComponentProps<typeof FieldErrorPrimitive>): React.JSX.Element {
  return <FieldErrorPrimitive className={cn('font-semibold text-danger', className)} {...props} />;
}

/** A rule between fields, optionally with a word in it ("or"). */
export function FieldSeparator({
  className,
  ...props
}: ComponentProps<typeof FieldSeparatorPrimitive>): React.JSX.Element {
  return (
    <FieldSeparatorPrimitive
      className={cn(
        '[&>[data-slot=separator]]:h-0.5 [&>[data-slot=separator]]:bg-line [&>[data-slot=field-separator-content]]:font-semibold [&>[data-slot=field-separator-content]]:text-ink-soft',
        className,
      )}
      {...props}
    />
  );
}
