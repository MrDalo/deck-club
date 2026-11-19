import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Button } from '#components/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '.';

describe('Collapsible', () => {
  it('reveals and hides its content', async () => {
    const user = userEvent.setup();
    render(
      <Collapsible>
        <CollapsibleTrigger>Show the answer</CollapsibleTrigger>
        <CollapsibleContent>The mitochondria.</CollapsibleContent>
      </Collapsible>,
    );
    const trigger = screen.getByRole('button', { name: 'Show the answer' });

    expect(screen.queryByText('The mitochondria.')).not.toBeInTheDocument();
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('The mitochondria.')).toBeVisible();
  });

  it('draws a decorative chevron on its own trigger', () => {
    const { container } = render(
      <Collapsible>
        <CollapsibleTrigger>More</CollapsibleTrigger>
      </Collapsible>,
    );
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('makes a branded Button the trigger with asChild', async () => {
    const user = userEvent.setup();
    render(
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="secondary">Advanced</Button>
        </CollapsibleTrigger>
        <CollapsibleContent>Daily limits</CollapsibleContent>
      </Collapsible>,
    );
    const trigger = screen.getByRole('button', { name: 'Advanced' });

    expect(trigger).toHaveClass('bg-card');
    await user.click(trigger);
    expect(screen.getByText('Daily limits')).toBeVisible();
  });

  it('sits on a sticker card as the card variant', () => {
    const { container } = render(<Collapsible variant="card" />);
    expect(container.firstChild).toHaveClass('rounded-card', 'border-ink', 'shadow-sticker-sm');
  });
});
