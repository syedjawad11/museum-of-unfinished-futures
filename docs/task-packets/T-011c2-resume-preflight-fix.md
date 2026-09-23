# T-011c2-resume-preflight-fix

Re-scoped from T-011c after two failures by Codex gpt-5.5 (charter rule: third attempt goes to a different model family).
- Attempt 1 (live run): stopped at "submit review" — `artifactReview.artifact` was a strong reference, so a review for a never-published artifact could not be created. Fixed (weak reference, `_weak: true`); unit 171 green. Log: evidence/T-011/publish-attempt-1-failed.txt.
- Attempt 2 (resume dry run, no writes): preflight falsely blocks. Log: evidence/T-011/publish-resume-dry-run-attempt-2-failed.txt.

```
ID: T-011c2-resume-preflight-fix
Project: /home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures
Objective: Make the PUBLISH_RESUME=1 preflight in scripts/publish-new-exhibits.ts report the live partial state correctly, proven by unit tests built from the real live documents below.

Allowed files:
  scripts/publish-new-exhibits.ts
  src/domain/exhibit-publication.ts
  src/domain/exhibit-publication.test.ts
Forbidden: everything else (schemas/**, src/domain/artifact-review*.ts, src/app/**, public/**, docs/**, evidence/**, .env*). No network: you cannot run the script against Sanity — the orchestrator will. Do not commit.

Read first: this packet; docs/task-packets/T-011c-publish-new-exhibits.md (original requirements); the two logs above; the resume code (planResumePublication and its callers, prepareRun around scripts/publish-new-exhibits.ts:185-270, readDocuments).

Verified live state (orchestrator read it directly with getDocument, Sep 23 ~20:25):
  - artifact-future-self-toaster, artifact-unfinished-conversations-switchboard, artifact-weather-of-visits-kettle: published = null.
  - drafts.artifact-future-self-toaster exists, keys: _createdAt,_id,_rev,_type,_updatedAt,accessionNote,artifactLabel,choices,era,image,slug,summary,title,visualDescription (image.asset._ref = image-f264b1f250a5b6644770c79b0c2edef59c0e41ab-800x600-svg). Other two drafts: null.
  - All 7 new outcomes published, created by step A in one transaction; keys: _createdAt,_id,_rev,_type,_updatedAt,body,consequenceTags,era,title; no leadsTo.
  - Only 3 artifactReview docs exist (the three old artifacts, approved). None for the new ones.

The attempt-2 preflight nonetheless reported:
  - "Published outcome X differs from the planned document" for 4 of the 7 outcomes (exchange-goes-quiet, blank-jack-rings, afternoon-comes-indoors, kettle-stays-cold) — the first 3 passed.
  - "Published artifact <each of the 3> already exists" — all false.
Suspect an id↔document misalignment when reading/zipping results (e.g. readDocuments/getDocuments returning a different order or length than requested, or results of one read being indexed against another id list), and/or a comparison that is not order- or key-insensitive. Find the actual cause; do not guess-fix.

Tests first:
  1. Build fixtures that mirror the live state above (including _rev/_createdAt/_updatedAt and key order as Sanity returns it; the outcome docs should equal buildOutcomeDocs(...) output plus system fields) and assert planResumePublication yields: skip all 7 outcomes, reuse the toaster draft + asset, create switchboard and kettle, zero blockers.
  2. If the bug is in the script's read/zip step, extract that step into a pure function in exhibit-publication.ts (e.g. map results by _id, never by index) and test it with results returned in a shuffled order and with nulls.
  3. Keep the existing negative tests (mismatched outcome blocks, mismatched draft blocks) green.
  Paste RED, then GREEN. Mutation proof on the new id-mapping or equality code (back up first, mutate, red, restore).

Acceptance (paste raw output): targeted vitest RED/GREEN, npm run test:unit, npm run typecheck, npm run lint, git status --short.
Required output: root cause in one or two sentences with file:line; changed files; raw outputs; limitations.
Limits: 45 minutes, two repair attempts, then stop and report.
Model: sonnet (builder)
```
