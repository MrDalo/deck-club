import {
  type DeckCard,
  type UpdateCardOutput,
  UpdateCardToolInputSchema,
} from '@deck-club/contracts';
import { describe, expect, it } from 'vitest';
import { readUpdatedCard, renderCardUpdated, undoArguments } from './card-updated-markup.js';

const DECK_ID = '00000000-0000-4000-8000-000000000001';
const CARD_ID = '00000000-0000-4000-8000-000000000002';
const card = (overrides: Partial<DeckCard> = {}): DeckCard => ({
  id: CARD_ID,
  type: 'basic',
  front: 'hablar',
  back: 'to speak',
  extra: '',
  tags: ['verbs'],
  addedBy: 'Claude',
  ...overrides,
});
const output = (overrides: Partial<UpdateCardOutput> = {}): UpdateCardOutput => ({
  deck: { id: DECK_ID, title: 'Spanish verbs', url: `https://deck.club/decks/${DECK_ID}` },
  card: card({ back: 'to speak, to talk', extra: 'yo hablo', tags: [] }),
  previous: card(),
  changedFields: ['back', 'extra', 'tags'],
  ...overrides,
});

describe('renderCardUpdated', () => {
  it('announces the edit on the deck’s own pastel and says study progress is kept', () => {
    const html = renderCardUpdated(output());

    expect(html).toMatch(
      /<span class="highlight" style="--highlight: var\(--color-[a-z]+\)">Card updated<\/span>/,
    );
    expect(html).toContain('In Spanish verbs · your study progress is kept');
  });

  it('shows the card as it is now, as a ruled index card with its author', () => {
    const html = renderCardUpdated(output());

    expect(html.match(/<li class="card">/g)).toHaveLength(1);
    expect(html).toContain('<p class="card-back">to speak, to talk</p>');
    expect(html).toContain('<p class="card-extra">yo hablo</p>');
    expect(html).toContain('Added by Claude');
  });

  it('shows each change before and after, labelled for screen readers', () => {
    const html = renderCardUpdated(output());

    expect(html).toContain('<h2 id="card-changes-title">What changed</h2>');
    expect(html.match(/<div class="change">/g)).toHaveLength(3);
    expect(html).toContain(
      '<dt>Back</dt>\n          <dd><span class="visually-hidden">Before: </span><del>to speak</del> <span class="change-arrow" aria-hidden="true">→</span> <span class="visually-hidden">After: </span><ins>to speak, to talk</ins></dd>',
    );
    expect(html).toContain('<del><em class="change-none">Empty</em></del>');
    expect(html).toContain('<del>verbs</del>');
    expect(html).toContain('<ins><em class="change-none">No tags</em></ins>');
    expect(html).not.toContain('<dt>Front</dt>');
  });

  it('tells a missing value apart from a card whose text is the same word', () => {
    const html = renderCardUpdated(
      output({ card: card({ extra: 'Empty' }), previous: card(), changedFields: ['extra'] }),
    );

    expect(html).toContain(
      '<del><em class="change-none">Empty</em></del> <span class="change-arrow" aria-hidden="true">→</span> <span class="visually-hidden">After: </span><ins>Empty</ins>',
    );
  });

  it('offers to undo the change and to open the deck', () => {
    const html = renderCardUpdated(output());

    expect(html).toContain(
      `<button class="button" type="button" data-action="undo" data-value="${CARD_ID}">Undo this change</button>`,
    );
    expect(html).toContain(`data-action="open" data-value="https://deck.club/decks/${DECK_ID}"`);
    expect(html).toContain('aria-label="Open Spanish verbs in Deck Club"');
  });

  it('says nothing changed, with nothing to undo, when the card already had the values', () => {
    const html = renderCardUpdated(output({ card: card(), changedFields: [] }));

    expect(html).toContain('>Card unchanged</span>');
    expect(html).toContain('<h2 id="card-changes-title">Nothing changed</h2>');
    expect(html).not.toContain('data-action="undo"');
    expect(html).not.toContain('study progress');
  });

  it('escapes the deck’s and the card’s text, before and after', () => {
    const html = renderCardUpdated(
      output({
        deck: { ...output().deck, title: '<img src=x onerror=alert(1)>' },
        card: card({ back: '<script>alert(1)</script>' }),
        previous: card({ back: '</del><b>x</b>' }),
        changedFields: ['back'],
      }),
    );

    expect(html).not.toContain('<img');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<b>x</b>');
    expect(html).toContain('<ins>&lt;script&gt;alert(1)&lt;/script&gt;</ins>');
  });
});

describe('undoArguments', () => {
  it('puts back the old values of the changed fields only', () => {
    expect(undoArguments(output())).toEqual({
      deckId: DECK_ID,
      cardId: CARD_ID,
      back: 'to speak',
      extra: '',
      tags: ['verbs'],
    });
  });

  it('is a valid update_card call, even when the old values were empty', () => {
    expect(UpdateCardToolInputSchema.safeParse(undoArguments(output())).success).toBe(true);
  });

  it('changes the front only when the front was changed', () => {
    const frontOnly = output({ card: card({ front: 'hablar (v.)' }), changedFields: ['front'] });

    expect(undoArguments(frontOnly)).toEqual({ deckId: DECK_ID, cardId: CARD_ID, front: 'hablar' });
  });
});

describe('readUpdatedCard', () => {
  it('reads the card after an undo the view sent', () => {
    expect(readUpdatedCard({ structuredContent: output() })).toEqual(output());
  });

  it('gives up on a refusal or a result that breaks the contract', () => {
    expect(readUpdatedCard({ isError: true, structuredContent: output() })).toBeNull();
    expect(readUpdatedCard({ structuredContent: { card: 'nope' } })).toBeNull();
  });
});
