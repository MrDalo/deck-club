'use client';

import type { ComponentProps } from 'react';
import { cn } from '#lib/utils';
import {
  InputOTPGroup as InputOTPGroupPrimitive,
  InputOTP as InputOTPPrimitive,
  InputOTPSeparator as InputOTPSeparatorPrimitive,
  InputOTPSlot as InputOTPSlotPrimitive,
} from '#ui/input-otp';

export { REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';

export type InputOTPProps = ComponentProps<typeof InputOTPPrimitive>;

/**
 * A one-time code, one box per character: a sign-in code from email. One
 * real input underneath, so paste, autofill (`autoComplete="one-time-code"`)
 * and screen readers work. Name it with `aria-label` or `aria-labelledby`.
 */
export function InputOTP({ containerClassName, ...props }: InputOTPProps): React.JSX.Element {
  return (
    <InputOTPPrimitive
      autoComplete="one-time-code"
      containerClassName={cn('gap-3', containerClassName)}
      {...props}
    />
  );
}

/** Boxes joined into one sticker. */
export function InputOTPGroup({
  className,
  ...props
}: ComponentProps<typeof InputOTPGroupPrimitive>): React.JSX.Element {
  return (
    <InputOTPGroupPrimitive className={cn('rounded-xl shadow-sticker-sm', className)} {...props} />
  );
}

/** One character's box. The box being typed into gets the Focus outline and a Butter wash. */
export function InputOTPSlot({
  className,
  ...props
}: ComponentProps<typeof InputOTPSlotPrimitive>): React.JSX.Element {
  return (
    <InputOTPSlotPrimitive
      className={cn(
        'size-12 border-y-2 border-r-2 border-ink bg-card font-display text-xl font-bold text-ink shadow-none first:rounded-l-xl first:border-l-2 last:rounded-r-xl',
        'data-[active=true]:z-10 data-[active=true]:border-ink data-[active=true]:bg-butter/50 data-[active=true]:ring-0 data-[active=true]:outline-3 data-[active=true]:outline-offset-2 data-[active=true]:outline-focus data-[active=true]:outline-solid',
        'aria-invalid:border-danger aria-invalid:bg-rose/20 data-[active=true]:aria-invalid:border-danger',
        className,
      )}
      {...props}
    />
  );
}

export function InputOTPSeparator({
  className,
  ...props
}: ComponentProps<typeof InputOTPSeparatorPrimitive>): React.JSX.Element {
  return <InputOTPSeparatorPrimitive className={cn('text-ink-soft', className)} {...props} />;
}
