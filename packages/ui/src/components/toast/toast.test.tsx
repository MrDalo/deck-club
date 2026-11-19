import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { toast, Toaster } from '.';

describe('Toaster', () => {
  it('is a notifications region named in the page’s language', () => {
    render(<Toaster label="Oznámenia" closeLabel="Zavrieť" />);
    expect(screen.getByRole('region', { name: 'Oznámenia' })).toBeInTheDocument();
  });

  it('shows a toast as a sticker and fills it by kind', async () => {
    render(<Toaster label="Notifications" closeLabel="Dismiss" />);

    act(() => {
      toast.success('Card added.', { description: 'Biology exam has 43 cards.' });
    });
    const title = await screen.findByText('Card added.');
    const item = title.closest('[data-sonner-toast]');

    expect(item).toHaveClass('border-ink', 'shadow-sticker', 'bg-mint');
    expect(screen.getByText('Biology exam has 43 cards.')).toBeInTheDocument();
  });

  it('runs its action and closes with a translated close button', async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();
    render(<Toaster label="Notifications" closeLabel="Zavrieť" closeButton />);

    act(() => {
      toast('Card deleted.', { action: { label: 'Undo', onClick: onUndo } });
    });
    await user.click(await screen.findByRole('button', { name: 'Undo' }));
    expect(onUndo).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Close toast' })).not.toBeInTheDocument();
  });
});
