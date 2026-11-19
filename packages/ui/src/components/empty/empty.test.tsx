import { render, screen } from '@testing-library/react';
import { LayersIcon } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '.';

describe('Empty', () => {
  it('names the empty state with a heading and shows what to do', () => {
    render(
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <LayersIcon />
          </EmptyMedia>
          <EmptyTitle>No decks yet</EmptyTitle>
          <EmptyDescription>Make your first deck.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <button type="button">New deck</button>
        </EmptyContent>
      </Empty>,
    );

    expect(screen.getByRole('heading', { level: 2, name: 'No decks yet' })).toHaveClass(
      'font-display',
    );
    expect(screen.getByRole('button', { name: 'New deck' })).toBeInTheDocument();
  });

  it('is a dashed outline by default and a ruled card on request', () => {
    const { container, rerender } = render(<Empty />);
    expect(container.firstChild).toHaveClass('border-dashed');

    rerender(<Empty variant="ruled" />);
    expect(container.firstChild).toHaveClass('ruled', 'border-ink');
  });

  it('puts the icon in a decorative pastel sticker circle', () => {
    const { container } = render(
      <EmptyMedia tone="mint">
        <LayersIcon />
      </EmptyMedia>,
    );
    const media = container.firstChild;

    expect(media).toHaveClass('bg-mint', 'rounded-full', 'border-ink');
    expect(media).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps links readable: Ink, never Lilac', () => {
    render(
      <EmptyDescription>
        Or <a href="#import">import a deck</a>.
      </EmptyDescription>,
    );
    expect(screen.getByText(/Or/)).toHaveClass('[&>a:hover]:text-ink');
    expect(screen.getByText(/Or/)).not.toHaveClass('[&>a:hover]:text-primary');
  });
});
