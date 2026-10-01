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

const OPTIONAL_REVIEW_FIELDS = [
  "submittedRevision",
  "approvedRevision",
  "changeRequestReason",
  "submittedAt",
  "changeRequestedAt",
  "approvedAt",
] as const;

export type ReviewWrite =
  | { kind: "create"; document: ArtifactReview }
  | {
      kind: "patch";
      id: string;
      ifRevisionId: string;
      set: Record<string, unknown>;
      unset: string[];
    };

/**
 * The mutation that turns the stored review into `next`: a create when there
 * is none, otherwise a revision-guarded patch, so two writers can't silently
 * overwrite each other.
 */
export function reviewWrite(
  next: ArtifactReview,
  previous: (ArtifactReview & { _rev?: string }) | null,
): ReviewWrite {
  if (!previous?._rev) {
    return { kind: "create", document: next };
  }

  const set: Record<string, unknown> = { state: next.state };
  const unset: string[] = [];
  for (const field of OPTIONAL_REVIEW_FIELDS) {
    if (next[field] === undefined) unset.push(field);
    else set[field] = next[field];
  }

  return { kind: "patch", id: next._id, ifRevisionId: previous._rev, set, unset };
}
