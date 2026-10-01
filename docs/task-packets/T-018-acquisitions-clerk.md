# T-018 — Acquisitions Clerk: an agent that moves drafts through `exhibit-review`

State: DESIGN (Oct 1). Waiting for the founder to approve the design below before code is written.

## Goal
A curator writes a one-line brief and picks a wing. An agent drafts a new exhibit (one artifact and two outcomes), starts an `exhibit-review` run on it, and fires `submit` itself. When a human fires `request-changes`, the agent reads the reason, revises the draft and submits again. The agent can never approve or put on display. After a human approves, the existing guarded Publish puts the exhibit live.

## API facts checked (source: `docs/reference/`, fetched Oct 1 from sanity.io/docs)
- **Actor identity** (`sanity-workflows/actors-and-enforcement.md`): the engine resolves the actor (`person | agent | system`) from the calling token, and no parameter can override it. → The Clerk runs on its own robot token (`SANITY_CLERK_TOKEN`, Editor role, in `.env.local`). It does not use `sanity exec --with-user-token`, which would record the founder.
- **Enforcement** (same page): action `roles` and guards are advisory and evaluated by the engine; only dataset access control is enforced by the lake. → `approve` and `put-on-display` get `roles: ["administrator"]` in the definition, and the Clerk's transition decider refuses them in code, with a unit test. The docs and the post will say this is advisory.
- **Subjects that were never published** (`sanity-workflows/global-document-references.md` "Use stable dataset document IDs"): pass the stable id (`artifact-x`), never `drafts.artifact-x`. The workflow's perspective decides whether the draft or the published document is read. This needs proving on the in-memory test bench with a draft-only subject before anything live. It is the T-011 strong-reference lesson again.
- **Generation** (`sanity-other/agent-actions_introduction.md`, `http-reference_agent-actions.md`, `agent-actions_prompt-quickstart.md`): Generate/Transform need a deployed schema (`schemaId`). Reference fields need the Embeddings Index API, which is **deprecated, with no replacement**, and our artifact is mostly references (era, choices → outcome, leadsTo). → Use **Agent Actions Prompt** (`client.agent.action.prompt`, `format: "json"`, `@sanity/client` 8.6.2 ≥ 7.4.0 ✓). It returns JSON and writes nothing; the Clerk validates the JSON against the schema rules and writes the draft and all references itself. Credits are shared across the org, and the remaining budget is visible in Manage → Settings → Spending limits. Fallback: the Anthropic API.

## Proposed design: bridge Workflows → the existing revision-pinned gate
The custom `artifactReview` gate stays the only thing that can unlock Publish. A pure function `syncReviewFromWorkflow({ stage, reviewDecision, changeRequestReason, review, draftRevision, now })` maps workflow state onto the existing transitions in `src/domain/artifact-review.ts`:

| Workflow event | Gate call |
|---|---|
| agent `submit` (stage → curatorial-review) | `submitDraftRevision` (pins the draft `_rev`) |
| human `request-changes` | `requestChangesForSubmittedRevision` (copies the reason) |
| agent revises and submits again | `resubmitChangedDraftRevision` |
| human `approve` (stage → approved) | `approveSubmittedRevision`, which fails with `staleSubmittedRevision` if the draft changed after submit |

The Clerk script runs the sync after each of its own moves and on a `--sync` pass, so human moves made in Studio get mirrored. The curator then uses the existing **Publish** action, which checks `approvedRevision === draft _rev`, and the new artifact and its two outcomes publish in one transaction. Nothing about revision pinning changes. The Workflows run is the conversation; the gate is the lock.

## Module layout
- `src/agents/acquisitions-clerk/`: `prompt.ts` (voice rules + 2–3 exhibits from `docs/content/*.json`), `validate.ts` (zod; schema limits; `leadsTo` only to published exhibits), `decide.ts` (submit / revise / refuse approve and put-on-display), `sync.ts` (table above). Unit tests first.
- `scripts/acquisitions-clerk.ts`: dry-run by default; `CLERK_EXECUTE=1` writes; subcommands `draft "<brief>" --wing <slug>`, `revise <artifactId>`, `sync <artifactId>`.
- `workflows/exhibit-review.ts`: add a `draftedBy` field and `roles` on approve / put-on-display; bump to v2; extend tests (agent submits, agent revises after request-changes, agent refused approve, happy path, draft-only subject) with a mutation proof; `deploy --check`.
- Plate pending: check `Vitrine`/`Plate` without `image`; add a frame plus an e2e test if needed.

## Approvals the founder must give
1. This design.
2. A robot token for the Clerk.
3. The live workflow deploy (v2).
4. Each live Clerk run.
