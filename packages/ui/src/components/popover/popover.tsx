import type { ComponentProps } from 'react';
import { SURFACE } from '#lib/brand';
import { cn } from '#lib/utils';
import { PopoverContent as PopoverContentPrimitive } from '#ui/popover';

export { Popover, PopoverAnchor, PopoverTrigger } from '#ui/popover';

/**
 * Content that opens next to its trigger on a sticker card: a quick edit, a
 * filter, a colour picker. Escape or a click outside closes it, and focus
 * returns to the trigger.
 */
export function PopoverContent({
  className,
  ...props
}: ComponentProps<typeof PopoverContentPrimitive>): React.JSX.Element {
  return <PopoverContentPrimitive className={cn(SURFACE, 'w-72 p-4', className)} {...props} />;
}
