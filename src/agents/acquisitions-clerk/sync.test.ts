import { describe, expect, it } from "vitest";
import {
  getPublishEligibility,
  type ArtifactReview,
} from "../../domain/artifact-review";
import { syncReviewFromWorkflow } from "./sync";

const artifactId = "artifact-doormat";
const T1 = "2026-10-01T10:00:00.000Z";
const T2 = "2026-10-01T11:00:00.000Z";

function workflow(
  stage: string,
  reviewDecision: string | null = null,
  changeRequestReason: string | null = null,
) {
  return { stage, reviewDecision, changeRequestReason };
}

function sync(
  stage: ReturnType<typeof workflow>,
  review: ArtifactReview | null,
  draftRevision: string | undefined,
  now = T1,
) {
  return syncReviewFromWorkflow({ artifactId, workflow: stage, review, draftRevision, now });
}

function reviewAfter(result: ReturnType<typeof sync>): ArtifactReview {
  if (!result.ok || !result.review) {
    throw new Error(`expected a review, got ${JSON.stringify(result)}`);
  }
  return result.review;
}

describe("syncReviewFromWorkflow", () => {
  it("walks the whole agent loop onto the gate and unlocks publish for the approved revision only", () => {
    const submitted = reviewAfter(sync(workflow("curatorial-review"), null, "rev-1"));
    expect(submitted).toMatchObject({ state: "submitted", submittedRevision: "rev-1" });

    const sentBack = reviewAfter(
      sync(workflow("drafting", "request-changes", "Quieter, please."), submitted, "rev-1"),
    );
    expect(sentBack).toMatchObject({
      state: "changesRequested",
      changeRequestReason: "Quieter, please.",
    });

    const resubmitted = reviewAfter(
      sync(workflow("curatorial-review"), sentBack, "rev-2", T2),
    );
    expect(resubmitted).toMatchObject({ state: "submitted", submittedRevision: "rev-2" });
    expect(resubmitted).not.toHaveProperty("changeRequestReason");

    const approved = reviewAfter(sync(workflow("approved", "approve"), resubmitted, "rev-2"));
    expect(approved).toMatchObject({ state: "approved", approvedRevision: "rev-2" });

    expect(getPublishEligibility({ review: approved, draftRevision: "rev-2" })).toEqual({
      eligible: true,
    });
    expect(getPublishEligibility({ review: approved, draftRevision: "rev-3" })).toMatchObject({
      eligible: false,
      reason: "approvedRevisionMismatch",
    });
  });

  it("refuses to approve on the gate when the draft changed after it was submitted", () => {
    const submitted = reviewAfter(sync(workflow("curatorial-review"), null, "rev-1"));

    expect(sync(workflow("approved", "approve"), submitted, "rev-1-edited")).toEqual({
      ok: false,
      code: "staleSubmittedRevision",
      expectedRevision: "rev-1",
    });
  });

  it("refuses a resubmit when the revision did not change anything", () => {
    const submitted = reviewAfter(sync(workflow("curatorial-review"), null, "rev-1"));
    const sentBack = reviewAfter(
      sync(workflow("drafting", "request-changes", "Fix it."), submitted, "rev-1"),
    );

    expect(sync(workflow("curatorial-review"), sentBack, "rev-1")).toMatchObject({
      ok: false,
      code: "draftRevisionUnchanged",
    });
  });

  it("does nothing while a fresh draft is still in drafting", () => {
    expect(sync(workflow("drafting"), null, "rev-1")).toEqual({
      ok: true,
      status: "noop",
      review: null,
    });
  });

  it("is idempotent: syncing the same state twice changes nothing the second time", () => {
    const submitted = reviewAfter(sync(workflow("curatorial-review"), null, "rev-1"));
    expect(sync(workflow("curatorial-review"), submitted, "rev-1")).toMatchObject({
      status: "noop",
    });

    const sentBack = reviewAfter(
      sync(workflow("drafting", "request-changes", "Fix it."), submitted, "rev-1"),
    );
    expect(
      sync(workflow("drafting", "request-changes", "Fix it."), sentBack, "rev-1"),
    ).toMatchObject({ status: "noop" });

    const approved = reviewAfter(sync(workflow("approved"), submitted, "rev-1"));
    expect(sync(workflow("on-display"), approved, "rev-1")).toMatchObject({
      status: "noop",
    });
  });

  it("will not approve on the gate a run that was never submitted there", () => {
    expect(sync(workflow("approved"), null, "rev-1")).toEqual({
      ok: false,
      code: "reviewRequired",
    });
  });
});
