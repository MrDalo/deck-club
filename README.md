# Deck Club

A free, open-source flashcard app. Learn alone with spaced repetition, learn
together in clubs, and let your own AI assistant (Claude, ChatGPT, Codex) make
the cards through Deck Club's MCP server. Deck Club never calls an AI itself
and has no paid tier.

> Status: **Phase 0 (foundation)** — decks and cards in the web app, the API
> and over MCP. Spaced repetition is the next slice. See
> [docs/roadmap.md](docs/roadmap.md).

## What is in the box

| Path                 | What                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `apps/web`           | Next.js 16 app: magic-link sign-in, deck library, card editor, Connect your AI (en, sk, cs) |
| `apps/api`           | NestJS core API: modular monolith of hexagonal modules, SQLite via Drizzle + libSQL         |
| `apps/mcp`           | NestJS MCP server (Streamable HTTP): `list_decks`, `get_deck`, `create_deck`, `add_cards`   |
| `packages/contracts` | Zod schemas and types shared by all three                                                   |
| `packages/config`    | ESLint, Prettier, TypeScript and Vitest presets                                             |

Architecture: [docs/architecture.md](docs/architecture.md). Product:
[docs/product-spec.md](docs/product-spec.md).

## Quick start

Requirements: Node 24, pnpm 10 (`corepack enable`), a free
[Supabase](https://supabase.com) project for sign-in.

```bash
pnpm install
```

```bash
cp .env.example .env
```

Fill in `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from your Supabase project (Project
Settings → API). In Supabase → Authentication → URL Configuration, set the
Site URL to `http://localhost:3000` and add `http://localhost:3000/**` to the
redirect URLs.

```bash
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/health
- MCP: http://localhost:4100/mcp

### With Docker

```bash
docker compose --env-file .env up -d --build
```

The three services share the private `deck-club-private` network. Only the
web app (3000) and the MCP server (4100) are published; the API is reachable
only from them. SQLite lives on the `api-data` volume.

## Connect your AI

Sign in, open **Connect your AI**, copy the access token, then for Claude
Code:

```bash
claude mcp add --transport http deck-club http://localhost:4100/mcp --header "Authorization: Bearer TOKEN"
```

Then ask: "Make 10 cards about the French Revolution in a new deck." The
token is temporary (one hour) until the OAuth flow lands.

## Development

| Task                 | Command                             |
| -------------------- | ----------------------------------- |
| Type-check           | `pnpm typecheck`                    |
| Lint (zero warnings) | `pnpm lint`                         |
| Format               | `pnpm format` / `pnpm format:check` |
| Dead code            | `pnpm deadcode`                     |
| Tests                | `pnpm test`                         |
| Build                | `pnpm build`                        |
| New DB migration     | `pnpm db:generate`                  |

Every feature ships with unit tests; the full checklist is
[docs/definition-of-done.md](docs/definition-of-done.md). Contributing:
[CONTRIBUTING.md](CONTRIBUTING.md).

This repository is set up for [Claude Code](https://claude.com/claude-code):
`CLAUDE.md` indexes the rules (`.claude/rules`), agents (`.claude/agents`),
skills (`.claude/skills`) and hooks.

## Licence

See [LICENSE](LICENSE).
