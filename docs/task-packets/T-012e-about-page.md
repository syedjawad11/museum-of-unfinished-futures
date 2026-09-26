# T-012e-about-page

```
ID: T-012e-about-page
Project: /home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures
Objective: Render the founder-approved colophon docs/content/about.md as the /about page ("How this museum was built") and point the footer's "Source on GitHub" link at the public repository.

Allowed files:
  src/app/about/page.tsx               (new; may include generateMetadata/metadata export)
  src/app/about/*.tsx                  (new, only if a small local component is genuinely needed)
  src/components/SiteFooter.tsx        (change the GitHub href only; keep everything else)
  tests/e2e/about.spec.ts              (new)
  evidence/T-012e/**                   (new screenshots)
Forbidden: everything else, including docs/content/about.md (the text is approved — do not edit it), src/domain/**, src/content/**, globals.css, existing e2e specs, schemas/**, .env*, package.json. No new dependencies (no markdown library). No Sanity writes. Do not commit. Do not git checkout/reset anything.

Read first:
  docs/content/about.md — the approved text. Render every heading, paragraph and bullet VERBATIM (same words, same order). Do NOT render the trailing <!-- sources ... --> HTML comment.
  src/app/layout.tsx (title template, metadataBase), src/app/eras/[slug]/page.tsx (an existing static-ish page for layout conventions), src/components/ (Hall, Plaque, etc.) and docs/design/ for tokens and the "blueprint night museum" style.
  node_modules/next/dist/docs/ — static metadata for THIS Next version (16.3.5) before writing it.

Requirements:
  - Content may be hard-coded JSX transcribed from about.md, or read and minimally parsed from about.md at build time (headings/paragraphs/bullets/inline code/the link only). Either way the words must match the file exactly.
  - Style: reads like a museum back-room placard — same palette, fonts and chrome as the rest of the site; comfortable reading width (~65ch); one <h1> ("How this museum was built"), <h2> per section; inline code in the mono font.
  - The repository URL https://github.com/syedjawad11/museum-of-unfinished-futures is a real link (opens normally, rel="noopener" if target=_blank).
  - Metadata: title "How this museum was built — Museum of Unfinished Futures" (via the existing template), a description ≤ 160 chars taken from the first paragraph of "What this is".
  - Footer: href="#" → the repository URL.
  - Accessible: headings in order, links distinguishable, readable at 390px width with no horizontal scroll.

Tests first: tests/e2e/about.spec.ts against the production build on port 3100 — /about returns 200; has the h1 and the five section h2s in order; contains one distinctive sentence from each section; contains no "{{" and no "sources"/"<!--" text; the repo link has the exact URL; the footer "Source on GitHub" link on / has the exact URL; <title> matches; no horizontal overflow at 390px (document.scrollWidth <= innerWidth). Run RED first, then GREEN. Mutation proof: break one assertion's target (e.g. change a heading), show it fails, restore.
Before any e2e run: `ss -ltnp | grep 3100` must print nothing. Trust only the literal "N passed" line; a run that says the port is in use has run nothing. Stop your server when done.
Screenshots: evidence/T-012e/about-desktop-1280.png and about-mobile-390.png (full page). READ them and fix anything clipped, cramped or ugly.

Acceptance (paste raw output): npx playwright test tests/e2e/about.spec.ts (RED then GREEN), npm run test:e2e (full suite), npm run test:unit, npm run typecheck, npm run lint, git status --short.
Required output: changed files, raw outputs, what the screenshots look like, limitations.
Limits: 45 minutes, two repair attempts. Model: sonnet (frontend-designer).
```

## Worker report
frontend-designer (Sonnet), ~20 min. New src/app/about/page.tsx (text transcribed verbatim from about.md, metadata via trimDescription), footer repo link, tests/e2e/about.spec.ts (8 tests). RED 7 failed/1 passed (the 390px check passes on the 404 page; acceptable), GREEN 8 passed, mutation (h2 text) failed as expected then restored. Side effect: full e2e rewrote evidence/T-011/screens/*.png; orchestrator restored them from git.

## Acceptance note
Sep 26, orchestrator: read the diff and the desktop screenshot (clean, matches site style, repo link correct). Re-ran: unit 197/197, typecheck ok, lint ok, e2e 69 passed (port 3100 checked free), git diff --check ok. No security/publishing surface, so no independent review required. DONE; awaiting founder OK to commit.
