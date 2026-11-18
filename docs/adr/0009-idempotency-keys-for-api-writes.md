# 0009. Idempotency keys for API writes, in the shared kernel

- Status: Accepted
- Date: 2026-11-18

## Context

Spec 9: "Writes accept an idempotency key, so a retried call never creates
duplicate cards." AI clients retry: the MCP server times out after 10 s and
the model may call a tool again, and a write that happened but whose answer
was lost would then run twice (a batch of cards added twice, a review
recorded twice). The contracts already publish `IdempotencyKeySchema` on the
`add_cards` and `suggest_club_cards` tools; the API had no support.

## Decision

- **The header.** Writes take an optional `Idempotency-Key` header (the IETF
  httpapi draft), validated with `IdempotencyKeySchema`; an invalid one is
  `VALIDATION_FAILED` naming the header. Routes opt in with `@Idempotent()`:
  `POST /decks`, `POST /decks/:id/cards`, `POST /decks/:id/cards/batch`,
  `POST /study/reviews` and `POST /study/reviews/undo`. `PATCH` and `DELETE`
  already have the same effect when repeated.
- **Semantics.** Keys are per user. The first request claims the key, runs,
  and stores its response; the same request sent again gets that response,
  with `Idempotent-Replayed: true`, and writes nothing. The same key with a
  different request (method, URL or body, compared by a SHA-256
  fingerprint) is `IDEMPOTENCY_KEY_REUSED` (422); the same request while the
  first still runs is `IDEMPOTENCY_KEY_IN_USE` (409). A failed request is
  not stored: its key is released, so the client can retry or correct it.
- **Storage.** One `idempotency_keys` table, primary key (user, key). A claim
  is `INSERT … ON CONFLICT DO NOTHING`, so SQLite decides which of two
  racing requests runs. Keys are forgotten after 24 hours (purged per user
  on the next claim); a claim whose request never finished is taken over
  after 60 seconds.
- **Where it lives.** `apps/api/src/common/idempotency/`, the shared kernel,
  like auth: it is an HTTP protocol concern every module's writes use, not a
  business context, and holds no business data. Its table sits next to its
  adapter; `drizzle.config.ts` collects `src/common/*/*.schema.ts` too.

## Consequences

Any write can be made safe to retry with one decorator, and clients that
send no key behave exactly as before. The response is stored next to the
write rather than in the same transaction, so if the process dies between
the two, the key counts as abandoned after a minute and a retry runs the
write again: rare, and the price of keeping use cases unaware of
idempotency. Stored responses (up to ~600 kB for a 100-card batch) live for
a day. The web forwarder and the MCP server do not send the header yet.

## Alternatives considered

A body field (every input schema would change, and the key is about the
request, not the resource); the key and response written in the use case's
own transaction (exactly-once even across a crash, but every repository
port and use case would carry it); an in-memory cache (lost on restart,
wrong with more than one process); storing failed responses as Stripe does
(a client could not fix a refused batch without a new key).
