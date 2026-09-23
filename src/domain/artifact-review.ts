export const ARTIFACT_REVIEW_REASON_MAX_LENGTH = 500;

export type ArtifactReviewState =
  | "editing"
  | "submitted"
  | "changesRequested"
  | "approved";

export type ArtifactReview = {
  _id: string;
  _type: "artifactReview";
  artifact: {
    _type: "reference";
    _ref: string;
    _weak: true;
  };
  state: ArtifactReviewState;
  submittedRevision?: string;
  approvedRevision?: string;
  changeRequestReason?: string;
  submittedAt?: string;
  changeRequestedAt?: string;
  approvedAt?: string;
};

type ChangedResult = {
  ok: true;
  status: "changed";
  review: ArtifactReview;
};

type NoopResult = {
  ok: true;
  status: "noop";
  review: ArtifactReview;
};

export type TransitionResult =
  | ChangedResult
  | NoopResult
  | { ok: false; code: "draftRevisionRequired" }
  | { ok: false; code: "reviewRequired" }
  | { ok: false; code: "invalidState"; state: ArtifactReviewState }
  | { ok: false; code: "reasonRequired" }
  | { ok: false; code: "reasonTooLong"; maxLength: number }
  | {
      ok: false;
      code: "staleSubmittedRevision";
      expectedRevision: string | undefined;
    }
  | {
      ok: false;
      code: "draftRevisionUnchanged";
      submittedRevision: string | undefined;
    };

export type PublishEligibility =
  | { eligible: true }
  | { eligible: false; reason: "draftRevisionRequired" }
  | { eligible: false; reason: "reviewMissing" }
  | { eligible: false; reason: "reviewNotApproved"; state: ArtifactReviewState }
  | { eligible: false; reason: "approvedRevisionMissing" }
  | {
      eligible: false;
      reason: "approvedRevisionMismatch";
      approvedRevision: string;
    };

export function getArtifactReviewId(artifactId: string): string {
  return `artifactReview.${artifactId}`;
}

export function submitDraftRevision(input: {
  artifactId: string;
  review: ArtifactReview | null;
  draftRevision: string | undefined;
  now: string;
}): TransitionResult {
  if (!input.draftRevision) {
    return { ok: false, code: "draftRevisionRequired" };
  }

  if (input.review?.state === "changesRequested") {
    return {
      ok: false,
      code: "invalidState",
      state: input.review.state,
    };
  }

  if (
    input.review?.state === "submitted" &&
    input.review.submittedRevision === input.draftRevision
  ) {
    return { ok: true, status: "noop", review: input.review };
  }

  if (
    input.review?.state === "approved" &&
    input.review.approvedRevision === input.draftRevision
  ) {
    return { ok: true, status: "noop", review: input.review };
  }

  return {
    ok: true,
    status: "changed",
    review: {
      _id: getArtifactReviewId(input.artifactId),
      _type: "artifactReview",
      artifact: { _type: "reference", _ref: input.artifactId, _weak: true },
      state: "submitted",
      submittedRevision: input.draftRevision,
      submittedAt: input.now,
    },
  };
}

export function requestChangesForSubmittedRevision(input: {
  review: ArtifactReview | null;
  draftRevision: string | undefined;
  reason: string;
  now: string;
}): TransitionResult {
  if (!input.review) {
    return { ok: false, code: "reviewRequired" };
  }

  if (!input.draftRevision) {
    return { ok: false, code: "draftRevisionRequired" };
  }

  if (input.review.state !== "submitted") {
    return { ok: false, code: "invalidState", state: input.review.state };
  }

  if (input.review.submittedRevision !== input.draftRevision) {
    return {
      ok: false,
      code: "staleSubmittedRevision",
      expectedRevision: input.review.submittedRevision,
    };
  }

  const reason = input.reason.trim();
  if (!reason) {
    return { ok: false, code: "reasonRequired" };
  }

  if (reason.length > ARTIFACT_REVIEW_REASON_MAX_LENGTH) {
    return {
      ok: false,
      code: "reasonTooLong",
      maxLength: ARTIFACT_REVIEW_REASON_MAX_LENGTH,
    };
  }

  return {
    ok: true,
    status: "changed",
    review: {
      ...input.review,
      state: "changesRequested",
      changeRequestReason: reason,
      changeRequestedAt: input.now,
    },
  };
}

export function resubmitChangedDraftRevision(input: {
  review: ArtifactReview | null;
  draftRevision: string | undefined;
  now: string;
}): TransitionResult {
  if (!input.review) {
    return { ok: false, code: "reviewRequired" };
  }

  if (!input.draftRevision) {
    return { ok: false, code: "draftRevisionRequired" };
  }

  if (input.review.state !== "changesRequested") {
    return { ok: false, code: "invalidState", state: input.review.state };
  }

  if (input.review.submittedRevision === input.draftRevision) {
    return {
      ok: false,
      code: "draftRevisionUnchanged",
      submittedRevision: input.review.submittedRevision,
    };
  }

  return {
    ok: true,
    status: "changed",
    review: clearDecisionFields({
      ...input.review,
      state: "submitted",
      submittedRevision: input.draftRevision,
      submittedAt: input.now,
    }),
  };
}

export function approveSubmittedRevision(input: {
  review: ArtifactReview | null;
  draftRevision: string | undefined;
  now: string;
}): TransitionResult {
  if (!input.review) {
    return { ok: false, code: "reviewRequired" };
  }

  if (!input.draftRevision) {
    return { ok: false, code: "draftRevisionRequired" };
  }

  if (input.review.state !== "submitted") {
    return { ok: false, code: "invalidState", state: input.review.state };
  }

  if (input.review.submittedRevision !== input.draftRevision) {
    return {
      ok: false,
      code: "staleSubmittedRevision",
      expectedRevision: input.review.submittedRevision,
    };
  }

  return {
    ok: true,
    status: "changed",
    review: {
      ...input.review,
      state: "approved",
      approvedRevision: input.draftRevision,
      approvedAt: input.now,
    },
  };
}

export function getPublishEligibility(input: {
  review: ArtifactReview | null;
  draftRevision: string | undefined;
}): PublishEligibility {
  if (!input.draftRevision) {
    return { eligible: false, reason: "draftRevisionRequired" };
  }

  if (!input.review) {
    return { eligible: false, reason: "reviewMissing" };
  }

  if (input.review.state !== "approved") {
    return {
      eligible: false,
      reason: "reviewNotApproved",
      state: input.review.state,
    };
  }

  if (!input.review.approvedRevision) {
    return { eligible: false, reason: "approvedRevisionMissing" };
  }

  if (input.review.approvedRevision !== input.draftRevision) {
    return {
      eligible: false,
      reason: "approvedRevisionMismatch",
      approvedRevision: input.review.approvedRevision,
    };
  }

  return { eligible: true };
}

function clearDecisionFields(review: ArtifactReview): ArtifactReview {
  const nextReview = { ...review };
  delete nextReview.approvedAt;
  delete nextReview.approvedRevision;
  delete nextReview.changeRequestedAt;
  delete nextReview.changeRequestReason;
  return nextReview;
}
