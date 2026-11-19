import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScrollArea } from '.';

describe('ScrollArea', () => {
  it('makes labelled content a focusable region a keyboard can scroll', () => {
    render(
      <ScrollArea label="The answer" className="h-20">
        <p>Long text</p>
      </ScrollArea>,
    );
    const region = screen.getByRole('region', { name: 'The answer' });

    expect(region).toHaveAttribute('tabindex', '0');
    expect(region).toHaveTextContent('Long text');
  });

  it('leaves content with its own controls as it is', () => {
    render(
      <ScrollArea className="h-20">
        <button type="button">Card 1</button>
      </ScrollArea>,
    );
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('draws an Ink scrollbar thumb', () => {
    const { container } = render(<ScrollArea className="h-20">Text</ScrollArea>);
    expect(container.firstChild).toHaveClass('[&_[data-slot=scroll-area-thumb]]:bg-ink/35');
  });
});
