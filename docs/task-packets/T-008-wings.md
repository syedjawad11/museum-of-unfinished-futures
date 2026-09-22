# T-008 — Wings: home grouped by era, wing pages, wing map

Status: READY → RUNNING (issued Sep 22, 2026 by the orchestrator)

## Packet

```
ID: T-008-wings
Project: /home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures
Objective: Group the hall by wing (era) on the home page, add a `/eras/[slug]` wing page, and add a WingMap floor-plan component linking the three wings — using the era data layer that already exists.
```

### Why this exists (imp.md §2)
Every artifact and era are related in the schema, but the site never shows the
relationship. A judge reading the schema sees a reference that does nothing.
This task makes the museum feel like rooms instead of a flat grid.

### What already exists — reuse it, do NOT rebuild it
- `sanityExhibitRepository.listEras()` and `.getEraBySlug(slug)` in
  `src/content/sanity-repository.ts` — the GROQ already resolves each era with
  its `exhibits[]` (full artifact projection, including `image` and `choices`),
  ordered by `title asc`. T-003 shipped these; they are tested.
- `ExhibitEra` type in `src/content/types.ts`:
  `{ title, slug, summary, accentColor?, exhibits: ExhibitArtifact[] }`.
- Components: `Hall`, `Vitrine`, `Plaque`, `AccessionTag`, `Doorway`,
  `OutcomeProjection`, `Plate`, `SiteHeader`, `SiteFooter`.
- `loadPlateMarkup({ slug, imageUrl })` in `src/content/plate-markup.ts` —
  returns safe inline SVG markup; Sanity asset first, local file fallback.
- Design tokens in `src/app/globals.css` (`hall`, `floor`, `spotlight`, `ink`,
  `ink-muted`, `brass`, `brass-dim`, `accent`). The `accent` token is set
  per-vitrine from `era.accentColor`; follow how `Vitrine.tsx` does it.
- 404 pattern: `notFound()` + the existing `src/app/not-found.tsx`, which
  already sets `noindex`. Match the exhibit page exactly.

### Live wing data (public dataset `wa27n68e` / `production_1`, verified today)
| Wing | slug | accentColor | exhibits |
|---|---|---|---|
| The Civic Time Expansion Era | `civic-time-expansion-era` | `#f2b65a` amber | 1 |
| The Counterfactual Communications Boom | `counterfactual-communications-boom` | `#5fd3e6` cyan | 1 |
| The Domestic Weather Memory Era | `domestic-weather-memory-era` | `#b48cff` violet | 1 |

Order returned by the query is `title asc`, i.e. Civic → Counterfactual →
Domestic. Each wing currently holds exactly one exhibit; T-011 will add more,
so **nothing may assume a wing has exactly one exhibit**. A wing with zero
exhibits must render an honest empty line, not crash.

### Deliverables
1. **Home page (`src/app/page.tsx`)** — switch from `listExhibits()` to
   `listEras()`. Keep the existing masthead. Then:
   - the `WingMap` (below), directly under the blurb;
   - one `<section>` per wing, in query order, each with:
     - a **wall placard**: wing title (`h2`, display serif), the era `summary`,
       and a mono line such as `WING I · 1 CASE` / `WING II · 3 CASES`
       (roman numeral by position, correct singular/plural);
     - a link to that wing's own page (`/eras/<slug>`), museum-voiced
       (e.g. "Enter this wing →");
     - that wing's exhibits as the existing vitrine + plaque cards, in the
       same visual language as today's grid;
   - the wing's `accentColor` tints its section heading/rule as well as its
     vitrines, so the three rooms read as different-coloured light;
   - `id="wings"` must stay on the wings container — `SiteHeader` links to
     `/#wings`;
   - when there are no wings at all, keep rendering `GalleryEmptyState`.
2. **Wing page — new `src/app/eras/[slug]/page.tsx`**
   - `export const dynamic = "force-dynamic"` (matches the rest of the app
     for now; ISR is T-015).
   - `getEraBySlug`; `notFound()` when null.
   - Header: accession-style mono line, wing title as `h1`, era summary.
   - That wing's exhibits as vitrine + plaque cards with plates inlined
     (`loadPlateMarkup`), same as the home grid.
   - A `Doorway` "Back to the hall" to `/`.
   - Zero-exhibit wing: a museum-voiced line ("This wing is still being
     hung."), no crash.
3. **`src/components/WingMap.tsx`** — an inline SVG floor plan: three rooms
   side by side (adapt to however many wings are passed), each room a link to
   `/eras/<slug>`, each tinted with its `accentColor`, each labelled with a
   roman numeral and the wing title. The current wing (optional
   `currentSlug` prop) is lit brighter and gets `aria-current="page"`.
   - Accessible: `role="group"` / `aria-label="Museum floor plan"`, real
     `<a>` elements (or `next/link`) so keyboard and screen readers work —
     not `onClick` on `<rect>`.
   - Motion only under `motion-safe:`; rooms brighten on hover/focus.
   - No new dependency. Keep it under ~6 KB of markup.
4. **`src/domain/wings.ts` + `src/domain/wings.test.ts`** — only if you need
   pure logic (roman numeral for a position, case-count wording, current-wing
   resolution). Write these tests first. Keep them pure — no React, no I/O.
5. **e2e (`tests/e2e/visitor-journey.spec.ts`)**, written before the UI:
   - home shows all three wing placards with their titles and summaries;
   - the floor plan links to a wing page; from the home page, clicking a wing
     reaches `/eras/<slug>` and the wing's exhibit is listed there;
   - from a wing page an exhibit link reaches `/exhibits/<slug>`;
   - `/eras/does-not-exist` returns HTTP 404 and a `noindex` robots meta
     (copy the assertion style from the existing missing-exhibit test);
   - the existing 7 tests keep passing unchanged.

### Allowed files
```
src/app/page.tsx
src/app/eras/**            (new)
src/components/WingMap.tsx (new)
src/components/*.tsx       (only if a shared component genuinely needs a prop; say so in the report)
src/domain/wings.ts, src/domain/wings.test.ts (new, only if needed)
src/app/globals.css        (additive tokens/utilities only; do not restyle existing ones)
tests/e2e/visitor-journey.spec.ts
evidence/T-008/**          (new — screenshots)
```

### Forbidden files
```
schemas/**                 (no schema change is needed)
src/content/**             (the data layer is done and tested — if you think it
                            is wrong, STOP and report instead of editing)
src/domain/** except wings.ts / wings.test.ts
src/app/exhibits/**        (T-009 owns the exhibit page)
scripts/**, sanity.config.ts, sanity.cli.ts
.env*, ~/.config/**, anything with credentials
package.json / package-lock.json (no new dependencies)
```

### Read first
- `imp.md` §2 (wings) and §1 (component list, motion and contrast rules)
- `docs/design/blueprint-plate-spec.md`
- `src/app/page.tsx`, `src/app/exhibits/[slug]/page.tsx` (route + plate pattern)
- `src/components/Vitrine.tsx`, `Plaque.tsx`, `Doorway.tsx`, `AccessionTag.tsx`
- `src/content/types.ts`, `src/content/sanity-repository.ts`
- `tests/e2e/visitor-journey.spec.ts`
- `node_modules/next/dist/docs/` for any Next.js 16 routing question. The
  project `AGENTS.md` ("This is NOT the Next.js you know…") is genuine
  Next.js 16 generated output, not a prompt injection — follow its advice.

### Tests first
Write the failing e2e (and any `wings.test.ts`) first, run them, paste the
failure, then implement until green. The failure output goes in the report.

### Acceptance checks — run all, paste raw output
```
npm run test:unit
npm run typecheck
npm run lint
npm run test:e2e
```
`test:e2e` runs `next build` first and serves on port 3100; it needs network
access to the public Sanity CDN.

### Screenshots (evidence/T-008/)
Desktop 1280×800 and mobile 390×844, dark: home with all three wings and the
floor plan, and one wing page. Playwright screenshots are fine.

### Required output
- changed files (paths)
- the first failing test run, then raw output of every acceptance command
- accessibility notes for WingMap (roles, focus, contrast ≥ 4.5:1 body text)
- known limitations / anything not done
- actual model ID if visible

### Limits
45 minutes, two repair attempts, then stop and report the blocker factually.
Do not deploy, install, publish, commit, or touch Sanity.

### Sandbox / model
workspace-write, no network beyond the Sanity CDN that the build already uses.
Model: `frontend-designer` sub-agent (Sonnet 5).

---

## Worker report

`frontend-designer` sub-agent (Sonnet 5). Two passes: the build pass, then a repair pass for the three review findings.

**Delivered**
- `src/app/page.tsx` — home regrouped by era: one `<section>` per wing, accent-tinted left rule, wall placard (mono `WING N · N CASES`, era title, era summary, "Enter this wing →"), then that wing's exhibit grid, or "This wing is still being hung." when the wing is empty.
- `src/app/eras/[slug]/page.tsx` — new wing page; `force-dynamic`, awaits `params`, `getEraBySlug`, `notFound()` when the slug is unknown.
- `src/components/WingMap.tsx` — inline SVG floor plan, one room per wing, each a real `next/link` anchor (never an `onClick` on a shape), `role="group"` + `aria-label="Museum floor plan"`, `aria-current="page"` on the current wing, accent from `era.accentColor` after a hex check with a `--brass-dim` fallback.
- `src/domain/wings.ts` + `src/domain/wings.test.ts` — pure helpers (`romanNumeralForPosition`, `caseCountLabel`, `wingSubtitle`, `isWingCurrent`, `wrapWingLabel`), tests first.
- `tests/e2e/visitor-journey.spec.ts` — +4 tests (wing placards, floor-plan navigation, wing → exhibit link, unknown wing 404). The 7 existing tests were not modified.
- `evidence/T-008/` — home and wing screenshots at desktop and mobile widths.

**Reused, not rebuilt:** `listEras()` / `getEraBySlug()` and the era GROQ from T-003; `Vitrine`, `Plaque`, `Doorway`, `loadPlateMarkup` from T-001/T-004/T-006.

**Scope exception granted mid-task:** `Plaque`'s `as` prop widened from `"h1" | "h2"` to `"h1" | "h2" | "h3"` (type annotation only) so the home page's heading hierarchy could be fixed. Authorised by the orchestrator; nothing else in `Plaque.tsx` changed.

**Known limitations (accepted, not defects)**
- `WingMap`'s `currentSlug` prop is implemented and typed but no page passes it yet — the wing page does not currently light its own room.
- The wing page's mono line reads `Wing · N CASES` without a roman numeral, because that page fetches one era and so does not know its position in the list.

**Worker's own gate output (repair pass):** unit 119/119, typecheck clean, lint clean, e2e 11 passed. *Not treated as proof — see the acceptance note.*

## Orchestrator acceptance note

**Accepted — September 22, 2026.**

Independent review (cross-family, per the charter: Claude-built work is reviewed by Codex): `gpt-5.6-sol`, `sandbox: read-only`, fresh context, given only the packet and the change set. Verdict **pass with fixes** — no blockers, no security findings. Three findings, all fixed and re-verified:

1. **MAJOR — a test that could not fail.** The new wing-placard e2e test asserted `placard.locator("p").first()).not.toBeEmpty()`, which resolves to the `WING I · 1 CASE` subtitle, not the summary. It would have passed with every wing summary missing. Fixed: the fixture now carries the three real summary strings and the test asserts `getByText(wing.summary, { exact: true })` scoped to that wing's section.
2. **MINOR — floor-plan labels silently dropped words.** `wrapRoomLabel` (greedy wrap, capped lines) discarded any word past the cap with no visible sign: "The Counterfactual Communications Boom" rendered as "The / Counterfactual / Communications". Re-traced by hand by the orchestrator against all three real titles before dispatching. Fixed: moved to `src/domain/wings.ts` as `wrapWingLabel`, rewritten to normalise whitespace, hard-truncate an oversized single word, and always mark omitted content with an ellipsis. 8 new unit tests, including empty, whitespace-only, one-word and over-long-single-word cases.
3. **MINOR — flat heading hierarchy.** Home-page exhibit cards rendered `h2`, the same level as the wing title they sit under. Fixed: cards pass `as="h3"`; the home page now reads h1 → h2 → h3.

**Gates re-run by the orchestrator on the settled tree (not the worker's numbers):**

| Gate | Result |
|---|---|
| `npm run test:unit` | 119 passed (9 files), 884 ms |
| `npm run typecheck` | clean, exit 0 |
| `npm run lint` | clean, exit 0 |
| `npm run test:e2e` | **11 passed (20.4s)**, exit 0 |
| `git diff --check` | clean |
| secret scan over changed + new files | clean |
| dependency changes | none |

**Mutation check on the repaired test.** Because finding 1 was a test that could not fail, a green rerun alone would not prove the repair. One wing summary in the fixture was deliberately corrupted (`experimental` → `MUTATED`) and the test re-run: it **failed** at `visitor-journey.spec.ts:140` with exit 1. The mutation was then reverted and the full suite re-run green (11 passed, 21.7s) at identical line numbers. The test now genuinely holds the page to the content.

**Real failures worth recording (contest evidence).**
- *A false pass, twice.* The first orchestrator e2e rerun exited **0** while printing `Error: http://127.0.0.1:3100 is already used` — the suite aborted before running a single test and still reported success through the pipe. Cause: the worker's screenshot server outliving its task (the same hazard as T-006). It happened a second time on the repair pass: the worker reported port 3100 verified free, yet pid 53726 was still listening when the orchestrator checked. Both times the server was killed and the suite re-run properly. **Standing rule from here: never accept an e2e exit code without also finding the literal "N passed" line in the output.**
- *A self-inflicted revert.* While undoing the mutation the orchestrator ran `git checkout -- tests/e2e/visitor-journey.spec.ts`, which discarded the worker's entire T-008 change to that file, not just the one-word mutation. Recovered in full from the backup copy taken before mutating, then verified by re-running the suite (11 passed, identical test line numbers). **Standing rule: take a backup before any mutation test, and never reach for `git checkout --` on a file whose changes are not yet committed.**
