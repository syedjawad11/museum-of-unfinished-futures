# Build Log

## 2026-09-20

- M02 Sanity read slice inspected `AGENTS.md`, current content/domain code, tests, README/HANDOFF, local Next App Router docs under `node_modules/next/dist/docs`, and installed Sanity package docs/readmes/type declarations for `next-sanity`, `sanity`, and `@sanity/vision`.
- RED, focused Sanity transformer test before implementation:

```text
$ npm run test:unit -- src/content/sanity-transform.test.ts
FAIL  src/content/sanity-transform.test.ts
Error: Cannot find module './sanity-transform' imported from /home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures/src/content/sanity-transform.test.ts
Test Files  1 failed (1)
Tests  no tests
```

- Inspected `AGENTS.md`, `package.json`, and local Next 16 docs under `node_modules/next/dist/docs`, including App Router project structure, layouts/pages, dynamic routes, accessibility, and Vitest setup.
- Attempted to install Vitest:

```text
$ npm install -D vitest
npm error code ENOTFOUND
npm error syscall getaddrinfo
npm error errno ENOTFOUND
npm error network request to https://registry.npmjs.org/vitest failed, reason: getaddrinfo ENOTFOUND registry.npmjs.org
npm error network This is a problem related to network connectivity.
npm error network In most cases you are behind a proxy or have bad network settings.
npm error network
npm error network If you are behind a proxy, please make sure that the 'proxy' config is set properly.  See: 'npm help config'
npm error Log files were not written due to an error writing to the directory: /home/shah20/.npm/_logs
npm error You can rerun the command with `--loglevel=verbose` to see the logs in your terminal
```

The builder sandbox could not install Vitest. The supervising session later installed it successfully with normal project network access and updated `package-lock.json`.

- RED, initial outcome-resolution test:

```text
$ npm run test:unit

> museum-of-unfinished-futures@0.1.0 test:unit
> vitest run

sh: 1: vitest: not found
```

- GREEN attempt after adding resolver and local fixture was also blocked by missing Vitest:

```text
$ npm run test:unit

> museum-of-unfinished-futures@0.1.0 test:unit
> vitest run

sh: 1: vitest: not found
```

- Added focused unknown-choice and missing-artifact tests. Their initial execution was blocked at the runner level until Vitest was installed by the supervising session.
- First `npm run build` after removing Google Fonts still failed under default Turbopack because the sandbox denied a helper process binding a port. Local Next CLI docs list `next build --webpack` as a supported build option, so the build script now uses Webpack.
- Webpack build initially failed with `Could not parse output from TypeScript's --showConfig.` Local Next docs document `experimental.useTypeScriptCli: false`; app `typecheck` already passes through `tsc`, so build now uses the TypeScript JS compiler API.

## Builder Verification

```text
$ npm run test:unit

> museum-of-unfinished-futures@0.1.0 test:unit
> vitest run

sh: 1: vitest: not found
```

```text
$ npm run typecheck

> museum-of-unfinished-futures@0.1.0 typecheck
> tsc --noEmit -p tsconfig.typecheck.json
```

Result: passed.

```text
$ npm run lint

> museum-of-unfinished-futures@0.1.0 lint
> eslint
```

Result: passed.

```text
$ npm run build

> museum-of-unfinished-futures@0.1.0 build
> next build --webpack

▲ Next.js 16.3.5 (webpack)
✓ Running next.config.ts took 29ms
- Experiments (use with caution):
  ⨯ useTypeScriptCli

  Creating an optimized production build ...
✓ Compiled successfully in 6.5s
  Running TypeScript ...
  Finished TypeScript in 3.1s ...
  Collecting page data using 6 workers ...
  Generating static pages using 6 workers (0/5) ...
  Generating static pages using 6 workers (1/5)
  Generating static pages using 6 workers (2/5)
  Generating static pages using 6 workers (3/5)
✓ Generating static pages using 6 workers (5/5) in 882ms
  Finalizing page optimization ...
  Collecting build traces ...

Route (app)
┌ ○ /
├ ○ /_not-found
└ ƒ /exhibits/[slug]


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

Result: passed.

- Sanity integration blocker: no Sanity account/project details or credentials exist in this local repo. This slice uses labelled local demo fixture data only.

## Supervising Session Verification

- Installed Vitest with project network access. An initial pinned `3.2.4` install exposed two known audit findings, including one critical advisory, so it was upgraded to `5.0.1`; `@types/node` was updated to satisfy the current peer range.
- Renamed the Vitest config to `vitest.config.mts` to remove the Vite native config-loader warning.

```text
$ npm run test:unit
Test Files  1 passed (1)
Tests       3 passed (3)
```

```text
$ npm run typecheck
Result: passed.

$ npm run lint
Result: passed.

$ npm run build
Result: passed. Routes: /, /_not-found, /exhibits/[slug].

$ npm audit --audit-level=moderate
found 0 vulnerabilities
```

## Review and Repair

- Fresh-context review used `gpt-5.6-sol` in a read-only sandbox; raw findings are preserved in `evidence/M01-review.txt`.
- Fixed both medium findings: unknown exhibit routes now use Next.js `notFound()` and return HTTP 404 with `noindex`; keyboard focus uses a dark, offset outline instead of the low-contrast gold ring.
- Unit-test files are now included in `npm run typecheck`.
- The raw builder summary in `evidence/M01-builder-summary.txt` is intentionally preserved as historical evidence; its Vitest blocker was resolved by the supervising session as documented above.

Final rerun after repairs:

```text
$ npm run test:unit
Test Files  1 passed (1)
Tests       3 passed (3)

$ npm run typecheck
Result: passed.

$ npm run lint
Result: passed.

$ npm run build
Result: passed.

$ npm audit --audit-level=moderate
found 0 vulnerabilities

$ git diff --check
Result: passed.
```

Local HTTP/browser smoke checks:

```text
GET /exhibits/does-not-exist -> 404
Missing page title -> 404: This page could not be found.
Missing page robots meta -> noindex
Gallery -> exhibit -> "Spend a plan" -> linked "A paper Monday drops" outcome verified.
```

## Live Sanity Read Integration — September 20, 2026

- Founder provided public project ID `wa27n68e` and dataset `production_1`.
- Sanity CLI Google authentication completed successfully. No password, token, or verification code entered the repository or chat.
- `npx sanity projects list` verified project `Competition` (`wa27n68e`).
- `npx sanity dataset list --project-id wa27n68e` verified datasets `production` and `production_1`; the approved target remains `production_1`.
- Added exact local Studio CORS origins with credentials for `http://localhost:3000` and `http://127.0.0.1:3000`, then read them back with `npx sanity cors list --project-id wa27n68e`.
- Added pinned Sanity/Studio dependencies, artifact/era/outcome schemas, runtime validation, GROQ repository queries, embedded `/studio`, and a real public-dataset check script.
- Visitor routes now use the Sanity repository without fixture fallback. The verified empty dataset produces an accessible empty-gallery state.
- The local fixture remains only for tests and recovery.

Two builder runs were interrupted during implementation and sandboxed build verification. The transformer/repository/empty-state tests exist and pass, but exact RED output from the interrupted runs was not preserved; do not claim complete RED-output evidence for this slice.

Initial production build failed because the server-component graph imported `sanity.config.ts`, causing Webpack to select SWR's `react-server` export, which intentionally has no default export while Sanity imports SWR's default hook. The failing import trace named `sanity.config.ts` through the Studio page. Moving the Studio/config import behind a client component fixed the root cause. Node 26's experimental Web Storage warning was removed for builds with `--no-experimental-webstorage`.

```text
$ npm run test:unit
Test Files  4 passed (4)
Tests       9 passed (9)

$ npm run sanity:check
projectId: wa27n68e
dataset: production_1
apiVersion: 2026-09-20
documentCount: 0
artifactCount: 0

$ npx sanity schemas validate
Errors:   0
Warnings: 0

$ npm run typecheck
Result: passed.

$ npm run lint
Result: passed.

$ npm run build
Result: passed. Routes: /, /_not-found, /exhibits/[slug], /studio/[[...tool]].
```

Browser/HTTP smoke checks:

```text
GET / -> 200 and visible "No published artifacts yet" state.
GET /studio -> 200 and Sanity provider-login surface after CORS configuration.
```

Dependency audit:

- A safe non-breaking `npm audit fix` removed the direct styled-components/PostCSS findings.
- Remaining result: 15 transitive findings (12 moderate, 3 high) under the latest compatible Sanity 6.15.0 CLI/workbench graph.
- npm's offered force fix downgrades Sanity to 5.14.1, outside `next-sanity` 13.3.4's accepted Sanity range. No force fix or incompatible downgrade was applied.
- No content documents were created or published.

Fresh-context review (`gpt-5.6-sol`) found one medium issue: malformed published artifacts could be silently dropped and misreported as an empty dataset. Two failing regression tests reproduced the problem. `transformSanityArtifacts()` now throws on an unexpected response shape or any malformed published artifact, so the route enters failure handling rather than presenting a false empty state.

The review's low-risk findings were also corrected: `.env.example` is explicitly tracked, `sanity:check` rejects missing/non-integer count fields, and application metadata no longer calls the live integration a local demo.

Post-review verification:

```text
$ npm run test:unit
Test Files  4 passed (4)
Tests       11 passed (11)

$ npm run sanity:check
documentCount: 0
artifactCount: 0

$ npx sanity schemas validate
Errors:   0
Warnings: 0

$ npm run typecheck
Result: passed.

$ npm run lint
Result: passed.

$ npm run build
Result: passed.

$ git diff --check
Result: passed.
```

## Curator Workflow Final Review — September 21, 2026

- A fresh-context reviewer found one blocking data-integrity issue in the custom publish action: it enforced curator approval but did not preserve Sanity's schema-validation gate.
- Added a tested validation guard and wired Sanity's `useValidationStatus` into guarded publishing. Publishing is now blocked while validation is running, while validation is stale for the current draft revision, or while error-level markers exist. Warning-level markers remain non-blocking.
- Added two regression tests covering running, stale, error, and warning validation states.
- Removed three lint warnings from the reproducible curator demonstration script.
- A second fresh-context reviewer passed the repaired slice with no security concerns or logic errors. Its only suggestion was optional action-level coverage around the already typechecked and inspected hook wiring.

Final rerun after repair:

```text
$ npm run test:unit
Test Files  6 passed (6)
Tests       25 passed (25)

$ npm run sanity:check
documentCount: 12
artifactCount: 3

$ npx sanity schemas validate
Errors:   0
Warnings: 0

$ npm run typecheck
Result: passed.

$ npm run lint
Result: passed with no warnings.

$ npm run build
Result: passed. Routes: /, /_not-found, /exhibits/[slug], /studio/[[...tool]].

$ git diff --check
Result: passed.
```

## Netlify Release Candidate — September 21, 2026

- Founder approved Netlify Free, CLI authentication, and creation of the empty manual site `museum-of-unfinished-futures`.
- Authenticated API read-back verified an active Free plan with 300 included/0 used credits, automatic top-up disabled, no payment method, and no published deploy.
- Added tracked `netlify.toml` build settings and ignored local `.netlify/` metadata.
- The first lint attempts timed out because generated `.netlify/` files were inside ESLint's traversal. Added `.netlify/**` to the flat-config global ignores; lint then passed normally.
- Offline Netlify production build passed and packaged `___netlify-server-handler`.

Release-gate rerun:

```text
$ npm run test:unit
Test Files  6 passed (6)
Tests       25 passed (25)

$ npm run sanity:check
documentCount: 12
artifactCount: 3

$ npx sanity schemas validate
Errors:   0
Warnings: 0

$ npx sanity documents validate --yes --level info --format pretty
Valid:    13 documents
Errors:   0
Warnings: 0
Info:     0

$ npm run typecheck
Result: passed.

$ npm run lint
Result: passed with no warnings after excluding generated `.netlify/**` files.

$ npm run build
Result: passed.

$ npm run test:e2e
Tests: 6 passed.

$ git diff --check
Result: passed.
```

- Secret/path scan found no tracked Netlify metadata, private keys, or secret-bearing environment files. `.env.example` contains only public Sanity identifiers.
- `npm audit --audit-level=moderate` still reports the previously documented 15 transitive Sanity CLI/workbench findings (12 moderate, 3 high). The offered force fix remains an incompatible Sanity downgrade and was not applied.
- Full evidence: `evidence/M05-release-candidate.txt`.
- No draft or production deployment occurred.

## Netlify Draft Deployment — September 21, 2026

- Founder authorized a verified commit and a draft deploy. Commit `60a60c9` records the Netlify release configuration and M05 local evidence.
- Draft deploy `6ab119b68b09d5206621140f` reached Netlify state `ready` with no deployment error. It remains unpublished and the site has no production deploy.
- Logged-out Playwright was redirected to Netlify Edge Access and received HTTP 401, so the private preview could not satisfy public logged-out assertions.
- Through the founder-authenticated Firefox preview, the gallery, all three exhibits, all six outcomes, invalid-choice state, and visible missing-exhibit 404 page rendered correctly.
- `/studio` reached Sanity's project connection/CORS gate because the ephemeral draft origin was intentionally not authorized.
- Ten screenshots are preserved under `evidence/M05-draft/`; detailed results are appended to `evidence/M05-release-candidate.txt`.
- Netlify API read-back after the draft still reported 300 included/0 used credits, automatic top-up disabled, and no payment method. No spend occurred.
- Production deployment and public release remain unauthorized.

## Orchestrated sprint, day 1 — September 21, 2026 (evening)

Claude Code (Opus 5) now orchestrates; workers are Codex `gpt-5.5`, a Sonnet 5 `reviewer`, and Sonnet 5 `frontend-designer` sub-agents. Packets and acceptance notes: `docs/task-packets/`.

- **T-002 blueprint plate 001 — accepted.** `docs/design/blueprint-plate-spec.md` (shared drafting style) and `public/illustrations/extra-mondays-vending-machine.svg` (15,466 bytes, `currentColor` only, valid XML, no hex/script/foreignObject). Previews in `evidence/T-002/`. Finding recorded in the spec: an `<img src=plate.svg>` cannot inherit the page's `currentColor`, so per-wing tinting needs the SVG inlined server-side — decided for the wiring task (T-004) together with a root default colour on the plate.
- **T-003 schema v2 + content layer — done and independently reviewed.** Codex wrote the failing tests first (11 failed / 7 passed), then implemented `era.accentColor`, `artifact.image` (+ nested required `alt`), `artifact.choices` 2–4 with a unique-outcome rule, `outcome.consequenceTags`, `outcome.leadsTo`, and typed era queries. Two repair attempts were used on typecheck (custom rule typing; test fixtures missing `consequenceTags`). Gates: unit 36/36, typecheck, lint, `npx sanity schemas validate` 0/0, `npm run sanity:check` 12 docs / 3 artifacts, `npx sanity documents validate` 13/13 valid — the live dataset stays valid because every new field is optional. Cross-family review (Sonnet reviewer): pass; minor duplicated alt rule; note that `leadsTo` needs a cycle guard when a resolver is written.
- **T-001 design foundation — interrupted, then resumed as T-001b.** The Sonnet designer produced fonts, eight components, restyled pages and the museum-voice 404/error/loading pages before the founder stopped it at ~3% session quota. Orchestrator gates over the interrupted tree: unit, typecheck, lint and build pass; e2e 5/6. Real failure: `/exhibits/does-not-exist` now answers HTTP 200 instead of 404. Cause (Next 16 docs, `loading.md` › Status codes): a root `loading.tsx` starts streaming before `notFound()` runs, so the status is locked at 200. The original packet asked for both a loading page and a real 404 — a contradiction the docs resolve. Decision: drop the root `loading.tsx`; keep the 404.
- **Concurrency note.** Three workers shared one tree on disjoint file sets. The reviewer's first typecheck hit TS6053 (`loading.tsx` not found) because the designer was creating that file at the same moment; the rerun passed. Next time, parallel Claude workers get `isolation: worktree`.
- Sanity: draft `accentColor` values were set through the Sanity MCP on the three era documents (amber `#f2b65a`, cyan `#5fd3e6`, violet `#b48cff`) and left **unpublished** pending founder approval.
- Session quota: the Claude session limit was hit at ~17:15 and reset about an hour later; work resumed at ~19:10. No money was spent.
- **T-001 finished (T-001b + T-001c).** Dropping `loading.tsx` restored the real 404 (e2e 6/6, `curl` 404). Cross-family review by Codex `gpt-5.6-sol` returned "fail → fixes": the case's breathing glow dimmed its caption below 4.5:1 mid-animation; several hover transitions ignored `prefers-reduced-motion`; heading order skipped h2; the selected choice relied on colour alone. All four were fixed by the designer, plus the mobile clipping it had reported on itself. Orchestrator re-verified (grep for unguarded transitions = 0; gates rerun; screenshots inspected). Evidence: `evidence/T-001/*.png`. Contrast table in the T-001b packet. Awaiting founder approval to commit.
- **Founder approvals (Sep 21, ~20:00).** (1) Committed the verified slice as `fdea66e` (`[verified] blueprint night museum foundation, plate 001, schema v2`, 57 files); tree clean afterwards; no push, no deploy. (2) Published the three era `accentColor` values via the Sanity MCP (`publish_documents`); verified afterwards: 3 eras carry amber `#f2b65a` / cyan `#5fd3e6` / violet `#b48cff`, 0 drafts remain, 13 content documents total.

## Orchestrated sprint, day 1 — plates in the cases (Sep 21, 20:00–21:05)

- **T-004 plate loader (Codex gpt-5.5).** Tests first (module missing → 45 tests). The Sonnet reviewer's "pass with fixes" found CSS-based bypasses (`style="fill:#…"`, `<style>` rules with `url()`) and a false positive on `data:` in label text; two fix rounds on the same thread plus one orchestrator-found gap (unquoted `style=`) brought it to 58 tests. Denylist + size caps by design, documented in code: plates only come from this repo or the museum's own CDN.
- **T-005 plates 002/003 (Sonnet designer).** Both pass every spec check at ~13 KB. Orchestrator inspection of the 1:1 renders found the compass rose overlapping the fig. 1 caption on all three plates — inherited from plate 001 — fixed on all three (plate 001 diff: the four compass lines only). Telephone cord re-routed twice until no leader crossed the dial.
- **T-006 wiring (Sonnet designer).** Plates are inlined server-side (`<img>` cannot inherit `currentColor`), hidden from assistive tech behind the existing `role="img"` label, and tinted from `era.accentColor` after a hex check. e2e grew to 7 tests. Home HTML is ~119 KB with three plates. Codex gpt-5.6-sol review: pass. Real hiccup: the worker's screenshot server outlived the task and blocked port 3100 for the orchestrator's e2e rerun; killed and rerun clean (7/7).
- Gates at the end of the slice: unit 94/94, typecheck, lint, build, e2e 7/7, `git diff --check`.
- **Commit + draft deploy (founder-approved, Sep 21 ~21:20).** Slice 2 committed as `0a9a5a6`. `npx netlify-cli deploy --build` failed once inside `@netlify/plugin-nextjs` ("Unexpected status code 403 from fetching extensions") after a successful 2-minute build; `netlify status` showed the login intact and the identical retry succeeded (build 2m 45s, 231 files, 1 function). Draft deploy `6ab179225cac95ae144beed3`, URL `https://6ab179225cac95ae144beed3--museum-of-unfinished-futures.netlify.app`. As before, the draft answers HTTP 401 to logged-out requests (Netlify private preview) — the founder must be signed in to Netlify to view it. No production deploy; site still has no published deploy.
- **Session close (Sep 21 ~21:40).** Founder asked to update records and start fresh tomorrow; T-007 deliberately not started. Remaining roadmap (T-007 … T-015, release, submission) recorded on `docs/TASK_BOARD.md` and in `memory/HANDOFF.md`.

## T-007 — plates into Sanity (Sep 21, ~20:55–21:10)

- The founder asked for T-007 to run and be committed. Codex `gpt-5.5` wrote `scripts/attach-plates.ts` plus a small tested domain module (`src/domain/plate-attachment.ts`, tests first: module-missing RED → 8 GREEN, later 10). The script is dry-run by default, aborts before any write on a missing artifact or an existing draft, and reuses the existing review state machine (`submitDraftRevision` → `approveSubmittedRevision` → `getPublishEligibility`) with `ifRevisionId` on every write — the same guarded path a curator uses in Studio.
- The orchestrator ran it with the founder's CLI login (`npx sanity exec … --with-user-token`, no tokens in files). Alt text is the plate's own `<desc>`. Result: three `sanity.imageAsset` documents (`…-800x600-svg`; Sanity derived 800×600 from the viewBox, which the site's transform requires), three artifacts republished with `image` + `alt`, the telephone's old M04 approval superseded by a fresh submitted → approved review, zero drafts left. Evidence: `evidence/T-007/attach-plates-executed.json`.
- Observed: the Sanity CDN serves a normalised copy of each SVG (comments removed, self-closing tags expanded; ~270 bytes larger) that still passes `sanitizePlateMarkup`. The production build now renders every plate with `data-plate-source="sanity"` (3 on home, 1 per exhibit); the local files remain the fallback.
- Gates: unit 104/104, typecheck, lint, build, e2e 7/7, `sanity:check` 15 docs, `sanity documents validate` 15/15, `git diff --check`, secret scan. Cross-family review (Sonnet reviewer): pass with fixes — two missing test cases (entities, exact 20/320 boundaries) and one comment — applied and re-verified.

## T-008 — wings (Sep 22, ~16:45–19:35)

The museum had eras in its data since T-003 but never showed them: the home page was a flat grid of three cases. T-008 turns the flat grid into rooms.

- **Re-scoped before the packet was written.** The board had T-008 down for Codex (data) *plus* a designer (UI). Reading `src/content/sanity-repository.ts` first showed T-003 had already shipped `eraListQuery` / `eraBySlugQuery` / `listEras()` / `getEraBySlug()`, each era already resolving its artifacts. So T-008 became UI-only, one worker, with an explicit "what already exists — reuse it, do NOT rebuild it" section in the packet and `src/content/**` on the forbidden list to stop a worker rebuilding tested code. The live wing slugs and accent colours in the packet were read straight off the public Sanity CDN rather than guessed, so the e2e fixtures match production content.
- **Delivered (Sonnet `frontend-designer`).** Home grouped into three wings, each with a wall placard (`WING N · N CASES`, era title, era summary, "Enter this wing →") and an accent-tinted rule; a new `/eras/[slug]` wing page with a real 404 for an unknown wing; `WingMap`, an inline SVG floor plan whose rooms are real `next/link` anchors (`role="group"`, `aria-label`, `aria-current="page"`, accent with a `brass-dim` fallback); `src/domain/wings.ts` with tests first; +4 e2e tests with the 7 existing ones untouched.
- **Forward-compatible with T-011.** The packet required that nothing assume a wing holds exactly one exhibit and that an empty wing render honestly ("This wing is still being hung.") rather than crash. The reviewer confirmed 0, 1 and many all work — so adding exhibits later needs no UI change.
- **Cross-family review** by Codex `gpt-5.6-sol` (read-only, fresh context, packet + change set only): pass with fixes, no blockers, no security findings. Three findings, all applied and re-verified — (1) MAJOR: the new wing-placard test asserted the `WING I · 1 CASE` subtitle rather than the summary, so it would have passed with every summary missing; (2) the floor-plan label wrapper silently dropped any word past its line cap, rendering "The Counterfactual Communications Boom" as "The / Counterfactual / Communications"; (3) home-page exhibit cards were `h2`, the same level as the wing heading above them.
- **Mutation check.** Because finding 1 was a test that could not fail, passing again would not have proved the repair. One wing summary in the fixture was deliberately corrupted and the test re-run: it failed at `visitor-journey.spec.ts:140`, exit 1. Mutation reverted, full suite green again at identical line numbers.
- **Gates re-run by the orchestrator** on the settled tree: unit 119/119 (884 ms), typecheck, lint, e2e 11/11 (20.4s), `git diff --check`, secret scan, no dependency changes.
- **Real failure — a false pass, twice.** An e2e rerun exited **0** while printing `Error: http://127.0.0.1:3100 is already used`: the suite aborted before running a single test and still reported success through the pipe. Cause: a worker's screenshot server outliving its task — the same hazard as T-006. It recurred on the repair pass, where the worker reported port 3100 verified free while pid 53726 was still listening. Standing rule adopted: never accept an e2e exit code without also finding the literal "N passed" line in the output.
- **Real failure — a self-inflicted revert.** Undoing the mutation with `git checkout -- tests/e2e/visitor-journey.spec.ts` discarded the worker's entire uncommitted change to that file, not just the one mutated word. Recovered from the backup taken before mutating and verified by re-running the suite. Standing rule adopted: back up before a mutation test, and never reach for `git checkout --` on uncommitted work.
- **A flagged security concern that turned out to be nothing.** The orchestrator reported to the founder that `AGENTS.md` carried a block telling agents to route file edits through shell commands while bypass-permissions mode was active — the shape of an instruction designed to slip past permission prompts. The founder authorised removing it. Checking the file first showed it contained only the block `next dev` regenerates, and a search of every file in the workspace for the quoted text returned no matches: the text had reached the orchestrator through session context, not from the repository, and was reported as a file finding without the file being opened. Nothing was edited. Recorded here because the near-miss is the point — an instruction-file finding must be read off disk and diffed against its committed version before it is acted on.
- **Known limitations (accepted):** `WingMap` accepts a `currentSlug` prop that no page passes yet, so the wing page does not light its own room; the wing page's mono line omits the roman numeral because it fetches one era and cannot know its position.

## T-009 — chained outcomes (Sep 22, ~19:25–20:00)

The museum had three exhibits that each ended in a dead end. T-009 turns them into a route.

- **Re-scoped on discovery, again.** The board had T-009 as a Codex data task. Reading first showed T-003 had already shipped `outcome.consequenceTags` and `outcome.leadsTo` — schema, GROQ projection, zod transform and TypeScript types, all tested. But a CDN query showed **all six live outcomes returned `null` for both fields**: finished plumbing with nothing flowing through it. So T-009 split into content (T-009a), UI (T-009b), a guarded dataset write (T-009c) and browser tests (T-009d).
- **T-009a — the walk (content-writer, Opus).** Consequence tags for all six endings and a `leadsTo` map. Every ending hands the visitor to a different exhibit *because of what they chose*; no ending returns to its own artifact; all three wings stay reachable; the museum loops on purpose and has no exit. Four tags deliberately repeat across wings so the ticket page can read as a composed sentence rather than a shuffled list. Orchestrator validated all 18 tag slots (14 distinct) against the schema rules: PASS.
- **T-009b — the UI (Codex gpt-5.5).** A consequence-tag strip and a "Continue to → {title}" door on the exhibit page, plus `src/domain/outcome-chain.ts` (tests first). Both render nothing when the fields are absent, which was the live state at the time — the page had to look deliberate either way.
- **Cross-family review** (Sonnet `reviewer`, read-only, fresh context): pass with fixes. Absence-handling and accessibility both passed with **no findings** — the reviewer confirmed the zod transform genuinely guarantees the array at runtime (the type is enforced, not lying) and that the `aria-label` correctly keeps the decorative arrow out of the accessible name.
- **A second test that could not fail.** The reviewer found `expect([].map(formatConsequenceTag)).toEqual([])` — `.map` never invokes its callback on an empty array, so it passes even if the function is deleted. This is the **same anti-pattern as T-008, from a different model family, on the same day**. Replaced with a version that exercises the real path against a one-tag control. Two independent workers producing the same hollow shape in one day is a pattern, not bad luck: "prove the assertion can fail" is now a written step in every test-bearing packet rather than something done on suspicion.
- **A corrected assumption about how to publish.** The plan (and what the founder was told) was to publish through the real review workflow, as T-007 did for the plates. That was wrong: `artifactReview` references an **artifact**, and `getArtifactReviewId` keys off an artifact id — outcomes are a different document type the state machine does not cover. Rather than bend it or extend it (a workflow covering every type is the separate, time-boxed T-013), safety came from different guards, and the founder was told plainly before anything was written.
- **T-009c — the guarded write.** `scripts/apply-chain.ts` + `src/domain/chain-application.ts` (tests first). Dry run unless `CHAIN_EXECUTE=1`; preflight reads **all six** documents and refuses if any one fails a precondition (missing, wrong type, already-populated fields, or an existing draft) before a single write; all six patches go as **one Sanity transaction with per-document `ifRevisionId`**, so a document edited by anyone in between aborts the whole thing rather than being silently clobbered. Orchestrator ran the dry run twice, confirmed every `leadsTo` `_ref` resolves to a real artifact id, then ran it with the founder's CLI login (`--with-user-token`, no token in any file). Result: **6 documents modified, 0 drafts left**, verified by re-querying the published dataset. Evidence: `evidence/T-009/apply-chain-executed.json`.
- **T-009d — proof it works (builder, Sonnet).** Three browser tests: a choice showing all three of its tags in display form, a chain hop crossing into another wing, and a three-exhibit walk asserting the URL at every hop. The worker verified every selector against rendered HTML rather than guessing, and mutation-proved the tag assertion (corrupting one expected string made it fail, exactly as intended).
- **A worker refused an injected instruction.** During T-009d the builder reported that a mid-conversation "system reminder" told it to do its file work through raw shell commands instead of the normal editing tools — the same text that, earlier the same day, the orchestrator mistakenly attributed to a repository file. The worker judged it an injected instruction that conflicted with its packet's file-scope safeguards, disregarded it, and said so in its report. Recorded because the worker did the right thing unprompted, and because it confirms the text is injected into agent contexts and is not in the repository.
- **Gates re-run by the orchestrator**: unit 155/155, typecheck, lint, e2e **14/14**, secret scan, no dependency changes.
- **Known limitation, stated plainly.** `visitedTrail` — the cycle guard — is implemented and tested but **no page calls it**. It was described to the founder as live protection before this was noticed; it is not. In practice it costs a visitor nothing, since the museum is meant to loop with no exit and there is no runaway behaviour without it. It is groundwork for the ticket page (T-010), where a visitor's trail genuinely accumulates. Left honestly labelled rather than wired in artificially to make the claim true.

## T-010 — the visitor's ticket (Sep 22, ~20:00–20:30)

Every visitor now leaves with something: `/your-future?trace=…` composes a short, personal "unfinished future" from the endings they reached. No accounts and no storage — the whole state is in the URL, so it is shareable by construction.

- **Split three ways across model families, on disjoint files, running in parallel.** T-010a (Codex `gpt-5.5`) the pure logic; T-010c (`content-writer`, Opus) the language; T-010b (`frontend-designer`, Sonnet) the page, the social image and the wiring.
- **T-010a — parsing untrusted input.** `parseTrace` treats `?trace=` as hostile: comma-split, trimmed, de-duplicated in first-seen order, hard-capped at 12 ids, every id checked against `^[a-z0-9-]{3,64}$`, a typed error returned rather than thrown, and ids passed to GROQ as query **parameters** — never string-concatenated into a query. Verified against `undefined`, `""`, `",,,"`, an array (Next can supply `string[]`) and a 10,000-character hostile string. `composeTicket` is deterministic: the same trace always composes the same ticket, because a shareable URL that rendered differently each visit would be a bug.
- **An orchestrator finding on the data query.** The new outcomes-by-id query resolved an ending's wing indirectly — outcome → whichever artifact happens to reference it → that artifact's era — when `outcome.era` is a **required** reference on the schema. Put to the worker with an explicit invitation to push back if the reading was wrong; it checked `schemas/outcome.ts`, agreed, and replaced it with the direct single-hop projection.
- **T-010b — every failure state written in the museum's voice.** No trace, a malformed trace, a well-formed trace resolving to nothing, and a partial trace where only some ids survive all render deliberate copy — never a stack trace, never a blank page. Verified by rendering each against a production build.
- **A real bug the worker's own new test caught.** Choice links did not forward an incoming `?trace=`, so a trail accumulated through "Continue to →" was silently dropped the moment the visitor made their next choice. The two-exhibit ticket test failed with only one wing named, which is exactly what a test is for. Fixed by threading the trace through choice links too.
- **Three pre-existing assertions were loosened, and the worker said so.** Two existing tests anchored the destination URL with `$`, asserting no query string at all — genuinely incompatible with a feature whose whole point is appending `?trace=`. They were relaxed from `${path}$` to `${path}(\?|$)`, still pinning the exact path. The worker flagged this as brushing against its packet's "do not alter the existing tests" wording rather than doing it quietly; the orchestrator inspected each of the three and agreed the change was minimal and correct.
- **A grammar defect in the headline sentence, found by rendering it.** The gates were all green and the e2e asserted the composed text, yet the live page read *"Your trace carries carrying a day that was never yours to keep…"* — the composer's stem was a finite verb while every tag phrase is a participial fragment written to hang off an implied "you". Found only by rendering a real ticket and reading it. Fixed to the content writer's intended stem ("You leave here"), split at three phrases per sentence for readability, and pinned with a unit test asserting the **full expected string** for a real two-ending trace so the defect cannot return silently. **Lesson recorded: green gates prove the code runs, not that the prose is English. Read the page.**
- **Gates re-run by the orchestrator**: unit 157/157, typecheck, lint, e2e **17/17**, secret scan, `git diff --check`, no dependency changes.
- **Known limitations.** (1) The social image is **not** trace-specific. The worker traced this to `next-metadata-route-loader`'s `getSingleImageRouteCode`, which discards the incoming `Request` before the module runs, so a route with no dynamic segment can never see `?trace=`; `generateImageMetadata` needs ids enumerable ahead of time. A genuine Next.js 16.3.5 constraint, documented in-code. The compromise: per-trace `title`/`description`/OG **text** via `generateMetadata` (which does receive `searchParams`), over a museum-branded image drawn with the three wings' real accent colours. (2) That image uses Satori's default font, because only `.woff2` faces exist here and `ImageResponse` accepts `.ttf/.otf/.woff`. (3) The composed body repeats its stem across sentences ("You leave here … You leave here …") — grammatical but clunky; polish, deliberately deferred rather than changed with a session limit approaching.
- **Two workers independently refused an injected instruction.** Both the T-009d builder and the T-010b designer reported that a mid-conversation message claiming "bypass permissions mode is active" told them to make file edits through raw shell commands instead of the normal editing tools. Both judged it an injected instruction conflicting with their packet's file-scope rules, disregarded it, and said so unprompted in their reports. Earlier the same day the orchestrator had mistakenly attributed that same text to a repository file and told the founder it was there; it is not in any file in this workspace.

## T-011 — three new exhibits, published through the review flow (Sep 23)

The museum grows from three exhibits to six, two per wing. The founder chose three rather than five to leave time for the Workflows task.

- **T-011a — the writing (content-writer, Opus).** Three exhibits: *The Toaster That Prints Notes From Your Future Self* (civic time), *The Switchboard for Conversations That Ended Too Soon* (communications — the first exhibit with **three** choices), *The Kettle That Brews the Weather of Past Visits* (weather memory). Seven new endings, eight new ticket phrases, and three proposed "rewires": old endings whose "Continue to →" door moves to a new exhibit so the new rooms are reachable from the old walk. The worker had no shell and counted limits by hand; the orchestrator's validator script (lengths, tag regex, phrase coverage, self-loops, strong connectivity across all six exhibits, ≤3 rewires) found 0 errors. Founder approved the text and the rewires.
- **T-011b — plates 004–006 (frontend-designer, Sonnet).** Same spec and furniture as 001–003; 11.9–14.9 KB each. The worker fixed two defects it found by reading its own renders (a dial label touching the crumb tray; an unreadable 5-column jack field, whose fix then routed a cord through two jacks — also caught). The orchestrator's read of the renders sent 005 (the key WAIT jack crowded by leaders and the lamp) and 006 (a dimension line through the cloud, "groups of 5" tallies that were not groups of five, a leader across the kettle body) back for one polish round. Accepted after it.
- **T-011c — the publish script (Codex gpt-5.5).** Dry run by default; strong references force an order: endings first without `leadsTo` → each artifact as draft → submit → approve (pinned to the draft `_rev`) → guarded publish → one `ifRevisionId`-guarded transaction for all ten `leadsTo` values. Independent review (Opus `reviewer`) passed with fixes: the medium one was that nothing checked a `leadsTo` target existed, so a missing target would have failed the final step *after* the exhibits were already live. Mutation proved the check was dead code. Fixed with four lower findings.
- **Live run 1 stopped part-way — a real design flaw in our own review system.** Step A published the seven endings; the toaster plate uploaded and its draft was created; then *submit review* failed: `artifactReview.artifact` was a **strong** reference, and a brand-new artifact has no published document to point to. The custom review flow had only ever been used on artifacts that already existed, so it could never have reviewed a new exhibit — in the script or in Studio. Codex had answered "yes, the flow supports brand-new artifacts" by reading the pure functions, not Content Lake's referential integrity; the reviewer had accepted that answer. Nothing visitor-facing broke: no published artifact pointed at the new endings. Fix: the review → artifact reference is now weak (`weak: true` in schema, `_weak: true` in the domain). Log: `evidence/T-011/publish-attempt-1-failed.txt`.
- **A resume mode, and a second failure.** Rather than delete published documents, the script gained `PUBLISH_RESUME=1`: skip endings that match the plan exactly, reuse the toaster draft and asset. Its dry run (no writes) falsely reported all three unpublished artifacts as "already exists" and four endings as changed. The orchestrator read the live documents directly and confirmed the report was wrong. Second failure on one task, so per the charter it moved to a different family.
- **T-011c2 — root cause (builder, Sonnet).** Two bugs. (1) Results were zipped to ids **by position**, assuming outcomes came before artifacts when the list was artifacts first, so every document was compared against the wrong plan. (2) Equality used `JSON.stringify`, which is key-order sensitive; Sanity returns keys in its own order. Fixed with lookup by `_id` and a structural comparison. The **cross-family review (Codex gpt-5.6-sol) returned "fail"**: a draft edited in Studio between preflight and approval could have gone live unchecked; resume mode skipped the missing-era, missing-target and rewire-draft checks; sparse arrays compared loosely. All three fixed and re-reviewed: pass.
- **Resume run: success.** 3 artifacts published through submit → approve → guarded publish (approved revisions recorded per artifact), 7 endings reused, 10 `leadsTo` values set and verified, 0 drafts, 3 plate assets 800×600 on the Sanity CDN. `sanity documents validate`: 28/28 valid. Anonymous CDN: 6 artifacts, 0 drafts. Logs: `evidence/T-011/publish-resume-executed-log.txt`, `evidence/T-011/publish-executed.json`.
- **T-011d — browser proof (builder, Sonnet).** 25 new e2e tests: six exhibits on the home page (two per wing), each new plate served from Sanity, the switchboard's three choices, all seven new doors, the three rewired doors, new ticket phrases, and wing pages. RED shown first; one door expectation mutation-proved. Screenshots in `evidence/T-011/screens/`, read by the orchestrator.
- **Gates re-run by the orchestrator**: unit **187/187**, typecheck, lint, e2e **42/42** (port 3100 checked free before and after), `sanity documents validate` 28/28.
- **Lesson.** "Does the flow support X?" has to be answered against the data store's rules, not only the code's. Two model families agreed on a claim that one dry run could not test, because the dry run never attempted a write. A dry run proves the plan, not the write.
- **Known limitations / follow-ups (for T-012).** On every exhibit page the "SELECTED" badge runs into the choice label; "Continue to →" wraps awkwardly on long titles; the vitrine column is still taller than the plate; ticket sentences repeat "You leave here". `quiet-refusal` now appears in four endings and may show up often on tickets.

## T-012 (part 1) — polish, ticket wording, link previews (Sep 23)

- **T-012b exhibit polish (frontend-designer, Sonnet):** the SELECTED badge now sits apart from the choice text, "Continue to →" stays together while long titles wrap as a block, and the drawing frame hugs the plate. +8 geometry-based browser tests (RED 8 failed → GREEN 8 passed). Screenshots read by the orchestrator in evidence/T-012/screens/. Leftover: on phones the onward title wraps in a narrow column.
- **T-012c ticket stem (Codex gpt-5.5):** the ticket no longer repeats "You leave here". The orchestrator rejected two versions: the first produced "And 4th later, you are still…" on long walks (tag phrases were uncapped); the second fixed a word clash by silently rewriting approved copy ("still" → "yet"). That second failure came from the orchestrator's own test instruction. Accepted version: stems "You leave here" / "You also go out" / "And you walk on", at most 9 phrases, phrases rendered verbatim, with tests for all three.
- **T-012d metadata (builder, Sonnet):** per-exhibit and per-wing titles, descriptions, and 1200×630 link-preview cards; icon.svg; sitemap.xml; robots.txt (disallows /studio). +11 browser tests, +6 unit tests, mutation proof (4 over-long summaries went red). Real bug caught: the sitemap was prerendered at build time from a stale Sanity response that listed only the 3 older exhibits. It is now dynamic like every other Sanity route. Limitation: the preview cards are text only, because Satori cannot draw the raw SVG plates.
- Orchestrator re-ran everything: unit 197/197, typecheck, lint, e2e 61/61 (port 3100 free before the run). The e2e run rewrites evidence/T-011/screens, so those were restored from git.
- Lesson: a test that says "no word appears in both" invites a worker to change the words. Say what must stay fixed, not only what must differ.

## Sep 26 — public repository and the /about page (T-012a, T-012e)

- Founder approved a public GitHub repository. Before pushing, the orchestrator scanned the whole history for keys/tokens/private keys (none) and checked tracked files and screenshots for credentials (none). Created https://github.com/syedjawad11/museum-of-unfinished-futures and pushed `main` at `87ca9d6`.
- T-012a closed: founder answers — keep the Hermes wording for now, model name "Opus 5.5", link the repository.
- T-012e (frontend-designer, Sonnet): `/about` renders the approved colophon; footer "Source on GitHub" now points at the repository. RED 7 failed → GREEN 8 passed; mutation proof failed as expected. Orchestrator re-ran unit 197/197, typecheck, lint, e2e 69 passed, `git diff --check`. The full e2e run rewrites `evidence/T-011/screens/*.png` as a side effect; restored from git.
- Sanity Workflows docs (early access, packages 0.35.0) saved under `docs/reference/sanity-workflows/` for the offline builder. No plan gate or charge found in the docs; the engine's checks are advisory during early access.

## Sep 26 — official Sanity Workflows (T-013a)

- Orchestrator installed `@sanity/workflow-*` 0.35.0 (+ `@sanity/sdk` 3.5, test bench as dev dependency). Two overrides: `@sanity/mutate` 0.18.2 under `@sanity/sdk` (documented by Sanity), and `@sanity/workflow-blueprint`'s optional TypeScript ^6 peer pinned to our TypeScript 5.9 (blueprint generation is experimental and unused). `npm ls` valid.
- Codex gpt-5.5 wrote `workflows/exhibit-review.ts` (drafting → curatorial-review → approved → on-display; request changes needs a reason; publishing held in drafting and review), `sanity.workflow.ts`, the Studio plugin registration, and `docs/workflows-spike.md`. Attempt 1 rejected: shape-only tests. Attempt 2: six behavioural tests on the real engine, mutation-proved.
- Gates re-run by the orchestrator: unit 203/203, typecheck, lint, e2e 69 passed, workflow `deploy --check`.
- Review (Claude reviewer): pass with fixes. High finding on privacy refuted with the official IDs doc and live anonymous queries.
- Live: definition `production.exhibit-review.v1` deployed to `production_1`. Demo run on the vending machine exhibit walked every stage, including a refused empty-reason change request. Anonymous API and CDN return nothing for workflow documents. Evidence: `evidence/T-013/`.
- Decision: run both. The custom `artifactReview` flow stays the hard publish gate (revision pinning, validation-gated publish); Workflows coordinates the curator's stages in Studio. Workflows' checks are advisory in early access.

## Sep 26 — 60-second page caching (T-015) and the DEV post draft (T-016a)

- T-015 (builder, Sonnet): home, wing pages and sitemap are now cached and refreshed at most every 60 seconds instead of rebuilt on every visit. Exhibit pages and the ticket page stay live per visit because they read the visitor's choice from the address; caching them could show one visitor's choice to another. The sitemap's "just the home page" fallback was removed, because under caching it would have been stored as the real sitemap during a Sanity outage; now an outage keeps the last good version. Unit tests lock in that the content reader fails loudly rather than returning an empty museum (mutation-proved).
- Orchestrator re-ran: unit 206/206, typecheck, lint, e2e 77 passed, build route table (`/` and `/sitemap.xml` 1m revalidate, `/eras/[slug]` ●). The worker briefly used `git stash` for its RED run; nothing was lost.
- T-016a (content-writer, Opus): first DEV post draft in `docs/submission/`, not published. Orchestrator read it against this log and verified the public query URL logged out.
- Founder approved going live on Netlify (not DEV) after seeing the site; the three production-deploy deny rules were lifted for this deploy and will be restored afterwards.

## Sep 26 — first production deploy (T-017)

- Deployed commit `7b83620` to production: deploy `6ab7e00cee525798fc0c5281`, https://museum-of-unfinished-futures.netlify.app. Deny rules restored straight after.
- The site sits behind Netlify's team-login protection for all deploys (`password_context: all`), so logged-out visitors get a 401 login redirect. The founder can review it while logged in. Turning protection off (founder approval) and the logged-out visitor checks come before the DEV submission. Evidence: `evidence/T-017/production-deploy.txt`.

## Oct 1 — final sprint, Phase 0 preflight (T-018-0)

- Fresh clone on a new MacBook (Node 26.10.0). `npm ci`, then the full gate: unit 206/206, typecheck, lint, build, e2e 77 passed, `sanity schemas validate` 0 errors, `git diff --check` clean. The e2e server logs "destination stream closed early" a few times with no failing test; noted, not chased.
- Production is now public: every route returned 200 to a logged-out curl. The founder had switched Netlify protection off.
- `docs/reference/` is gitignored, so the saved Sanity docs did not come with the clone. Re-fetched as markdown from sanity.io (39 Workflows pages, plus Agent Actions, App SDK, Live). Workflows 0.36 shipped Sep 30; we stay on 0.35.0 for now because its migrations touch nothing we use.
- Finding for T-018: the Workflows engine takes the actor from the calling token, so a Clerk run on the founder's user token would be recorded as the founder. The agent needs its own robot token to be recorded as an agent, and its ban on approving is engine-advisory unless backed by dataset roles.
- Later on Oct 1: the founder logged in to the Sanity CLI (Administrator on `wa27n68e`). Read-only checks found 0 drafts, plus the deployed `production.exhibit-review.v1` and the T-013 demo instance. The founder added the production CORS origin; verified with `sanity cors list` and a credentialed preflight (`204`, allow-origin plus allow-credentials true).
- T-018 design drafted (`docs/task-packets/T-018-acquisitions-clerk.md`). It uses Agent Actions **Prompt**, not Generate/Transform: those can fill reference fields only through the deprecated Embeddings Index API, and an artifact is mostly references. The Workflows run is bridged into the existing revision-pinned `artifactReview` gate, which stays the only thing that unlocks Publish. The Clerk runs on its own robot token so the history records an agent. Waiting for founder approval.

### Resume here (evening, Oct 1) — superseded by "Resume here (setup day)" at the end of this log
Waiting on the founder:
1. Studio Workflows panel check on production `/studio` (checklist in `T-018-0-preflight.md`).
2. Approve the T-018 design.
3. Create the "Acquisitions Clerk" robot token (Editor) as `SANITY_CLERK_TOKEN` in `.env.local`.
4. Report the AI credits left (Manage → Settings → Spending limits).
Next for the orchestrator after approval: T-018 tests first. Start with the in-memory workflow test proving that a draft-only subject works, then the `src/agents/acquisitions-clerk/` module, then the workflow v2 definition and `deploy --check`.

## Oct 1 evening — Acquisitions Clerk built offline (T-018)

- Founder decision: no paid AI of any kind (no Anthropic or other API key). The Clerk writes with Sanity Agent Actions Prompt on the free monthly credits, or with Ollama running on the founder's Mac. The founder installs Ollama and checks the credits on setup day; everything else is built now.
- Workflow `exhibit-review` v2 (not deployed): human-only `roles: ["administrator"]` on request-changes, approve and put-on-display, and a `submittedBy` actor field. Bench tests prove the Clerk can submit but is refused the human actions, the full agent loop works, and a never-published draft can be a run's subject (this passed on v1 unchanged). `deploy --check` passes.
- `src/agents/acquisitions-clerk/` and `scripts/acquisitions-clerk.ts`: draft, revise, sync, status, and the curator-only publish. Endings stay drafts until the curator publishes, so no unreviewed text is public. 47 new unit tests, 11 mutation proofs. A rehearsal dry run against the live public collection with a saved answer produced the expected drafts; nothing was written.
- Found on the way: the test bench stamps every actor as a person, so the claim "history shows an agent" waits for the live run. `@sanity/client` refuses a GROQ parameter named `tag` (it is a request option); the instance query uses `$workflowTag`.
- Gates: unit 257/257, typecheck, lint, `sanity schemas validate` 0/0, e2e 77 passed, `git diff --check` clean (T-011 screenshots restored after e2e).

## Oct 1 evening — Curator's Desk built (T-019)

- `apps/curators-desk/`: a Sanity App SDK app (organization `onilz47gs`, read with the founder's CLI login). One screen lists every exhibit with drafts included, the state of its endings, plate and alt text, its Exhibit review stage and the review gate. Selecting one opens its live workflow run; the buttons come from the engine's evaluation for the signed-in person, and every move also updates the review gate through the same `syncReviewFromWorkflow` the Clerk uses (now shared with a new `reviewWrite` helper).
- Dependency change: `@sanity/sdk-react` 3.5.0 added at the root to match `@sanity/sdk` 3.5.0, as the Workflows App SDK guide asks. npm deduped Studio's copy too, so Studio now runs sdk-react 3.5.0 instead of 3.3.0 with its own nested sdk 3.3.0. `npm ls` is valid and `@sanity/mutate` stays at the 0.18.2 override. A logged-out local load of `/studio` boots to its CORS screen with no page errors; the signed-in Studio is re-checked on setup day.
- Found on the way: inside this repository the Sanity CLI builds the Studio even when run from the app folder, because it looks for `sanity.config.ts` in parent folders before it looks for an app. `apps/curators-desk/run.sh` stages the app outside the repository and runs the CLI there. Sanity UI 4 renamed `space` to `gap` and `columns` to `gridTemplateColumns`.
- Verified: 7 unit tests for the Desk logic (one mutation survived at first, an ending with a pending edit counted twice; a test was added and the mutation now fails), typecheck, lint, app build (our code is in the bundle), and a logged-out load that redirects to Sanity's login with no errors of its own. Not verified: the signed-in screen, which needs the founder in the Dashboard.
- Gates: unit 266/266, typecheck, lint, schemas 0/0, e2e 77 passed, `git diff --check` clean.

## Oct 1 evening — "In conservation" strip cut (T-020)

- Checked what a logged-out visitor can read on `production_1` (apicdn, raw perspective): `artifactReview` 0, drafts 0, `sanity.workflow.instance` 0, artifacts 6. Review records and workflow runs have dotted ids and stay private; drafts are private. The site reads without a token by design (T-003), so a public strip of exhibits under review would need a read token on the web server, or a public document carrying titles nobody has reviewed yet. Neither is worth it four days before the deadline. Cut, and the post says so.
- Not attempted for the same reason: next-sanity Live Content. ISR already refreshes the hall within 60 seconds of a publish, which is what the demo video shows.

### Resume here (setup day)

Everything that could be built without keys, credits or deploys is built and committed locally (not pushed): T-018 Clerk, T-019 Curator's Desk, T-021 post and screenshots; T-020 cut. The founder chose to do the AI setup on one day (Sat 3 Oct preferred; deadline Mon 5 Oct 08:59 Malta). Their checklist is `docs/submission/setup-day-runbook.md`:
1. Ollama installed with `qwen2.5:7b`, and/or Sanity free AI credits checked with no way to bill.
2. Editor robot token "Acquisitions Clerk" in `.env.local` as `SANITY_CLERK_TOKEN`, plus `CLERK_GENERATOR`.
3. Studio Workflows panel check (also covers the sdk-react 3.5.0 change).
4. Approvals, in order: workflow v2 deploy (dry run first), each live Clerk run, the curator's publish, Curator's Desk `npm run dev`, git push, DEV publish. No Netlify deploy is needed: the public site's code is unchanged since the Sep 26 deploy; only Studio's packages moved.
Then fill the post's `{{CONFIRM}}` and screenshot slots from `evidence/T-018/`.

## Oct 2 evening: setup day, brought forward (T-018 live)

- Generator: Sanity's free AI credits, 1,000 a month with a $0 cap, so it cannot bill. Ollama was not installed. The whole run used 3 credits: one each for the dry run, the draft and the revision, and every answer passed on the first try.
- The founder made the Editor robot token "Acquisitions Clerk" and saved it in `.env.local`. The Studio Workflows panel check passed on production (`T-018-0-preflight.md`).
- Workflow v2 deployed to production after a dry run that showed only the expected changes (`evidence/T-018/workflow-v2-deploy.txt`).
- Live run on "A doormat that knows who is coming":
  - The Clerk drafted it and submitted it as `g-BHx7IW47nZRW`.
  - The curator requested changes in Studio. Their note asked for choices about being known and a more sensory second ending.
  - The Clerk revised it ("Wipe your feet and let the house know you" / "Step over the threshold without being known") and resubmitted.
  - The curator approved in Studio. `sync` mirrored the approval onto the gate, then the curator ran `publish` with `--with-user-token`: a dry run first, then the real publish of the endings and the exhibit together, which also put the run On display.
  - It was live within a minute, and a ticket built from the doormat and the umbrella quotes it.
  - Evidence: `evidence/T-018/clerk-*-executed-*.json` and `evidence/T-018/screens/01–09`.
- The founder's Studio clicks were made by a Playwright-driven Chrome on the founder's own signed-in profile, at their direction. They wrote the change-request note and gave the approval in chat. The founder logged in by hand; no token was handled. Recordings were saved outside the repository (`~/Desktop/museum-demo/`).
- Found on the way:
  - Workflow history credits the Clerk by its robot id, with no separate "agent" badge.
  - Studio's Approve is not mirrored onto the gate until `sync` runs, so `publish` refuses until then, as the runbook says.
  - A revision keeps the choices' original `_key`s, so the URL reads `?choice=step-onto-the-mat` under the new label. This was left as it is, because fixing it needs another review round.
- Tests: the e2e checks that counted exactly six exhibits and exactly two per wing now treat those as minimums, because the Clerk adds reviewed exhibits. The 404 noindex check reads the first robots tag, because Next can stream two identical tags.
- Gates: unit 266/266, typecheck, lint, `sanity schemas validate` 0/0, `sanity documents validate` 32/32, e2e 77 passed. The T-011 screenshots that e2e regenerates are left uncommitted.

### Resume here (after the live run)
Checked on Oct 2 against the challenge page (dev.to/challenges/sanity-2026-09-16): a video is **not** required ("a video walkthrough or screenshots"). The Agent Session transcript is optional but encouraged. Required tags: devchallenge, sanitychallenge, sanity, ai. The post's front matter (suggested title, `published: false`) and the exact intro line are now filled.

Waiting on the founder:
- a YouTube link, or "no video"
- "push approved"
- show or skip the Curator's Desk

`evidence/T-011/screens/` holds e2e-regenerated PNGs that were left uncommitted. Restore them with `git restore evidence/T-011/screens`.

Still open:
1. Optional: Curator's Desk signed in (runbook 5b).
2. Video: `~/Desktop/museum-demo/0-full-tour.webm` is a continuous take: hall → the Clerk's exhibit → a choice → the umbrella → the ticket → Studio workflow history. The numbered clips show each live step. The founder uploads to YouTube, unlisted.
3. `git push`, which needs approval.
4. DEV front matter, the template intro line, the video URL and the Agent Session link, then publish before Mon 5 Oct 08:59 Malta.
