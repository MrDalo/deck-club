import { describe, expect, it } from 'vitest';
import {
  actionButton,
  chip,
  countLabel,
  deckChip,
  emptyState,
  notice,
  pageHeader,
  searchForm,
} from './components.js';

describe('countLabel', () => {
  it('uses the singular for one and the plural otherwise', () => {
    expect([countLabel(1, 'card'), countLabel(0, 'card'), countLabel(42, 'card')]).toEqual([
      '1 card',
      '0 cards',
      '42 cards',
    ]);
  });

  it('takes an irregular plural', () => {
    expect(countLabel(2, 'query', 'queries')).toBe('2 queries');
  });
});

describe('pageHeader', () => {
  it('puts the title on the brand’s highlighter swipe', () => {
    const html = pageHeader({ title: 'Your decks', lead: '2 decks' });

    expect(html).toContain('<h1><span class="highlight">Your decks</span></h1>');
    expect(html).toContain('<p class="lead">2 decks</p>');
  });

  it('colours the swipe with an accent when given one', () => {
    expect(pageHeader({ title: 'Biology', lead: '', accent: 'var(--color-mint)' })).toContain(
      'style="--highlight: var(--color-mint)"',
    );
  });

  it('escapes the title and the lead', () => {
    const html = pageHeader({ title: '<b>x</b>', lead: '"y"' });

    expect(html).not.toContain('<b>x</b>');
    expect(html).toContain('&quot;y&quot;');
  });
});

describe('actionButton', () => {
  it('is a real button carrying its action and value', () => {
    expect(
      actionButton({ label: 'Open deck', action: 'open', value: 'https://deck.club/decks' }),
    ).toBe(
      '<button class="button" type="button" data-action="open" data-value="https://deck.club/decks">Open deck</button>',
    );
  });

  it('has a secondary look and a fuller accessible name when asked', () => {
    const html = actionButton({
      label: 'Open deck',
      action: 'open',
      value: 'u',
      variant: 'secondary',
      accessibleName: 'Open Spanish in Deck Club',
    });

    expect(html).toContain('class="button button-secondary"');
    expect(html).toContain('aria-label="Open Spanish in Deck Club"');
  });

  it('escapes a value, so quotes cannot break out of the attribute', () => {
    const html = actionButton({
      label: 'Ask',
      action: 'ask',
      value: 'my "x" deck" onclick="evil()',
    });

    expect(html).toContain('data-value="my &quot;x&quot; deck&quot; onclick=&quot;evil()"');
  });
});

describe('chip', () => {
  it('takes a brand pastel and an accessible name', () => {
    expect(chip('Added by Claude', 'mint')).toBe(
      '<span class="chip chip-mint">Added by Claude</span>',
    );
    expect(chip('es', 'paper', 'Language: es')).toContain('aria-label="Language: es"');
  });

  it('escapes its text', () => {
    expect(chip('<i>tag</i>')).toContain('&lt;i&gt;tag&lt;/i&gt;');
  });
});

describe('notice', () => {
  it('is announced as a status and escapes its message', () => {
    const html = notice('<b>Deck Club</b> could not list the decks.');

    expect(html).toContain('role="status"');
    expect(html).toContain('&lt;b&gt;Deck Club&lt;/b&gt; could not list the decks.');
  });
});

describe('emptyState', () => {
  it('says what is missing and offers the one action that helps', () => {
    const html = emptyState('No cards yet', 'Ask the assistant.', '<button>Add</button>');

    expect(html).toContain('<p class="empty-title">No cards yet</p>');
    expect(html).toContain('<div class="actions actions-centered"><button>Add</button></div>');
  });
});

describe('deckChip', () => {
  it('fills the chip with the deck’s pastel and names the deck', () => {
    expect(deckChip('Spanish', 'var(--color-mint)')).toBe(
      '<span class="chip chip-deck" style="--deck-accent: var(--color-mint)" aria-label="Deck: Spanish">Spanish</span>',
    );
  });

  it('escapes the title', () => {
    expect(deckChip('<b>x</b>', 'var(--color-mint)')).not.toContain('<b>');
  });
});

describe('searchForm', () => {
  it('is a labelled search landmark that runs its action on submit', () => {
    const html = searchForm('search', 'hablar');

    expect(html).toContain('<form class="search" role="search" data-action="search">');
    expect(html).toContain(
      '<label class="visually-hidden" for="deck-club-search">Search your cards</label>',
    );
    expect(html).toContain('name="value" value="hablar" maxlength="200" required');
    expect(html).toContain('<button class="button" type="submit">Search</button>');
  });

  it('escapes the current words so they cannot leave the value attribute', () => {
    expect(searchForm('search', '" autofocus onfocus="x')).toContain(
      'value="&quot; autofocus onfocus=&quot;x"',
    );
  });
});
