import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '#lib/utils';

export type MessageProps = ComponentProps<'article'> & {
  /** `start` for others (and the AI), `end` for you. */
  align?: 'start' | 'end';
  /** An Avatar beside the bubble. */
  avatar?: ReactNode;
};

/**
 * One message in a conversation: with your AI assistant, or in a club. Put
 * a MessageHeader and a MessageContent inside; stack them in a
 * MessageScroller.
 */
export function Message({
  align = 'start',
  avatar,
  className,
  children,
  ...props
}: MessageProps): React.JSX.Element {
  return (
    <article
      data-slot="message"
      data-align={align}
      className={cn(
        'group/message flex w-full items-end gap-2.5 data-[align=end]:flex-row-reverse',
        className,
      )}
      {...props}
    >
      {avatar !== undefined && (
        <div data-slot="message-avatar" className="shrink-0">
          {avatar}
        </div>
      )}
      <div className="flex max-w-[85%] min-w-0 flex-col gap-1 group-data-[align=end]/message:items-end sm:max-w-[75%]">
        {children}
      </div>
    </article>
  );
}

type MessageHeaderProps = ComponentProps<'div'> & {
  author: ReactNode;
  /** When it was sent. */
  time?: Date;
  /** Formats the time; a BCP 47 tag, the runtime's by default. */
  locale?: string;
  /** Intl options for the time; `{ timeStyle: 'short' }` by default. Set `timeZone` when rendering on a server. */
  timeFormat?: Intl.DateTimeFormatOptions;
};

/** Who wrote it and when. */
export function MessageHeader({
  author,
  time,
  locale,
  timeFormat = { timeStyle: 'short' },
  className,
  ...props
}: MessageHeaderProps): React.JSX.Element {
  return (
    <div
      data-slot="message-header"
      className={cn('flex items-baseline gap-2 px-1 text-sm', className)}
      {...props}
    >
      <span className="font-bold text-ink">{author}</span>
      {time !== undefined && (
        <time dateTime={time.toISOString()} className="text-xs text-ink-soft">
          {new Intl.DateTimeFormat(locale, timeFormat).format(time)}
        </time>
      )}
    </div>
  );
}

const contentVariants = cva(
  [
    'w-fit max-w-full rounded-2xl border-2 border-ink px-4 py-2.5 text-base text-ink shadow-sticker-sm',
    'break-words whitespace-pre-wrap [overflow-wrap:anywhere]',
    // The corner nearest the avatar is the bubble's tail.
    'group-data-[align=start]/message:rounded-bl-md group-data-[align=end]/message:rounded-br-md',
  ],
  {
    variants: {
      tone: {
        card: 'bg-card',
        lilac: 'bg-lilac',
        mint: 'bg-mint',
        peach: 'bg-peach',
        rose: 'bg-rose',
        sky: 'bg-sky',
        butter: 'bg-butter',
      },
    },
    defaultVariants: { tone: 'card' },
  },
);

export type MessageContentProps = ComponentProps<'div'> & VariantProps<typeof contentVariants>;

/** The bubble. A pastel fill per speaker (you in Lilac, Claude in Mint); text stays Ink. */
export function MessageContent({
  tone,
  className,
  ...props
}: MessageContentProps): React.JSX.Element {
  return (
    <div
      data-slot="message-content"
      className={cn(contentVariants({ tone }), className)}
      {...props}
    />
  );
}

/** Buttons under the bubble: copy, retry, "Add these cards". Always visible, never on hover only. */
export function MessageActions({ className, ...props }: ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="message-actions"
      className={cn('flex flex-wrap items-center gap-1.5 px-1 pt-0.5', className)}
      {...props}
    />
  );
}

type MessageTypingProps = Omit<ComponentProps<'div'>, 'children'> & {
  /** Announced to screen readers, translated ("Claude is typing"). */
  label: string;
};

/** Three dots while the other side writes. A polite live status for screen readers. */
export function MessageTyping({
  label,
  className,
  ...props
}: MessageTypingProps): React.JSX.Element {
  return (
    <div
      role="status"
      data-slot="message-typing"
      className={cn(
        contentVariants({ tone: 'card' }),
        'flex items-center gap-1.5 py-3.5',
        className,
      )}
      {...props}
    >
      <span className="sr-only">{label}</span>
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          aria-hidden
          className="size-2 rounded-full bg-ink-soft motion-safe:animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

/** A line about the conversation, not in it: "Jana joined the club", "Today". */
export function MessageNotice({ className, ...props }: ComponentProps<'p'>): React.JSX.Element {
  return (
    <p
      data-slot="message-notice"
      className={cn(
        'mx-auto w-fit rounded-full border-[1.5px] border-line bg-card px-3 py-1 text-center text-sm font-semibold text-ink-soft',
        className,
      )}
      {...props}
    />
  );
}
