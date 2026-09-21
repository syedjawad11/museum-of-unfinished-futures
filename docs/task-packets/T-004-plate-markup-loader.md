# T-004-plate-markup-loader

```
ID: T-004-plate-markup-loader
Project: /home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures
Objective: Add a small, tested server-side module that returns safe, inline-ready SVG markup for an exhibit's blueprint plate — from the artifact's Sanity image asset when one exists, otherwise from the local file public/illustrations/<slug>.svg — so the UI can inline plates and tint them with CSS `currentColor`.

Why inline: an <img src="plate.svg"> cannot inherit the page's colour, so per-wing tinting only works when the SVG markup is inlined into the HTML (see docs/design/blueprint-plate-spec.md › "Note: <img> vs inline SVG and currentColor"). Inlining markup means it must be validated first.

Allowed files (new):
  src/content/plate-markup.ts
  src/content/plate-markup.test.ts
  src/content/__fixtures__/plates/*.svg   (small test fixtures you author: one valid plate, several invalid ones)
Forbidden files: everything else. In particular do NOT touch src/components/**, src/app/**, src/content/{types,sanity-repository,sanity-transform,local-*}.ts, schemas/**, public/**, docs/**, package.json. Another worker is drawing SVGs in public/illustrations/ right now — never read from or write to that folder in tests; use your own fixtures.

Read first:
  AGENTS.md (genuine Next.js 16 notice); src/content/types.ts (ExhibitArtifact.image is { url, alt, width, height, lqip? } | undefined); docs/design/blueprint-plate-spec.md (the plate contract: viewBox 0 0 800 600, currentColor only, no script/foreignObject/external href/data:image/hex colours, <title id="plate-title">, <desc id="plate-desc">, role="img"); public/illustrations/extra-mondays-vending-machine.svg (read-only, the real reference plate — do not copy it into fixtures verbatim, write a ~20-line minimal valid fixture instead).

API to implement (named exports, no default export):

  export type PlateSource = { slug: string; imageUrl?: string | null };
  export type PlateMarkup = { markup: string; source: "sanity" | "local"; bytes: number };
  export type PlateLoaderDeps = {
    fetchText?: (url: string) => Promise<{ ok: boolean; status: number; text: () => Promise<string> }>;
    readLocalFile?: (absolutePath: string) => Promise<string>;   // default: node:fs/promises readFile utf8
    localDir?: string;                                            // default: path.join(process.cwd(), "public", "illustrations")
  };
  export function sanitizePlateMarkup(raw: string): { ok: true; markup: string } | { ok: false; reason: string };
  export async function loadPlateMarkup(source: PlateSource, deps?: PlateLoaderDeps): Promise<PlateMarkup | null>;
  export function isAllowedPlateUrl(url: string): boolean;

Rules for sanitizePlateMarkup (pure function, no DOM, no new dependencies — regex/string work is fine, keep it readable):
  - Strip a leading XML declaration, DOCTYPE, BOM, and XML comments; trim.
  - Must start with "<svg" and end with "</svg>"; the root must contain viewBox="0 0 800 600".
  - Reject (ok:false with a short reason) if the markup contains, case-insensitively: "<script", "<foreignobject", "<iframe", "<embed", "<object", "<image", "<use " with an href not starting with "#", "javascript:", "data:", any attribute starting with "on" followed by letters and "=" (e.g. onload=, onclick=), "<style" that contains "@import" or "url(", any href/xlink:href whose value does not start with "#", any hex colour #xxx/#xxxxxx or rgb(/hsl( paint, "<animate", "<set ", "<animateTransform", "<animateMotion".
  - Reject if longer than 61,440 bytes (UTF-8) or if it has more than 400 "<" characters.
  - Reject if it lacks role="img" or lacks a <title> element.
  - On success return the cleaned markup unchanged otherwise (do not re-serialize).
  Decide and document (in a comment) whether the check is a denylist with a size cap (it is) and why that is acceptable here: plates are authored inside this repository or uploaded by the curator to the museum's own Sanity project; this is a defence-in-depth check, not a general-purpose sanitizer.

Rules for isAllowedPlateUrl: true only for https URLs on host cdn.sanity.io whose pathname starts with /images/wa27n68e/production_1/ and ends with .svg. (Read the project id / dataset from src/content constants if they are exported there; otherwise hard-code these two literal values with a comment — they are public identifiers.)

Rules for loadPlateMarkup:
  1. If source.imageUrl is a non-empty string and isAllowedPlateUrl(imageUrl): fetchText(imageUrl); if ok → sanitize → on ok return { markup, source: "sanity", bytes }. If the fetch fails or the markup is rejected, log nothing secret, and fall through to step 2 (the local file is the fallback). If the URL is not allowed, skip the fetch and go to step 2.
  2. Local: slug must match /^[a-z0-9-]{2,64}$/ (reject anything else → return null; this prevents path traversal). Read `${localDir}/${slug}.svg`; ENOENT → return null; other read errors → rethrow. Sanitize; ok → { markup, source: "local", bytes }; rejected → return null.
  3. Never throw for a missing/invalid plate; the page shows the placeholder in that case.

Tests first (Vitest, src/content/plate-markup.test.ts): write the failing tests, run `npx vitest run src/content/plate-markup.test.ts` and paste the failing output, then implement. Cover at least: strips xml declaration/comments; accepts a minimal valid fixture; rejects each forbidden pattern listed above (one small inline string per case is fine); rejects >61,440 bytes; rejects >400 tags; rejects missing viewBox / role / title; isAllowedPlateUrl true/false cases (wrong host, http, wrong project path, .png); loadPlateMarkup prefers sanity when fetch ok; falls back to local when fetch is not ok, when the URL is disallowed, and when the fetched markup is rejected; returns null on ENOENT; rejects a traversal slug like "../secret" without touching the filesystem (assert readLocalFile was not called); rethrows non-ENOENT errors.

Acceptance checks (run all, paste raw output):
  npm run test:unit
  npm run typecheck
  npm run lint
  git status --short   (must show only the three allowed paths)
Required output:
  - Status: done | partial | blocked
  - Changed files
  - Raw output of every acceptance command, including the initial failing test run
  - Known limitations / decisions
  - Actual model ID if visible
Limits: 45 minutes, two repair attempts, then stop and report the blocker.
Sandbox/permissions: workspace-write; no installs, deploys, credentials, network, or public actions. Do not run `npm run build` or the e2e suite.
Model: gpt-5.5 (Codex)
```

## Worker report (Codex gpt-5.5, thread 01a0c518-3256-7f42-befc-eca98141b7d4, ~3 min)
Status: done. Files: src/content/plate-markup.ts, plate-markup.test.ts, __fixtures__/plates/{valid-plate,invalid-script,invalid-hex,invalid-external-href}.svg. Tests-first: initial run failed with "Cannot find module './plate-markup'"; final `npm run test:unit` → 7 files, 81 tests passed (45 new); typecheck clean; lint clean. Decisions: denylist + size/tag caps with a source-trust comment; Sanity project/dataset literals hard-coded (public identifiers) since no content constant exports them.

## Orchestrator acceptance — ACCEPTED (Sep 21, ~20:25)
- Read the module in full. Reran unit 81/81, typecheck 0, lint clean. Verified the real plate 001 passes the loader (`local`, 15,101 bytes).
- Observations for the reviewer: `hasHexColour` only inspects paint attributes (a `style="fill:#fff"` would slip); `\bdata\s*:` could reject a label such as "DATA: NONE".
- Cross-family review requested from the `reviewer` sub-agent (Sonnet 5) because the output is later inlined into HTML.

- Review (`reviewer` Sonnet 5): **pass with fixes.** Major: hex colours / `url()` inside `style="…"` attributes and CSS rules in `<style>` blocks slipped through; Medium: `data:` check rejected label text like "DATA: NONE"; Minor: no regression tests for either; Nit: nested `<svg>` untested. Reviewer confirmed slug/path-traversal and host-spoofing protection, ENOENT handling, and that no test touches disk/network outside fixtures.
- Fix rounds on the same Codex thread: (1) style-attribute + style-block scanning for hex/url()/@import/expression()/behavior:/-moz-binding; `data:` scoped to href/src/url() contexts; regression tests incl. uppercase `<SCRIPT>` and nested svg → 93 tests. (2) Orchestrator probe found unquoted `style=fill:#fff` still passing → now rejected → 94 tests.
- Orchestrator verification: probed eight bypass/false-positive strings directly against the module (all behave as required); unit 94/94, typecheck 0, lint clean; real plates pass the loader (001: 15,101 B; 002: 12,678 B; 003: 13,037 B). Verdict: DONE.
