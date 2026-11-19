import type { ComponentProps } from 'react';
import { cn } from '#lib/utils';
import {
  TooltipContent as TooltipContentPrimitive,
  Tooltip as TooltipPrimitive,
  TooltipProvider,
} from '#ui/tooltip';

export { TooltipProvider, TooltipTrigger } from '#ui/tooltip';

/**
 * One hint and its trigger. Brings its own provider, so a tooltip works
 * anywhere; a TooltipProvider higher up still sets the delay for a group.
 */
export function Tooltip(props: ComponentProps<typeof TooltipPrimitive>): React.JSX.Element {
  return (
    <TooltipProvider>
      <TooltipPrimitive {...props} />
    </TooltipProvider>
  );
}

/**
 * A short hint on hover and keyboard focus: an Ink chip with Paper text. A
 * hint only; it names nothing an icon button's `aria-label` should name.
 */
export function TooltipContent({
  className,
  ...props
}: ComponentProps<typeof TooltipContentPrimitive>): React.JSX.Element {
  return (
    <TooltipContentPrimitive
      className={cn('rounded-lg bg-ink px-3 py-1.5 text-sm font-semibold text-paper', className)}
      {...props}
    />
  );
}
