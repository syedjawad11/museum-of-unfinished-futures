# T-001b-design-foundation-resume

```
ID: T-001b-design-foundation-resume
Project: /home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures
Objective: Finish T-001 (design foundation) from the partial work already in the tree — restore the real HTTP 404 for missing exhibits, self-review the visual polish, capture the evidence screenshots, and write the T-001 worker report.

Context: a previous run of T-001 was interrupted before it could report. Its work is already in the working tree (uncommitted): src/fonts/fonts.ts, eight components in src/components/, restyled src/app/{layout,page,gallery-empty-state}.tsx, src/app/exhibits/[slug]/page.tsx, globals.css, new not-found.tsx / error.tsx / loading.tsx, starter SVGs deleted, e2e text "Back to the hall". Build on it; do NOT start over and do NOT rewrite files that already meet the T-001 requirements. Unit, typecheck, lint and build already pass. e2e is 5/6.

Read first:
  docs/task-packets/T-001-design-foundation.md  (the full original requirements — all of them still apply; sections 1–10)
  node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md  (section "Status codes")
  src/app/loading.tsx, src/app/exhibits/[slug]/page.tsx, src/app/globals.css, src/components/*.tsx, tests/e2e/visitor-journey.spec.ts
  Run `git diff --stat` and `git status --short` first to see exactly what the previous run changed.

Known failure to fix (do this first):
  `npm run test:e2e` → "missing exhibit returns a noindex 404" fails: /exhibits/does-not-exist returns HTTP 200. Cause: the root src/app/loading.tsx starts streaming a shell before notFound() runs in the exhibit page, so Next cannot set a 404 status (documented in loading.md › Status codes). Fix: delete src/app/loading.tsx (decision already taken by the orchestrator — a real 404 matters more than a sub-second loading animation). If you want to keep the "drafting the plate" animation for later, leave its CSS keyframes in globals.css only if they are still referenced; otherwise remove dead CSS. Do not add a proxy/middleware. Re-run e2e; it must be 6/6.

Then:
  1. Self-review the pages against T-001 requirements 1–8 (tokens, fonts on <html>, Hall/SiteHeader/SiteFooter/Vitrine/Plaque/AccessionTag/Doorway/OutcomeProjection present and used, home grid, exhibit two-column, motion gated by prefers-reduced-motion, focus rings, landmarks). Fix only real gaps; do not restyle for taste.
  2. Confirm requirement 10 (metadataBase = https://museum-of-unfinished-futures.netlify.app in layout.tsx).
  3. Compute and list contrast ratios for every text/background pair actually used (--ink, --ink-muted, --brass, --accent, --spotlight on --hall / --floor / plaque background). Anything below 4.5:1 for body/label text must be adjusted in globals.css.
  4. Capture the evidence screenshots (commands below) into evidence/T-001/ and look at each one (Read the PNG) — report anything visibly broken (overlaps, clipped text, invisible text, unstyled fallback fonts).

Allowed files: exactly the T-001 allowed list — src/app/globals.css, src/app/layout.tsx, src/app/page.tsx, src/app/exhibits/[slug]/page.tsx, src/app/gallery-empty-state.tsx, src/app/gallery-empty-state.test.ts, src/app/not-found.tsx, src/app/error.tsx, src/app/loading.tsx (delete), src/components/**, src/fonts/fonts.ts, tests/e2e/visitor-journey.spec.ts (text/selector only; keep all 6 tests), evidence/T-001/**.
Forbidden files: everything else — schemas/**, src/content/**, src/domain/**, studio/**, scripts/**, sanity.config.ts, next.config.*, package*.json, tsconfig*, playwright.config.ts, .env*, docs/**, src/app/studio/**, public/** (the five starter SVG deletions already happened; do not touch public/illustrations/). No new npm packages. No network calls.

Acceptance checks (run all, paste raw output in the report):
  npm run test:unit
  npm run typecheck
  npm run lint
  npm run test:e2e            (must pass 6/6)
  git status --short          (must list only allowed files plus the pre-existing changes from other tasks: schemas/**, src/content/**, src/domain/**, docs/**, imp.md, public/illustrations/, evidence/T-002/ — do not touch those)
  Screenshots: after the e2e run (which builds), start `NODE_OPTIONS=--no-experimental-webstorage npm run start -- --hostname 127.0.0.1 --port 3100` in the background, then
    npx playwright screenshot --viewport-size=1280,900 http://127.0.0.1:3100/ evidence/T-001/home-desktop.png
    npx playwright screenshot --viewport-size=390,844 --full-page http://127.0.0.1:3100/ evidence/T-001/home-mobile.png
    npx playwright screenshot --viewport-size=1280,900 "http://127.0.0.1:3100/exhibits/extra-mondays-vending-machine?choice=spend-a-plan" evidence/T-001/exhibit-desktop.png
    npx playwright screenshot --viewport-size=1280,900 http://127.0.0.1:3100/exhibits/does-not-exist evidence/T-001/not-found.png
    curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3100/exhibits/does-not-exist   (must print 404)
  then stop the server (kill the background process).

Required output (this becomes the T-001 worker report):
  - Status: done | partial | blocked
  - Changed files in this run; full list of files changed/added/deleted by T-001 overall (from git status)
  - Raw output of every acceptance command
  - Contrast pairs used (foreground / background / ratio)
  - What you saw in each screenshot (one line each)
  - Known limitations / anything from T-001 requirements 1–10 not done
  - Actual model ID if visible
Limits: 30 minutes, two repair attempts on a failing gate, then stop and report the blocker honestly. No scope widening (no wing map, no OG images, no per-exhibit metadata, no real plate wiring — those are later tasks).
Sandbox/permissions: workspace-write inside the project; no installs, deploys, credentials, network calls, or public actions. You are the only worker in the tree right now.
Model: sonnet (frontend-designer)
```

## Worker report (frontend-designer, claude-sonnet-5, ~7 min)
Status: done. Deleted `src/app/loading.tsx` (root loading boundary streamed a 200 before `notFound()`); removed the dead `.blueprint-frame` / `draw-plate` CSS it alone used. Gates: unit 36/36, typecheck clean, lint clean, e2e 6/6, `curl /exhibits/does-not-exist` → 404. Screenshots in `evidence/T-001/` (home-desktop, home-mobile, exhibit-desktop, not-found). Contrast table: ink/hall 15.59:1, ink-muted/hall 9.28:1, brass/hall 8.31:1, spotlight/hall 17.40:1, accent/hall 11.02:1 (all pairs ≥ 8:1 on --floor as well). Self-review of T-001 requirements 1–10: all present except loading.tsx (dropped by decision). Known limitation reported honestly: on narrow viewports the Vitrine placeholder's italic description is clipped by the 4:3 box.

## Orchestrator acceptance (Sep 21, ~19:35)
- Orchestrator reran all gates on the tree: unit 36/36, typecheck 0 errors, lint clean, e2e 6/6, `git diff --check` clean, secret grep clean. Looked at all four screenshots: desktop home and exhibit pages read as the intended night museum; mobile clipping confirmed (cosmetic).
- Independent cross-family review by Codex `gpt-5.6-sol` (read-only, thread 01a0c504-331f-7f23-8229-5896c788cb1f): **fail → fixes required, no blockers.** Major: (a) `animate-plate-glow` fades the whole placeholder so `text-ink-muted` falls to ~3.4:1 at the dim keyframe; (b) `transition` utilities in SiteHeader/SiteFooter/Doorway/page/exhibit page/error.tsx are not gated by prefers-reduced-motion. Minor: heading order h1→h3 on the exhibit page; selected choice conveyed by colour only. Everything else checked clean (6 e2e intents intact, hrefs, strings, server/client boundaries, fonts, metadataBase, no hex outside tokens, no invented content, no secrets). Reviewer's `npm run test:unit` could not run in the read-only sandbox (Vitest writes a temp config) — orchestrator's own run covers it.
- Follow-up T-001c sent to the same designer: the four review findings + the mobile clipping. T-001 stays in REVIEW until T-001c passes.


## T-001c — reviewer fixes (same designer, ~7 min) and final acceptance (Sep 21, ~19:50)
Worker: moved the breathing glow onto a separate aria-hidden layer (text stays full-contrast); every `transition` now `motion-safe:`; added visible h2 "Choose a trace"; selected choice shows "●" + "SELECTED" tag (aria-hidden, since aria-current already announces it); `line-clamp-4` on the placeholder description. Worker gates: unit 36/36, typecheck, lint, e2e 6/6, curl 404; four screenshots retaken.
Orchestrator: grep confirms zero unguarded `transition` utilities in src/app + src/components; read Vitrine.tsx; reran unit 36/36, typecheck 0, lint clean, e2e 6/6, `git diff --check` clean; inspected exhibit-desktop.png (h2 present, selected marker visible). All four Codex findings and the mobile clipping are resolved. **T-001 ACCEPTED — DONE.** Awaiting founder approval to commit T-001 + T-002 + T-003 together.
