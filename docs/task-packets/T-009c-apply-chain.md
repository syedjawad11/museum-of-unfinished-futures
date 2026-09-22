# T-009c — apply the chain to the dataset (guarded script)

**Worker:** Codex `gpt-5.5` via the `codex` MCP tool
**Sandbox:** `workspace-write`, `approval-policy: never`, `cwd` = `/home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures`
**Limit:** 45 minutes, two repair attempts, then stop and report the blocker factually.

## Objective
Write a dry-run-by-default, optimistically-locked script that applies the approved `consequenceTags` and `leadsTo` values from `docs/content/chain-outcomes.json` to the six live outcome documents — tests first. **You write it; you do not run it against the dataset.**

## Why this shape
The founder has approved the content. The orchestrator will run the script with the founder's own Sanity CLI login. Your sandbox has no network, so you cannot reach Sanity and must not try.

**Read this carefully — it corrects an assumption:** the existing review workflow (`src/domain/artifact-review.ts`, `schemas/artifactReview.ts`) is **artifact-scoped**. `artifactReview.artifact` is a reference to an `artifact`, and `getArtifactReviewId` keys off an artifact id. Outcomes are a different document type and that state machine does not cover them. **Do not bend it to fit, and do not extend it** — a curation workflow covering every type is a separate, time-boxed task (T-013). Safety here comes from the guards below instead.

## Read these first — reuse, do NOT rebuild
- `scripts/attach-plates.ts` — the house pattern for this kind of script: `getCliClient`, an env-var execute flag, a `preflight` step that refuses to proceed on a bad precondition, a dry-run JSON report, and a written evidence file. Follow its structure closely.
- `src/domain/plate-attachment.ts` + its test — the house pattern for putting every decision in a pure, tested module so the script itself stays a thin shell. Do the same.
- `docs/content/chain-outcomes.json` — the approved input. Its `leadsTo` is an expanded `{ artifactId, slug, title }` object for reviewability; Sanity needs `{ _type: "reference", _ref: artifactId }`. Converting that is your job.
- `schemas/outcome.ts` — the validation the result must satisfy (1–4 tags, each `^[a-z0-9-]{2,32}$`, unique; `leadsTo` a reference to an `artifact`).

## Deliverables
1. **`src/domain/chain-application.ts` + `src/domain/chain-application.test.ts` — tests first.** Pure, no I/O, no network:
   - `parseChainProposal(json)` → validated plan, or a typed error. Reject: an outcome id not in the known six; a tag failing the schema regex; duplicate tags within an outcome; fewer than 1 or more than 4 tags; a `leadsTo` pointing at the outcome's own artifact; a missing or unknown `artifactId`.
   - `buildOutcomePatch(entry, publishedDoc)` → the exact patch to send (`consequenceTags` as a plain string array, `leadsTo` as `{ _type: "reference", _ref }`), leaving every other field untouched.
   - `checkPreconditions(publishedDoc, entry)` → refuse when the document is missing, when it is not `_type: "outcome"`, or when it **already** has non-empty `consequenceTags` or a `leadsTo` (this script is for first application, not overwriting curated work).
   - Test every rejection path, plus the happy path for all six real outcome ids.
2. **`scripts/apply-chain.ts`** — thin shell:
   - **Dry run unless `CHAIN_EXECUTE=1`.** Default output: a JSON report of exactly what would change per document, and nothing else.
   - Preflight **all six** documents before writing **any**: fetch each published outcome, run `checkPreconditions`, and if any one fails, print the reason and exit non-zero **having written nothing**. All six succeed or none are touched.
   - Every write uses `ifRevisionId` with the `_rev` read during preflight, so a document changed by anyone in between causes a failure rather than a silent clobber.
   - Writes go to the published documents (these fields have never been used, so there is no draft to reconcile) — but if a draft exists for any outcome, treat that as a failed precondition and stop.
   - On success write `evidence/T-009/apply-chain-executed.json`: per document, the id, the `_rev` before and after, the tags and the `leadsTo` ref applied.
   - Print a final line stating how many documents were modified.
   - **Never print or write a token.** The client comes from `getCliClient`; there is no credential in this repo and you must not add one.
3. Add an npm script if `attach-plates` has one; otherwise document the exact invocation in a comment at the top of the file.

## Allowed files
`src/domain/chain-application.ts`, `src/domain/chain-application.test.ts`, `scripts/apply-chain.ts`, and `package.json` **only** if it is solely to add a script entry mirroring the existing plates entry.

## Forbidden
`schemas/**`, `src/content/**`, `src/app/**`, `src/components/**`, `src/domain/artifact-review.ts`, `src/domain/outcome-chain.ts`, `docs/content/**`, `tests/**`, `.env*`, `package-lock.json`. Add no dependencies. **Do not call Sanity. Do not set `CHAIN_EXECUTE`. Do not deploy, publish, or commit.**

## Acceptance commands — paste raw output for each
```
npm run test:unit      # expect the 129 existing tests plus yours, all passing
npm run typecheck
npm run lint
```
Do **not** run `npm run test:e2e` — it needs port 3100 and the orchestrator runs it. Do not attempt a live dry run; there is no network in your sandbox. Instead, demonstrate the logic with unit tests against fixture documents.

## Required output
- changed files (paths)
- the first failing (RED) test run, then raw output of every acceptance command
- the exact command the orchestrator should run for a dry run, and the exact command for the real run
- in one sentence: what happens if document 4 of 6 has been edited by someone since preflight
- known limitations / anything not done
- actual model ID if visible
