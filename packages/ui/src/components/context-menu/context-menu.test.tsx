import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '.';

function CardMenu({ onDelete = vi.fn() }: { onDelete?: () => void }): React.JSX.Element {
  return (
    <ContextMenu>
      <ContextMenuTrigger>Mitosis</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>Card</ContextMenuLabel>
        <ContextMenuItem>Edit card</ContextMenuItem>
        <ContextMenuCheckboxItem checked>Suspended</ContextMenuCheckboxItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Move to deck</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Biology exam</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuRadioGroup value="good">
          <ContextMenuRadioItem value="again">Again</ContextMenuRadioItem>
          <ContextMenuRadioItem value="good">Good</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onSelect={onDelete}>
          Delete card
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

describe('ContextMenu', () => {
  it('opens on right-click as a sticker menu', async () => {
    render(<CardMenu />);

    fireEvent.contextMenu(screen.getByText('Mitosis'));
    const menu = await screen.findByRole('menu');

    expect(menu).toHaveClass('rounded-2xl', 'border-ink', 'shadow-sticker');
    expect(screen.getByRole('menuitem', { name: 'Edit card' })).toHaveClass('focus:bg-butter');
  });

  it('reports checkbox and radio states', async () => {
    render(<CardMenu />);

    fireEvent.contextMenu(screen.getByText('Mitosis'));
    expect(await screen.findByRole('menuitemcheckbox', { name: 'Suspended' })).toBeChecked();
    expect(screen.getByRole('menuitemradio', { name: 'Good' })).toBeChecked();
    expect(screen.getByRole('menuitemradio', { name: 'Again' })).not.toBeChecked();
  });

  it('runs a destructive item, drawn in Danger', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<CardMenu onDelete={onDelete} />);

    fireEvent.contextMenu(screen.getByText('Mitosis'));
    const remove = await screen.findByRole('menuitem', { name: 'Delete card' });
    expect(remove).toHaveClass('data-[variant=destructive]:text-danger');
    await user.click(remove);

    expect(onDelete).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens a submenu from the keyboard', async () => {
    const user = userEvent.setup();
    render(<CardMenu />);

    fireEvent.contextMenu(screen.getByText('Mitosis'));
    const trigger = await screen.findByRole('menuitem', { name: 'Move to deck' });
    trigger.focus();
    await user.keyboard('{ArrowRight}');

    expect(await screen.findByRole('menuitem', { name: 'Biology exam' })).toBeInTheDocument();
  });
});
