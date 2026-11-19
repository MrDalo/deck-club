import { Fragment, type ComponentProps, type CSSProperties } from 'react';
import type { Pastel } from '#lib/brand';
import { cn } from '#lib/utils';
import { markSegments, markTermsOf } from './mark-segments.js';

const VARIANTS = {
  /** The brand's signature: a tilted highlighter swipe behind the words. */
  swipe: 'highlight',
  /** A thick marker stroke under the words. */
  underline:
    'underline decoration-(--highlight) decoration-[0.32em] underline-offset-[-0.08em] [text-decoration-skip-ink:none]',
} as const;

export type MarkerProps = ComponentProps<'mark'> & {
  /** The highlighter's pastel; Butter, like a real one, by default. */
  tone?: Pastel;
  variant?: keyof typeof VARIANTS;
  /**
   * `mark` (default) for text that is relevant here, such as search matches.
   * `span` for decoration only, such as the brand swipe behind a heading.
   */
  as?: 'mark' | 'span';
};

/**
 * The highlighter: pastel ink behind (or under) words, text staying Ink.
 * Spend it once per screen, on the main heading or on search matches.
 */
export function Marker({
  tone = 'butter',
  variant = 'swipe',
  as: Element = 'mark',
  className,
  style,
  ...props
}: MarkerProps): React.JSX.Element {
  return (
    <Element
      data-slot="marker"
      data-tone={tone}
      className={cn('bg-transparent text-inherit', VARIANTS[variant], className)}
      style={{ '--highlight': `var(--color-${tone})`, ...style } as CSSProperties}
      {...props}
    />
  );
}

export type MarkedTextProps = Omit<MarkerProps, 'children' | 'as'> & {
  /** The text to show, as written. */
  text: string;
  /** The search as typed; its words are marked wherever they occur. */
  query: string;
};

/**
 * Text with the words of a search marked, ignoring case and accents like the
 * search itself: a card in the results for "mitoza" shows "[Mitóza]".
 */
export function MarkedText({ text, query, ...markerProps }: MarkedTextProps): React.JSX.Element {
  const segments = markSegments(text, markTermsOf(query));
  // Segments are positional and never reorder, so their index is a stable key.
  return (
    <>
      {segments.map((segment, index) => (
        <Fragment key={index}>
          {segment.marked ? <Marker {...markerProps}>{segment.text}</Marker> : segment.text}
        </Fragment>
      ))}
    </>
  );
}
