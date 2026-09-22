# T-009b — chained outcomes: cycle-safe walk UI

**Worker:** Codex `gpt-5.5` via the `codex` MCP tool
**Sandbox:** `workspace-write`, `approval-policy: never`, `cwd` = `/home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures`
**Limit:** 45 minutes, two repair attempts, then stop and report the blocker factually.

## Objective
Surface an outcome's consequence tags and its "Continue to →" link on the exhibit page, with a cycle guard, so three dead ends become a walk — tests first.

## Why this exists
`outcome.consequenceTags` and `outcome.leadsTo` exist in the schema (T-003), are projected by `artifactProjection`, validated by `sanity-transform.ts` and typed in `src/content/types.ts`. **Nothing in `src/app` or `src/components` reads either field.** This task is the missing UI plus the safety logic around it.

## Read these first — reuse, do NOT rebuild
- `src/content/types.ts` — `consequenceTags: string[]` and the optional `leadsTo { title, slug }` already exist on the resolved outcome.
- `src/content/sanity-repository.ts` lines 38–55 — the projection already resolves `leadsTo->{ title, "slug": slug.current }` **one level deep only**. Do not deepen it.
- `src/content/sanity-transform.ts` lines 20–80 — `consequenceTags` already defaults to `[]`; `leadsTo` is already optional.
- `src/app/exhibits/[slug]/page.tsx` — where the chosen outcome renders today.
- `src/components/Plaque.tsx`, `src/components/Doorway.tsx` — existing components and their `as` prop convention. Reuse the design tokens (`--accent`, `--brass`, `--ink-muted`); invent no new colours.
- `src/domain/wings.ts` — the house style for a pure, unit-tested domain module. Follow it.

## Critical constraint: the live dataset is empty on both fields
All six live outcomes currently return `consequenceTags: null` and `leadsTo: null`. The content lands separately (T-009a, then a founder-approved publish). Therefore:
- **Absence is the normal case, not an error.** No tags → render no tag strip, no empty container, no placeholder. No `leadsTo` → render no "Continue to" affordance. The page must look deliberate in both states.
- Your Playwright run will see the *empty* state. That is expected. **Do not add an e2e test that asserts a chain link exists** — it would fail today and is scheduled as T-009c after the content publishes. The existing 11 e2e tests must stay green.

## Deliverables
1. **`src/domain/outcome-chain.ts` + `src/domain/outcome-chain.test.ts` — tests first.** Pure, no React, no I/O:
   - `nextStep(outcome, currentArtifactSlug)` → the onward step, or `null`. Returns `null` when `leadsTo` is missing **and** when `leadsTo.slug === currentArtifactSlug` (an outcome that points back at its own exhibit is a content mistake; refuse to render a link that goes nowhere new).
   - `visitedTrail(trail, nextSlug)` → the cycle guard for a multi-step walk: given the slugs already visited, decide whether the next step continues the walk or closes the loop, and say which. Longer cycles (A → B → C → A) are legitimate content, so this must **detect and label** a loop, never crash and never recurse without bound.
   - `formatConsequenceTag(tag)` → display form for a `lowercase-hyphenated` tag (e.g. `borrowed-time` → `Borrowed time`). Handles empty string, a single word, and leading/trailing hyphens without throwing.
   - Test the real tag shapes and all three live artifact slugs, plus: no tags, one tag, four tags, missing `leadsTo`, self-referential `leadsTo`, a two-step loop and a three-step loop.
2. **A consequence-tag strip** on the exhibit page, shown only when the chosen outcome has tags. Mono, uppercase, `--brass`, wrapping on narrow screens. Not a heading. Not a link.
3. **"Continue to → {title}"** on the exhibit page when `nextStep` returns a step: a real `next/link` anchor to `/exhibits/{slug}`, styled as a doorway consistent with the existing `Doorway`. It must be reachable by keyboard and carry an accessible name that includes the destination title.
4. Both must degrade to nothing when the fields are absent, with no layout jump.

## Allowed files
`src/domain/outcome-chain.ts`, `src/domain/outcome-chain.test.ts`, `src/app/exhibits/[slug]/page.tsx`, and **at most one** new component under `src/components/` if the exhibit page would otherwise get unwieldy.

## Forbidden
`schemas/**`, `src/content/**`, `scripts/**`, `docs/content/**`, `tests/e2e/**`, `src/app/page.tsx`, `src/app/eras/**`, `src/components/WingMap.tsx`, `src/domain/wings.ts`, `.env*`, `package.json`, `package-lock.json`. Add no dependencies. Do not deploy, publish, touch Sanity, or commit.

## Acceptance commands — paste raw output for each
```
npm run test:unit      # expect the 119 existing tests plus yours, all passing
npm run typecheck
npm run lint
npm run test:e2e       # expect exactly "11 passed"; see the port note below
```
**Port note.** A previous worker's server has twice outlived its task and held port 3100, causing `test:e2e` to abort before running a single test *while still exiting 0*. Before your e2e run, confirm the port is free (`ss -ltnp | grep 3100` → no output) and kill anything holding it. Afterwards, confirm the literal text `11 passed` appears in the output — **do not report success from the exit code alone.**

## Required output
- changed files (paths)
- the first failing test run (RED) before the implementation, then raw output of every acceptance command
- how the cycle guard behaves on a three-step loop, in one sentence
- accessibility notes for the "Continue to" link
- known limitations / anything not done
- actual model ID if visible
