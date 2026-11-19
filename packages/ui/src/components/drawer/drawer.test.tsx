import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '#components/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '.';

function CardActions({ onSuspend = vi.fn() }: { onSuspend?: () => void }): React.JSX.Element {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>Card actions</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Mitosis</DrawerTitle>
          <DrawerDescription>What to do with this card.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button onClick={onSuspend}>Suspend card</Button>
          <DrawerClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

describe('Drawer', () => {
  it('slides in a named, described dialog from the bottom', async () => {
    const user = userEvent.setup();
    render(<CardActions />);

    await user.click(screen.getByRole('button', { name: 'Card actions' }));
    const drawer = await screen.findByRole('dialog', { name: 'Mitosis' });

    expect(drawer).toHaveAccessibleDescription('What to do with this card.');
    expect(drawer).toHaveAttribute('data-vaul-drawer-direction', 'bottom');
    expect(drawer).toHaveClass('data-[vaul-drawer-direction=bottom]:rounded-t-card', 'border-ink');
  });

  it('runs its actions and closes from its own button', async () => {
    const user = userEvent.setup();
    const onSuspend = vi.fn();
    render(<CardActions onSuspend={onSuspend} />);

    await user.click(screen.getByRole('button', { name: 'Card actions' }));
    await user.click(await screen.findByRole('button', { name: 'Suspend card' }));
    expect(onSuspend).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
