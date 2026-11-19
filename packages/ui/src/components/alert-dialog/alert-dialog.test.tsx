import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '#components/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '.';

function DeleteDeck({ onDelete }: { onDelete: () => void }): React.JSX.Element {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="danger">Delete deck</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this deck?</AlertDialogTitle>
          <AlertDialogDescription>Its 42 cards are deleted with it.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep deck</AlertDialogCancel>
          <AlertDialogAction variant="danger" onClick={onDelete}>
            Delete deck
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

describe('AlertDialog', () => {
  it('asks with a named, described alert dialog', async () => {
    const user = userEvent.setup();
    render(<DeleteDeck onDelete={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Delete deck' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete this deck?' });

    expect(dialog).toHaveAccessibleDescription('Its 42 cards are deleted with it.');
    expect(dialog).toHaveClass('rounded-card', 'border-ink', 'shadow-sticker');
  });

  it('focuses Cancel first, so Enter never destroys anything', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<DeleteDeck onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: 'Delete deck' }));
    expect(await screen.findByRole('button', { name: 'Keep deck' })).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('draws its actions as branded buttons and confirms', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<DeleteDeck onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: 'Delete deck' }));
    const dialog = await screen.findByRole('alertdialog');
    const confirm = screen
      .getAllByRole('button', { name: 'Delete deck' })
      .find((button) => dialog.contains(button));

    expect(confirm).toHaveClass('bg-rose', 'border-ink');
    expect(screen.getByRole('button', { name: 'Keep deck' })).toHaveClass('bg-card');
    await user.click(confirm!);
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<DeleteDeck onDelete={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Delete deck' }));
    await screen.findByRole('alertdialog');
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
