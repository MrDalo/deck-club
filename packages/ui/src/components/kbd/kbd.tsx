import type { ComponentProps } from 'react';
import { cn } from '#lib/utils';
import { KbdGroup as KbdGroupPrimitive, Kbd as KbdPrimitive } from '#ui/kbd';

/**
 * A key on the keyboard: a small Ink-outlined keycap, heavier at the bottom.
 * For an icon key, add visually hidden text (`<span className="sr-only">Left
 * arrow</span>`); `aria-label` is not allowed on `<kbd>`.
 */
export function Kbd({
  className,
  ...props
}: ComponentProps<typeof KbdPrimitive>): React.JSX.Element {
  return (
    <KbdPrimitive
      className={cn(
        'h-6 min-w-6 rounded-[0.375rem] border-[1.5px] border-b-[3px] border-ink bg-card px-1.5 text-xs font-bold text-ink',
        '[[data-slot=tooltip-content]_&]:border-paper/60',
        className,
      )}
      {...props}
    />
  );
}

/** Keys pressed together or in turn: ⌘ + K. */
export function KbdGroup({
  className,
  ...props
}: ComponentProps<typeof KbdGroupPrimitive>): React.JSX.Element {
  return <KbdGroupPrimitive className={cn('gap-1 text-sm text-ink-soft', className)} {...props} />;
}
