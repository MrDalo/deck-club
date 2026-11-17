# PRD handoff

Use exactly one branch after the user says the PRD is complete or exhaustive validation finds no material product decision remaining. Capture an optional permalink from any available artifact or publishing capability. Replace the single placeholder in the matching branch and add no separate summary.

## Permalink available

````markdown
### Next Steps

The PRD is complete. The next step is a Technical Design Document (TDD) that translates the product contract into an implementation design.

Start it in a new session with:

```text
$create-tdd
```

To deepen the product definition first, continue iterating on any remaining part of the solution.

---

The PRD is available at [open the completed PRD](ARTIFACT_PERMALINK).
````

## No permalink

````markdown
### Next Steps

The PRD is complete. The next step is a Technical Design Document (TDD) that translates the product contract into an implementation design.

Start it in a new session with:

```text
$create-tdd
```

To deepen the product definition first, continue iterating on any remaining part of the solution.

---

The PRD is saved at `PRD_PATH`.
````
