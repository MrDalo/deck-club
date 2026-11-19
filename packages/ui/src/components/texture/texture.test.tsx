import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Texture } from '.';

describe('Texture', () => {
  it('draws lined paper on Card by default', () => {
    render(<Texture data-testid="paper">Notes</Texture>);

    const paper = screen.getByTestId('paper');
    expect(paper).toHaveAttribute('data-pattern', 'lined');
    expect(paper).toHaveClass('lined-paper', 'bg-card', 'text-ink');
  });

  it.each([
    ['grid', 'grid-paper'],
    ['dots', 'dot-paper'],
  ] as const)('draws %s paper on the chosen tone', (pattern, utility) => {
    render(
      <Texture data-testid="paper" pattern={pattern} tone="mint">
        Notes
      </Texture>,
    );

    expect(screen.getByTestId('paper')).toHaveClass(utility, 'bg-mint');
    expect(screen.getByTestId('paper')).not.toHaveClass('bg-card');
  });

  it('draws the ruled index card with its own white fill', () => {
    render(
      <Texture data-testid="card" pattern="ruled">
        Notes
      </Texture>,
    );

    expect(screen.getByTestId('card')).toHaveClass('ruled');
    expect(screen.getByTestId('card')).not.toHaveClass('bg-card');
  });

  it('puts the pattern on its child, keeping the child’s semantics', () => {
    render(
      <Texture asChild pattern="grid">
        <section aria-label="Scratchpad">Working</section>
      </Texture>,
    );

    const region = screen.getByRole('region', { name: 'Scratchpad' });
    expect(region).toHaveClass('grid-paper');
    expect(region).toHaveAttribute('data-slot', 'texture');
  });
});
