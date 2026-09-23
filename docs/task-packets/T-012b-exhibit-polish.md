# T-012b-exhibit-polish

```
ID: T-012b-exhibit-polish
Project: /home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures
Objective: Fix three visual defects seen in evidence/T-011/screens/: the SELECTED badge crowding the choice label, the "Continue to → <title>" link wrapping awkwardly on long titles, and the vitrine frame being taller than the plate it holds.

Allowed files:
  src/app/exhibits/[slug]/page.tsx   (ONLY the choice-list markup and the "Continue to" link markup; do not add metadata exports or change data logic)
  src/components/Vitrine.tsx, src/components/Plate.tsx, src/app/globals.css (only if needed)
  tests/e2e/exhibit-polish.spec.ts (new)
  evidence/T-012/screens/** (new)
Forbidden: everything else, including src/domain/**, src/content/**, other src/app routes, existing e2e specs, .env*. No Sanity writes. Do not commit.

Read first: the three defects in evidence/T-011/screens/02..05 (look at them); docs/design/ (tokens/spec); src/app/exhibits/[slug]/page.tsx; Vitrine.tsx; Plate.tsx.

Constraints:
  - Keep the accessible names exactly as today: the choice links keep their label text as the name (the badge stays aria-hidden or becomes visually separate), and the onward link keeps aria-label "Continue to <title>" — existing e2e depends on both.
  - SELECTED: put the badge on its own line or right-aligned with a fixed gap so it never touches the label at 390px or 1280px widths; the switchboard's three long labels are the stress case.
  - Continue to: "Continue to" and the arrow stay together; the title wraps as a block with a hanging indent under the title start (no orphaned arrow, no title starting under the dot).
  - Vitrine: the frame hugs the plate's 4:3 aspect at every breakpoint (no empty band above/below the plate), and the PLATE PENDING fallback still renders.
  - Respect prefers-reduced-motion as the existing code does.

Tests first: write tests/e2e/exhibit-polish.spec.ts that measures with boundingBox(): (1) SELECTED badge box does not intersect the label text box, on /exhibits/unfinished-conversations-switchboard at 390×844 and 1280×900 after choosing each choice; (2) the Continue-to arrow's top is within the first line box of the link; (3) vitrine frame height ≤ plate height + 2×padding + 4px. Run it RED against current code, then fix to GREEN.
Before any e2e run: `ss -ltnp | grep 3100` must print nothing. Trust only the literal "N passed" line.
Screenshots (after) into evidence/T-012/screens/: switchboard after choosing its longest-label choice at 1280×900 and 390×844, toaster after a choice at 1280×900. READ them before reporting.

Acceptance (paste raw output): npx playwright test tests/e2e/exhibit-polish.spec.ts (RED then GREEN), npm run test:e2e (full), npm run typecheck, npm run lint, git status --short.
Required output: changed files, raw outputs, what you saw in each screenshot, limitations.
Limits: 45 minutes, two repair attempts. Model: sonnet (frontend-designer).
```
