import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Label } from '.';

describe('Label', () => {
  it('names its control and focuses it when clicked', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Label htmlFor="deck-title">Deck title</Label>
        <input id="deck-title" />
      </>,
    );

    await user.click(screen.getByText('Deck title'));
    expect(screen.getByRole('textbox', { name: 'Deck title' })).toHaveFocus();
  });

  it('is Ink and semibold', () => {
    render(<Label>Deck title</Label>);
    expect(screen.getByText('Deck title')).toHaveClass('text-ink', 'font-semibold');
  });

  it('dims beside a disabled control', () => {
    render(<Label>Deck title</Label>);
    expect(screen.getByText('Deck title')).toHaveClass('peer-disabled:opacity-50');
  });
});
