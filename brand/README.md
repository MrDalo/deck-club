# Deck Club brand

## Idea

**Index cards and highlighters.** Deck Club should feel like a good study
desk: a stack of ruled index cards, pastel highlighter strokes on the things
that matter, a friend's sticky note saying "Added by Claude". Calm enough for
a five-minute daily habit, warm enough for a club.

Light mode only, by decision: the whole look is paper.

## Name and mark

- **Name:** Deck Club (two words, both capitalised). Never "DeckClub" or
  "deck.club" in prose.
- **Mark:** two index cards fanned like a hand — the back one lilac, the front
  one white and ruled, with a mint highlighter stroke. Source:
  `apps/web/src/shared/ui/logo.tsx`, favicon `apps/web/src/app/icon.svg`.
- **Wordmark:** "Deck Club" in Bricolage Grotesque ExtraBold next to the mark.

## Colour

| Name     | Hex       | Role                                                |
| -------- | --------- | --------------------------------------------------- |
| Paper    | `#faf8ff` | Background: lilac-tinted card stock                 |
| Card     | `#ffffff` | Surfaces: cards, inputs                             |
| Ink      | `#24203a` | Text, borders, the hard sticker shadow              |
| Ink soft | `#5b5575` | Secondary text                                      |
| Line     | `#e4def5` | Ruling, dividers                                    |
| Lilac    | `#cdbffb` | Brand, primary actions                              |
| Mint     | `#bdebd6` | Success, AI badges, "Good"                          |
| Peach    | `#ffd3b8` | Caution, "Hard"                                     |
| Rose     | `#f9c2d1` | Errors, danger, "Again"; the index-card margin rule |
| Sky      | `#c3e0fa` | The card editor, "Easy"                             |
| Butter   | `#fff0a8` | The highlighter swipe                               |
| Focus    | `#6e56cf` | Keyboard focus outline only                         |

Pastels are always fills. Text on them is Ink, which keeps every pair above
WCAG 2.2 AA (Ink on Lilac ≈ 9.8:1, on Paper ≈ 15:1; Ink soft on Paper ≈ 6.9:1).

## Type

- **Bricolage Grotesque** (display): headings, deck titles, the front of a
  card. Weight 700–800, tracking −0.02em. It has character without being
  childish.
- **Atkinson Hyperlegible** (text): everything else. Designed for low-vision
  readers, which fits a reference-quality, accessible product (spec G5).
- Both with `latin-ext` for Slovak and Czech.

## Motifs

- **Ruled card** (`.ruled`): faint blue-lilac lines with a rose margin rule.
  Used for card previews and the create-deck panel.
- **Highlighter swipe** (`.highlight`): one per page, behind the main heading;
  on a deck page it takes the deck's own pastel.
- **Sticker buttons and panels**: 2px Ink border, hard 2–3px offset shadow
  with no blur; pressing a button flattens it.
- **Deck tabs**: every deck gets a stable pastel (from its id) shown as the
  coloured tab of its tile.

Spend boldness once per screen. Everything around it stays quiet.

## Voice

Plain, warm, direct, second person, sentence case. Buttons name the action
("Add card"); confirmations reuse the verb ("Card added."). Errors say what
happened and what to do, without apologising. No exclamation marks in UI copy.
In Slovak and Czech use informal "ty".
