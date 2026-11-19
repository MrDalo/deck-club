import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  type AccordionProps,
} from '.';

type FaqProps = { variant?: AccordionProps['variant'] };

function Faq({ variant = 'plain' }: FaqProps): React.JSX.Element {
  return (
    <Accordion type="single" collapsible variant={variant}>
      <AccordionItem value="srs">
        <AccordionTrigger>What is spaced repetition?</AccordionTrigger>
        <AccordionContent>Reviews spread out just before you forget.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="ai">
        <AccordionTrigger>Can my AI add cards?</AccordionTrigger>
        <AccordionContent>Yes, through the MCP server.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

describe('Accordion', () => {
  it('opens one answer at a time', async () => {
    const user = userEvent.setup();
    render(<Faq />);
    const first = screen.getByRole('button', { name: 'What is spaced repetition?' });
    const second = screen.getByRole('button', { name: 'Can my AI add cards?' });

    await user.click(first);
    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Reviews spread out just before you forget.')).toBeVisible();

    await user.click(second);
    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(second).toHaveAttribute('aria-expanded', 'true');
  });

  it('operates from the keyboard', async () => {
    const user = userEvent.setup();
    render(<Faq />);

    await user.tab();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('button', { name: 'What is spaced repetition?' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('tells its items which variant to draw', () => {
    const { container } = render(<Faq variant="cards" />);
    expect(container.firstChild).toHaveAttribute('data-variant', 'cards');
  });

  it('sets triggers in the display face with the brand focus outline', () => {
    render(<Faq />);
    expect(screen.getByRole('button', { name: 'Can my AI add cards?' })).toHaveClass(
      'font-display',
      'focus-visible:outline-focus',
    );
  });
});
