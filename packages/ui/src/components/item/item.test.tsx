import { render, screen, within } from '@testing-library/react';
import { LayersIcon } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '.';

describe('Item', () => {
  it('lays out media, content and actions in a row', () => {
    render(
      <Item variant="outline">
        <ItemMedia variant="icon" tone="mint">
          <LayersIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Biology exam</ItemTitle>
          <ItemDescription>42 cards · 12 due today</ItemDescription>
        </ItemContent>
        <ItemActions>
          <button type="button">Study</button>
        </ItemActions>
      </Item>,
    );

    expect(screen.getByText('Biology exam')).toHaveClass('font-bold', 'text-ink');
    expect(screen.getByText('42 cards · 12 due today')).toHaveClass('text-ink-soft');
    expect(screen.getByRole('button', { name: 'Study' })).toBeInTheDocument();
  });

  it.each([
    ['outline', 'border-ink'],
    ['sticker', 'shadow-sticker-sm'],
    ['muted', 'bg-line/50'],
  ] as const)('draws the %s variant', (variant, expected) => {
    const { container } = render(<Item variant={variant}>Deck</Item>);
    expect(container.firstChild).toHaveClass(expected);
  });

  it('puts the icon on a pastel tile', () => {
    const { container } = render(
      <ItemMedia variant="icon" tone="peach">
        <LayersIcon />
      </ItemMedia>,
    );
    expect(container.firstChild).toHaveClass('bg-peach', 'border-ink');
  });

  it('makes a whole row a link with asChild', () => {
    render(
      <Item asChild>
        <a href="#biology">
          <ItemContent>
            <ItemTitle>Biology exam</ItemTitle>
          </ItemContent>
        </a>
      </Item>,
    );
    expect(screen.getByRole('link', { name: 'Biology exam' })).toHaveAttribute('data-slot', 'item');
  });
});

describe('ItemGroup', () => {
  it('is a list whose items are list items, links included', () => {
    render(
      <ItemGroup aria-label="Your decks">
        <Item>Biology exam</Item>
        <ItemSeparator />
        <Item asChild>
          <a href="#spanish">Spanish verbs</a>
        </Item>
      </ItemGroup>,
    );
    const list = screen.getByRole('list', { name: 'Your decks' });
    const items = within(list).getAllByRole('listitem');

    expect(items).toHaveLength(2);
    expect(within(items[1]!).getByRole('link', { name: 'Spanish verbs' })).toBeInTheDocument();
  });

  it('leaves items outside a group without a list role', () => {
    render(<Item>Alone</Item>);
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});
