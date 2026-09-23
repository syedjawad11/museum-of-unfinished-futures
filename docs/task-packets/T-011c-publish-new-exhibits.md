# T-011c-publish-new-exhibits

Plain-language goal: a careful, dry-run-first script that puts the three founder-approved exhibits (Sep 23) live in Sanity — their seven endings, their three drawings, the artifacts themselves through the real curator review flow, and the three approved door changes on old endings. Plus the eight new ticket phrases. Codex `gpt-5.5` writes it (its sandbox has no network); the orchestrator runs it with the founder's CLI login; the `reviewer` sub-agent reviews because it publishes.

```
ID: T-011c-publish-new-exhibits
Project: /home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures
Objective: Write a reproducible, dry-run-by-default CLI script that publishes the content in docs/content/new-exhibits.json to Sanity in a safe order, with the pure planning logic unit-tested first, and add the eight new ticket phrases.

Allowed files:
  src/domain/exhibit-publication.ts        (new; pure, testable logic)
  src/domain/exhibit-publication.test.ts   (new)
  scripts/publish-new-exhibits.ts          (new; run via `npx sanity exec scripts/publish-new-exhibits.ts --with-user-token`)
  src/content/ticket-lines.json            (add the 8 `newTagPhrases` to `tagPhrases`; change nothing else)
  docs/content/ticket-lines.json           (identical copy; keep the two files byte-identical after formatting)
Forbidden files: everything else, including schemas/**, src/app/**, src/components/**, public/**, tests/e2e/**, docs/content/new-exhibits.*, the existing scripts, package*.json, .env*. No network: you cannot run the script against Sanity; the orchestrator will.

Read first:
  docs/content/new-exhibits.json   — the approved content: artifacts (plain-string ids for era/outcome refs — convert to {_type:"reference",_ref} and give each choice `_type: "object"` like the live artifacts), outcomes, rewire, newTagPhrases.
  docs/content/remaining-exhibits.json — shape of live documents (choices, slug objects, references).
  scripts/attach-plates.ts + src/domain/plate-attachment.ts — the upload + review-flow + guarded-publish pattern. Reuse sanitizePlateMarkup, extractPlateAlt, checkUploadedAsset (import; do not copy). NOTE: those three artifacts already existed; these three are BRAND NEW (no published document). Read src/domain/artifact-review.ts in full and establish whether submitDraftRevision / approveSubmittedRevision / getPublishEligibility work for an artifact with no published version. If they do not, stop and report — do NOT change the domain rules.
  scripts/apply-chain.ts + src/domain/chain-application.ts — the ifRevisionId transaction pattern for patching outcomes.
  schemas/artifact.ts, schemas/outcome.ts — `leadsTo` and `choices[].outcome` are STRONG references, so a referenced document must already be published when the reference is written.
  src/content/sanity-transform.ts — the site drops an artifact whose image lacks positive dimensions.

Required order (strong references force it):
  1. Preflight (no writes): parse new-exhibits.json with a zod-validated parser; check every length/regex limit from the schemas; read the 3 new artifact ids, 7 new outcome ids, their drafts and reviews → abort if ANY already exists (published or draft); read the 3 rewire outcomes → abort if any has a draft or its current leadsTo._ref ≠ the `from` value; read the 3 era ids → must exist; read + sanitize the 3 local SVGs `public/illustrations/<slug>.svg` and extract alt → abort on failure. The alt used for the image must be the artifact's `imageAlt` from the JSON (it matches the plate desc intent); if the SVG desc differs, prefer `imageAlt` and report both in the plan.
  2. Dry-run (default): print a JSON plan of every write in order, then exit 0 having written nothing. `PUBLISH_EXECUTE=1` executes.
  3. Execute step A — one transaction: create the 7 outcomes as published documents WITHOUT leadsTo (createIfNotExists is wrong here — use create so an unexpected existing doc fails the transaction).
  4. Step B — per artifact, sequentially: upload plate (contentType image/svg+xml), checkUploadedAsset (refetch if metadata missing); create the draft `drafts.artifact-<slug>` with all fields + image{asset ref, alt}; submit → approve (ifRevisionId) → guarded publish via getPublishEligibility, exactly as attach-plates does; read back.
  5. Step C — one transaction: set leadsTo on the 7 new outcomes AND on the 3 rewire outcomes, each patch guarded by ifRevisionId from a fresh read taken just before the transaction.
  6. Read back: every new doc published, 0 drafts for all 13 ids, every leadsTo as planned, every artifact's image has url + dimensions. Print a JSON summary.
  Any error stops the run and prints the failing step. No catch-and-continue. Print a note on how far a partial run got so the orchestrator can recover.

Pure functions to export and test (tests first — paste RED then GREEN):
  - parseNewExhibits(json) → ok/err with field-level reasons (test: a too-long summary, a bad tag, a self-loop leadsTo, an unknown outcome ref each fail).
  - buildOutcomeDocs(parsed) → the 7 docs without leadsTo.
  - buildArtifactDraft(parsed artifact, assetId, alt) → draft doc with proper references, `_key`s, `_type`s, slug object.
  - buildLeadsToPatches(parsed, revisions) → 10 patches (7 new + 3 rewire), each carrying ifRevisionId; rewire patches refuse when current ref ≠ `from`.
  - planPreflight(readState) → list of blocking reasons (existing doc, existing draft, rewire mismatch, missing era).
  Prove at least two assertions can fail (mutate, show red, restore) and paste that output.

Also: add the 8 phrases from new-exhibits.json `newTagPhrases` into both ticket-lines.json files (keep key order: existing first, new appended). Add a unit test asserting every tag in new-exhibits.json outcomes has a phrase in src/content/ticket-lines.json.

Acceptance checks (run all, paste raw output):
  npx vitest run src/domain/exhibit-publication.test.ts   (RED first, then GREEN)
  npm run test:unit
  npm run typecheck
  npm run lint
  cmp src/content/ticket-lines.json docs/content/ticket-lines.json
  git status --short   (only the allowed files)
Required output: changed files; raw output of every check; the answer to "does the review flow support brand-new artifacts" with file:line evidence; known limitations; actual model ID if visible.
Limits: 45 minutes, two repair attempts, then stop and report the blocker.
Sandbox/permissions: workspace-write; no installs, network, deploys, credentials, or public actions. apiVersion "2026-09-20". No env vars other than PUBLISH_EXECUTE.
Model: gpt-5.5 (Codex)
```
