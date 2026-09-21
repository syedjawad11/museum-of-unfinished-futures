# T-007-plates-into-sanity

Plain-language goal: the three blueprint drawings currently live only as files in the code. This task uploads them to Sanity as image assets and attaches each one to its exhibit through the museum's own curator review flow (draft → submitted → approved → guarded publish), so the drawings become content the curator can manage, and the site starts serving them from the Sanity CDN with the local files as the fallback.

Split: Codex `gpt-5.5` writes the script + tests (no network in its sandbox); the orchestrator runs it against the real dataset with the founder's CLI login; the `reviewer` sub-agent (Sonnet 5) reviews because the script publishes content.

```
ID: T-007-plates-into-sanity
Project: /home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures
Objective: Write a reproducible, dry-run-by-default CLI script that uploads the three plate SVGs as Sanity image assets and attaches each to its artifact (`image` + `alt`) through the artifactReview flow with a guarded publish, with the pure decision logic unit-tested first.

Allowed files:
  scripts/attach-plates.ts            (new; run via `npx sanity exec scripts/attach-plates.ts --with-user-token`)
  src/domain/plate-attachment.ts      (new; pure, testable logic used by the script)
  src/domain/plate-attachment.test.ts (new)
Forbidden files: everything else. In particular do NOT edit schemas/**, src/content/**, src/components/**, src/app/**, public/**, docs/**, scripts/curator-demo.mjs, package*.json, any .env*. No network calls from your sandbox: you cannot run the script against Sanity; the orchestrator will.

Read first:
  scripts/curator-demo.mjs               — the authenticated CLI pattern (getCliClient, ifRevisionId patches, guarded publish transaction, toStoredDocument). Mirror its style.
  src/domain/artifact-review.ts          — the review state machine. Reuse submitDraftRevision / approveSubmittedRevision (or whatever the approve function is named) and the publish-eligibility helper instead of re-implementing the rules. Read the whole file.
  src/content/plate-markup.ts            — reuse `sanitizePlateMarkup` and `isAllowedPlateUrl` (import them; do not copy).
  src/content/sanity-transform.ts        — note `resolvedImageSchema`: the site REQUIRES `asset.metadata.dimensions.width/height` to be positive numbers, else the whole artifact fails to parse and disappears from the site.
  schemas/artifact.ts                    — `image` field: type image with hotspot and an `alt` string (required, 20–320 chars).
  public/illustrations/*.svg             — each has `<title id="plate-title">` and `<desc id="plate-desc">`.

Requirements:
  1. Manifest (in src/domain/plate-attachment.ts): the three slugs `extra-mondays-vending-machine`, `memory-umbrella`, `roads-not-taken-telephone`; artifact id = `artifact-<slug>`; draft id = `drafts.artifact-<slug>`; review id via getArtifactReviewId; local file = `public/illustrations/<slug>.svg`; asset filename = `<slug>.svg`.
  2. Alt text = the SVG's `<desc>` text, whitespace-collapsed. Export a pure `extractPlateAlt(markup): { ok: true, alt } | { ok: false, reason }` that fails when the desc is missing, shorter than 20 chars, or longer than 320 chars. Test it.
  3. Export a pure `checkUploadedAsset(asset: { url: string; metadata?: { dimensions?: { width?: number; height?: number } } }): { ok: true } | { ok: false, reason }` that requires `isAllowedPlateUrl(asset.url)` AND positive dimensions. Test both failure branches and the success branch.
  4. Export a pure `buildDraftWithPlate(published, assetId, alt)` returning the draft document: published fields minus `_rev/_createdAt/_updatedAt`, `_id` = draft id, `image: { _type: "image", asset: { _type: "reference", _ref: assetId }, alt }`. Test it.
  5. Script flow (scripts/attach-plates.ts), per slug, sequential:
     a. Read the local SVG, run `sanitizePlateMarkup`; abort the whole run on failure (before any writes).
     b. Read published artifact, existing draft, existing review. Abort BEFORE ANY WRITES if any artifact is missing or already has a draft. An existing review in any state is allowed (the telephone has an approved review from the M04 demo); submitting a new draft revision replaces it per the state machine.
     c. Dry-run (default): print a JSON plan for all three (artifactId, file, bytes, alt, existing review state, hasDraft) and exit 0 without writing anything. `PLATES_EXECUTE=1` executes.
     d. Execute: `client.assets.upload("image", buffer, { filename, contentType: "image/svg+xml" })`; run `checkUploadedAsset` on the returned document (re-fetch it by id if metadata is missing from the upload response); abort on failure.
     e. Create the draft with `buildDraftWithPlate` (createOrReplace), re-read it for `_rev`.
     f. Submit: apply the state machine result of submitDraftRevision to the review document (createOrReplace with the returned review object — it already contains state/submittedRevision/submittedAt and omits approved/changeRequest fields, so createOrReplace is the correct way to clear them). Re-read.
     g. Approve: use the domain approve function with the current draft `_rev`; patch the review with `ifRevisionId` and set approvedRevision/approvedAt/state exactly as curator-demo does. Re-read.
     h. Guarded publish: re-read draft and review; use the domain publish-eligibility helper; only if eligible run the transaction createOrReplace(published from draft) + delete(draft). Abort otherwise.
     i. Read back: published `image.asset._ref`, `image.alt`, no draft, review approved with approvedRevision === the draft rev that was published. Print a JSON summary per artifact (ids, revisions, asset id, asset url, bytes, dimensions).
     Any thrown error stops the run; do not catch-and-continue. Print which step failed.
  6. Tests first: write src/domain/plate-attachment.test.ts, run `npx vitest run src/domain/plate-attachment.test.ts` and paste the RED output, then implement and paste GREEN.
  7. Use apiVersion "2026-09-20" like curator-demo. No secrets, no tokens, no env vars other than PLATES_EXECUTE.

Acceptance checks (run all, paste raw output):
  npx vitest run src/domain/plate-attachment.test.ts   (RED first, then GREEN)
  npm run test:unit
  npm run typecheck
  npm run lint
  git status --short   (only the three allowed files)

Required output:
  - Status: done | partial | blocked
  - Changed files
  - Raw output of every acceptance command
  - Known limitations / anything not done
  - Actual model ID if visible
Limits: 45 minutes, two repair attempts on a failing gate, then stop and report the blocker honestly. No scope widening (no schema/transform changes, no component changes, no new npm packages).
Sandbox/permissions: workspace-write inside the project; no installs, deploys, credentials, network calls, or public actions.
Model: gpt-5.5
```

## Worker report (Codex gpt-5.5, thread 01a0c551-7f04-7a42-9ce1-148dd5f60239, Sep 21 ~20:58)

Status: done. Model ID visible: `gpt-5.5`. Changed files: `scripts/attach-plates.ts`, `src/domain/plate-attachment.ts`, `src/domain/plate-attachment.test.ts`. RED: `Cannot find module './plate-attachment'` (1 file failed, 0 tests). GREEN: 8/8 focused, unit 102/102, typecheck clean, lint clean, `git status --short` only the three allowed files (+ this packet). Limitation: did not run the script against Sanity (no network in sandbox), as intended.

## Orchestrator run (Sep 21 ~21:00)

- Dry run (`npx sanity exec scripts/attach-plates.ts --with-user-token`): three plates planned, alt text taken from each SVG `<desc>` (163/173/155 chars), no drafts, one pre-existing approved review on the telephone (from the M04 demo).
- Execute (`PLATES_EXECUTE=1 …`): all three uploaded and published. Evidence: `evidence/T-007/attach-plates-executed.json`. Sanity read 800×600 from the viewBox, so the transform's dimensions requirement is met. Asset ids end in `-800x600-svg`; CDN URLs are `https://cdn.sanity.io/images/wa27n68e/production_1/<sha1>-800x600.svg`.
- Verification: `npm run sanity:check` 15 docs / 3 artifacts; `npx sanity documents validate` 15/15 valid, 0 errors; CDN answers 200 `image/svg+xml` for all three (Sanity normalises the SVG on serve — comments stripped, self-closing tags expanded — semantically identical and it passes the plate sanitizer); production server shows `data-plate-source="sanity"` ×3 on home and ×1 on each exhibit page; e2e 7/7.

## Independent review (reviewer sub-agent, Sonnet 5, Sep 21 ~21:05)

Verdict: pass with fixes. Publishing-safety trace confirmed: submit → approve → guarded publish through the domain state machine, `ifRevisionId` on every write, eligibility checked on freshly read documents right before the publish transaction, existing approved review correctly superseded. Findings: [minor] no test for XML entities in `<desc>`; [minor] no exact 20/320-char boundary tests; [nit] comment the intentional duplicate read. All three applied by the same Codex thread (10/10 focused tests, typecheck and lint clean). Not checked: the RED transcript retroactively; live dataset state (orchestrator did that above).

## Acceptance (orchestrator)

Diff read in full. Gates rerun: unit 104/104, typecheck, lint, build, e2e 7/7, `git diff --check`, secret scan clean. Scope: only the three allowed code files plus packet and evidence. DONE.
