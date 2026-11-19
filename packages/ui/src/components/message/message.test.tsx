import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from '#components/avatar';
import {
  Message,
  MessageActions,
  MessageContent,
  MessageHeader,
  MessageNotice,
  MessageTyping,
} from '.';

describe('Message', () => {
  it('shows who wrote what and when, with a machine-readable time', () => {
    render(
      <Message avatar={<Avatar name="Claude" size="sm" />}>
        <MessageHeader
          author="Claude"
          time={new Date(Date.UTC(2026, 10, 18, 9, 30))}
          locale="en-GB"
          timeFormat={{ timeStyle: 'short', timeZone: 'UTC' }}
        />
        <MessageContent tone="mint">I added 10 cards about cell division.</MessageContent>
      </Message>,
    );

    expect(screen.getByRole('article')).toHaveAttribute('data-align', 'start');
    expect(screen.getByRole('img', { name: 'Claude' })).toBeInTheDocument();
    const time = screen.getByText('09:30');
    expect(time.tagName).toBe('TIME');
    expect(time).toHaveAttribute('dateTime', '2026-11-18T09:30:00.000Z');
  });

  it('draws the bubble as a pastel sticker with Ink text', () => {
    render(
      <Message>
        <MessageContent tone="lilac">Make me a deck</MessageContent>
      </Message>,
    );
    expect(screen.getByText('Make me a deck')).toHaveClass(
      'bg-lilac',
      'text-ink',
      'border-ink',
      'shadow-sticker-sm',
    );
  });

  it('aligns your own messages to the end', () => {
    render(
      <Message align="end">
        <MessageContent>Thanks</MessageContent>
      </Message>,
    );
    expect(screen.getByRole('article')).toHaveClass('data-[align=end]:flex-row-reverse');
  });

  it('keeps actions visible under the bubble', () => {
    render(
      <Message>
        <MessageContent>Here are the cards.</MessageContent>
        <MessageActions>
          <button type="button">Add them</button>
        </MessageActions>
      </Message>,
    );
    expect(screen.getByRole('button', { name: 'Add them' })).toBeVisible();
  });
});

describe('MessageTyping', () => {
  it('announces who is typing, with decorative dots', () => {
    const { container } = render(<MessageTyping label="Claude is typing" />);

    expect(screen.getByRole('status')).toHaveTextContent('Claude is typing');
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(3);
  });
});

describe('MessageNotice', () => {
  it('is a quiet line between messages', () => {
    render(<MessageNotice>Jana joined the club</MessageNotice>);
    expect(screen.getByText('Jana joined the club')).toHaveClass('text-ink-soft', 'mx-auto');
  });
});
