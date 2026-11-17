---
name: iterate-research
description: Revise an existing research artifact from feedback, comments, or refreshed codebase evidence.
disable-model-invocation: true
---

# Iterate Research

Revise one research artifact in place. Treat the artifact as a current-state technical map: feedback
changes the questions or corrects the map, and evidence determines the resulting claims.

## 1. Select exactly one research artifact

Prefer a research-document path supplied by the user. Otherwise, inspect the task artifact directory
named in the system context, or `.agent-work/tasks/<task-slug>/` when the task slug is known, with
`ls -La -- <artifact-directory>`; `-L` is required because the directory may be a symlink. Select
files whose basename matches `*research*.md` while excluding `*research-questions*.md`.

- One candidate: select it.
- Several candidates: list them, ask the user to choose, and stop before reading any candidate.
- No candidate, or no task artifact directory in context: ask the user for the research-document
  path and the feedback or additional question to address.

The artifact directory is a narrow trust boundary. Read the selected research document and only
feedback sources the user explicitly identifies; leave `ticket.md`, `task.md`, research-question
artifacts, and unrelated task files unopened.

**Complete when:** one research artifact has been selected unambiguously, or the turn has stopped on
the single missing selection required from the user.

## 2. Establish the full baseline

Read the selected document from first byte to last, including its YAML frontmatter, citations, open
questions, and any existing revision-history convention. Read every file the user directly names as
feedback in full before delegating research.

If the feedback arrives as artifact comments, asks to fetch comments, or includes a
`<comments>...</comments>` block, read [comment feedback](references/comment_feedback.md) now and
follow its input and authorization rules. If no feedback, comments, or follow-up question was
provided, ask for one focused revision request and stop.

**Complete when:** the whole artifact and every explicitly supplied feedback source have been read,
the feedback source is known, and no unrequested artifact file has been opened.

## 3. Build an exhaustive revision ledger

Split the input into atomic items and assign each one a mode:

| Mode | Required treatment |
| --- | --- |
| Editorial | Reword, restructure, or clarify without changing unsupported facts. |
| Correction or challenged claim | Re-check the affected claim against current evidence. |
| Evidence gap or follow-up question | Investigate the missing repository behavior. |
| Scope change | State the new boundary and identify every section it affects. |
| External-source refresh | Use web research only when the user explicitly requested it. |
| Comment action | Track the content change separately from any reply, resolution, or deletion. |

Record the target section, evidence needed, and intended disposition for every item. Mark ambiguous
items before research; ask only when competing interpretations would materially change the artifact.

**Complete when:** every feedback statement and every in-scope unresolved comment appears once in the
ledger, and each item has a mode, affected section, evidence need, and intended disposition.

## 4. Refresh the affected evidence

For every ledger item that can change a factual claim, read and apply
[evidence revision](references/evidence_revision.md). Editorial-only items may skip this step when
they leave meaning and citations unchanged.

Use independent read-only subagents in parallel for independent repository questions. Keep artifact
synthesis and editing in this agent. Wait for all dispatched work, reconcile overlapping findings,
and run a focused second wave only for uncovered paths or unresolved contradictions.

**Complete when:** every factual ledger item is supported, narrowed, contradicted, or explicitly left
open; every new or changed claim has traceable evidence; and all delegated work has returned and been
reconciled.

## 5. Recompose the artifact in place

Before editing, read [research document style](references/research_document_style.md). Revise the
selected path rather than creating a sibling document. Preserve the frontmatter schema, key order,
and unrelated values. When repository evidence was refreshed, update existing snapshot fields such
as `date`, `git_commit`, `branch`, or `repository` to the snapshot actually researched; add no new
frontmatter keys unless the user requested them.

Weave findings into their conceptual sections and rework affected transitions, summaries, code
references, architecture explanations, testing coverage, and open questions. Preserve useful
unaffected material. When a conclusion changed, keep provenance at the affected claim or in the
document's existing revision-history section; a newly appended changelog is not a substitute for a
cohesive document.

If authorized comment actions depend on the edit, perform them only after the artifact write
succeeds, following [comment feedback](references/comment_feedback.md).

**Complete when:** every ledger item has one visible disposition in the revised artifact or comment
thread, the artifact contains no placeholders, and the selected file is the only artifact file
created or edited.

## 6. Validate and hand off

Read the revised artifact completely. Verify all of the following:

- frontmatter parses and preserves the prior schema;
- every ledger item is accepted, partially accepted, disputed with evidence, deferred with a reason,
  or converted into a specific open question;
- every changed factual claim has a valid repository citation or external link, and cited locations
  still support the surrounding sentence;
- contradictions, version boundaries, and inference are labeled rather than silently flattened;
- takeaway headers, visuals, prose, code references, testing coverage, and open questions satisfy
  [research document style](references/research_document_style.md);
- Markdown fences and local links are balanced and resolvable, host-provided or repository permalinks contain
  no placeholder values, and the open-question count is exact;
- every authorized comment reply/state change succeeded, while unrequested comment state stayed
  unchanged.

Then read [the research handoff](references/research_final_answer.md). If any
validation check remains unresolved, render its blocked branch and do not claim
the revision is complete or offer the next workflow command. Otherwise render
the completed branch with the artifact path and any permalink the host provides.

**Complete when:** either every validation check passes and the completed
handoff reports the verified artifact location and accurate open-question
status, or the blocked handoff names every unresolved check and the evidence or
decision needed to continue.
