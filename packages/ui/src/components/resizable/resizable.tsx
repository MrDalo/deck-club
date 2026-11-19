import type { ComponentProps } from 'react';
import { FOCUS_RING } from '#lib/brand';
import { cn } from '#lib/utils';
import {
  ResizableHandle as ResizableHandlePrimitive,
  ResizablePanelGroup as ResizablePanelGroupPrimitive,
} from '#ui/resizable';

export { ResizablePanel } from '#ui/resizable';

export type ResizablePanelGroupProps = ComponentProps<typeof ResizablePanelGroupPrimitive> & {
  /** `sticker`: the panels share one sticker card. `plain`: no frame. */
  variant?: 'sticker' | 'plain';
};

/**
 * Panels whose sizes people can change: the card list beside the card editor.
 * The group fills its parent's height (react-resizable-panels sets
 * `height: 100%` inline), so size the parent or give the group a `min-h-*`.
 * A panel scrolls what does not fit: put long content in a ScrollArea with a
 * `label`, so the keyboard can scroll it too.
 */
export function ResizablePanelGroup({
  variant = 'plain',
  className,
  ...props
}: ResizablePanelGroupProps): React.JSX.Element {
  return (
    <ResizablePanelGroupPrimitive
      className={cn(
        variant === 'sticker' && 'rounded-card border-2 border-ink bg-card shadow-sticker-sm',
        className,
      )}
      {...props}
    />
  );
}

export type ResizableHandleProps = ComponentProps<typeof ResizableHandlePrimitive> & {
  /** Names the divider, translated ("Resize the card list"). It is focusable: arrow keys resize. */
  label: string;
};

/** The divider between panels: an Ink rule with an optional grip. */
export function ResizableHandle({
  label,
  className,
  ...props
}: ResizableHandleProps): React.JSX.Element {
  return (
    <ResizableHandlePrimitive
      aria-label={label}
      className={cn(
        'bg-ink/25 data-[separator=active]:bg-ink data-[separator=hover]:bg-ink/60 w-0.5 aria-[orientation=horizontal]:h-0.5',
        '[&>div]:h-8 [&>div]:w-3.5 [&>div]:rounded-full [&>div]:border-2 [&>div]:border-ink [&>div]:bg-card [&>div>svg]:size-3 [&>div>svg]:text-ink',
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}
