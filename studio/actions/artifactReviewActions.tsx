import { Button, Flex, Text, TextArea } from "@sanity/ui";
import { useToast } from "@sanity/ui/toast";
import { useEffect, useState } from "react";
import type {
  DocumentActionComponent,
  DocumentActionDescription,
  DocumentActionProps,
  SanityDocument,
} from "sanity";
import { useClient, useDocumentOperation, useValidationStatus } from "sanity";
import {
  approveSubmittedRevision,
  getArtifactReviewId,
  getPublishEligibility,
  requestChangesForSubmittedRevision,
  resubmitChangedDraftRevision,
  submitDraftRevision,
  type ArtifactReview,
} from "@/domain/artifact-review";
import { getValidationDisabledReason } from "@/domain/publish-validation";
import { sanityApiVersion } from "@/content/sanity-config";

declare module "sanity" {
  interface DocumentActionKeys {
    submitArtifactReview: never;
    requestArtifactChanges: never;
    resubmitArtifactReview: never;
    approveArtifactReview: never;
  }
}

type ReviewDocument = ArtifactReview & {
  _rev?: string;
};

const reviewProjection = `{
  _id,
  _rev,
  _type,
  artifact,
  state,
  submittedRevision,
  approvedRevision,
  changeRequestReason,
  submittedAt,
  changeRequestedAt,
  approvedAt
}`;

const SubmitForReviewAction: DocumentActionComponent = (
  props: DocumentActionProps,
): DocumentActionDescription => {
  const client = useClient({ apiVersion: sanityApiVersion });
  const toast = useToast();
  const { review, refresh } = useArtifactReview(props.id);
  const draftRevision = props.draft?._rev;
  const disabledReason = getSubmitActionDisabledReason(review, draftRevision);

  return {
    label: "Submit for review",
    disabled: !!disabledReason,
    title: disabledReason,
    onHandle: async () => {
      const latestReview = await fetchReview(client, props.id);
      const latestDraft = await fetchDraft(client, props.id);
      const result = submitDraftRevision({
        artifactId: props.id,
        review: latestReview,
        draftRevision: latestDraft?._rev,
        now: new Date().toISOString(),
      });

      if (!result.ok) {
        toast.push({
          status: "error",
          title: transitionMessage(result.code),
        });
        return;
      }

      if (result.status === "noop") {
        toast.push({ status: "info", title: "No review change needed." });
        return;
      }

      const saved = await saveReview(client, result.review, latestReview, toast);
      if (!saved) return;
      await refresh();
      toast.push({ status: "success", title: "Submitted for review." });
    },
  };
};
SubmitForReviewAction.action = "submitArtifactReview";
SubmitForReviewAction.displayName = "SubmitForReviewAction";

const RequestChangesAction: DocumentActionComponent = (
  props: DocumentActionProps,
): DocumentActionDescription => {
  const client = useClient({ apiVersion: sanityApiVersion });
  const toast = useToast();
  const { review, refresh } = useArtifactReview(props.id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  const disabledReason = getSubmittedActionDisabledReason(
    review,
    props.draft?._rev,
  );

  return {
    label: "Request changes",
    disabled: !!disabledReason,
    title: disabledReason,
    onHandle: () => setDialogOpen(true),
    dialog: dialogOpen
      ? {
          type: "dialog",
          header: "Request changes",
          width: "small",
          onClose: () => setDialogOpen(false),
          content: (
            <div>
              <Text size={1}>
                Public-safe curator feedback for the next draft.
              </Text>
              <div style={{ height: 12 }} />
              <TextArea
                value={reason}
                onChange={(event) => setReason(event.currentTarget.value)}
              />
            </div>
          ),
          footer: (
            <Flex gap={2} justify="flex-end" padding={3}>
              <Button
                mode="bleed"
                text="Cancel"
                onClick={() => setDialogOpen(false)}
              />
              <Button
                tone="critical"
                text="Request changes"
                disabled={!reason.trim()}
                onClick={async () => {
                  const latestReview = await fetchReview(client, props.id);
                  const latestDraft = await fetchDraft(client, props.id);
                  const result = requestChangesForSubmittedRevision({
                    review: latestReview,
                    draftRevision: latestDraft?._rev,
                    reason,
                    now: new Date().toISOString(),
                  });

                  if (!result.ok) {
                    toast.push({
                      status: "error",
                      title: transitionMessage(result.code),
                    });
                    return;
                  }

                  const saved = await saveReview(
                    client,
                    result.review,
                    latestReview,
                    toast,
                  );
                  if (!saved) return;
                  await refresh();
                  setReason("");
                  setDialogOpen(false);
                  toast.push({
                    status: "success",
                    title: "Changes requested.",
                  });
                }}
              />
            </Flex>
          ),
        }
      : null,
  };
};
RequestChangesAction.action = "requestArtifactChanges";
RequestChangesAction.displayName = "RequestChangesAction";

const ResubmitForReviewAction: DocumentActionComponent = (
  props: DocumentActionProps,
): DocumentActionDescription => {
  const client = useClient({ apiVersion: sanityApiVersion });
  const toast = useToast();
  const { review, refresh } = useArtifactReview(props.id);
  const draftRevision = props.draft?._rev;
  const disabledReason =
    review?.state === "changesRequested" ? undefined : "No changes requested.";

  return {
    label: "Resubmit for review",
    disabled: !!disabledReason || !draftRevision,
    title: disabledReason ?? (!draftRevision ? "Draft is missing." : undefined),
    onHandle: async () => {
      const latestReview = await fetchReview(client, props.id);
      const latestDraft = await fetchDraft(client, props.id);
      const result = resubmitChangedDraftRevision({
        review: latestReview,
        draftRevision: latestDraft?._rev,
        now: new Date().toISOString(),
      });

      if (!result.ok) {
        toast.push({
          status: "error",
          title: transitionMessage(result.code),
        });
        return;
      }

      const saved = await saveReview(client, result.review, latestReview, toast);
      if (!saved) return;
      await refresh();
      toast.push({ status: "success", title: "Resubmitted for review." });
    },
  };
};
ResubmitForReviewAction.action = "resubmitArtifactReview";
ResubmitForReviewAction.displayName = "ResubmitForReviewAction";

const ApproveReviewAction: DocumentActionComponent = (
  props: DocumentActionProps,
): DocumentActionDescription => {
  const client = useClient({ apiVersion: sanityApiVersion });
  const toast = useToast();
  const { review, refresh } = useArtifactReview(props.id);
  const disabledReason = getSubmittedActionDisabledReason(
    review,
    props.draft?._rev,
  );

  return {
    label: "Approve review",
    disabled: !!disabledReason,
    title: disabledReason,
    onHandle: async () => {
      const latestReview = await fetchReview(client, props.id);
      const latestDraft = await fetchDraft(client, props.id);
      const result = approveSubmittedRevision({
        review: latestReview,
        draftRevision: latestDraft?._rev,
        now: new Date().toISOString(),
      });

      if (!result.ok) {
        toast.push({
          status: "error",
          title: transitionMessage(result.code),
        });
        return;
      }

      const saved = await saveReview(client, result.review, latestReview, toast);
      if (!saved) return;
      await refresh();
      toast.push({ status: "success", title: "Review approved." });
    },
  };
};
ApproveReviewAction.action = "approveArtifactReview";
ApproveReviewAction.displayName = "ApproveReviewAction";

const GuardedPublishAction: DocumentActionComponent = (
  props: DocumentActionProps,
): DocumentActionDescription => {
  const client = useClient({ apiVersion: sanityApiVersion });
  const toast = useToast();
  const { review, refresh } = useArtifactReview(props.id);
  const { publish } = useDocumentOperation(props.id, props.type);
  const validationStatus = useValidationStatus(
    props.draft?._id ?? props.id,
    props.type,
    true,
  );
  const disabledReason = getPublishDisabledReason(
    props,
    publish.disabled,
    review,
    validationStatus,
  );

  return {
    label: "Publish",
    disabled: !!disabledReason,
    title: disabledReason,
    onHandle: async () => {
      const latestReview = await fetchReview(client, props.id);
      const latestDraft = await fetchDraft(client, props.id);
      const currentDisabledReason = getPublishDisabledReason(
        { ...props, draft: latestDraft ?? null },
        publish.disabled,
        latestReview,
        validationStatus,
      );

      if (currentDisabledReason) {
        await refresh();
        toast.push({
          status: "error",
          title: currentDisabledReason,
        });
        return;
      }

      publish.execute();
      toast.push({ status: "success", title: "Publishing approved draft." });
    },
  };
};
GuardedPublishAction.action = "publish";
GuardedPublishAction.displayName = "GuardedPublishAction";

export const artifactReviewActions: DocumentActionComponent[] = [
  SubmitForReviewAction,
  RequestChangesAction,
  ResubmitForReviewAction,
  ApproveReviewAction,
];

export const guardedPublishAction: DocumentActionComponent = GuardedPublishAction;

function useArtifactReview(artifactId: string): {
  review: ReviewDocument | null;
  refresh: () => Promise<void>;
} {
  const client = useClient({ apiVersion: sanityApiVersion });
  const [review, setReview] = useState<ReviewDocument | null>(null);

  async function refresh() {
    setReview(await fetchReview(client, artifactId));
  }

  useEffect(() => {
    let cancelled = false;

    fetchReview(client, artifactId).then((nextReview) => {
      if (!cancelled) {
        setReview(nextReview);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [artifactId, client]);

  return { review, refresh };
}

async function fetchReview(
  client: ReturnType<typeof useClient>,
  artifactId: string,
): Promise<ReviewDocument | null> {
  return client.fetch<ReviewDocument | null>(
    `*[_id == $reviewId][0]${reviewProjection}`,
    { reviewId: getArtifactReviewId(artifactId) },
  );
}

async function fetchDraft(
  client: ReturnType<typeof useClient>,
  artifactId: string,
): Promise<SanityDocument | null> {
  return (await client.getDocument<SanityDocument>(`drafts.${artifactId}`)) ?? null;
}

async function saveReview(
  client: ReturnType<typeof useClient>,
  review: ArtifactReview,
  previousReview: ReviewDocument | null,
  toast: ReturnType<typeof useToast>,
): Promise<boolean> {
  try {
    if (!previousReview?._rev) {
      await client.create(review);
      return true;
    }

    const patchValues = toReviewPatch(review);
    const setValues = Object.fromEntries(
      Object.entries(patchValues).filter(([, value]) => value !== undefined),
    );
    const unsetFields = Object.entries(patchValues)
      .filter(([, value]) => value === undefined)
      .map(([field]) => field);

    let patch = client.patch(review._id).ifRevisionId(previousReview._rev);
    if (Object.keys(setValues).length > 0) {
      patch = patch.set(setValues);
    }
    if (unsetFields.length > 0) {
      patch = patch.unset(unsetFields);
    }
    await patch.commit();
    return true;
  } catch (error) {
    if (isConflictError(error)) {
      toast.push({
        status: "error",
        title: "Review changed. Reload and try again.",
      });
      return false;
    }

    toast.push({
      status: "error",
      title: "Review update failed.",
    });
    return false;
  }
}

function toReviewPatch(review: ArtifactReview): Omit<ArtifactReview, "_id" | "_type"> {
  return {
    artifact: review.artifact,
    state: review.state,
    submittedRevision: review.submittedRevision,
    approvedRevision: review.approvedRevision,
    changeRequestReason: review.changeRequestReason,
    submittedAt: review.submittedAt,
    changeRequestedAt: review.changeRequestedAt,
    approvedAt: review.approvedAt,
  };
}

function getSubmitActionDisabledReason(
  review: ReviewDocument | null,
  draftRevision: string | undefined,
): string | undefined {
  if (!draftRevision) {
    return "Draft is missing.";
  }

  if (review?.state === "changesRequested") {
    return "Revise the draft, then use Resubmit for review.";
  }

  if (
    review?.state === "submitted" &&
    review.submittedRevision === draftRevision
  ) {
    return "Current draft is already submitted.";
  }

  if (review?.state === "approved" && review.approvedRevision === draftRevision) {
    return "Current draft is already approved.";
  }

  return undefined;
}

function getSubmittedActionDisabledReason(
  review: ReviewDocument | null,
  draftRevision: string | undefined,
): string | undefined {
  if (!review) {
    return "Review is missing.";
  }

  if (review.state !== "submitted") {
    return "Review is not submitted.";
  }

  if (!review.submittedRevision) {
    return "Submitted revision is missing.";
  }

  if (!draftRevision) {
    return "Draft is missing.";
  }

  if (review.submittedRevision !== draftRevision) {
    return "Draft changed after submission. Submit the current draft again.";
  }

  return undefined;
}

function getPublishDisabledReason(
  props: Pick<DocumentActionProps, "draft" | "ready" | "transactionSyncLock">,
  publishDisabled: false | string,
  review: ReviewDocument | null,
  validationStatus: ReturnType<typeof useValidationStatus>,
): string | undefined {
  if (!props.ready) {
    return "Document is not ready.";
  }

  if (!props.draft?._rev) {
    return "Draft is missing.";
  }

  if (props.transactionSyncLock?.enabled) {
    return "Document is sync-locked.";
  }

  if (publishDisabled) {
    return `Publish is disabled: ${publishDisabled}.`;
  }

  const validationDisabledReason = getValidationDisabledReason({
    draftRevision: props.draft._rev,
    isValidating: validationStatus.isValidating,
    validatedRevision: validationStatus.revision,
    markers: validationStatus.validation,
  });
  if (validationDisabledReason) {
    return validationDisabledReason;
  }

  const eligibility = getPublishEligibility({
    review,
    draftRevision: props.draft._rev,
  });

  if (eligibility.eligible) {
    return undefined;
  }

  switch (eligibility.reason) {
    case "draftRevisionRequired":
      return "Draft revision is missing.";
    case "reviewMissing":
      return "Review is missing.";
    case "reviewNotApproved":
      return `Review is ${eligibility.state}.`;
    case "approvedRevisionMissing":
      return "Approved revision is missing.";
    case "approvedRevisionMismatch":
      return "Current draft differs from the approved revision.";
  }
}

function transitionMessage(code: string): string {
  switch (code) {
    case "draftRevisionRequired":
      return "Draft revision is missing.";
    case "reviewRequired":
      return "Review is missing.";
    case "invalidState":
      return "Review state does not allow that action.";
    case "reasonRequired":
      return "Reason is required.";
    case "reasonTooLong":
      return "Reason is too long.";
    case "staleSubmittedRevision":
      return "Submitted revision is stale.";
    case "draftRevisionUnchanged":
      return "Draft must change before resubmitting.";
    default:
      return "Review action failed.";
  }
}

function isConflictError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    error.statusCode === 409
  );
}
