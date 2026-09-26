# T-013a-workflows-definition

Part of T-013 (official Sanity Workflows spike, 4-hour box). This packet is the offline half: definition, config, Studio plugin registration, in-memory tests. The orchestrator installs packages beforehand (network) and does any live deploy afterwards with founder approval.

```
ID: T-013a-workflows-definition
Project: /home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures
Objective: Express the museum's exhibit review as an official Sanity Workflows definition, prove every path with the real engine in memory, register the Workflows Studio plugin, and pass the CLI's offline deploy check — without removing the existing custom review flow.

Pre-installed by the orchestrator (do not install, upgrade or remove anything; you have no network):
  @sanity/workflow-* 0.35.0 (engine, cli, blueprint, studio-plugin, studio, react, sdk, components, diagram), @sanity/sdk ^3.1, and the documented @sanity/mutate 0.18.2 override. Also a package.json override pinning @sanity/workflow-blueprint's optional TypeScript peer (wants ^6) to the project's TypeScript 5.9 — blueprint generation is experimental and out of scope; `npx sanity-workflows --version` reports 0.35.0. Baseline after install: build ok, unit 197/197, typecheck ok. Check `npm ls @sanity/workflow-engine` first; if it is missing, STOP and report.

Allowed files:
  workflows/exhibit-review.ts               (new; the definition)
  workflows/exhibit-review.test.ts          (new; or tests/unit/… if vitest config only picks that up — check vitest.config.mts)
  sanity.workflow.ts                        (new; project root)
  sanity.config.ts                          (ADD the Workflows plugin + document view; do not remove or change the existing artifactReview schema/actions)
  tsconfig*.json, eslint.config.mjs, vitest.config.mts   (only if strictly needed to include the new files; explain each change)
  docs/workflows-spike.md                   (new; your findings)
Forbidden: everything else — src/app/**, src/components/**, src/domain/**, src/content/**, schemas/** (existing), scripts/**, studio/** existing actions, package.json/package-lock.json, .env*. No Sanity writes of any kind: never run `deploy` without `--check`, never run `--dry-run`, `start`, `nuke`, or anything that needs a token. Do not commit. Do not git checkout/reset anything.

Read first (saved copies of the official docs, fetched Sep 26 2026 — these are authoritative over your memory):
  docs/reference/sanity-workflows/getting-started.md, definitions-and-instances.md, fields.md, activities-and-actions.md, conditions.md, operations.md, cookbook-editorial-review.md, testing.md, deploy-definitions.md, studio-plugin.md, prerelease.md, guards.md, actors-and-enforcement.md, limits.md
  The installed package types under node_modules/@sanity/workflow-engine (exports: '@sanity/workflow-engine/define', test bench exports described in testing.md).
  Existing custom flow for parity: schemas/ (artifactReview), src/domain/ artifact-review transition code and its tests, studio/ actions. Understand what it guarantees (submit → request changes with a reason → resubmit → approve pinned to a draft revision → guarded publish that waits for Sanity validation).
  sanity.config.ts (existing plugins/actions), sanity.cli.ts (projectId wa27n68e, dataset production_1).

Requirements:
  1. Definition `exhibit-review` (defineWorkflow) whose subject is an `artifact` document. Stages: drafting → curatorial-review → approved → on-display (terminal). Transitions: submit (drafting→curatorial-review), request-changes (curatorial-review→drafting) that REQUIRES a non-empty reason field recorded on the instance, approve (curatorial-review→approved), put-on-display (approved→on-display). Publishing allowed only in `approved` (use the documented stage publishing flag if it exists — cite where). No role names that don't exist in the project (the project has a single member; avoid role-gated conditions unless using built-in roles such as administrator, and say which).
  2. If the engine supports it, record or check the reviewed draft revision (our custom flow pins approval to a `_rev`). If not supported, say so plainly in docs/workflows-spike.md — do not fake it.
  3. sanity.workflow.ts: one deployment, name "production", tag "production", expectedMinReaderModel set to the literal the CLI/docs require for this definition (find out via --check output, do not guess), workflowResource from ONE clearly named constant, `wa27n68e.production_1` for now. The founder has approved a separate private dataset if engine documents would be publicly readable in production_1; if you conclude they would be, set the constant to `wa27n68e.workflows` with a resourceAliases entry binding the content to `wa27n68e.production_1` (see deploy-definitions.md), set the Studio plugin's `workflowDataset` accordingly, and say so. The orchestrator creates that dataset; you do not.
  4. Studio: register workflowStudioPlugin({tag: "production", mappings: [{docType: "artifact", definition: "exhibit-review", label: "Exhibit review"}]}) and the Workflows document view per studio-plugin.md, keeping every existing plugin, structure customisation and document action working.
  5. docs/workflows-spike.md: what maps 1:1 from the custom flow, what doesn't (revision pinning, validation-gated publish, advisory-only guards per prerelease.md), where engine documents will live and whether they would be publicly readable in a public dataset (check document ID format in the docs/types — dotted IDs are private in Sanity public datasets), and a recommendation: migrate / run both / keep custom. Plain, honest, short.

Tests first: using the engine's in-memory test bench (testing.md), write tests that drive: the happy path drafting→…→on-display; request-changes with a reason returns to drafting and the reason is stored; request-changes WITHOUT a reason is refused; approve/put-on-display are not available from drafting (no skipping); publishing permitted only in `approved` if the engine exposes that verdict. Run RED first (definition stub), then GREEN. Mutation proof: remove the reason requirement, show the refusal test fails, restore.

Acceptance (paste raw output):
  npx sanity-workflows deploy --check --deployment production   (offline; must pass)
  npm run test:unit (full; state the "N passed" line), npm run typecheck, npm run lint, npm run build (the embedded /studio must still build with the plugin), git status --short
Required output: changed files, raw outputs, the RED/GREEN/mutation evidence, the expectedMinReaderModel value and where it came from, the contents summary of docs/workflows-spike.md, and limitations.
Limits: 75 minutes, two repair attempts. Model: Codex gpt-5.5, sandbox workspace-write, approval-policy never.
```

## Worker report
Codex gpt-5.5, two attempts. Attempt 1 rejected by the orchestrator: tests only inspected the definition's shape (the test bench package was not installed; orchestrator then installed @sanity/workflow-engine-test@0.35.0). Attempt 2: 6 behavioural tests on the real engine (happy path; request-changes stores reason then resubmit/approve; missing/empty reason refused; no skipping from drafting; publish denied in drafting/review and allowed in approved; no permanent hold after on-display). RED 2 failed → GREEN 6 passed; mutations (drop `required`, add a hold to `approved`) each failed a test and were restored. expectedMinReaderModel 10, from the CLI's reader-floor error. Removed the terminal-stage publish hold (guards lift only on stage exit).

## Acceptance note
Sep 26, orchestrator. Re-ran: deploy --check ok, unit 203/203, typecheck, lint, e2e 69 passed, git diff --check. Independent review (Claude reviewer): pass with fixes. Its one high finding (engine docs might be public in production_1) was refuted by the official IDs doc (saved as docs/reference/sanity-content-lake-ids.md: dotted IDs need authentication) and by live anonymous queries returning [] (evidence/T-013/privacy-check.txt, live-demo.txt); citation added to docs/workflows-spike.md. Low finding (stale changeRequestReason after resubmit) left as an audit trail; history records every decision anyway.
Live (founder-approved): dry-run showed 1 create; deploy created production.exhibit-review.v1. A demo run on artifact-extra-mondays-vending-machine went drafting → review → request changes (empty reason refused, then accepted with a reason) → drafting → review → approved → on-display; no guard documents remain, 0 drafts, the exhibit itself was not modified. Not verified: the Workflows panel inside the browser Studio (needs an interactive login). DONE.
