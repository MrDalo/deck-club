# Deck Club: Product Specification

Nov 17, 2026

> Source of truth for what the product does (rule `00-core`). Tech stack and
> branding are recorded separately: `docs/architecture.md`, `docs/adr/`,
> `brand/README.md`. Section numbers are referenced from code, rules and
> skills as "spec N".

## 1. Overview

Deck Club is a free, open-source flashcard app. People learn alone with spaced repetition and together in clubs, and any MCP-capable AI assistant (Claude, ChatGPT, Codex) can create cards and run study sessions on the user's behalf.

### Problem

- Writing good flashcards is slow, so most people stop after a few days.
- AI assistants are great at making cards and explaining things, but what they produce disappears with the chat. They don't know what you already know or when you should review it.
- Flashcard apps are solo tools. Study groups end up with everyone keeping separate, duplicated decks.

### Goals

- **G1 Retention:** Help people remember things long term, using a proven spaced repetition scheduler (FSRS).
- **G2 Zero AI cost:** The app never calls an LLM itself. All AI features run through the app's MCP server, using the user's own AI subscription.
- **G3 Learning together:** Clubs share decks, see each other's progress and play quick live battles.
- **G4 Free and open:** MIT-licensed, self-hostable, with full import and export of user data.
- **G5 Quality:** Accessible, well tested and documented, good enough to serve as a reference project.

### Non-goals

- No built-in AI features, API keys or token billing.
- No paid tiers, ads or third-party tracking.
- No native mobile apps in v1. The web app is responsive and installable as a PWA.
- Not a note-taking or course-authoring platform.

### Product principles

- **The app owns the schedule and the data; the AI is a guest.** The AI reads and writes through the same rules and validation as the UI.
- **Parity:** Anything the AI can do, a person can also do by hand in the UI.
- **Fast daily habit:** A typical daily review takes a few minutes and works well on a phone.
- **Private by default:** Decks, stats and club activity are private until the user chooses to share.

## 2. Target users and use cases

The first audience is self-learners and small study groups who already use an AI assistant daily.

| Persona        | Who they are                                                         | What they need from Deck Club                                                            |
| -------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Solo learner   | Learning a language or a hobby topic in their free time              | Cards made for them from articles or notes, a short daily review, a streak               |
| Student        | Preparing for an exam with classmates                                | Turn lecture notes into cards, share one deck with the group, practice before the exam   |
| Club organizer | Runs a Discord, a class, a language meetup or a team                 | A shared deck, light moderation, a weekly league and live battles                        |
| Developer      | Learning a framework, API or codebase, often in Claude Code or Codex | Save "things worth remembering" from coding sessions as cards without leaving the editor |

### Key use cases

1. "Make 30 cards from this article and add them to my Spanish deck." The AI creates them through MCP and the user sees them in the app.
2. "Quiz me on what's due today." The AI pulls due cards, asks the questions in chat, grades the answers and records the reviews.
3. A user reviews their due cards on the phone at the bus stop, with no AI involved.
4. A study group shares one deck. Each member keeps their own schedule, and the group sees a weekly leaderboard.
5. On a Friday call, a club host starts a 10-question live battle from the club deck. Members join with a code.
6. A user imports their old Anki or CSV deck, and can export everything at any time.

## 3. Core concepts and domain model

A card's content belongs to its deck, but its review schedule belongs to each user who studies it. That split is what lets a club share one deck while every member learns at their own pace.

| Concept         | What it is                         | Key fields and rules                                                                                                                   |
| --------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| User            | A person with an account           | Display name, time zone, day start hour, language, privacy settings                                                                    |
| Deck            | A named collection of cards        | Owner (a user or a club), title, description, language, tags, visibility (private, unlisted, public), license for public decks         |
| Card            | One thing to remember              | Type, front, back, optional extra (explanation, example, source link), tags, provenance (created by a person or an AI client), version |
| Card type       | How the card is shown              | Basic (front to back), Reversible (both directions), Cloze (fill in the gap), Type-in (user types the answer)                          |
| Study state     | One user's schedule for one card   | FSRS state (new, learning, review, relearning), due date, stability, difficulty, lapses, suspended flag                                |
| Review          | One answer to one card             | User, card, rating (Again, Hard, Good, Easy), time taken, source (app, MCP, battle), timestamp. Append-only.                           |
| Club            | A group that studies together      | Name, description, invite code, member limit, visibility (private or public listing)                                                   |
| Membership      | A user's place in a club           | Role (owner, admin, member), joined date, show-on-leaderboard flag                                                                     |
| Card suggestion | A proposed card for a club deck    | Proposed by a member or their AI, status (pending, accepted, rejected), reviewer                                                       |
| League week     | A weekly competition inside a club | Week range, points per member, final ranking                                                                                           |
| Battle          | A live quiz session from a deck    | Host, deck, settings, join code, status (lobby, running, finished), players, rounds, scores                                            |
| AI connection   | A user's authorized MCP client     | Client name, granted scopes, created and last-used dates, revocable                                                                    |

### Rules that hold everywhere

- Editing a card keeps everyone's study state. Only a change of card type resets it.
- Deleting is soft for 30 days, so mistakes (human or AI) can be undone.
- Every write records who made it: the user directly, or the user through a named AI client.

## 4. Main user flows

The two flows that define the product are the daily review and creating cards through an AI assistant. Everything else supports them.

### 4.1 First run

1. The user signs up and picks a language, a time zone and a daily new-card limit (with sensible defaults).
2. An empty dashboard offers three ways to start: create a deck, import a deck, or connect an AI assistant.
3. The "Connect your AI" screen shows the MCP server URL and short steps for Claude, ChatGPT and Codex.

### 4.2 Create cards by hand

1. The user creates a deck: title, language, optional description and tags.
2. They add cards in a fast editor: type the front, press Tab, type the back, press Enter for the next card.
3. A live preview shows how the card will look during review.

### 4.3 Create cards through an AI assistant

1. In their assistant, the user asks for something like "Make 20 cards from this PDF for my Biology deck."
2. The AI calls `list_decks`, then `add_cards` with the new cards.
3. The server validates the cards, flags likely duplicates, saves them and returns a summary plus a link to the deck.
4. In the app, the new cards show an "Added by Claude" badge and can be edited or removed in bulk.

### 4.4 Daily review in the app

1. The dashboard shows today's count: due reviews and new cards, per deck and in total.
2. The user starts a session. A card shows its front; they reveal the answer with a tap or Space.
3. They rate it: Again, Hard, Good or Easy (keys 1 to 4). Each button shows when the card will come back.
4. The session ends with a short summary: cards done, accuracy, time spent, and the streak.
5. Undo is available for the last rating.

### 4.5 Study in chat through an AI assistant

1. The user says "Quiz me on my due Spanish cards."
2. The AI calls `get_due_cards` and asks the questions one by one in chat.
3. The user answers in their own words. The AI judges the answer, explains mistakes and calls `submit_review` with a rating.
4. These reviews update the same schedule as reviews in the app.

### 4.6 Clubs

1. A user creates a club and shares an invite link or code.
2. The owner adds or creates shared club decks. Members study them with their own schedules.
3. Members (or their AI) suggest new cards. Admins accept or reject them.
4. Every week, the club league ranks members by study points.

### 4.7 Live battle

1. A host picks a deck and settings, and gets a join code and a link.
2. Players join on their phones, including guests with just a nickname.
3. The host starts the battle. Everyone answers the same question against a timer, and a scoreboard appears after each round.
4. The final results screen shows the winner and the cards most people got wrong.

### 4.8 Leaving with your data

1. Settings allow export of all decks, cards and review history.
2. Account deletion removes all personal data. Cards in club decks remain, credited to "former member".

## 5. App components and screens

The product has four entry points (web app, MCP server, realtime battles, background jobs), and all of them go through one shared core. Business rules live only in the core, so the UI and the AI can never behave differently.

The SRS engine should be a standalone, pure package with no I/O, so it can be unit tested exhaustively and reused by every entry point.

| Screen            | Purpose               | Main elements                                                                               |
| ----------------- | --------------------- | ------------------------------------------------------------------------------------------- |
| Today (dashboard) | Start the daily habit | Due and new counts per deck, Start review button, streak, club activity snippet             |
| Deck library      | Find and manage decks | Personal and club decks, search, tags, create and import buttons                            |
| Deck page         | Work with one deck    | Card list with search and filters, bulk actions, AI-added badge, deck stats, share settings |
| Card editor       | Write cards fast      | Card type picker, front, back, extra, tags, live preview, keyboard-first entry              |
| Review session    | Study due cards       | Card display, reveal, four rating buttons with next-interval hints, progress bar, undo      |
| Session summary   | Close the loop        | Cards done, accuracy, time, streak, Continue or Done                                        |
| Stats             | Show progress         | Reviews per day, retention, upcoming workload, heatmap, per-deck breakdown                  |
| Import and export | Move data in and out  | Anki, CSV and JSON import with preview and field mapping; full export                       |
| Club home         | The group's space     | Members, shared decks, this week's league, pending suggestions, Start battle                |
| Club suggestions  | Review proposed cards | Suggested cards with author (person or AI), accept, edit, reject                            |
| League            | Weekly ranking        | Ranked members, points, last week's winner                                                  |
| Battle host       | Run a live battle     | Settings, join code and QR, player list, start, next question, scoreboard                   |
| Battle player     | Play on a phone       | Nickname, question, answer options or input, timer, own score                               |
| Public deck page  | Share a deck          | Title, description, sample cards, license, Copy to my decks                                 |
| Settings          | Account and data      | Profile, review settings, AI connections (list and revoke), export, delete account          |
| Connect your AI   | Onboard MCP           | Server URL, copy button, steps for Claude, ChatGPT and Codex, example prompts               |

## 6. Spaced repetition and review logic

Scheduling uses FSRS through a maintained open-source implementation, never a home-made algorithm. Every review, from the app, the MCP server or a battle, goes through the same engine.

### Scheduling rules

- **Card states:** New, Learning, Review, Relearning, plus a Suspended flag that hides the card from sessions.
- **Ratings:** Again, Hard, Good, Easy. The review screen shows the next interval for each before the user picks.
- **Desired retention:** Default 0.90, adjustable per user between 0.80 and 0.97.
- **Daily limits per deck:** New cards default 20, reviews default 200. Both editable. Limits apply to the app and to the MCP server alike.
- **Day boundary:** The user's local time at a configurable hour (default 4:00), so late-night study counts for the right day.
- **Siblings:** The two directions of a reversible card are never shown on the same day.
- **Undo:** The last rating in a session can be undone, restoring the exact previous state.

### Session order

1. Learning and relearning cards whose short step is due.
2. Due review cards, most overdue first.
3. New cards, up to the daily limit, in the order they were added.

### Review sources

| Source | How the rating is decided                                                                      | Counts for streak and league |
| ------ | ---------------------------------------------------------------------------------------------- | ---------------------------- |
| App    | The user picks a rating                                                                        | Yes                          |
| MCP    | The AI picks a rating based on the user's answer; the user can always say "mark that as Again" | Yes                          |
| Battle | Correct = Good, wrong or timeout = Again; only for logged-in players who opt in                | Yes, if opted in             |

### Stats definitions

- **Streak:** Consecutive days with at least one completed review, in the user's day boundary.
- **Retention:** Share of review-state cards rated Hard, Good or Easy over the last 30 days.
- **Workload forecast:** Number of reviews due on each of the next 30 days.

## 7. Clubs: groups, shared decks, leagues

A club is a small private group (up to 100 members in v1) that shares decks and studies them together, each member on their own schedule.

### Membership and roles

| Action                                  | Owner | Admin | Member                  |
| --------------------------------------- | ----- | ----- | ----------------------- |
| Study club decks                        | Yes   | Yes   | Yes                     |
| Suggest cards                           | Yes   | Yes   | Yes                     |
| Add or edit cards directly              | Yes   | Yes   | No                      |
| Accept or reject suggestions            | Yes   | Yes   | No                      |
| Start a battle                          | Yes   | Yes   | Optional, owner setting |
| Invite and remove members               | Yes   | Yes   | No                      |
| Change roles, rename or delete the club | Yes   | No    | No                      |

- Joining works through an invite link or a 6-character code. The owner can reset the code at any time.
- A member can leave at any time. Their study history stays with them.

### Shared decks

- A club deck belongs to the club, not to a person. Owners and admins edit it directly.
- Members can copy a club deck into their personal library as an independent deck.
- Edits to a card's wording reach every member without resetting their study state (see section 3).

### Card suggestions

- Members suggest cards from the UI or through their AI (`suggest_club_cards`).
- Suggestions wait in a queue with their author and provenance, for example "Jana via Claude".
- Admins accept, edit then accept, or reject. Accepted cards appear for all members as new cards.
- Simple duplicate detection warns when a suggestion is very close to an existing card.

### Weekly league

- Weeks run Monday to Sunday in the club's time zone.
- Points: 1 per completed review, 2 per new card learned, plus a 10-point bonus for each day the member clears all due cards. Battle wins add 5.
- The leaderboard shows rank, display name and points only, never the cards or answers.
- Members can hide themselves from the leaderboard and still take part in the club.
- At week end a job freezes the ranking, stores the winner and starts a new week.

## 8. Live Battle mode

A battle is a 5 to 10 minute live quiz built from an existing deck, for up to 30 players on their phones. It is the social hook: one host brings the whole group into the app at once.

### Settings (host)

| Setting             | Options                                        | Default              |
| ------------------- | ---------------------------------------------- | -------------------- |
| Deck                | Any personal or club deck the host can study   | Required             |
| Number of questions | 5, 10, 15, 20                                  | 10                   |
| Card selection      | Random, hardest for this group, recently added | Random               |
| Answer format       | Multiple choice, type-in                       | Multiple choice      |
| Time per question   | 10, 20, 30 seconds                             | 20                   |
| Who can join        | Club members only, anyone with the code        | Anyone with the code |

### How a battle runs

1. **Lobby:** The host sees a join code, a link and a QR code. Players join with an account or as a guest with a nickname.
2. **Question:** Everyone sees the same card front at the same moment. The timer starts.
3. **Answer:** Multiple choice shows four options. Wrong options are backs of other cards from the same deck. Type-in answers are checked case-insensitively, ignoring accents and extra spaces.
4. **Reveal:** The correct answer and the card's extra text appear, then the round scoreboard.
5. **Finish:** The final ranking, plus "the 3 cards the group struggled with most", with a one-click "add to my review" for logged-in players.

### Scoring

- A correct answer earns 500 to 1000 points: faster answers earn more, scaled linearly over the time limit.
- A wrong answer or a timeout earns 0.
- A streak of 3 or more correct answers in a row adds 100 per question.

### Rules

- The server is the source of truth for the timer and scores; clients only display them.
- A player who disconnects can rejoin with the same nickname and keeps their score.
- The host can skip a question, remove a player, or end the battle early.
- Guest data (nickname, score) is deleted 24 hours after the battle ends.
- Battle results feed the SRS only for logged-in players who opted in (see section 6).

## 9. MCP server

The MCP server is the product's AI layer. It lets a user's own assistant create cards, run study sessions and work with clubs on their behalf, at no AI cost to the project. It is a first-class client of the core, with the same validation, limits and permissions as the web app.

### Connection and auth

- Remote server over Streamable HTTP at a single public URL, so it works in claude.ai, Claude Desktop, Claude Code, ChatGPT and Codex without local installs.
- OAuth 2.1 with the standard MCP authorization flow. The user signs in to Deck Club and approves the requested scopes.
- Scopes: `decks:read`, `decks:write`, `study` (read due cards, submit reviews), `clubs` (read clubs, suggest cards, start battles).
- Every connection appears in Settings > AI connections with its client name and last use, and can be revoked in one click.

### Tools

| Tool                 | What it does                                                         | Scope       | Notes                                                            |
| -------------------- | -------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------- |
| `list_decks`         | Lists the user's personal and club decks with card and due counts    | decks:read  |                                                                  |
| `get_deck`           | Returns deck details and a page of cards                             | decks:read  | Paginated                                                        |
| `search_cards`       | Full-text search across the user's cards                             | decks:read  | Used to avoid duplicates                                         |
| `create_deck`        | Creates a personal deck                                              | decks:write |                                                                  |
| `add_cards`          | Adds up to 100 cards to a deck in one call                           | decks:write | Returns created, skipped as duplicate, and invalid, with reasons |
| `update_card`        | Edits a card's content or tags                                       | decks:write | Keeps study state                                                |
| `delete_cards`       | Soft-deletes cards                                                   | decks:write | Tool description tells the AI to confirm with the user first     |
| `get_due_cards`      | Returns the next due cards for a deck or all decks, fronts and backs | study       | Respects daily limits                                            |
| `submit_review`      | Records a rating for one card                                        | study       | Returns the next due date                                        |
| `get_stats`          | Streak, today's progress, retention, weak cards                      | study       |                                                                  |
| `list_clubs`         | Clubs the user belongs to, with their decks                          | clubs       |                                                                  |
| `suggest_club_cards` | Sends card suggestions to a club's queue                             | clubs       | Admins may add directly                                          |
| `create_battle`      | Creates a battle lobby and returns the join link and code            | clubs       |                                                                  |

### Prompts

The server also publishes ready-made prompts the user can pick in their assistant:

- **Make cards from this:** Turn pasted text, a file or a link into well-formed cards, following good card-writing rules (one fact per card, short answers, cloze for definitions).
- **Quiz me:** Run a due-card session in chat, judge free-form answers fairly, explain mistakes, and submit a rating for each card.
- **Find my weak spots:** Use stats and review history to explain what the user keeps forgetting and suggest better cards.

### Behavior rules

- Tool descriptions are written for the AI: they say when to use the tool, what good input looks like, and what to confirm with the user.
- All writes are validated by the core: text length limits, allowed card types, no HTML or script content, deck access.
- Writes accept an idempotency key, so a retried call never creates duplicate cards.
- Every card or review created through MCP stores the client name as provenance.
- Rate limits per user: 60 tool calls per minute and 2,000 new cards per day.
- Errors return a short, human-readable message the AI can relay, plus a machine code.
- No tool exposes another user's personal data. Club tools return only what a member could see in the UI.

## 10. Accounts, privacy, moderation, import and export

Users own their data: everything is private by default, exportable at any time, and deletable for good.

### Accounts

- Sign in with an email magic link, Google or GitHub. No passwords to store.
- Guests can play battles with a nickname but cannot keep decks or history.
- Profile: display name, avatar, language, time zone, day start hour.

### Privacy

- Decks are private by default. Sharing options: unlisted (anyone with the link can view and copy) or public (listed in a public gallery).
- Public decks carry a license chosen by the author, default CC BY 4.0.
- No ads and no third-party tracking. Only privacy-friendly, cookieless usage analytics.
- The privacy page explains in plain language that card content sent through MCP is processed by the user's own AI provider, under that provider's terms.

### Moderation

- Report buttons on public decks, club content and battle nicknames.
- Club owners and admins can remove cards, suggestions and members.
- Reported public decks are hidden from the gallery until reviewed by the project maintainer.
- A simple blocklist filters offensive nicknames in battles.

### Import

| Format               | What is kept                                                         |
| -------------------- | -------------------------------------------------------------------- |
| Anki package (.apkg) | Basic, reversed and cloze notes, tags, decks; media in a later phase |
| CSV or TSV           | Front, back, extra and tags, with a column-mapping step and preview  |
| Deck Club JSON       | Everything, including study state and review history                 |

### Export

- CSV for any deck.
- Full account export as JSON: decks, cards, study states, reviews, club memberships.
- Anki-compatible export in a later phase.

### Account deletion

- Deletes the profile, personal decks, study states and reviews after a 7-day grace period.
- Cards the user added to club decks stay, credited to "former member".

## 11. Non-functional requirements

The app must stay free to run, fast on a phone, accessible, and safe for others to self-host.

| Area               | Requirement                                                                                                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cost               | Runs on free tiers of common hosting and database providers at small scale. No paid third-party APIs, and no LLM calls from the server.                                                 |
| Performance        | Review screen interactive within 2 seconds on a mid-range phone over 4G. Rating a card shows the next one in under 150 ms.                                                              |
| Battle latency     | Players see a new question within 500 ms of the host advancing.                                                                                                                         |
| Accessibility      | WCAG 2.2 AA. The whole review flow works with a keyboard (Space to reveal, 1 to 4 to rate) and a screen reader. Respects reduced motion.                                                |
| Responsive and PWA | Mobile-first layouts. Installable as a PWA. Offline review is out of scope for v1.                                                                                                      |
| Languages          | English first. All UI text externalized so Slovak and Czech can follow. Card content may be in any language, including right-to-left scripts.                                           |
| Security           | Server-side authorization on every request and tool call. Card content rendered as sanitized text or limited Markdown, never raw HTML. Secrets only in environment variables.           |
| Reliability        | Reviews are never lost: writes are confirmed before the next card shows, with a retry queue if a request fails.                                                                         |
| Testing            | Unit tests for the SRS engine and all core rules, integration tests for the API and every MCP tool, end-to-end tests for the main flows in section 4, and an accessibility check in CI. |
| Observability      | Structured logs and error tracking, with no card content in logs. A simple health endpoint.                                                                                             |
| Open source        | MIT license, clear README, contributing guide, architecture overview, self-hosting guide, and seed data for local development.                                                          |

## 12. MVP scope, phases and out of scope

Build in four phases, each shippable on its own. The MVP is a solo learner with an AI assistant: if that loop isn't good, clubs and battles won't save it.

### Phase 1: MVP, solo learning plus MCP

- Accounts (magic link plus one OAuth provider), profile and review settings.
- Decks and cards: Basic and Reversible types, card editor, deck page, search, tags.
- SRS engine with the review session, session summary, undo and the Today dashboard.
- MCP server with OAuth and these tools: `list_decks`, `get_deck`, `search_cards`, `create_deck`, `add_cards`, `update_card`, `get_due_cards`, `submit_review`, `get_stats`.
- Connect your AI screen and AI connections in Settings.
- CSV import and export, full JSON export, account deletion.
- **Done when:** A user can connect Claude, create 50 cards from an article in one prompt, review them in the app and in chat, and the schedules match.

### Phase 2: Clubs and leagues

- Clubs, invites, roles, shared club decks, copy to personal library.
- Card suggestions with review queue, plus `list_clubs` and `suggest_club_cards`.
- Weekly league with the end-of-week job.
- Cloze and Type-in card types, and the Stats screen.
- **Done when:** A group of 5 can share one deck, suggest cards through their AI, and see a correct weekly ranking.

### Phase 3: Live battles

- Realtime service, battle host and player screens, guest join, scoring, results.
- `create_battle` tool, and opt-in battle results feeding the SRS.
- **Done when:** 30 simulated players finish a 10-question battle with no desynced scores.

### Phase 4: Sharing and polish

- Public deck gallery with licenses and reporting.
- Anki import, then Anki-compatible export.
- MCP prompts (Make cards, Quiz me, Find my weak spots) and `delete_cards`.
- Slovak and Czech UI translations, PWA install and reminders.

### Out of scope for now

- Any built-in AI features or paid API usage.
- Native iOS or Android apps, and offline review.
- Images, audio and other media on cards (planned after Phase 4).
- Monetization, paid tiers, ads.
- Public social features beyond clubs: follows, comments, direct messages.
- An FSRS parameter optimizer per user (possible later, since review logs are stored).

## 13. Success metrics and open questions

Success means people come back to review, and a meaningful share of cards arrive through an AI assistant.

| Metric                                | Why it matters                               | First target                             |
| ------------------------------------- | -------------------------------------------- | ---------------------------------------- |
| Day-7 return rate                     | Shows whether the daily habit forms          | 30% of new users review on day 7         |
| Share of cards created via MCP        | Shows the AI layer is useful, not decoration | 40% of new cards                         |
| Reviews per active user per week      | Depth of real learning                       | 50                                       |
| Users with an AI connection           | Adoption of the core differentiator          | 50% of active users                      |
| Clubs with 3+ active members          | Shows the social layer works                 | 20 clubs after Phase 2                   |
| GitHub stars and outside contributors | Health as an open-source project             | 5 outside contributors in the first year |

### Open questions

- [x] Final product name and branding — working name **Deck Club**, brand in `brand/README.md`.
- [x] Tech stack and hosting — see `docs/architecture.md` and `docs/adr/`. Realtime service for battles still open.
- [ ] Which FSRS library to use, and whether it handles all card states needed here (proposed: `ts-fsrs`).
- [ ] Should members be allowed to start battles by default, or only owners and admins?
- [ ] Should the public deck gallery launch in Phase 4, or wait until moderation is proven?
- [ ] Is an MCP Apps UI (interactive review cards rendered inside the chat) worth adding after Phase 4?
- [ ] Which languages to translate after Slovak and Czech?
