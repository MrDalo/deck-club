import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '.';

describe('HoverCard', () => {
  it('previews on keyboard focus as a sticker card', async () => {
    const user = userEvent.setup();
    render(
      <HoverCard openDelay={0}>
        <HoverCardTrigger href="#biology">Biology exam</HoverCardTrigger>
        <HoverCardContent>42 cards · 12 due today</HoverCardContent>
      </HoverCard>,
    );

    await user.tab();
    const preview = await screen.findByText('42 cards · 12 due today');

    expect(screen.getByRole('link', { name: 'Biology exam' })).toHaveFocus();
    expect(preview).toHaveClass('rounded-2xl', 'border-ink', 'shadow-sticker', 'w-72');
  });

  it('stays closed until asked', () => {
    render(
      <HoverCard>
        <HoverCardTrigger href="#biology">Biology exam</HoverCardTrigger>
        <HoverCardContent>42 cards</HoverCardContent>
      </HoverCard>,
    );
    expect(screen.queryByText('42 cards')).not.toBeInTheDocument();
  });
});
