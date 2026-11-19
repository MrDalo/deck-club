import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '.';

function Editor(): React.JSX.Element {
  return (
    <Menubar aria-label="Card editor">
      <MenubarMenu>
        <MenubarTrigger>Deck</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>New card</MenubarItem>
          <MenubarSeparator />
          <MenubarItem variant="destructive">Delete deck</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem checked>Show answers</MenubarCheckboxItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

describe('Menubar', () => {
  it('is a named menubar of pill triggers', () => {
    render(<Editor />);
    const bar = screen.getByRole('menubar', { name: 'Card editor' });

    expect(bar).toHaveClass('rounded-full', 'border-ink', 'shadow-sticker-sm');
    expect(screen.getByRole('menuitem', { name: 'Deck' })).toHaveClass('rounded-full');
  });

  it('opens a menu and moves to the next one with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<Editor />);

    await user.click(screen.getByRole('menuitem', { name: 'Deck' }));
    expect(await screen.findByRole('menuitem', { name: 'New card' })).toBeInTheDocument();

    await user.keyboard('{ArrowRight}');
    expect(await screen.findByRole('menuitemcheckbox', { name: 'Show answers' })).toBeChecked();
  });

  it('draws its menus as sticker cards with a Danger destructive item', async () => {
    const user = userEvent.setup();
    render(<Editor />);

    await user.click(screen.getByRole('menuitem', { name: 'Deck' }));
    expect(await screen.findByRole('menu')).toHaveClass('border-ink', 'shadow-sticker');
    expect(screen.getByRole('menuitem', { name: 'Delete deck' })).toHaveAttribute(
      'data-variant',
      'destructive',
    );
  });
});
