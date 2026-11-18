import type { CardMatch, SearchCardsOutput } from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import {
  nextSearchArguments,
  readSearchResults,
  renderSearchResults,
} from './search-results-markup.js';

const SPANISH = '00000000-0000-4000-8000-0000000000d1';
const FRENCH = '00000000-0000-4000-8000-0000000000d2';
const match = (index: number, deckId = SPANISH, front = `hablar ${index}`): CardMatch => ({
  card: {
    id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    type: 'basic',
    front,
    back: 'to speak',
    extra: '',
    tags: [],
    addedBy: null,
  },
  deck: {
    id: deckId,
    title: deckId === SPANISH ? 'Spanish' : 'French',
    url: `https://deck.club/decks/${deckId}`,
  },
  matchedIn: ['front'],
});
const output = (overrides: Partial<SearchCardsOutput> = {}): SearchCardsOutput => ({
  query: 'hablar',
  deckId: null,
  matches: [match(1), match(2, FRENCH)],
  totalMatches: 2,
  ...overrides,
});

describe('renderSearchResults', () => {
  it('titles the view with the search and counts matches and decks', () => {
    const html = renderSearchResults(output());

    expect(html).toContain('Cards matching &quot;hablar&quot;');
    expect(html).toContain('2 matches in 2 decks');
  });

  it('says when it shows only the best matches, and how many more there are', () => {
    const html = renderSearchResults(output({ matches: [match(1)], totalMatches: 12 }));

    expect(html).toContain('12 matches in 1 deck · showing the 1 best');
    expect(html).toContain('Narrow the search to see the other 11.');
  });

  it('offers a search box holding the current words', () => {
    const html = renderSearchResults(output());

    expect(html).toContain('<form class="search" role="search" data-action="search">');
    expect(html).toContain('value="hablar"');
  });

  it('shows each match as an index card with the words marked', () => {
    const html = renderSearchResults(output());

    expect(html.match(/<li class="card">/g)).toHaveLength(2);
    expect(html).toContain('<mark>hablar</mark> 1');
  });

  it('names each card’s deck in its own pastel and offers to open it', () => {
    const html = renderSearchResults(output());

    expect(html).toMatch(
      /<span class="chip chip-deck" style="--deck-accent: var\(--color-[a-z]+\)" aria-label="Deck: Spanish">Spanish<\/span>/,
    );
    expect(html).toContain(`data-action="open" data-value="https://deck.club/decks/${FRENCH}"`);
    expect(html).toContain('aria-label="Open French in Deck Club"');
  });

  it('says there is no card about it yet, and offers to make some', () => {
    const html = renderSearchResults(output({ matches: [], totalMatches: 0 }));

    expect(html).toContain('No matches.');
    expect(html).toContain('No card about this yet');
    expect(html).toContain(
      'data-action="ask" data-value="Make 10 cards about &quot;hablar&quot;."',
    );
    expect(html).not.toContain('<ol');
  });

  it('escapes the search and the cards, so neither can inject markup', () => {
    const html = renderSearchResults(
      output({ query: '"><img src=x>', matches: [match(1, SPANISH, '<script>x</script>')] }),
    );

    expect(html).not.toContain('<img');
    expect(html).not.toContain('<script>');
    expect(html).toContain('value="&quot;&gt;&lt;img src=x&gt;"');
  });
});

describe('nextSearchArguments', () => {
  it('searches every deck again when the shown search did', () => {
    expect(nextSearchArguments(output(), '  comer ')).toEqual({ query: 'comer', limit: 20 });
  });

  it('keeps a one-deck search in its deck', () => {
    expect(nextSearchArguments(output({ deckId: SPANISH }), 'comer')).toEqual({
      query: 'comer',
      deckId: SPANISH,
      limit: 20,
    });
  });
});

describe('readSearchResults', () => {
  it('reads results the view fetched itself, and gives up on anything else', () => {
    expect(readSearchResults({ structuredContent: output() })).toEqual(output());
    expect(readSearchResults({ isError: true, structuredContent: output() })).toBeNull();
    expect(readSearchResults({ structuredContent: { query: 1 } })).toBeNull();
  });
});
