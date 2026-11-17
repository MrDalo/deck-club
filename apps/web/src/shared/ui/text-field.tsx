import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

const fieldClasses =
  'w-full rounded-xl border-2 border-ink/80 bg-card px-3.5 py-2.5 text-base text-ink placeholder:text-ink-soft/70 aria-invalid:border-[#b4234d] aria-invalid:bg-rose/20';

/** Single-line text input. Pair with {@link Label} and {@link FieldError}. */
export function Input({ className, ...props }: ComponentProps<'input'>): React.JSX.Element {
  return <input className={cn(fieldClasses, 'h-11', className)} {...props} />;
}

/** Multi-line text input. */
export function Textarea({ className, ...props }: ComponentProps<'textarea'>): React.JSX.Element {
  return <textarea className={cn(fieldClasses, 'min-h-24 resize-y', className)} {...props} />;
}

/** Native select styled like the inputs. */
export function Select({ className, ...props }: ComponentProps<'select'>): React.JSX.Element {
  return <select className={cn(fieldClasses, 'h-11 pr-8', className)} {...props} />;
}

/** Field label. */
export function Label({ className, ...props }: ComponentProps<'label'>): React.JSX.Element {
  return (
    <label className={cn('mb-1.5 block text-sm font-semibold text-ink', className)} {...props} />
  );
}
