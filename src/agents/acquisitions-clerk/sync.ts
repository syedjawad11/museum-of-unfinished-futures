import {
  approveSubmittedRevision,
  requestChangesForSubmittedRevision,
  resubmitChangedDraftRevision,
  submitDraftRevision,
  type ArtifactReview,
  type TransitionResult,
} from "../../domain/artifact-review";
import type { WorkflowView } from "./decide";

// Mirrors an exhibit-review run onto the revision-pinned artifactReview gate.
// The run is the conversation; the gate is the lock that Publish checks.

export type SyncResult =
  | TransitionResult
  | { ok: true; status: "noop"; review: ArtifactReview | null };

export function syncReviewFromWorkflow(input: {
  artifactId: string;
  workflow: WorkflowView;
  review: ArtifactReview | null;
  draftRevision: string | undefined;
  now: string;
}): SyncResult {
  const { workflow, review } = input;
  const noop = { ok: true, status: "noop", review } as const;

  switch (workflow.stage) {
    case "curatorial-review": {
      return review?.state === "changesRequested"
        ? resubmitChangedDraftRevision(input)
        : submitDraftRevision(input);
    }
    case "drafting": {
      if (workflow.reviewDecision !== "request-changes") {
        return noop;
      }
      if (review?.state !== "submitted") {
        return noop;
      }
      return requestChangesForSubmittedRevision({
        ...input,
        reason: workflow.changeRequestReason ?? "",
      });
    }
    case "approved":
    case "on-display": {
      if (review?.state === "approved") {
        return noop;
      }
      return approveSubmittedRevision(input);
    }
    default:
      return noop;
  }
}
