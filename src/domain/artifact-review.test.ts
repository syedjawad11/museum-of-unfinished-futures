import { describe, expect, it } from "vitest";
import {
  ARTIFACT_REVIEW_REASON_MAX_LENGTH,
  approveSubmittedRevision,
  getArtifactReviewId,
  getPublishEligibility,
  requestChangesForSubmittedRevision,
  resubmitChangedDraftRevision,
  submitDraftRevision,
  type ArtifactReview,
} from "./artifact-review";

const NOW = "2026-09-20T10:00:00.000Z";
const LATER = "2026-09-20T11:00:00.000Z";
const artifactId = "artifact.extra-mondays";

function submittedReview(overrides: Partial<ArtifactReview> = {}): ArtifactReview {
  return {
    _id: getArtifactReviewId(artifactId),
    _type: "artifactReview",
    artifact: { _type: "reference", _ref: artifactId },
    state: "submitted",
    submittedRevision: "draft-rev-1",
    submittedAt: NOW,
    ...overrides,
  };
}

describe("artifact review transitions", () => {
  it("creates a submitted review for the current draft revision", () => {
    expect(
      submitDraftRevision({
        artifactId,
        review: null,
        draftRevision: "draft-rev-1",
        now: NOW,
      }),
    ).toEqual({
      ok: true,
      status: "changed",
      review: submittedReview(),
    });
  });

  it("treats an unchanged repeated submit as a no-op", () => {
    const review = submittedReview();

    expect(
      submitDraftRevision({
        artifactId,
        review,
        draftRevision: "draft-rev-1",
        now: LATER,
      }),
    ).toEqual({ ok: true, status: "noop", review });
  });

  it("does not let submit bypass a requested revision", () => {
    expect(
      submitDraftRevision({
        artifactId,
        review: submittedReview({
          state: "changesRequested",
          changeRequestReason: "Add detail.",
          changeRequestedAt: LATER,
        }),
        draftRevision: "draft-rev-1",
        now: LATER,
      }),
    ).toEqual({
      ok: false,
      code: "invalidState",
      state: "changesRequested",
    });
  });

  it("rejects submit attempts without a draft revision", () => {
    expect(
      submitDraftRevision({
        artifactId,
        review: null,
        draftRevision: undefined,
        now: NOW,
      }),
    ).toEqual({ ok: false, code: "draftRevisionRequired" });
  });

  it("requests changes from the current submitted draft with a trimmed reason", () => {
    expect(
      requestChangesForSubmittedRevision({
        review: submittedReview(),
        draftRevision: "draft-rev-1",
        reason: "  Needs a clearer ending.  ",
        now: LATER,
      }),
    ).toEqual({
      ok: true,
      status: "changed",
      review: submittedReview({
        state: "changesRequested",
        changeRequestReason: "Needs a clearer ending.",
        changeRequestedAt: LATER,
      }),
    });
  });

  it("rejects change requests from non-submitted states", () => {
    expect(
      requestChangesForSubmittedRevision({
        review: submittedReview({ state: "editing" }),
        draftRevision: "draft-rev-1",
        reason: "Add source context.",
        now: LATER,
      }),
    ).toEqual({ ok: false, code: "invalidState", state: "editing" });
  });

  it("rejects empty and too-long change request reasons", () => {
    expect(
      requestChangesForSubmittedRevision({
        review: submittedReview(),
        draftRevision: "draft-rev-1",
        reason: "   ",
        now: LATER,
      }),
    ).toEqual({ ok: false, code: "reasonRequired" });

    expect(
      requestChangesForSubmittedRevision({
        review: submittedReview(),
        draftRevision: "draft-rev-1",
        reason: "x".repeat(ARTIFACT_REVIEW_REASON_MAX_LENGTH + 1),
        now: LATER,
      }),
    ).toEqual({
      ok: false,
      code: "reasonTooLong",
      maxLength: ARTIFACT_REVIEW_REASON_MAX_LENGTH,
    });
  });

  it("rejects change requests and approvals after the draft changes", () => {
    expect(
      requestChangesForSubmittedRevision({
        review: submittedReview(),
        draftRevision: "draft-rev-2",
        reason: "Update the ending.",
        now: LATER,
      }),
    ).toEqual({
      ok: false,
      code: "staleSubmittedRevision",
      expectedRevision: "draft-rev-1",
    });

    expect(
      approveSubmittedRevision({
        review: submittedReview(),
        draftRevision: "draft-rev-2",
        now: LATER,
      }),
    ).toEqual({
      ok: false,
      code: "staleSubmittedRevision",
      expectedRevision: "draft-rev-1",
    });
  });

  it("requires a changed draft revision before resubmitting", () => {
    expect(
      resubmitChangedDraftRevision({
        review: submittedReview({
          state: "changesRequested",
          changeRequestReason: "Add detail.",
          changeRequestedAt: LATER,
        }),
        draftRevision: "draft-rev-1",
        now: LATER,
      }),
    ).toEqual({
      ok: false,
      code: "draftRevisionUnchanged",
      submittedRevision: "draft-rev-1",
    });
  });

  it("resubmits changed drafts and clears rejection and approval fields", () => {
    expect(
      resubmitChangedDraftRevision({
        review: submittedReview({
          state: "changesRequested",
          approvedRevision: "older-approved-rev",
          approvedAt: NOW,
          changeRequestReason: "Add detail.",
          changeRequestedAt: LATER,
        }),
        draftRevision: "draft-rev-2",
        now: LATER,
      }),
    ).toEqual({
      ok: true,
      status: "changed",
      review: submittedReview({
        state: "submitted",
        submittedRevision: "draft-rev-2",
        submittedAt: LATER,
      }),
    });
  });

  it("approves only the current submitted draft revision", () => {
    expect(
      approveSubmittedRevision({
        review: submittedReview(),
        draftRevision: "draft-rev-1",
        now: LATER,
      }),
    ).toEqual({
      ok: true,
      status: "changed",
      review: submittedReview({
        state: "approved",
        approvedRevision: "draft-rev-1",
        approvedAt: LATER,
      }),
    });
  });

  it("allows publish only for the approved current draft", () => {
    const approved = submittedReview({
      state: "approved",
      approvedRevision: "draft-rev-1",
      approvedAt: LATER,
    });

    expect(
      getPublishEligibility({ review: approved, draftRevision: "draft-rev-1" }),
    ).toEqual({ eligible: true });
    expect(
      getPublishEligibility({ review: null, draftRevision: "draft-rev-1" }),
    ).toEqual({ eligible: false, reason: "reviewMissing" });
    expect(
      getPublishEligibility({ review: approved, draftRevision: "draft-rev-2" }),
    ).toEqual({
      eligible: false,
      reason: "approvedRevisionMismatch",
      approvedRevision: "draft-rev-1",
    });
  });
});
