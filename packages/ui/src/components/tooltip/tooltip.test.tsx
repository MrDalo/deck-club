import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tooltip, TooltipContent, TooltipTrigger } from '.';

describe('Tooltip', () => {
  it('shows an Ink hint on keyboard focus and hides on Escape', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip>
        <TooltipTrigger aria-label="Shuffle">↻</TooltipTrigger>
        <TooltipContent>Shuffle the deck</TooltipContent>
      </Tooltip>,
    );

    await user.tab();
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Shuffle the deck');
    expect(
      screen.getByText('Shuffle the deck', { selector: '[data-slot=tooltip-content]' }),
    ).toHaveClass('bg-ink', 'text-paper');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
