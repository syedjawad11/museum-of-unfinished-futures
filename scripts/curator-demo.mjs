import { getCliClient } from "sanity/cli";

const apiVersion = "2026-09-20";
const artifactId = "artifact-roads-not-taken-telephone";
const draftId = `drafts.${artifactId}`;
const reviewId = `artifactReview.${artifactId}`;
const execute = process.env.CURATOR_DEMO_EXECUTE === "1";
const changeRequestReason =
  "Clarify what callers hear before the connection opens.";
const revisedSummary =
  "A cream rotary telephone once connected callers to lives formed by decisions they nearly made. Before each connection, it played a dial tone assembled from almost-spoken words, charging the conversation in certainty rather than coins.";

const client = getCliClient({ apiVersion });
const [published, existingDraft, existingReview] = await Promise.all([
  client.getDocument(artifactId),
  client.getDocument(draftId),
  client.getDocument(reviewId),
]);

if (!published) {
  throw new Error(`Published artifact ${artifactId} was not found.`);
}

if (!execute) {
  console.log(
    JSON.stringify(
      {
        mode: "dry-run",
        artifactId,
        currentSummary: published.summary,
        proposedSummary: revisedSummary,
        changeRequestReason,
        blockedByExistingState: Boolean(existingDraft || existingReview),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

if (existingDraft || existingReview) {
  throw new Error(
    "Curator demo requires no pre-existing draft or review for the selected artifact.",
  );
}

const initialDraft = toStoredDocument(published, draftId, {
  summary: published.summary,
});
await client.createOrReplace(initialDraft);
const submittedDraft = await requireDocument(draftId);

await client.create({
  _id: reviewId,
  _type: "artifactReview",
  artifact: { _type: "reference", _ref: artifactId },
  state: "submitted",
  submittedRevision: submittedDraft._rev,
  submittedAt: new Date().toISOString(),
});
const submittedReview = await requireDocument(reviewId);

await client
  .patch(reviewId)
  .ifRevisionId(submittedReview._rev)
  .set({
    state: "changesRequested",
    changeRequestReason,
    changeRequestedAt: new Date().toISOString(),
  })
  .commit();
const changesRequestedReview = await requireDocument(reviewId);

await client
  .patch(draftId)
  .ifRevisionId(submittedDraft._rev)
  .set({ summary: revisedSummary })
  .commit();
const revisedDraft = await requireDocument(draftId);

if (revisedDraft._rev === submittedDraft._rev) {
  throw new Error("Draft revision did not change after the requested revision.");
}

await client
  .patch(reviewId)
  .ifRevisionId(changesRequestedReview._rev)
  .set({
    state: "submitted",
    submittedRevision: revisedDraft._rev,
    submittedAt: new Date().toISOString(),
  })
  .unset([
    "approvedRevision",
    "approvedAt",
    "changeRequestReason",
    "changeRequestedAt",
  ])
  .commit();
const resubmittedReview = await requireDocument(reviewId);

if (resubmittedReview.submittedRevision !== revisedDraft._rev) {
  throw new Error("Resubmission did not record the revised draft revision.");
}

await client
  .patch(reviewId)
  .ifRevisionId(resubmittedReview._rev)
  .set({
    state: "approved",
    approvedRevision: revisedDraft._rev,
    approvedAt: new Date().toISOString(),
  })
  .commit();
const approvedReview = await requireDocument(reviewId);
const approvedDraft = await requireDocument(draftId);

if (
  approvedReview.state !== "approved" ||
  approvedReview.approvedRevision !== approvedDraft._rev
) {
  throw new Error("Guarded publish check rejected the current draft revision.");
}

await client
  .transaction()
  .createOrReplace(toStoredDocument(approvedDraft, artifactId))
  .delete(draftId)
  .commit();

const [finalPublished, finalDraft, finalReview] = await Promise.all([
  requireDocument(artifactId),
  client.getDocument(draftId),
  requireDocument(reviewId),
]);

if (finalDraft) {
  throw new Error("Draft still exists after publication.");
}

if (finalPublished.summary !== revisedSummary) {
  throw new Error("Published artifact does not contain the approved revision.");
}

console.log(
  JSON.stringify(
    {
      mode: "executed",
      artifactId,
      submittedRevision: submittedDraft._rev,
      revisedRevision: revisedDraft._rev,
      approvedRevision: finalReview.approvedRevision,
      finalReviewState: finalReview.state,
      publicSummary: finalPublished.summary,
      draftRemoved: finalDraft === undefined,
    },
    null,
    2,
  ),
);

async function requireDocument(id) {
  const document = await client.getDocument(id);
  if (!document) {
    throw new Error(`Document ${id} was not found.`);
  }
  return document;
}

function toStoredDocument(document, id, overrides = {}) {
  const content = { ...document };
  delete content._rev;
  delete content._createdAt;
  delete content._updatedAt;

  return {
    ...content,
    ...overrides,
    _id: id,
  };
}
