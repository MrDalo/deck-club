'use client';

import { ArrowDownIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Button } from '#components/button';
import { FOCUS_RING } from '#lib/brand';
import { cn } from '#lib/utils';

/** How close to the bottom still counts as "reading the latest", in pixels. */
const PINNED_WITHIN = 48;

const isNearBottom = (element: HTMLElement): boolean =>
  element.scrollHeight - element.scrollTop - element.clientHeight <= PINNED_WITHIN;

const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export type MessageScrollerProps = ComponentProps<'div'> & {
  /** Names the conversation, translated ("Conversation with Claude"). */
  label: string;
  /** The button that returns to the newest message, translated ("Jump to latest"). */
  latestLabel: string;
};

/**
 * A scrolling conversation. It stays on the newest message while you are
 * reading the newest message, and leaves you where you are when you scroll
 * up to read back; then a button brings you down again. A `log` region:
 * screen readers hear new messages as they arrive.
 */
export function MessageScroller({
  label,
  latestLabel,
  className,
  children,
  ...props
}: MessageScrollerProps): React.JSX.Element {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  const [showLatest, setShowLatest] = useState(false);

  useEffect(() => {
    const scroller = viewport.current;
    const inner = content.current;
    if (scroller === null || inner === null) return undefined;
    scroller.scrollTop = scroller.scrollHeight;
    // New messages, images loading, a bubble growing while it streams in.
    const observer = new ResizeObserver(() => {
      if (pinned.current) scroller.scrollTop = scroller.scrollHeight;
    });
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

  const handleScroll = (): void => {
    if (viewport.current === null) return;
    pinned.current = isNearBottom(viewport.current);
    setShowLatest(!pinned.current);
  };

  const jumpToLatest = (): void => {
    const scroller = viewport.current;
    if (scroller === null) return;
    pinned.current = true;
    scroller.scrollTo({
      top: scroller.scrollHeight,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
    setShowLatest(false);
  };

  return (
    <div
      data-slot="message-scroller"
      className={cn('relative flex min-h-0 flex-col', className)}
      {...props}
    >
      <div
        ref={viewport}
        role="log"
        aria-label={label}
        tabIndex={0}
        onScroll={handleScroll}
        className={cn(
          'min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-[inherit] p-4',
          FOCUS_RING,
          'focus-visible:outline-offset-[-3px]',
        )}
      >
        <div ref={content} className="flex flex-col gap-4">
          {children}
        </div>
      </div>
      {showLatest && (
        <Button
          size="sm"
          variant="secondary"
          onClick={jumpToLatest}
          className="absolute inset-x-0 bottom-3 mx-auto w-fit"
        >
          <ArrowDownIcon aria-hidden />
          {latestLabel}
        </Button>
      )}
    </div>
  );
}
