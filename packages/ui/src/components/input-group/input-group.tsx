import type { ComponentProps } from 'react';
import { FOCUS_RING } from '#lib/brand';
import { cn } from '#lib/utils';
import {
  InputGroupAddon as InputGroupAddonPrimitive,
  InputGroupButton as InputGroupButtonPrimitive,
  InputGroupInput as InputGroupInputPrimitive,
  InputGroup as InputGroupPrimitive,
  InputGroupText as InputGroupTextPrimitive,
  InputGroupTextarea as InputGroupTextareaPrimitive,
} from '#ui/input-group';

/**
 * A field with addons. The whole group draws the field and its Focus
 * outline; the control inside stays borderless.
 */
export function InputGroup({
  className,
  ...props
}: ComponentProps<typeof InputGroupPrimitive>): React.JSX.Element {
  return (
    <InputGroupPrimitive
      className={cn(
        'h-11 rounded-xl border-2 border-ink/80 bg-card text-ink shadow-none has-[>textarea]:h-auto',
        // Class names are written out in full: Tailwind finds them by reading the source.
        'has-[[data-slot=input-group-control]:focus-visible]:border-ink has-[[data-slot=input-group-control]:focus-visible]:ring-0 has-[[data-slot=input-group-control]:focus-visible]:outline-3 has-[[data-slot=input-group-control]:focus-visible]:outline-offset-2 has-[[data-slot=input-group-control]:focus-visible]:outline-focus has-[[data-slot=input-group-control]:focus-visible]:outline-solid',
        'has-[[data-slot][aria-invalid=true]]:border-danger has-[[data-slot][aria-invalid=true]]:bg-rose/20',
        className,
      )}
      {...props}
    />
  );
}

export function InputGroupAddon({
  className,
  ...props
}: ComponentProps<typeof InputGroupAddonPrimitive>): React.JSX.Element {
  return (
    <InputGroupAddonPrimitive
      className={cn(
        'text-sm font-semibold text-ink-soft [&>svg]:size-5 [&>svg]:text-ink-soft',
        className,
      )}
      {...props}
    />
  );
}

/** A button inside the field (clear, copy, send): a quiet pill. */
export function InputGroupButton({
  className,
  ...props
}: ComponentProps<typeof InputGroupButtonPrimitive>): React.JSX.Element {
  return (
    <InputGroupButtonPrimitive
      className={cn(
        'rounded-full font-semibold text-ink hover:bg-butter hover:text-ink',
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}

export function InputGroupText({
  className,
  ...props
}: ComponentProps<typeof InputGroupTextPrimitive>): React.JSX.Element {
  return <InputGroupTextPrimitive className={cn('text-ink-soft', className)} {...props} />;
}

export function InputGroupInput({
  className,
  ...props
}: ComponentProps<typeof InputGroupInputPrimitive>): React.JSX.Element {
  return (
    <InputGroupInputPrimitive
      className={cn('h-full text-base text-ink placeholder:text-ink-soft md:text-base', className)}
      {...props}
    />
  );
}

export function InputGroupTextarea({
  className,
  ...props
}: ComponentProps<typeof InputGroupTextareaPrimitive>): React.JSX.Element {
  return (
    <InputGroupTextareaPrimitive
      className={cn(
        'min-h-24 text-base text-ink placeholder:text-ink-soft md:text-base',
        className,
      )}
      {...props}
    />
  );
}
