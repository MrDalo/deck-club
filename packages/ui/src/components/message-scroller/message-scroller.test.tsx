import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MessageScroller } from '.';

function Conversation(): React.JSX.Element {
  return (
    <MessageScroller label="Conversation with Claude" latestLabel="Jump to latest" className="h-64">
      <p>Make me a deck</p>
      <p>Here it is</p>
    </MessageScroller>
  );
}

/** jsdom has no layout: give the log a size and a scroll position. */
function scrollLog(log: HTMLElement, scrollTop: number): void {
  Object.defineProperty(log, 'scrollHeight', { configurable: true, value: 1000 });
  Object.defineProperty(log, 'clientHeight', { configurable: true, value: 200 });
  log.scrollTop = scrollTop;
  fireEvent.scroll(log);
}

describe('MessageScroller', () => {
  it('is a named, keyboard-scrollable log', () => {
    render(<Conversation />);
    const log = screen.getByRole('log', { name: 'Conversation with Claude' });

    expect(log).toHaveAttribute('tabindex', '0');
    expect(log).toHaveTextContent('Here it is');
  });

  it('offers a way back to the latest message once you scroll up', () => {
    render(<Conversation />);
    const log = screen.getByRole('log');

    expect(screen.queryByRole('button', { name: 'Jump to latest' })).not.toBeInTheDocument();
    scrollLog(log, 100);
    expect(screen.getByRole('button', { name: 'Jump to latest' })).toBeInTheDocument();
  });

  it('hides the button again at the bottom', () => {
    render(<Conversation />);
    const log = screen.getByRole('log');

    scrollLog(log, 100);
    scrollLog(log, 790);
    expect(screen.queryByRole('button', { name: 'Jump to latest' })).not.toBeInTheDocument();
  });

  it('scrolls to the newest message when asked', async () => {
    const user = userEvent.setup();
    render(<Conversation />);
    const log = screen.getByRole('log');
    const scrollTo = vi.spyOn(log, 'scrollTo');

    scrollLog(log, 100);
    await user.click(screen.getByRole('button', { name: 'Jump to latest' }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: 'smooth' });
    expect(screen.queryByRole('button', { name: 'Jump to latest' })).not.toBeInTheDocument();
  });
});
