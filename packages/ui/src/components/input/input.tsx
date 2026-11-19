import type { ComponentProps } from 'react';
import { FIELD, FOCUS_RING } from '#lib/brand';
import { cn } from '#lib/utils';
import { Input as InputPrimitive } from '#ui/input';

export type InputProps = ComponentProps<typeof InputPrimitive>;

/**
 * A single-line text field, drawn like the web app's fields: Card fill, an
 * Ink outline at 80%, Danger when `aria-invalid`. File inputs get a Butter
 * sticker button.
 */
export function Input({ className, ...props }: InputProps): React.JSX.Element {
  return (
    <InputPrimitive
      className={cn(
        FIELD,
        'py-2 shadow-none placeholder:text-ink-soft md:text-base',
        'file:mr-3 file:h-8 file:rounded-full file:border-2 file:border-ink file:bg-butter file:px-3 file:text-sm file:font-semibold file:text-ink',
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}
