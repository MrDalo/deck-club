import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '.';

describe('Button', () => {
  it('is a primary, medium, non-submitting button by default', () => {
    render(<Button>Add card</Button>);
    const button = screen.getByRole('button', { name: 'Add card' });

    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('bg-lilac', 'border-ink', 'text-ink', 'h-11', 'rounded-full');
  });

  it('keeps an explicit submit type', () => {
    render(<Button type="submit">Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'submit');
  });

  it.each([
    ['secondary', 'bg-card'],
    ['danger', 'bg-rose'],
    ['ghost', 'bg-transparent'],
    ['link', 'underline'],
  ] as const)('draws the %s variant', (variant, expected) => {
    render(<Button variant={variant}>Go</Button>);
    expect(screen.getByRole('button')).toHaveClass(expected, 'text-ink');
  });

  it('replaces shadcn’s primary fill and translucent ring with the brand', () => {
    render(<Button>Go</Button>);
    const button = screen.getByRole('button');

    expect(button).not.toHaveClass('bg-primary', 'focus-visible:ring-[3px]');
    expect(button).toHaveClass('focus-visible:outline-focus');
  });

  it('renders a link with button styling through asChild', () => {
    render(
      <Button asChild variant="secondary">
        <a href="/decks">Your decks</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Your decks' });

    expect(link).toHaveClass('bg-card');
    expect(link).not.toHaveAttribute('type');
  });

  it('calls onClick, and not when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Go</Button>);

    await user.click(screen.getByRole('button'));
    rerender(
      <Button onClick={onClick} disabled>
        Go
      </Button>,
    );
    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('lets a className override a brand class', () => {
    render(<Button className="shadow-none">Go</Button>);
    expect(screen.getByRole('button')).not.toHaveClass('shadow-sticker-sm');
  });
});
