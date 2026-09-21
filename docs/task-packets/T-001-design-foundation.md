# T-001-design-foundation

```
ID: T-001-design-foundation
Project: /home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures
Objective: Replace the starter look with the "blueprint night museum" foundation — design tokens, self-hosted fonts, site chrome, restyled home and exhibit pages built from new components, and museum-voice not-found / error / loading pages — without changing any data shape or query.

Art direction (founder-approved): a dark museum after closing time. Near-black hall, dim floor, warm spotlight white, faint glass highlights, brass plaques. Each invention is shown as a glowing engineer's blueprint inside a spotlit glass case (the "vitrine"). Typography: Fraunces (display serif) for titles, IBM Plex Mono for labels, accession tags and blueprint annotations. Dark-only palette. Subtle motion only, all gated by prefers-reduced-motion. No 3D, no WebGL, no animation libraries, no new npm packages.

Allowed files:
  src/app/globals.css
  src/app/layout.tsx
  src/app/page.tsx
  src/app/exhibits/[slug]/page.tsx
  src/app/gallery-empty-state.tsx, src/app/gallery-empty-state.test.ts
  src/app/not-found.tsx, src/app/error.tsx, src/app/loading.tsx  (new)
  src/components/**  (new)
  src/fonts/fonts.ts  (new; the .woff2 and LICENSE files are already in src/fonts/, do not modify them)
  public/file.svg, public/globe.svg, public/next.svg, public/vercel.svg, public/window.svg  (delete these five starter files only)
  tests/e2e/visitor-journey.spec.ts  (only selector/text updates forced by the new UI; keep all 6 tests and their intent; do not delete assertions)
  evidence/T-001/  (screenshots)
Forbidden files: everything else — in particular schemas/**, src/content/**, src/domain/**, studio/**, scripts/**, sanity.config.ts, next.config.*, package.json, package-lock.json, tsconfig*, playwright.config.ts, .env*, docs/**, src/app/studio/**, src/app/favicon.ico. Another worker is editing schemas/** and src/content/** at the same time; never touch them.

Read first:
  AGENTS.md (genuine Next.js 16 notice) then node_modules/next/dist/docs/ pages for: fonts (next/font/local), metadata, not-found, error, loading, app router layout.
  src/app/layout.tsx, page.tsx, exhibits/[slug]/page.tsx, globals.css, gallery-empty-state.tsx
  src/content/types.ts (ExhibitArtifact — consume it as-is; do not depend on `choices` being exactly two; use .map)
  tests/e2e/visitor-journey.spec.ts

Requirements:
  1. Tokens in globals.css (Tailwind 4 @theme): --hall (near-black, e.g. #07090d), --floor, --spotlight (warm white), --glass, --brass, --brass-dim, --ink (body text, ≥ 4.5:1 on --hall), --ink-muted (still ≥ 4.5:1), --accent (default wing light; amber #f2b65a-ish; expose --accent as a CSS var so a later task can set it per wing), plus font vars from next/font/local (--font-display = Fraunces variable, --font-mono = IBM Plex Mono 400/500 + 400 italic). Remove the light/dark media query; the museum is dark-only. Body background must be --hall.
  2. src/fonts/fonts.ts: export `display` and `mono` via next/font/local pointing at ../fonts/*.woff2 with `display: "swap"` and CSS variables; apply both variables on <html> in layout.tsx.
  3. Components in src/components/ (server components unless client is required; keep each small):
     - Hall: page wrapper drawing the room — floor perspective grid (CSS gradients or one inline SVG), a soft light beam, vignette. Pure CSS; no canvas in this task.
     - SiteHeader: museum name (display font) linking to "/", nav placeholders "Wings" (href "/#wings") and "Your ticket" (href "/your-future", may 404 for now — that is expected), all keyboard-focusable.
     - SiteFooter: "How this museum was built" (href "/about", may 404 for now), repo placeholder text "Source on GitHub" (href "#"), and "Sanity project wa27n68e · dataset production_1" in mono.
     - Vitrine: a glass case with a light cone; props: `title`, `plate?: ReactNode`, `label: string` (artifactLabel), `description: string` (visualDescription → role="img" aria-label as today), `accent?: string`. When `plate` is absent render a placeholder "blueprint sheet": faint grid, a title block in mono reading "PLATE PENDING · {title}", and the artifactLabel text set in Fraunces italic. A later task will pass a real SVG plate as `plate`.
     - Plaque: brass wall label; props: `accessionNote`, `title`, `summary`, `children` (for the choice list).
     - AccessionTag: small mono tag, e.g. "ACC. · DO NOT TOUCH" built from `accessionNote`; keep it honest — no invented numbers beyond the note.
     - Doorway: a lit exit link, props `href`, `label`; used for "Back to the hall".
     - OutcomeProjection: the outcome panel; keeps the three states that exist today (awaiting choice / outcome / choice unavailable); shows with a soft projector flicker-in (CSS keyframes, disabled under prefers-reduced-motion).
  4. Home (page.tsx): museum name in display type over the hall, one-line blurb, then the exhibits as a grid of spotlit vitrines (Vitrine placeholder + Plaque). Keep an <h1> with the exact text "Museum of Unfinished Futures" and an <h2> per exhibit with the exact title; each card is one link whose accessible name contains the title (the e2e tests rely on this). Keep GalleryEmptyState behaviour (restyle it; keep its test passing or update the test to the new copy).
  5. Exhibit page: two-column on desktop, stacked on mobile — Vitrine on one side, Plaque with the choices on the other, OutcomeProjection below the choices, Doorway "Back to the hall" (update the e2e test from "Back to gallery" accordingly). Keep: <h1> = exhibit title, choice links with exact labels and the same href pattern `?choice=<id>`, aria-current on the selected choice, "Linked outcome" / "Choice unavailable" / "No linked outcome exists." strings (or update the e2e test consistently), aria-live region, outcome title as a heading. Replace "Select one of the two choices" with wording that does not assume two.
  6. not-found.tsx: museum voice ("This exhibit was never finished." + a short line + Doorway back to the hall), drawn in the same style. error.tsx (client component): "The lights went out in this wing." with a retry button calling reset(). loading.tsx: a blueprint sheet outline with a slow drawing animation (stroke-dashoffset), static under reduced motion. The missing-exhibit route must still return HTTP 404 with a noindex robots meta (Next does this for notFound(); verify with the existing e2e test).
  7. Motion (CSS only, every animation wrapped in @media (prefers-reduced-motion: no-preference)): spotlight brightens on card hover/focus, plate glow breathes slowly (~6 s), outcome flicker-in (~400 ms), doorway glow on hover.
  8. Accessibility: all text ≥ 4.5:1 against its background (state the pairs you used and their ratios in the report), visible focus rings, semantic landmarks (header/main/footer/nav), no information conveyed by colour alone.
  9. Delete the five starter SVGs listed above. Do not add images or fonts other than the ones present in src/fonts/.
  10. Layout metadata: set `metadataBase` to new URL("https://museum-of-unfinished-futures.netlify.app") and keep title/description; per-exhibit generateMetadata is a later task — do not add it here.

Tests first: before styling, update tests/e2e/visitor-journey.spec.ts for any string you intend to change (e.g. "Back to the hall"), run `npm run test:e2e` once to see it fail for that reason, then implement. Keep the unit test for gallery-empty-state green (update copy assertions if you change the copy).

Acceptance checks (run all, paste raw output in the report):
  npm run test:unit
  npm run typecheck
  npm run lint
  npm run test:e2e            (this builds first; it must pass 6/6)
  git status --short          (must list only allowed files)
  Screenshots: with `NODE_OPTIONS=--no-experimental-webstorage npm run start -- --hostname 127.0.0.1 --port 3100` running in the background after the build, capture
    npx playwright screenshot --viewport-size=1280,900 http://127.0.0.1:3100/ evidence/T-001/home-desktop.png
    npx playwright screenshot --viewport-size=390,844 http://127.0.0.1:3100/ evidence/T-001/home-mobile.png
    npx playwright screenshot --viewport-size=1280,900 "http://127.0.0.1:3100/exhibits/extra-mondays-vending-machine?choice=spend-a-plan" evidence/T-001/exhibit-desktop.png
    npx playwright screenshot --viewport-size=1280,900 http://127.0.0.1:3100/exhibits/does-not-exist evidence/T-001/not-found.png
  then stop the server.

Required output:
  - Status: done | partial | blocked
  - Changed files (paths), deleted files
  - Raw output of every acceptance command
  - Contrast pairs used (foreground/background/ratio)
  - Known limitations / anything not done
  - Actual model ID if visible
Limits: 45 minutes of focused work, two repair attempts on a failing gate, then stop and report the blocker honestly. Do not widen scope (no wing map, no OG images, no schema or query changes, no new packages).
Sandbox/permissions: workspace-write inside the project; no installs, deploys, credentials, network calls, or public actions. Do not run `npm run build` more than the e2e run needs; another worker runs unit tests concurrently, which is fine.
Model: sonnet (frontend-designer)
```

## Worker report
(run 1 — interrupted) The frontend-designer agent was stopped by the founder at ~17:15 on Sep 21 when the Claude session quota reached ~3%. No report was returned. Work left in the tree: `src/fonts/fonts.ts`, all eight components in `src/components/`, restyled `layout.tsx`/`page.tsx`/`exhibits/[slug]/page.tsx`/`gallery-empty-state.tsx`/`globals.css`, new `not-found.tsx`/`error.tsx`/`loading.tsx`, starter SVGs deleted from `public/`, e2e text updated to "Back to the hall". No `evidence/T-001/` screenshots, no contrast table.

## Orchestrator acceptance
(run 1 — not accepted; resume needed) Orchestrator gates over the interrupted tree (19:13, Sep 21): unit 36/36, typecheck clean, lint clean, build passed, **e2e 5/6** — `missing exhibit returns a noindex 404` fails: `/exhibits/does-not-exist` now returns HTTP 200. Root cause: the new root `src/app/loading.tsx` makes the exhibit route stream a shell before `notFound()` runs, so the status is locked at 200 (Next 16 docs, `loading.md` › Status codes). Decision: drop the root `loading.tsx` — a real 404 (already part of the release evidence) matters more than a sub-second loading animation. Resume packet: T-001b below.

