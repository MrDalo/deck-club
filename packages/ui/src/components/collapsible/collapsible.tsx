import { ChevronDownIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { FOCUS_RING } from '#lib/brand';
import { cn } from '#lib/utils';
import {
  CollapsibleContent as CollapsibleContentPrimitive,
  Collapsible as CollapsiblePrimitive,
  CollapsibleTrigger as CollapsibleTriggerPrimitive,
} from '#ui/collapsible';

export type CollapsibleProps = ComponentProps<typeof CollapsiblePrimitive> & {
  /** `card`: the whole disclosure sits on a sticker card. */
  variant?: 'plain' | 'card';
};

/** Shows and hides one section: the back of a card, advanced settings. */
export function Collapsible({
  variant = 'plain',
  className,
  ...props
}: CollapsibleProps): React.JSX.Element {
  return (
    <CollapsiblePrimitive
      data-variant={variant}
      className={cn(
        variant === 'card' && 'rounded-card border-2 border-ink bg-card p-4 shadow-sticker-sm',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Without `asChild`: a quiet pill button with a chevron that turns when open.
 * With `asChild`: your own control (a branded Button) becomes the trigger.
 */
export function CollapsibleTrigger({
  asChild = false,
  className,
  children,
  ...props
}: ComponentProps<typeof CollapsibleTriggerPrimitive>): React.JSX.Element {
  if (asChild)
    return (
      <CollapsibleTriggerPrimitive asChild className={className} {...props}>
        {children}
      </CollapsibleTriggerPrimitive>
    );
  return (
    <CollapsibleTriggerPrimitive
      className={cn(
        'group/trigger inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-semibold text-ink hover:bg-line/60',
        FOCUS_RING,
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon
        aria-hidden
        className="size-4 transition-transform duration-200 group-data-[state=open]/trigger:rotate-180"
      />
    </CollapsibleTriggerPrimitive>
  );
}

export function CollapsibleContent({
  className,
  ...props
}: ComponentProps<typeof CollapsibleContentPrimitive>): React.JSX.Element {
  return (
    <CollapsibleContentPrimitive
      className={cn(
        'overflow-hidden text-ink data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down',
        className,
      )}
      {...props}
    />
  );
}
