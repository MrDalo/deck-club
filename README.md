# Deck Club

A free, open-source flashcard app. Learn alone with spaced repetition, learn
together in clubs, and let your own AI assistant (Claude, ChatGPT, Codex) make
the cards through Deck Club's MCP server. Deck Club never calls an AI itself
and has no paid tier.

> Status: **Phase 1** — decks and cards in the web app and the API, the
> spaced repetition API, and the MCP server (SDK v2, Supabase OAuth 2.1,
> health). `list_decks`, `get_deck`, `search_cards` and `create_deck` work
> end to end and render your library, your decks, your search results and
> new decks inside the chat; the other MCP tools are published interfaces
> that are not built yet.
> See [docs/roadmap.md](docs/roadmap.md).

## What is in the box

| Path                 | What                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------- |
| `apps/web`           | Next.js 16 app: magic-link sign-in, deck library, card editor, Connect your AI (en, sk, cs)   |
| `apps/api`           | NestJS core API: modular monolith of hexagonal modules, SQLite via Drizzle + libSQL           |
| `apps/mcp`           | NestJS MCP server (SDK v2, stateless Streamable HTTP, OAuth 2.1 via Supabase, MCP Apps views) |
| `packages/contracts` | Zod schemas and types shared by all three                                                     |
| `packages/ui`        | Component library: shadcn/ui primitives in branded components, pastel theme, Storybook        |
| `packages/config`    | ESLint, Prettier, TypeScript and Vitest presets                                               |

Architecture: [docs/architecture.md](docs/architecture.md), the MCP server:
[docs/mcp-server.md](docs/mcp-server.md). Product:
[docs/product-spec.md](docs/product-spec.md).

## Quick start

Requirements: Node 22.12 or newer, pnpm 10 (`corepack enable`), a free
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
- MCP: http://localhost:4100/mcp (readiness: http://localhost:4100/health/ready)

### With Docker

```bash
docker compose --env-file .env up -d --build
```

The three services share the private `deck-club-private` network. Only the
web app (3000) and the MCP server (4100) are published; the API is reachable
only from them. SQLite lives on the `api-data` volume.

## Connect your AI

The MCP server is an OAuth 2.1 resource server and Supabase Auth is its
authorization server, so MCP clients discover sign-in on their own:

```bash
claude mcp add --transport http deck-club http://localhost:4100/mcp
```

For that flow, enable the OAuth 2.1 server in your Supabase project
(Authentication → OAuth Server, with dynamic client registration); the
steps are in [docs/mcp-server.md](docs/mcp-server.md#supabase-setup). The
consent page Supabase redirects to is not built yet, so until it is, sign in,
open **Connect your AI**, copy the access token (valid one hour) and pass it
yourself:

```bash
claude mcp add --transport http deck-club http://localhost:4100/mcp --header "Authorization: Bearer TOKEN"
```

Then ask: "What decks do I have?", "Show me my Spanish deck", "Do I already
have a card about mitosis?", "Make me a deck for my biology exam", "Add 10
cards about cell division to it", "Fix the answer on the mitosis card",
"Delete the cards about meiosis", "Quiz me on what is due today" or "How
am I doing?" — `list_decks`, `get_deck`, `search_cards`, `create_deck`,
`add_cards`, `update_card`, `delete_cards`, `get_due_cards`,
`submit_review` and `get_stats` answer, and a host
that supports MCP Apps (Claude, ChatGPT, VS Code…) draws the result in the
chat.
The other tools, prompts and resources are listed but answer
`NOT_IMPLEMENTED` until their slice is built.

## Development

| Task                    | Command                             |
| ----------------------- | ----------------------------------- |
| Type-check              | `pnpm typecheck`                    |
| Lint (zero warnings)    | `pnpm lint`                         |
| Format                  | `pnpm format` / `pnpm format:check` |
| Dead code               | `pnpm deadcode`                     |
| Tests                   | `pnpm test`                         |
| Build                   | `pnpm build`                        |
| Storybook (packages/ui) | `pnpm storybook`                    |
| New DB migration        | `pnpm db:generate`                  |

Every feature ships with unit tests; the full checklist is
[docs/definition-of-done.md](docs/definition-of-done.md). Contributing:
[CONTRIBUTING.md](CONTRIBUTING.md).

This repository is set up for [Claude Code](https://claude.com/claude-code):
`CLAUDE.md` indexes the rules (`.claude/rules`), agents (`.claude/agents`),
skills (`.claude/skills`) and hooks.

## Licence

See [LICENSE](LICENSE).
