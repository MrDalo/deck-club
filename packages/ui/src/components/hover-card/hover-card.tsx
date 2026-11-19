import type { ComponentProps } from 'react';
import { SURFACE } from '#lib/brand';
import { cn } from '#lib/utils';
import { HoverCardContent as HoverCardContentPrimitive } from '#ui/hover-card';

export { HoverCard, HoverCardTrigger } from '#ui/hover-card';

/**
 * A preview on a sticker card, shown while the pointer rests on (or focus is
 * on) its trigger: a deck behind a link, a person behind a name. Extra
 * information only; keep anything essential on the page itself.
 */
export function HoverCardContent({
  className,
  ...props
}: ComponentProps<typeof HoverCardContentPrimitive>): React.JSX.Element {
  return <HoverCardContentPrimitive className={cn(SURFACE, 'w-72 p-4', className)} {...props} />;
}
