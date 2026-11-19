import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { FOCUS_RING } from '#lib/brand';
import { cn } from '#lib/utils';
import { Toggle as TogglePrimitive } from '#ui/toggle';

/**
 * On reads twice: a Lilac fill and an Ink outline (ghost), or a sticker that
 * sinks into the page (outline). Never the pastel alone.
 */
export const toggleVariants = cva(
  [
    'rounded-full border-2 font-semibold text-ink hover:bg-line/60 hover:text-ink',
    'data-[state=on]:border-ink data-[state=on]:bg-lilac data-[state=on]:text-ink',
    FOCUS_RING,
  ],
  {
    variants: {
      variant: {
        ghost: 'border-transparent bg-transparent',
        outline:
          'border-ink bg-card shadow-sticker-sm transition-[transform,box-shadow] data-[state=on]:translate-x-[2px] data-[state=on]:translate-y-[2px] data-[state=on]:shadow-none',
      },
      size: {
        sm: 'h-9 min-w-9 px-2.5 text-sm',
        md: 'h-11 min-w-11 px-3 text-base',
        lg: 'h-13 min-w-13 px-4 text-lg',
      },
    },
    defaultVariants: { variant: 'ghost', size: 'md' },
  },
);

export type ToggleProps = Omit<ComponentProps<typeof TogglePrimitive>, 'variant' | 'size'> &
  VariantProps<typeof toggleVariants>;

/** A button that stays pressed: bold, show hints, "Only due cards". */
export function Toggle({ variant, size, className, ...props }: ToggleProps): React.JSX.Element {
  return (
    <TogglePrimitive className={cn(toggleVariants({ variant, size }), className)} {...props} />
  );
}
