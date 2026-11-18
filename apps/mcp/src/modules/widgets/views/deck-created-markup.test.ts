import type { CreateDeckOutput } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { renderDeckCreated } from './deck-created-markup.js';

const DECK_ID = '00000000-0000-4000-8000-000000000001';
const output = (deck: Partial<CreateDeckOutput['deck']> = {}): CreateDeckOutput => ({
  deck: {
    id: DECK_ID,
    title: 'Spanish verbs',
    description: 'A1 verbs',
    language: 'es',
    cardCount: 0,
    url: `https://deck.club/decks/${DECK_ID}`,
    tags: ['a1', 'verbs'],
    visibility: 'private',
    ...deck,
  },
  libraryUrl: 'https://deck.club/decks',
});

describe('renderDeckCreated', () => {
  it('announces the deck on its own pastel and says it is private', () => {
    const html = renderDeckCreated(output());

    expect(html).toMatch(
      /<span class="highlight" style="--highlight: var\(--color-[a-z]+\)">Deck created<\/span>/,
    );
    expect(html).toContain('It is private: only you can see it until you share it.');
  });

  it('shows the deck as its library tile, with language, count, visibility and tags', () => {
    const html = renderDeckCreated(output());

    expect(html).toContain('<h2>Spanish verbs</h2>');
    expect(html).toContain('A1 verbs');
    expect(html).toContain('0 cards');
    expect(html).toContain('aria-label="Visibility: Private">Private</span>');
    expect(html).toContain('aria-label="Tag: a1">a1</span>');
    expect(html).toContain('--deck-accent: var(--color-');
  });

  it('makes filling the deck the main next step, in the assistant', () => {
    const html = renderDeckCreated(output());

    expect(html).toContain('<section class="panel" aria-labelledby="next-step-title">');
    expect(html).toContain(
      '<button class="button" type="button" data-action="ask" data-value="Add 10 new cards to my &quot;Spanish verbs&quot; deck.">Add 10 cards</button>',
    );
    expect(html).toContain(
      'data-value="Turn my notes into cards for my &quot;Spanish verbs&quot; deck. I will paste them next."',
    );
  });

  it('links the deck and the whole library in Deck Club', () => {
    const html = renderDeckCreated(output());

    expect(html).toContain(`data-action="open" data-value="https://deck.club/decks/${DECK_ID}"`);
    expect(html).toContain('aria-label="Open Spanish verbs in Deck Club"');
    expect(html).toContain('data-action="open" data-value="https://deck.club/decks">See all decks');
  });

  it('names another visibility when the deck has one', () => {
    expect(renderDeckCreated(output({ visibility: 'unlisted' }))).toContain('It is unlisted.');
  });

  it('shows no tag chips for a deck without tags', () => {
    expect(renderDeckCreated(output({ tags: [] }))).not.toContain('Tag:');
  });

  it('escapes the deck’s text', () => {
    const html = renderDeckCreated(output({ title: '<img src=x onerror=alert(1)>', tags: ['"x'] }));

    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).not.toContain('aria-label="Tag: "x"');
  });
});
