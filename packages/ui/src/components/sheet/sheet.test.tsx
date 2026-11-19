import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Button } from '#components/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '.';

function Settings({ side }: { side?: 'left' | 'right' }): React.JSX.Element {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Deck settings</Button>
      </SheetTrigger>
      <SheetContent closeLabel="Zavrieť" {...(side === undefined ? {} : { side })}>
        <SheetHeader>
          <SheetTitle>Deck settings</SheetTitle>
          <SheetDescription>Daily limits.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}

describe('Sheet', () => {
  it('opens a named panel from the right with one translated close button', async () => {
    const user = userEvent.setup();
    render(<Settings />);

    await user.click(screen.getByRole('button', { name: 'Deck settings' }));
    const sheet = await screen.findByRole('dialog', { name: 'Deck settings' });

    expect(sheet).toHaveAccessibleDescription('Daily limits.');
    expect(sheet).toHaveClass('border-l-2', 'rounded-l-card', 'border-ink');
    expect(screen.getAllByRole('button', { name: 'Zavrieť' })).toHaveLength(1);
    // shadcn's own English close button is the last child, hidden by CSS
    // (jsdom loads no stylesheet; the Storybook browser check confirms it is gone).
    expect(sheet.lastElementChild).toHaveTextContent('Close');
    expect(sheet).toHaveClass('[&>button:last-child]:hidden');
  });

  it('closes with its close button', async () => {
    const user = userEvent.setup();
    render(<Settings />);

    await user.click(screen.getByRole('button', { name: 'Deck settings' }));
    await user.click(await screen.findByRole('button', { name: 'Zavrieť' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('rounds the inner edge on the left', async () => {
    const user = userEvent.setup();
    render(<Settings side="left" />);

    await user.click(screen.getByRole('button', { name: 'Deck settings' }));
    expect(await screen.findByRole('dialog')).toHaveClass('border-r-2', 'rounded-r-card');
  });
});
