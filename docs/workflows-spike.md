# Workflows Spike

T-013a expresses the museum artifact review loop as an official Sanity Workflows
definition while leaving the existing `artifactReview` schema and Studio actions
in place.

## What Maps Cleanly

- Drafting to curatorial review maps to the `submit` action on the `drafting`
  stage.
- Requesting changes maps to `request-changes`, a required `reason` parameter,
  the persisted `changeRequestReason` workflow field, and a transition back to
  `drafting`.
- Approval maps to the `approve` action and an `approved` stage.
- The final display step maps to `put-on-display`, which moves the run to the
  terminal `on-display` stage.
- Publishing outside `approved` is represented with Workflows publish guards on
  `drafting` and `curatorial-review`. The installed 0.35.0 stage type does not
  expose a separate stage-level publishing flag; the documented mechanism is a
  guard. There is intentionally no guard on terminal `on-display`: the docs say
  a stage with no outgoing transitions is terminal when reached, and that guards
  are registered on stage entry and removed on stage exit. A terminal-stage
  guard has no later exit, so it would hold forever after display.

## Gaps

- Revision pinning is not equivalent. The custom flow stores
  `submittedRevision` and `approvedRevision` from the artifact draft `_rev`, and
  the guarded publish action refuses to publish when the current draft `_rev`
  differs. Workflows can store fields and read referenced document content, but
  the official definition language does not expose a first-class "pin approval
  to this subject `_rev` and compare at publish" primitive. Adding it would need
  a custom action/runtime integration outside this definition.
- Validation-gated publish is not equivalent. The custom guarded publish action
  waits for Sanity validation before publishing. This definition only models the
  workflow state and the advisory publish hold.
- Workflows guards are advisory during early access. The Studio plugin and
  engine honor them, but the Content Lake does not enforce `temp.system.guard`
  documents yet. Rules that must hold against direct Content Lake writes still
  belong in dataset access control or the existing custom publish action.

## Workflow Data

The deployment currently stores engine documents in `wa27n68e.production_1`.
Workflows owns `sanity.workflow.definition`, `sanity.workflow.instance`, and
`temp.system.guard` documents. Definition ids are documented as
`<tag>.<name>.v<version>`, instances are engine-minted as
`<tag>.wf-instance.<random>`, and guards derive dotted ids from the instance and
guard names. Evidence: `docs/reference/sanity-workflows/definitions-and-instances.md:49`
documents definition IDs as `<tag>.<name>.v<version>`, and
`node_modules/@sanity/workflow-engine/dist/index.d.ts:5702` documents
engine-minted instance IDs as `<tag>.wf-instance.<random>`. Dotted Sanity
document IDs are private documents in a public dataset (official source, saved at
`docs/reference/sanity-content-lake-ids.md:38` and `:72-73`: "All documents that
contain a `.` in their _id can only be accessed when a user is logged in or a
valid authentication token is provided"), so these engine documents are not
publicly readable through the public production dataset surface. The orchestrator
re-checks this with an anonymous query after the live deploy (see build log).

Recommendation: run both flows for now. Keep the custom flow as the hard gate
for revision-pinned, validation-gated publishing, and use Workflows in
`production_1` as a Studio coordination layer. A separate `workflows` dataset is
still reasonable later for operational isolation and cleanup, but it is not
required to prevent public reads of the engine documents.
