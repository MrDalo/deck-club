---
description: Deck Club glossary. The product specification's words are the code's words — in types, functions, files, tables, routes, tool names and UI copy. Always applied.
---

# Glossary

Use these words, exactly, in code and copy. A synonym is a bug: `flashcard`
in one file and `card` in the next means two things to the next reader.

| Word              | Means                                                                | Not                                 |
| ----------------- | -------------------------------------------------------------------- | ----------------------------------- |
| **User**          | A person with an account (Supabase user id = `userId`, JWT `sub`)    | account, member (see below), player |
| **Deck**          | A named collection of cards, owned by a user (later: a club)         | set, collection, stack              |
| **Card**          | One thing to remember: `front`, `back`, `extra`, `type`, `tags`      | flashcard, note, item               |
| **Card type**     | `basic`, `reversible`; later `cloze`, `type-in`                      | kind, mode                          |
| **Provenance**    | Who created a card: `source` (`app` / `mcp`) and the AI `clientName` | author, origin                      |
| **Study state**   | One user's FSRS schedule for one card (Phase 1, next slice)          | progress, srs data                  |
| **Review**        | One rating of one card; append-only                                  | answer, attempt                     |
| **Rating**        | `again`, `hard`, `good`, `easy`                                      | grade, score                        |
| **Due**           | A card whose study state says it should be reviewed now              | pending, scheduled                  |
| **Session**       | One sitting of reviews in the app or in chat                         | quiz, run                           |
| **Club**          | A group that studies together (Phase 2)                              | group, team, room                   |
| **Membership**    | A user's place in a club, with a role `owner`/`admin`/`member`       |                                     |
| **Suggestion**    | A proposed card for a club deck                                      | proposal, draft                     |
| **League week**   | A weekly competition inside a club                                   | season, round                       |
| **Battle**        | A live quiz built from a deck (Phase 3)                              | game, match, quiz                   |
| **AI connection** | A user's authorized MCP client                                       | integration, app, token             |
| **AI client**     | The assistant acting for the user: Claude, ChatGPT, Codex            | bot, agent (in UI copy)             |
| **Soft delete**   | `deletedAt` set; restorable for 30 days                              | archive, trash                      |

UI copy follows the same words in each language (`messages/*.json`): "deck"
is "balíček" in Slovak and Czech, "card" is "kartička".
