import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '#components/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '.';

function DeckMenu({ onDelete = vi.fn() }: { onDelete?: () => void }): React.JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary">Deck</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Biology exam</DropdownMenuLabel>
        <DropdownMenuItem>Rename</DropdownMenuItem>
        <DropdownMenuCheckboxItem checked>Show due cards</DropdownMenuCheckboxItem>
        <DropdownMenuRadioGroup value="due">
          <DropdownMenuRadioItem value="due">Sort by due date</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="added">Sort by date added</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Export</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>CSV</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          Delete deck
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe('DropdownMenu', () => {
  it('opens from the keyboard as a sticker menu and focuses the first item', async () => {
    const user = userEvent.setup();
    render(<DeckMenu />);

    screen.getByRole('button', { name: 'Deck' }).focus();
    await user.keyboard('{Enter}');
    const menu = await screen.findByRole('menu');

    expect(menu).toHaveClass('rounded-2xl', 'border-ink', 'shadow-sticker');
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveFocus();
  });

  it('reports checkbox and radio states', async () => {
    const user = userEvent.setup();
    render(<DeckMenu />);

    await user.click(screen.getByRole('button', { name: 'Deck' }));
    expect(await screen.findByRole('menuitemcheckbox', { name: 'Show due cards' })).toBeChecked();
    expect(screen.getByRole('menuitemradio', { name: 'Sort by due date' })).toBeChecked();
  });

  it('runs a destructive item drawn in Danger, then closes', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<DeckMenu onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: 'Deck' }));
    const remove = await screen.findByRole('menuitem', { name: 'Delete deck' });
    expect(remove).toHaveClass('data-[variant=destructive]:text-danger');
    await user.click(remove);

    expect(onDelete).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens a submenu with the right arrow', async () => {
    const user = userEvent.setup();
    render(<DeckMenu />);

    await user.click(screen.getByRole('button', { name: 'Deck' }));
    (await screen.findByRole('menuitem', { name: 'Export' })).focus();
    await user.keyboard('{ArrowRight}');

    expect(await screen.findByRole('menuitem', { name: 'CSV' })).toBeInTheDocument();
  });
});
