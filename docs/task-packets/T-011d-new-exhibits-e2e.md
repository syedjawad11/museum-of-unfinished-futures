# T-011d-new-exhibits-e2e

```
ID: T-011d-new-exhibits-e2e
Project: /home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures
Objective: Prove in the browser that the three new exhibits (live in Sanity since Sep 23) work end to end, and capture screenshots for the orchestrator to read.

Allowed files:
  tests/e2e/new-exhibits.spec.ts   (new)
  evidence/T-011/screens/**        (new PNGs)
Forbidden: everything else, including tests/e2e/visitor-journey.spec.ts, src/**, schemas/**, scripts/**, docs/**, .env*. No Sanity writes. Do not commit.

Read first: docs/content/new-exhibits.json (titles, slugs, choice labels, outcome titles, leadsTo, rewires, newTagPhrases); tests/e2e/visitor-journey.spec.ts (style, helpers, how trace threading works); playwright.config.ts (port 3100, production build).

Before any e2e run: `ss -ltnp | grep 3100` must print nothing. Never trust the exit code — confirm the literal "N passed" line and that N includes your new tests.

Tests (tests first: run them once with a deliberately wrong expected title to show RED, then fix to GREEN):
  1. Home lists all six exhibits; each wing shows exactly two.
  2. Each new exhibit page (/exhibits/future-self-toaster, /exhibits/unfinished-conversations-switchboard, /exhibits/weather-of-visits-kettle) renders its title, its plate served from Sanity (data-plate-source="sanity"), and exactly its number of choices — the switchboard shows THREE.
  3. Every new choice shows its outcome title and a "Continue to <title>" link to the planned artifact (all 7 new outcomes).
  4. The three rewired doors: "A missed call arrives from you" → Toaster, "The machine keeps humming" → Kettle, "The room rains back" → Switchboard.
  5. A walk through a new exhibit then /your-future renders at least one of the new tag phrases from newTagPhrases, and the page contains no "undefined", no doubled words like "carries carrying".
  6. The wing page for each era lists its two exhibits.
Mutation proof: change one expected door target, show RED, restore.

Screenshots (desktop 1280×900 full page, and one mobile 390×844) into evidence/T-011/screens/: home, each new exhibit after choosing one option, the switchboard before choosing, one ticket page. Name them clearly.

Acceptance (paste raw output): npx playwright test tests/e2e/new-exhibits.spec.ts (RED then GREEN), npm run test:e2e (full, literal passed line), npm run lint, git status --short.
Required output: changed files, raw outputs, screenshot list, anything that looked wrong on screen (describe it — do not fix src).
Limits: 45 minutes, two repair attempts. Model: sonnet (builder).
```
