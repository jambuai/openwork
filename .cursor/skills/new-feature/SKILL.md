---
name: new-feature
description: >-
  Starts shippable work from free-form input: feature intent, slash commands,
  comments, issue/PR links, URLs, or pasted specs. Creates a git branch,
  implements within scope, and adds a Changesets file so the change joins the
  automated release (CHANGELOG + npm + GitHub Release). Use when the user
  invokes /new-feature or new-feature followed by any context they provide.
---

# New feature (branch + Changesets)

## Input shape

The user may pass **anything after** `new-feature` / `/new-feature`: a one-liner, a bullet list, a command to run, `#123`, URLs, design notes, acceptance criteria, or “see thread X”. Treat that blob as the **source of truth for scope and naming**, not only a title.

- **Parse first:** extract goals, constraints, file paths, tickets, and explicit “out of scope”.
- **If contradictory or too thin to branch safely:** one clarifying question, then continue.
- **References:** open linked issues/docs when useful; if unreachable, proceed from pasted excerpts only.

## When this applies

Use for **work that should appear in the next release** (features, fixes, breaking changes). For **no-release** edits only (docs-only, internal refactors with zero user impact), skip a changeset or use `bunx changeset --empty` if Changesets still complains locally.

If the idea needs design exploration first, use the **brainstorming** skill, then return here.

## Package name

Changeset frontmatter must use the npm name from `package.json`:

`@jambulab/openwork`

## Workflow (execute in order)

1. **Branch**
   - `git fetch origin` and base off current `main`.
   - Create `feat/<slug>`: **kebab-case** ASCII from the strongest short label in the user’s input (issues: `feat/issue-123-short-topic`; max ~48 chars).

2. **Implement**
   - Follow existing project patterns; honor references and commands from the input unless they conflict with the repo — then stop and ask.

3. **Changeset (required before the PR is merge-ready)**
   - **TTY:** `bunx changeset`.
   - **Agent / non-interactive:** create `.changeset/<slug>.md`:

```markdown
---
"@jambulab/openwork": minor
---

<User-facing summary; imperative/neutral; reflects the input intent>
```

   - **Bump:** `minor` default for new capability; `patch` fix; `major` breaking CLI/API for consumers.

4. **Validate**
   - `bun run build` when runtime code or packaging is touched.
   - `CI=true bunx changeset status` exits **0**.

5. **Commit**
   - Same PR: code + `.changeset/*.md`.

## Release linkage

Merging to `main` runs `.github/workflows/release.yml` (Version packages PR → merge → `npm publish` + GitHub Release). Do **not** hand-bump `package.json` or tag for normal releases.

## Checklist

```
- [ ] Parsed user input (commands / references / comments)
- [ ] Branch feat/<slug> from up-to-date main
- [ ] Implementation scoped to input
- [ ] .changeset/<slug>.md (correct bump + changelog line)
- [ ] CI=true bunx changeset status + build/smoke as needed
```
