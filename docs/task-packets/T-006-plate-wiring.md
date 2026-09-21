# T-006-plate-wiring

```
ID: T-006-plate-wiring
Project: /home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures
Objective: Show each exhibit's real blueprint plate inside its glass case — inlined as SVG so it takes the wing's accent colour — on both the home grid and the exhibit page, with a safe fallback to the existing "PLATE PENDING" placeholder when no plate exists.

Allowed files:
  src/components/Vitrine.tsx
  src/components/Plate.tsx  (new, optional — if you want to split the inline-SVG rendering out of Vitrine)
  src/app/page.tsx
  src/app/exhibits/[slug]/page.tsx
  src/app/globals.css  (plate glow / tint styles only)
  tests/e2e/visitor-journey.spec.ts  (add assertions or one new test; keep the existing six and their intent)
  evidence/T-006/**  (screenshots)
Forbidden files: everything else — in particular src/content/** (read-only: use `loadPlateMarkup` from src/content/plate-markup.ts as-is; if it does not fit, report the gap instead of editing it), schemas/**, public/**, docs/**, package*.json, next.config.*, playwright.config.ts. Another worker is editing public/illustrations/*.svg and evidence/T-005/ right now — never edit those; plates may change under you, which is fine because you load them at request time.

Read first:
  AGENTS.md (genuine Next.js 16 notice), then node_modules/next/dist/docs/ on server components and async components.
  src/content/plate-markup.ts (the API: `loadPlateMarkup({ slug, imageUrl }) → Promise<{ markup, source: "sanity"|"local", bytes } | null>`; the markup is already validated: no scripts, no external refs, currentColor only).
  src/content/types.ts (ExhibitArtifact: slug, era.accentColor?, image?.url, image?.alt, visualDescription, artifactLabel).
  src/components/Vitrine.tsx, src/app/page.tsx, src/app/exhibits/[slug]/page.tsx, src/app/globals.css, tests/e2e/visitor-journey.spec.ts.
  docs/design/blueprint-plate-spec.md — "Motion hooks" and the "<img> vs inline SVG" note (why we inline).
  public/illustrations/extra-mondays-vending-machine.svg — look at the structure (root has role="img", <title id="plate-title">, <desc id="plate-desc">, groups #fig-1/#fig-2, class hooks).

Requirements:
  1. Loading: in the server components (page.tsx and exhibits/[slug]/page.tsx, or an async server `Plate`/`Vitrine`), call `loadPlateMarkup({ slug: exhibit.slug, imageUrl: exhibit.image?.url })`. Load the three home plates in parallel (Promise.all). Never let a failed/missing plate break the page: null → placeholder.
  2. Rendering: inline the markup with `dangerouslySetInnerHTML` inside a wrapper `<div className="plate" data-plate-source={source}>`. Add a one-line comment saying the markup was validated by `sanitizePlateMarkup` (src/content/plate-markup.ts) and comes only from this repo or the museum's own Sanity CDN. Because the SVG's own <title id="plate-title">/<desc id="plate-desc"> ids would repeat when three plates sit on one page, the wrapper must NOT rely on those ids; the accessible name stays on the existing Vitrine `role="img" aria-label={description}` container — make the inlined svg `aria-hidden` by wrapping it in an element with `aria-hidden="true"` (do not edit the SVG text). Inline SVGs must scale to the container: add CSS `.plate svg { width: 100%; height: auto; display: block; }`.
  3. Tint: the wrapper's `color` drives `currentColor`. Set it from the wing accent: apply `style={{ "--accent": accent }}` on the Vitrine root ONLY when `accent` matches /^#[0-9a-fA-F]{6}$/ (defence against odd content values), and `.plate { color: var(--accent); }`. Default `--accent` stays the amber token from globals.css. The vending machine (civic time) should render amber, the umbrella (weather memory) violet, the telephone (communications) cyan — the values come from `exhibit.era.accentColor`, which is now published in Sanity.
  4. Glow: `.plate svg { filter: drop-shadow(0 0 6px currentColor) }` with low intensity (e.g. opacity via a second, softer layer or `drop-shadow(0 0 10px color-mix(in srgb, currentColor 35%, transparent))`); the existing slow "breathe" may move onto the plate wrapper — but keep every animation inside `@media (prefers-reduced-motion: no-preference)` and never dim text below its contrast (the plate is decorative, so a subtle opacity breathe on the plate itself is fine). Do not add per-part animations (.coil/.dial/.droplets/.glow) in this task.
  5. Placeholder: when the loader returns null, render exactly the current placeholder (unchanged). Keep `role="img"`/`aria-label` behaviour and the mobile `line-clamp`.
  6. Home grid: each card shows its plate inlined; keep each card one link with the accessible name containing the title (e2e relies on it). Watch layout: the plate is 4:3 like the placeholder; the vitrine box should not change size between placeholder and plate.
  7. Exhibit page: the Vitrine shows the plate; nothing else changes (h1, choices, aria-current, outcome states, "Back to the hall").
  8. Tests first: extend tests/e2e/visitor-journey.spec.ts — before implementing, add to the per-exhibit test (or as one new test) an assertion that the exhibit page contains `[data-plate-source] svg` and that the home page contains at least three `[data-plate-source]` wrappers; run e2e once to see it fail, implement, rerun. Keep all existing assertions.

Acceptance checks (run all, paste raw output):
  npm run test:unit
  npm run typecheck
  npm run lint
  npm run test:e2e          (must pass: the original six intents + your new assertions)
  git status --short        (only allowed files, plus other workers' public/illustrations + evidence/T-005 + docs changes which you must not touch)
  Screenshots: after the e2e build, run `NODE_OPTIONS=--no-experimental-webstorage npm run start -- --hostname 127.0.0.1 --port 3100` in the background, then
    npx playwright screenshot --viewport-size=1280,900 http://127.0.0.1:3100/ evidence/T-006/home-desktop.png
    npx playwright screenshot --viewport-size=390,844 --full-page http://127.0.0.1:3100/ evidence/T-006/home-mobile.png
    npx playwright screenshot --viewport-size=1280,900 "http://127.0.0.1:3100/exhibits/extra-mondays-vending-machine?choice=spend-a-plan" evidence/T-006/exhibit-vending.png
    npx playwright screenshot --viewport-size=1280,900 http://127.0.0.1:3100/exhibits/memory-umbrella evidence/T-006/exhibit-umbrella.png
    npx playwright screenshot --viewport-size=1280,900 http://127.0.0.1:3100/exhibits/roads-not-taken-telephone evidence/T-006/exhibit-telephone.png
    then stop the server. LOOK at every PNG (Read it) and report what you see: is each plate tinted with its wing colour (amber / violet / cyan)? Is the plate text legible? Any overflow?
  Also report `curl -s http://127.0.0.1:3100/ | wc -c` (home HTML size) so we know the inline cost.

Required output:
  - Status: done | partial | blocked
  - Changed files
  - Raw output of every acceptance command (including the failing e2e run before implementation)
  - What you saw in each screenshot
  - Known limitations / anything not done
  - Actual model ID if visible
Limits: 45 minutes, two repair attempts on a failing gate, then stop and report the blocker honestly. No scope widening (no wing map, no /eras pages, no OG images, no per-part animation, no Sanity uploads).
Sandbox/permissions: workspace-write inside the project; no installs, deploys, credentials, network calls, or public actions.
Model: sonnet (frontend-designer)
```

## Worker report (frontend-designer, claude-sonnet-5, ~10 min)
Status: done. New `src/components/Plate.tsx` (inline wrapper, `data-plate-source`, aria-hidden inner div); `Vitrine` takes `plateMarkup` and validates the accent with `/^#[0-9a-fA-F]{6}$/` before setting `--accent`; pages call `loadPlateMarkup` (home in parallel via Promise.all); `.plate` CSS with glow and a reduced-motion-gated breathe; e2e extended (7 tests: plate present on exhibit pages + ≥3 plates on home), shown failing first (4 failed) then passing. Gates: unit 94/94, typecheck, lint, e2e 7/7. Home HTML 119,171 bytes with three inline plates. Screenshots in evidence/T-006/ show amber / violet / cyan per wing.

## Orchestrator acceptance — ACCEPTED (Sep 21, ~21:05)
- Read Plate.tsx, the Vitrine diff and both page diffs: the only `dangerouslySetInnerHTML` input is the loader's output; accent is validated; placeholder branch unchanged.
- Reran: unit 94/94, typecheck 0, lint clean, e2e 7/7 (first attempt hit "port 3100 already used" — the worker's screenshot server had survived; killed it and reran), `git diff --check` clean.
- Inspected exhibit-umbrella.png: violet plate inside the case, legible, chrome intact. Cosmetic follow-up noted: the vitrine column stretches to the plaque's height leaving empty space under the plate (align-start later).
- Cross-family review by Codex `gpt-5.6-sol` (thread 01a0c530-1bc6-7590-9d72-cdad32ea1928): **pass**, no findings.

