import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Button } from '#components/button';
import { Input } from '#components/input';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '.';

function Rename({ closeButton = true }: { closeButton?: boolean }): React.JSX.Element {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Rename deck</Button>
      </DialogTrigger>
      <DialogContent {...(closeButton ? { closeLabel: 'Zavrieť' } : { showCloseButton: false })}>
        <DialogHeader>
          <DialogTitle>Rename deck</DialogTitle>
          <DialogDescription>Give it a name you will recognise.</DialogDescription>
        </DialogHeader>
        <Input aria-label="Deck name" defaultValue="Biology exam" />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

describe('Dialog', () => {
  it('opens a named, described sticker dialog and moves focus into it', async () => {
    const user = userEvent.setup();
    render(<Rename />);

    await user.click(screen.getByRole('button', { name: 'Rename deck' }));
    const dialog = await screen.findByRole('dialog', { name: 'Rename deck' });

    expect(dialog).toHaveAccessibleDescription('Give it a name you will recognise.');
    expect(dialog).toHaveClass('rounded-card', 'border-ink', 'shadow-sticker');
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it('closes with its translated close button', async () => {
    const user = userEvent.setup();
    render(<Rename />);

    await user.click(screen.getByRole('button', { name: 'Rename deck' }));
    await user.click(await screen.findByRole('button', { name: 'Zavrieť' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('closes on Escape and gives focus back to the trigger', async () => {
    const user = userEvent.setup();
    render(<Rename />);
    const trigger = screen.getByRole('button', { name: 'Rename deck' });

    await user.click(trigger);
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('leaves the close button out when asked', async () => {
    const user = userEvent.setup();
    render(<Rename closeButton={false} />);

    await user.click(screen.getByRole('button', { name: 'Rename deck' }));
    await screen.findByRole('dialog');
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});
