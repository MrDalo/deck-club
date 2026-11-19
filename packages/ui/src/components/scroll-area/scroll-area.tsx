import type { ComponentProps } from 'react';
import { cn } from '#lib/utils';
import {
  ScrollArea as ScrollAreaPrimitive,
  ScrollBar as ScrollBarPrimitive,
} from '#ui/scroll-area';

export type ScrollAreaProps = ComponentProps<typeof ScrollAreaPrimitive> & {
  /**
   * Names the content and makes it focusable, so a keyboard can scroll it.
   * Give one when the content has nothing focusable of its own (a card's
   * long answer, a changelog).
   */
  label?: string;
};

/** A scrolling box with a slim Ink scrollbar that matches the brand. */
export function ScrollArea({
  label,
  className,
  children,
  ...props
}: ScrollAreaProps): React.JSX.Element {
  return (
    <ScrollAreaPrimitive
      className={cn(
        '[&_[data-slot=scroll-area-thumb]]:bg-ink/35 [&_[data-slot=scroll-area-thumb]:hover]:bg-ink/55',
        className,
      )}
      {...props}
    >
      {label === undefined ? (
        children
      ) : (
        <div
          role="region"
          aria-label={label}
          tabIndex={0}
          className="rounded-[inherit] outline-none focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-focus focus-visible:outline-solid"
        >
          {children}
        </div>
      )}
    </ScrollAreaPrimitive>
  );
}

/** A second scrollbar, for horizontal scrolling: `<ScrollBar orientation="horizontal" />`. */
export function ScrollBar(props: ComponentProps<typeof ScrollBarPrimitive>): React.JSX.Element {
  return <ScrollBarPrimitive {...props} />;
}
