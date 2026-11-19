# 0010. Clubs share decks by link; the deck stays its author's

- Status: Accepted
- Date: 2026-11-18

## Context

Spec 7 lets a club share decks with its members, and `list_clubs` (spec 9)
lists "clubs the user belongs to, with their decks". Spec 3 says a deck's
owner is "a user or a club", and spec 10 that cards in club decks remain,
credited to "former member", when their author deletes their account.
Today `decks.owner_id` is always a user, and every deck and study rule
checks that the caller owns the deck.

Two models fit the spec:

- **Club-owned decks.** `decks` gains an owner type; a club deck belongs to
  the club. Faithful to spec 3 and 10, but the decks module must then ask
  the clubs module whether a user is an owner or admin before anyone may
  add a card, while the clubs module asks the decks module for its decks'
  titles: a dependency cycle between the two modules. Until that access
  slice exists, a club deck could not receive a single card.
- **Shared by link.** The clubs module keeps a `club_decks` table linking a
  club to decks its owners and admins already own. The deck, its cards and
  its author's rights do not change.

## Decision

Clubs share decks by link, for now.

- The clubs module owns `clubs`, `club_members` (role: owner, admin,
  member) and `club_decks` (club, deck, who shared it, when). `deck_id`
  carries no foreign key into the decks module (rule 25-data).
- Owners and admins share one of their own decks
  (`POST /clubs/:clubId/decks`); a member is `FORBIDDEN`, a deck that is
  not theirs `DECK_NOT_FOUND`. Sharing again changes nothing.
- The clubs module reads decks only through `DecksFacade`
  (`getManagedDeck` to check the sharer owns it, `listDecksByIds` to show a
  club's decks to its members). Dependencies point one way: clubs → decks.
- A deck its author deletes simply stops being listed.

## Consequences

`GET /clubs` works today with real decks and card counts, and the deck's
author keeps adding cards through the usual endpoints. Not yet possible,
and the next slices of spec 7: a member reading or studying a club deck
they do not own (`get_deck`, `get_due_cards` answer `DECK_NOT_FOUND`),
admins editing another member's shared deck, and club cards outliving
their author's account. Those need the decks and study modules to know
membership; that arrives as a `ClubsFacade` consumed through a port in the
decks module (so the cycle is broken by the port, not by `forwardRef`), and
may move club decks to club ownership with a migration of `club_decks`
rows. This ADR is then superseded.

## Alternatives considered

Club-owned decks now (see Context: a dependency cycle, and club decks
nobody could fill until member access exists); copying a deck into the club
on share (two diverging copies, and card suggestions would land in neither
the author's deck nor a stable club deck).
