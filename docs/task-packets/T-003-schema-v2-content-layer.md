# T-003-schema-v2-content-layer

```
ID: T-003-schema-v2-content-layer
Project: /home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures
Objective: Extend the Sanity schema and the typed content layer for the next features (wings, blueprint images, 2–4 choices, chained outcomes) while keeping every existing published document valid and every current page working unchanged.

Allowed files:
  schemas/era.ts, schemas/artifact.ts, schemas/outcome.ts
  src/content/**  (types.ts, sanity-repository.ts, sanity-transform.ts, local-fixtures.ts, local-repository.ts, and their tests)
  src/domain/visitor-trace.ts and its test  (only if the type change requires it)
  scripts/sanity-check.mjs  (only if it asserts the old shape)
Forbidden files: everything else — src/app/**, src/components/**, studio/**, schemas/artifactReview.ts, sanity.config.ts, package.json, next.config.*, .env*, docs/**, tests/e2e/**. Another worker is restyling src/app/** at the same time; never edit those files even if typecheck complains about them — report instead.

Read first:
  AGENTS.md then node_modules/next/dist/docs/ only if you touch anything Next-specific (you should not need to).
  schemas/*.ts, src/content/*.ts, src/content/*.test.ts, src/domain/visitor-trace.ts, docs/content/*.json (the real published documents — they must stay valid).

Schema changes (Sanity v6 defineField/defineType, keep the existing style):
  era:
    + accentColor: string, title "Wing accent colour", description "Hex colour of this wing's light, e.g. #f2b65a", validation: optional, but when present must match /^#[0-9a-fA-F]{6}$/ (rule.regex with a clear message).
  artifact:
    + image: type "image", title "Blueprint plate", options { hotspot: true }, fields: [{ name: "alt", type: "string", title "Alt text", validation required min 20 max 320 }]. The image itself is OPTIONAL for now (existing documents have none); alt is required whenever an image is set — enforce with a custom rule on the image field.
    ~ choices: validation rule.required().min(2).max(4) instead of length(2). Also enforce unique outcome references within one artifact (custom rule) — that is new but cheap and protects the future ticket page.
  outcome:
    + consequenceTags: array of strings, title "Consequence tags", description "1–4 short lowercase tags that describe what this outcome does to the visitor's future, e.g. borrowed-time", optional for now; when present: min 1, max 4, unique, each matching /^[a-z0-9-]{2,32}$/.
    + leadsTo: reference to artifact, title "Leads to (next exhibit)", optional, weak: false.
  Do NOT make new fields required — `npx sanity documents validate` must still pass against the live dataset, which the orchestrator runs.

Content layer:
  types.ts:
    ArtifactChoice unchanged. ArtifactOutcome gains `consequenceTags: string[]` (empty array when absent) and `leadsTo?: { title: string; slug: string }`.
    ExhibitArtifact: `choices: ArtifactChoice[]` (2–4, no tuple), plus `era: { title: string; slug: string; summary: string; accentColor?: string }`, plus `image?: { url: string; alt: string; width: number; height: number; lqip?: string }`.
    New `ExhibitEra = { title; slug; summary; accentColor?; exhibits: ExhibitArtifact[] }`.
    ExhibitRepository gains `listEras(): Promise<ExhibitEra[]>` (eras with their artifacts, eras ordered by title, artifacts by title) and `getEraBySlug(slug): Promise<ExhibitEra | null>`.
  sanity-repository.ts: add `era->{title, "slug": slug.current, summary, accentColor}` and `image{asset->{url, metadata{lqip, dimensions{width, height}}}, alt}` to both artifact queries; extend `outcome->` with `consequenceTags, leadsTo->{title, "slug": slug.current}`; add `eraListQuery` and `eraBySlugQuery` that embed the same artifact projection (factor the projection into one shared groq fragment string). Keep existing exported names.
  sanity-transform.ts: zod — choices as array min 2 max 4; era object required (every published artifact has one); image optional with asset url + alt required when present; consequenceTags default []; leadsTo optional. Add `transformSanityEra(s)`. An artifact that lacks `era` is malformed (same handling as today).
  local-fixtures.ts / local-repository.ts: update to the new shape so the local repository still works and implements the two new methods.
  src/domain/visitor-trace.ts: keep behaviour; adjust only if the tuple type was relied on.

Tests first (Vitest, existing style): for each behaviour, write the failing test first, run it, paste the failure, then implement. Minimum new cases: 3-choice artifact accepted; 1-choice and 5-choice rejected; missing era → malformed; image without alt → malformed; image with alt → passed through; outcome without consequenceTags → []; leadsTo passed through; transformSanityEras groups artifacts; repository listEras/getEraBySlug call the right queries with the right params (use the existing fake-client pattern in sanity-repository.test.ts).

Acceptance checks (run all, paste raw output):
  npm run test:unit
  npm run typecheck
  npm run lint
  npx sanity schemas validate
  git status --short   (only allowed files)
Do NOT run `npm run build`, `npm run test:e2e`, `npx sanity documents validate`, or anything needing the network; the orchestrator runs those afterwards (the sandbox has no network and another worker owns the build directory).

Required output:
  - Status: done | partial | blocked
  - Changed files
  - Raw output of every acceptance command, including the initial failing test runs
  - Known limitations / decisions (e.g. how you handled duplicate-outcome validation)
  - Actual model ID if visible
Limits: 45 minutes, two repair attempts, then stop and report the blocker.
Sandbox/permissions: workspace-write; no installs, deploys, credentials, network, or public actions.
Model: gpt-5.5 (Codex)
```

## Worker report (Codex gpt-5.5, thread 01a0c476-164c-7b23-9cf1-d182ef809dc7, ~8 min)
Status: done. Changed: schemas/{artifact,era,outcome}.ts, src/content/{types,sanity-repository,sanity-transform,local-fixtures,local-repository}.ts + tests, src/domain/visitor-trace.test.ts.
Tests-first evidence: initial focused run `Tests 11 failed | 7 passed (18)`; after implementation `18 passed`; typecheck failed once (custom rule typing + visitor-trace test fixtures missing consequenceTags) and was repaired (2 attempts used).
Final raw: `npm run test:unit` → Test Files 6 passed, Tests 36 passed (36); `npm run typecheck` clean; `npm run lint` clean; `npx sanity schemas validate` → 0 errors 0 warnings.
Decision: duplicate-outcome rule compares `outcome._ref` values across choices; missing refs are left to the reference's own required rule.

## Orchestrator acceptance — ACCEPTED (Sep 21, 2026)
- Orchestrator read the full diff (schemas, types, GROQ, zod). Shared `artifactProjection` fragment; era-grouped queries use `references(^._id)`; nulls are normalised via `optionalNullable`.
- Orchestrator-run network gates: `npm run sanity:check` → 12 documents / 3 artifacts; `npx sanity documents validate` → 13/13 valid, 0 errors, 0 warnings (live dataset stays valid under the new schema). Live `eraListQuery`-shaped query via Sanity MCP returned 3 eras, each with its artifact and resolved `era->`.
- Independent cross-family review requested from the `reviewer` sub-agent (Sonnet 5) because the change touches Studio validation. `npm run build` / e2e run once T-001 lands (shared build directory).
- Independent review (`reviewer` sub-agent, Sonnet 5, fresh context): **pass** — no blocker/major findings.
  - Minor: `artifact.image` carries a custom alt rule that duplicates the nested `alt` `required()` (harmless; candidate for cleanup in a later packet).
  - Informational: a dangling `era` reference makes the whole list throw (strict by design; follow-up candidate). `outcome.leadsTo` has no cycle guard — the future resolver must add one.
  - Nit: the "image without alt" transform test should use `alt: null` to mirror GROQ output.
  - Noted: `docs/content/*.json` holds 12 docs; live dataset has 13 (the 13th is the curator `artifactReview.*` record) — consistent with HANDOFF.
  - Reviewer's first `npm run typecheck` failed with TS6053 (`src/app/loading.tsx` not found) — a race with the concurrent T-001 worker creating that file; the rerun passed. Unrelated to T-003.
- Orchestrator gates on the combined tree (19:13, Sep 21): `npm run test:unit` 36/36; `npm run typecheck` clean; `npm run lint` clean; `npm run build` passed (routes `/`, `/_not-found`, `/exhibits/[slug]`, `/studio/[[...tool]]`). The one e2e failure in that run belongs to T-001 (see its packet).
- Verdict: DONE. Not yet committed (commit together with T-001 once its gates pass).
