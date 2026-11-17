# Walkthrough production

Use this branch only for a PR with at least 300 additions-plus-deletions **and** at least 5 changed files, or when the user explicitly requests a walkthrough. The HTML is a reviewer narrative, not a decorated file list.

## Produce the artifact

1. Copy [the walkthrough source](pr_walkthrough_example.html) to `.agent-work/tasks/{task-directory}/pr-walkthrough.html`, or `.agent-work/tasks/pr-{number}/pr-walkthrough.html` when no task directory exists. Preserve its style and renderer; replace every placeholder and the `NODES` data with evidence from the PR.

2. Write the intro as a two- or three-paragraph top-to-bottom account. Include only verified stats: meaningful before/after metrics, additions/deletions and file count, observed test results, and commit SHA.

3. Build a collapsible tree in this order:

   - problem and context;
   - operating principles that explain structural choices;
   - numbered implementation phases;
   - deliberately unchanged areas a reviewer might otherwise question;
   - verification and ship status.

   Scale the tree to the change. Every node needs a valid badge, short title, one-line summary, and enough expanded detail to explain its role. Use real before/after snippets for the most consequential changes.

4. For each `new`, `rewritten`, `modified`, or `deleted` file node:

   - set `diff` to `{PR_URL}/files#diff-{SHA256(destination_path)}` and add a verified `R{line}` or `L{line}` only when useful;
   - set `diffFile` to the exact repository-relative destination path used by the unified diff;
   - keep the `#diffs` stash empty before injection and edit only `NODES`, never generated stash content.

5. Fill the stash with [the deterministic injector](../scripts/inject-walkthrough-diffs.sh). Choose one source mode:

   ```bash
   # Existing local or remote/fork PR
   {SKILLBASE}/scripts/inject-walkthrough-diffs.sh {walkthrough} --base-dir {repo} --pr {number}

   # Checked-out branch before a PR exists
   {SKILLBASE}/scripts/inject-walkthrough-diffs.sh {walkthrough} --base-dir {repo} --range {base}...HEAD

   # Complete unified diff captured through API recovery or another trusted source
   {SKILLBASE}/scripts/inject-walkthrough-diffs.sh {walkthrough} --diff-file {captured.diff}
   ```

   Use `--max-lines N` only for an oversized generated or lockfile-style hunk; the artifact must disclose the exact elided count. In a multi-repository task, run the matching base directory and source once per walkthrough.

6. Read the script report. Resolve every missing `diffFile` by fixing the node path or diff source. Re-run freely after node edits: generated content is idempotently replaced. When the host maintains artifact copies, read at least the first line through its artifact-aware read mechanism so direct script writes synchronize, then capture the optional host permalink.

## Validate the artifact

- The document has no brace placeholders and the `PR` constant is the actual URL.
- Node order tells the implementation story; every badge is one of `step`, `why`, `principle`, `new`, `rewritten`, `modified`, `deleted`, `kept`, `verify`, or `ship`.
- Every file node has one valid GitHub diff URL, one exact `diffFile`, and one injected `data-diff`; the injection report is `N/N` with no missing paths.
- Injected hunks are flush-left, preserve diff bytes, and encode each literal closing script tag as `<\/script>` inside the stash.
- Generated sentinel markers occur exactly once; re-running the injector produces byte-identical output when the source diff is unchanged.
- Expand/collapse controls, inline diffs, external diff links, before/after pairs, and responsive layout remain functional.
- Test and ship claims reflect observed commands and actual remote state.
- Any host-maintained artifact copy contains the injected stash, not the pre-injection empty copy.

Walkthrough production is complete only when every check passes.

## Optional code-slide branch

When the PR also needs a presentation-style architecture explanation and a code-slide guide/template is installed, read that package and progress from 50,000-foot context through 25,000-foot architecture, 10,000-foot interactions, and code-level evidence. Treat slides as an additional artifact; they never replace the PR description or walkthrough.
