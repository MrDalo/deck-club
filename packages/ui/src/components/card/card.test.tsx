import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '.';

describe('Card', () => {
  it('is a sticker card with an Ink outline', () => {
    const { container } = render(<Card>Body</Card>);
    expect(container.firstChild).toHaveClass(
      'rounded-card',
      'border-2',
      'border-ink',
      'shadow-sticker-sm',
    );
  });

  it.each([
    ['raised', 'shadow-sticker'],
    ['flat', 'shadow-none'],
    ['ruled', 'ruled'],
  ] as const)('draws the %s variant', (variant, expected) => {
    const { container } = render(<Card variant={variant}>Body</Card>);
    expect(container.firstChild).toHaveClass(expected);
  });

  it('wears a decorative pastel tab when given an accent', () => {
    const { container } = render(<Card accent="mint">Body</Card>);
    const tab = container.querySelector('[data-slot="card-accent"]');

    expect(tab).toHaveClass('bg-mint');
    expect(tab).toHaveAttribute('aria-hidden', 'true');
  });

  it('announces its title as a heading at the given level', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle level={2}>Biology exam</CardTitle>
          <CardDescription>42 cards</CardDescription>
        </CardHeader>
        <CardContent>Cells</CardContent>
      </Card>,
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Biology exam' })).toHaveClass(
      'font-display',
    );
    expect(screen.getByText('42 cards')).toHaveClass('text-ink-soft');
  });

  it('defaults the title to level 3', () => {
    render(<CardTitle>Deck</CardTitle>);
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });
});
