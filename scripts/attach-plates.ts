import { readFile } from "node:fs/promises";
import { getCliClient } from "sanity/cli";
import {
  approveSubmittedRevision,
  getPublishEligibility,
  submitDraftRevision,
  type ArtifactReview,
} from "../src/domain/artifact-review";
import {
  buildDraftWithPlate,
  checkUploadedAsset,
  extractPlateAlt,
  PLATE_ATTACHMENTS,
  type PlateAttachment,
  type UploadedPlateAsset,
} from "../src/domain/plate-attachment";
import { sanitizePlateMarkup } from "../src/content/plate-markup";

const apiVersion = "2026-09-20";
const execute = process.env.PLATES_EXECUTE === "1";
const client = getCliClient({ apiVersion });

type StoredDocument = Record<string, unknown> & {
  _id: string;
  _type: string;
  _rev?: string;
  _createdAt?: string;
  _updatedAt?: string;
};

type StoredArtifactReview = ArtifactReview & StoredDocument;

type AssetDocument = UploadedPlateAsset & {
  _id: string;
};

type PreparedPlate = PlateAttachment & {
  buffer: Buffer;
  bytes: number;
  alt: string;
  published: StoredDocument;
  existingReview: ArtifactReview | null;
  existingReviewState: ArtifactReview["state"] | null;
  hasDraft: boolean;
};

const prepared = await step("preflight", prepareAllPlates);

if (!execute) {
  console.log(
    JSON.stringify(
      {
        mode: "dry-run",
        plates: prepared.map((plate) => ({
          artifactId: plate.artifactId,
          file: plate.file,
          bytes: plate.bytes,
          alt: plate.alt,
          existingReviewState: plate.existingReviewState,
          hasDraft: plate.hasDraft,
        })),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const summaries = [];

for (const plate of prepared) {
  summaries.push(await attachPlate(plate));
}

console.log(
  JSON.stringify(
    {
      mode: "executed",
      plates: summaries,
    },
    null,
    2,
  ),
);

async function prepareAllPlates(): Promise<PreparedPlate[]> {
  const localPlates = await Promise.all(
    PLATE_ATTACHMENTS.map(async (plate) => {
      const buffer = await readFile(plate.file);
      const raw = buffer.toString("utf8");
      const sanitized = sanitizePlateMarkup(raw);

      if (!sanitized.ok) {
        throw new Error(`${plate.file}: ${sanitized.reason}`);
      }

      const alt = extractPlateAlt(sanitized.markup);

      if (!alt.ok) {
        throw new Error(`${plate.file}: ${alt.reason}`);
      }

      return {
        ...plate,
        buffer,
        bytes: buffer.byteLength,
        alt: alt.alt,
      };
    }),
  );

  const remoteState = await Promise.all(
    localPlates.map(async (plate) => {
      const [published, existingDraft, existingReview] = await Promise.all([
        getDocument<StoredDocument>(plate.artifactId),
        getDocument<StoredDocument>(plate.draftId),
        getDocument<StoredArtifactReview>(plate.reviewId),
      ]);

      if (!published) {
        throw new Error(`Published artifact ${plate.artifactId} was not found.`);
      }

      if (existingDraft) {
        throw new Error(`Draft ${plate.draftId} already exists.`);
      }

      return {
        ...plate,
        published,
        existingReview: existingReview ?? null,
        existingReviewState: existingReview?.state ?? null,
        hasDraft: Boolean(existingDraft),
      };
    }),
  );

  return remoteState;
}

async function attachPlate(plate: PreparedPlate) {
  return step(plate.artifactId, async () => {
    const uploadedAsset = await uploadAndVerifyAsset(plate);
    const draft = buildDraftWithPlate(
      plate.published,
      uploadedAsset._id,
      plate.alt,
    );

    await step(`${plate.artifactId}: create draft`, () =>
      client.createOrReplace(draft),
    );
    const submittedDraft = await step(`${plate.artifactId}: read submitted draft`, () =>
      requireDocument<StoredDocument>(plate.draftId),
    );

    const submittedReviewResult = submitDraftRevision({
      artifactId: plate.artifactId,
      review: plate.existingReview,
      draftRevision: submittedDraft._rev,
      now: new Date().toISOString(),
    });

    if (!submittedReviewResult.ok) {
      throw new Error(
        `Submit transition rejected ${plate.artifactId}: ${submittedReviewResult.code}`,
      );
    }

    await step(`${plate.artifactId}: submit review`, () =>
      client.createOrReplace(submittedReviewResult.review),
    );
    const submittedReview = await step(`${plate.artifactId}: read submitted review`, () =>
      requireDocument<StoredArtifactReview>(plate.reviewId),
    );

    const approvalResult = approveSubmittedRevision({
      review: submittedReview,
      draftRevision: submittedDraft._rev,
      now: new Date().toISOString(),
    });

    if (!approvalResult.ok) {
      throw new Error(
        `Approve transition rejected ${plate.artifactId}: ${approvalResult.code}`,
      );
    }

    const submittedReviewRevision = requireRevision(submittedReview, plate.reviewId);

    await step(`${plate.artifactId}: approve review`, () =>
      client
        .patch(plate.reviewId)
        .ifRevisionId(submittedReviewRevision)
        .set({
          state: approvalResult.review.state,
          approvedRevision: approvalResult.review.approvedRevision,
          approvedAt: approvalResult.review.approvedAt,
        })
        .commit(),
    );

    // Intentional audit checkpoint; guarded-publish preflight below re-reads fresh on purpose.
    await step(`${plate.artifactId}: read approved review`, () =>
      requireDocument<StoredArtifactReview>(plate.reviewId),
    );

    const [draftToPublish, reviewToPublish] = await step(
      `${plate.artifactId}: guarded publish preflight`,
      () =>
        Promise.all([
          requireDocument<StoredDocument>(plate.draftId),
          requireDocument<StoredArtifactReview>(plate.reviewId),
        ]),
    );

    const publishEligibility = getPublishEligibility({
      review: reviewToPublish,
      draftRevision: draftToPublish._rev,
    });

    if (!publishEligibility.eligible) {
      throw new Error(
        `Guarded publish rejected ${plate.artifactId}: ${publishEligibility.reason}`,
      );
    }

    const publishedFromDraft = toStoredDocument(draftToPublish, plate.artifactId);

    await step(`${plate.artifactId}: publish`, () =>
      client
        .transaction()
        .createOrReplace(publishedFromDraft)
        .delete(plate.draftId)
        .commit(),
    );

    const [finalPublished, finalDraft, finalReview] = await step(
      `${plate.artifactId}: read back`,
      () =>
        Promise.all([
          requireDocument<StoredDocument>(plate.artifactId),
          getDocument<StoredDocument>(plate.draftId),
          requireDocument<StoredArtifactReview>(plate.reviewId),
        ]),
    );

    assertFinalState({
      plate,
      asset: uploadedAsset,
      finalPublished,
      finalDraft,
      finalReview,
      publishedDraftRevision: draftToPublish._rev,
    });

    return {
      artifactId: plate.artifactId,
      draftId: plate.draftId,
      reviewId: plate.reviewId,
      publishedRevision: finalPublished._rev,
      approvedRevision: finalReview.approvedRevision,
      publishedDraftRevision: draftToPublish._rev,
      assetId: uploadedAsset._id,
      assetUrl: uploadedAsset.url,
      bytes: plate.bytes,
      dimensions: uploadedAsset.metadata?.dimensions,
    };
  });
}

async function uploadAndVerifyAsset(plate: PreparedPlate): Promise<AssetDocument> {
  const uploaded = await step(`${plate.artifactId}: upload asset`, () =>
    client.assets.upload("image", plate.buffer, {
      filename: plate.filename,
      contentType: "image/svg+xml",
    }),
  );
  const uploadedAsset = uploaded as AssetDocument;
  const asset =
    hasDimensions(uploadedAsset) && uploadedAsset.url
      ? uploadedAsset
      : await step(`${plate.artifactId}: read uploaded asset`, () =>
          requireDocument<AssetDocument>(uploadedAsset._id),
        );
  const check = checkUploadedAsset(asset);

  if (!check.ok) {
    throw new Error(`Uploaded asset ${asset._id} failed validation: ${check.reason}`);
  }

  return asset;
}

async function requireDocument<T>(id: string): Promise<T> {
  const document = await getDocument<T>(id);

  if (!document) {
    throw new Error(`Document ${id} was not found.`);
  }

  return document;
}

async function getDocument<T>(id: string): Promise<T | undefined> {
  return (await client.getDocument(id)) as T | undefined;
}

function toStoredDocument(document: StoredDocument, id: string): StoredDocument {
  const content = { ...document };
  delete content._rev;
  delete content._createdAt;
  delete content._updatedAt;

  return {
    ...content,
    _id: id,
  };
}

function assertFinalState(input: {
  plate: PreparedPlate;
  asset: AssetDocument;
  finalPublished: StoredDocument;
  finalDraft: StoredDocument | undefined;
  finalReview: ArtifactReview;
  publishedDraftRevision: string | undefined;
}) {
  const image = input.finalPublished.image as
    | {
        asset?: { _ref?: string };
        alt?: string;
      }
    | undefined;

  if (image?.asset?._ref !== input.asset._id) {
    throw new Error(`${input.plate.artifactId}: published image asset mismatch.`);
  }

  if (image.alt !== input.plate.alt) {
    throw new Error(`${input.plate.artifactId}: published image alt mismatch.`);
  }

  if (input.finalDraft) {
    throw new Error(`${input.plate.artifactId}: draft still exists after publish.`);
  }

  if (
    input.finalReview.state !== "approved" ||
    input.finalReview.approvedRevision !== input.publishedDraftRevision
  ) {
    throw new Error(`${input.plate.artifactId}: final review is not approved.`);
  }
}

function hasDimensions(asset: AssetDocument): boolean {
  const width = asset.metadata?.dimensions?.width;
  const height = asset.metadata?.dimensions?.height;

  return typeof width === "number" && typeof height === "number";
}

function requireRevision(document: StoredDocument, id: string): string {
  if (!document._rev) {
    throw new Error(`Document ${id} did not include a revision.`);
  }

  return document._rev;
}

async function step<T>(name: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Step failed (${name}): ${message}`, { cause: error });
  }
}
