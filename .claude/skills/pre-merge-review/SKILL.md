---
name: 'pre-merge-review'
description: 'Use to review a diff, branch or pull request before it is committed or merged: routes the read-only reviewers by the paths touched, runs them in parallel, merges their findings into one verdict, and records blockers and majors in docs/review-findings.md.'
---

# Pre-merge review

1. Get the diff: `git diff --stat <base>...HEAD` (or the working tree) and the
   slice frame (capability, demo).
2. Route by path — always `reviewer`, plus:

   | Touched                                                                      | Add                 |
   | ---------------------------------------------------------------------------- | ------------------- |
   | `common/auth`, `app/api/v1`, `app/auth`, `apps/mcp/**/http`, env, Docker, CI | `security-reviewer` |
   | a new file, folder, module or feature group; `packages/*`                    | `structure-auditor` |
   | MCP tool names, descriptions, inputs or result text                          | `learner-advocate`  |

3. Dispatch them in parallel with the diff command, base ref and intent. They
   are read-only.
4. Merge: dedupe, keep the highest severity, drop what the linter already
   enforces. Verdict: **ship** (no blocker or major), **fix then ship**, or
   **rethink** (the approach is wrong).
5. Record every blocker and major in `docs/review-findings.md` (date, area,
   finding, fix). A finding recorded three times becomes a lint rule, a hook
   or a test.
