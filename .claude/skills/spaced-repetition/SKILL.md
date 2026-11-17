---
name: 'spaced-repetition'
description: 'Use when building the study slice or anything that schedules cards: study state, reviews, due cards, daily limits, the day boundary, session order, undo, streaks and retention. Distils spec section 6 and how it maps onto the codebase. Not built yet; this is the plan for the next slice.'
---

# Spaced repetition (spec 6) — next slice

Status: **not implemented**. Decks and cards exist; study state and reviews
do not. This skill is the agreed shape for the study slice.

## Library

Use a maintained FSRS implementation (`ts-fsrs`), never a home-made
algorithm (spec 6). Confirm its version and API with context7 before use, and
record the choice in an ADR. Wrap it behind a pure scheduler in the new
`study` module's `domain/` so every entry point (app, MCP, battles) uses the
same engine and tests can exercise it exhaustively.

## Model

- **Study state** (per user, per card): FSRS state (`new`, `learning`,
  `review`, `relearning`), due, stability, difficulty, lapses, reps,
  suspended. Created lazily on first review or when a card enters a session.
- **Review** (append-only): user, card, rating (`again|hard|good|easy`),
  duration ms, source (`app|mcp|battle`), reviewed at, plus the previous state
  snapshot so undo restores exactly.
- Editing a card keeps study state; only a card-type change resets it
  (spec 3).

## Rules

- Desired retention default 0.90, user range 0.80–0.97.
- Daily limits per deck: 20 new, 200 reviews; the same limits apply over MCP.
- Day boundary: the user's time zone at their day-start hour (default 4:00).
- Reversible siblings never on the same day.
- Session order: due learning/relearning → due reviews (most overdue first) →
  new cards in insertion order up to the limit.
- The review screen shows the next interval for each rating before the user
  picks.
- Undo: the last rating of a session restores the exact previous state.
- Streak: consecutive days with ≥ 1 review; retention: share of review-state
  cards rated Hard/Good/Easy over 30 days.

## Slice plan

contracts (`StudyState`, `Review`, `SubmitReviewInput`, `DueCards`) → `study`
module (domain scheduler + ports + Drizzle tables `study_states`, `reviews`)
using `DecksFacade` for card access → MCP `get_due_cards`, `submit_review`,
`get_stats` → web Today dashboard and review session (Space to reveal, 1–4 to
rate) → tests, including property tests that intervals never shrink on `easy`.
