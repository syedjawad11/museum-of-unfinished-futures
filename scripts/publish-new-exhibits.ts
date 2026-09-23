import { mkdir, readFile, writeFile } from "node:fs/promises";
import { getCliClient } from "sanity/cli";
import newExhibitsJson from "../docs/content/new-exhibits.json";
import { sanitizePlateMarkup } from "../src/content/plate-markup";
import {
  approveSubmittedRevision,
  getArtifactReviewId,
  getPublishEligibility,
  submitDraftRevision,
  type ArtifactReview,
} from "../src/domain/artifact-review";
import {
  artifactReviewIds,
  buildArtifactDraft,
  buildLeadsToPatches,
  buildOutcomeDocs,
  checkReusableDraftStillMatchesPlan,
  eraIds,
  externalTargetArtifactIds,
  indexDocumentsById,
  newDocumentIds,
  parseNewExhibits,
  planPreflight,
  planPreflightInvariants,
  planResumePublication,
  verifyOutcomeUnchangedBeforePatch,
  type ArtifactDraft,
  type LeadsToPatch,
  type ParsedArtifact,
  type ParsedNewExhibits,
  type ReadState,
  type Reference,
  type ResumePublicationPlan,
  type RevisionState,
} from "../src/domain/exhibit-publication";
import {
  checkUploadedAsset,
  extractPlateAlt,
  type UploadedPlateAsset,
} from "../src/domain/plate-attachment";

const apiVersion = "2026-09-20";
const execute = process.env.PUBLISH_EXECUTE === "1";
const resume = process.env.PUBLISH_RESUME === "1";
const client = getCliClient({ apiVersion });
const completedSteps: string[] = [];
const createdIds = {
  outcomes: [] as string[],
  assets: [] as string[],
  reviews: [] as string[],
  artifacts: [] as string[],
};
const dryRunEvidenceFile = "evidence/T-011/publish-dry-run.json";
const resumeDryRunEvidenceFile = "evidence/T-011/publish-resume-dry-run.json";
const executedEvidenceFile = "evidence/T-011/publish-executed.json";

type StoredDocument = Record<string, unknown> & {
  _id: string;
  _type: string;
  _rev?: string;
  _createdAt?: string;
  _updatedAt?: string;
};

type StoredReview = ArtifactReview & StoredDocument;

type AssetDocument = UploadedPlateAsset & {
  _id: string;
};

type PreparedArtifact = {
  artifact: ParsedArtifact;
  draftId: string;
  reviewId: string;
  file: string;
  filename: string;
  buffer: Buffer;
  bytes: number;
  svgAlt: string;
  jsonAlt: string;
  action: "upload-create" | "reuse-draft";
  reusableAsset?: AssetDocument;
};

type PreparedRun = {
  parsed: ParsedNewExhibits;
  artifacts: PreparedArtifact[];
  outcomeDocs: ReturnType<typeof buildOutcomeDocs>;
  plannedPatches: LeadsToPatch[];
  mode: "fresh" | "resume";
  resumePlan?: ResumePublicationPlan;
};

type ArtifactPublishSummary = {
  artifactId: string;
  assetId: string;
  assetUrl: string;
  dimensions:
    | {
        width?: number;
        height?: number;
      }
    | undefined;
  reviewId: string;
  approvedRevision: string | undefined;
};

const parsed = parseNewExhibits(newExhibitsJson);

if (!parsed.ok) {
  console.error(
    JSON.stringify(
      {
        error: "new-exhibits.json failed validation",
        reasons: parsed.reasons,
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

try {
  const prepared = await step("preflight", () => prepareRun(parsed.value));

  if (!execute) {
    const plan = buildDryRunPlan(prepared);
    await writeEvidence(
      resume ? resumeDryRunEvidenceFile : dryRunEvidenceFile,
      plan,
    );
    console.log(JSON.stringify(plan, null, 2));
    process.exit(0);
  }

  await step("A: create outcome documents", () =>
    createOutcomeDocuments(prepared.outcomeDocs),
  );

  const artifactSummaries: ArtifactPublishSummary[] = [];

  for (const artifact of prepared.artifacts) {
    artifactSummaries.push(await publishArtifact(artifact));
  }

  await step("C: set leadsTo patches", () => setLeadsToPatches(prepared.parsed));

  const summary = await step("read back", () =>
    readBack(prepared.parsed, artifactSummaries),
  );

  await writeEvidence(executedEvidenceFile, summary);
  console.log(JSON.stringify(summary, null, 2));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    JSON.stringify(
      {
        error: message,
        partialRun: {
          completedSteps,
          createdIds,
          note: recoveryNote(completedSteps),
        },
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

async function prepareRun(parsedValue: ParsedNewExhibits): Promise<PreparedRun> {
  const preparedPlates = await Promise.all(
    parsedValue.artifacts.map(prepareArtifactPlate),
  );
  const docsToCreate = newDocumentIds(parsedValue);
  const outcomeIds = parsedValue.outcomes.map((outcome) => outcome._id);
  const artifactIds = parsedValue.artifacts.map((artifact) => artifact._id);
  const reviewsToCreate = artifactReviewIds(parsedValue);
  const draftIds = docsToCreate.map((id) => `drafts.${id}`);
  const targetIds = externalTargetArtifactIds(parsedValue);
  const rewireDraftIds = parsedValue.rewire.map(
    (rewire) => `drafts.${rewire.outcome}`,
  );

  const [
    publishedDocs,
    draftDocs,
    reviewDocs,
    eraDocs,
    targetDocs,
    rewireDraftDocs,
    rewireDocs,
  ] = await Promise.all([
    readDocuments<StoredDocument>(docsToCreate),
    readDocuments<StoredDocument>(draftIds),
    readDocuments<StoredReview>(reviewsToCreate),
    readDocuments<StoredDocument>(eraIds(parsedValue)),
    readDocuments<StoredDocument>(targetIds),
    readDocuments<StoredDocument>(rewireDraftIds),
    readDocuments<StoredDocument>(parsedValue.rewire.map((rewire) => rewire.outcome)),
  ]);

  // `docsToCreate`/`draftIds` are ordered artifacts-then-outcomes (see
  // newDocumentIds), not outcomes-then-artifacts, and Promise.all preserves
  // that request order in publishedDocs/draftDocs. Look each id up by the
  // document's own _id (indexDocumentsById) rather than assuming a slice
  // boundary, so this stays correct regardless of that ordering.
  const publishedById = indexDocumentsById(publishedDocs);
  const draftById = indexDocumentsById(draftDocs);
  const publishedOutcomes = Object.fromEntries(
    outcomeIds.map((id) => [id, publishedById[id]]),
  );
  const publishedArtifacts = artifactIds.map((id) => publishedById[id]);
  const artifactDraftDocs = artifactIds.map((id) => draftById[`drafts.${id}`]);
  const artifactAssetIds = artifactDraftDocs.map((draft) =>
    draft ? extractImageAssetRef(draft) : undefined,
  );
  const artifactAssetDocs = await readDocuments<AssetDocument>(
    artifactAssetIds.filter((id): id is string => typeof id === "string"),
  );
  const assetById = new Map(
    artifactAssetDocs.flatMap((asset) => (asset ? [[asset._id, asset]] : [])),
  );
  const artifactStates = Object.fromEntries(
    artifactIds.map((id, index) => {
      const draft = artifactDraftDocs[index];
      const assetId = artifactAssetIds[index];

      return [
        id,
        {
          published: publishedArtifacts[index],
          draft,
          review: reviewDocs[index],
          draftAsset: assetId ? assetById.get(assetId) : undefined,
        },
      ];
    }),
  );

  const rewireCurrentRefs = Object.fromEntries(
    parsedValue.rewire.map((rewire, index) => [
      rewire.outcome,
      extractRef(rewireDocs[index]?.leadsTo),
    ]),
  );

  let outcomeDocs = buildOutcomeDocs(parsedValue);
  let artifacts = preparedPlates;
  let resumePlan: ResumePublicationPlan | undefined;

  const readState: ReadState = {
    parsed: parsedValue,
    existingPublishedIds: compactIds(publishedDocs),
    existingDraftIds: compactIds(draftDocs).map((id) => id.replace(/^drafts\./, "")),
    existingReviewIds: compactIds(reviewDocs),
    missingEraIds: eraIds(parsedValue).filter((_, index) => !eraDocs[index]),
    existingTargetArtifactIds: compactIds(targetDocs),
    rewireDraftIds: compactIds(rewireDraftDocs),
    rewireCurrentRefs,
  };
  // Resume mode replaces the "does a new id/draft already exist" checks with
  // planResumePublication's content-aware judgment below, but every other
  // invariant (missing eras, missing external leadsTo/rewire target
  // artifacts, rewire drafts, stale rewire `from` refs) must still block.
  const blockers = resume
    ? planPreflightInvariants(readState)
    : planPreflight(readState);

  if (resume) {
    resumePlan = planResumePublication({
      parsed: parsedValue,
      publishedOutcomes,
      artifactStates,
    });
    blockers.push(...resumePlan.blockers);
    outcomeDocs = outcomeDocs.filter((doc) =>
      resumePlan?.outcomeActions.some(
        (action) => action.id === doc._id && action.action === "create",
      ),
    );
    artifacts = preparedPlates.map((artifact) => {
      const action = resumePlan?.artifactActions.find(
        (candidate) => candidate.id === artifact.artifact._id,
      );
      const reusableAsset =
        action?.action === "reuse-draft" ? assetById.get(action.assetId) : undefined;

      return {
        ...artifact,
        action: action?.action ?? "upload-create",
        reusableAsset,
      };
    });
  }

  if (blockers.length > 0) {
    throw new Error(`Preflight blocked publication:\n${blockers.join("\n")}`);
  }

  const revisions = revisionStateForPlan(parsedValue, [
    ...parsedValue.outcomes.map((outcome) => ({
      _id: outcome._id,
      _rev: "created-in-step-A",
    })),
    ...rewireDocs,
  ]);
  const plannedPatches = buildLeadsToPatches(parsedValue, revisions);

  if (!plannedPatches.ok) {
    throw new Error(plannedPatches.reason);
  }

  return {
    parsed: parsedValue,
    artifacts,
    outcomeDocs,
    plannedPatches: plannedPatches.patches,
    mode: resume ? "resume" : "fresh",
    resumePlan,
  };
}

async function prepareArtifactPlate(
  artifact: ParsedArtifact,
): Promise<PreparedArtifact> {
  const file = `public/illustrations/${artifact.slug}.svg`;
  const raw = await readFile(file, "utf8");
  const sanitized = sanitizePlateMarkup(raw);

  if (!sanitized.ok) {
    throw new Error(`${file}: ${sanitized.reason}`);
  }

  const svgAlt = extractPlateAlt(sanitized.markup);

  if (!svgAlt.ok) {
    throw new Error(`${file}: ${svgAlt.reason}`);
  }

  const buffer = Buffer.from(sanitized.markup, "utf8");

  return {
    artifact,
    draftId: `drafts.${artifact._id}`,
    reviewId: getArtifactReviewId(artifact._id),
    file,
    filename: `${artifact.slug}.svg`,
    buffer,
    bytes: buffer.byteLength,
    svgAlt: svgAlt.alt,
    jsonAlt: artifact.imageAlt,
    action: "upload-create",
  };
}

function buildDryRunPlan(prepared: PreparedRun) {
  return {
    mode: prepared.mode === "resume" ? "resume-dry-run" : "dry-run",
    executeWith:
      prepared.mode === "resume"
        ? "PUBLISH_RESUME=1 PUBLISH_EXECUTE=1 npx sanity exec scripts/publish-new-exhibits.ts --with-user-token"
        : "PUBLISH_EXECUTE=1 npx sanity exec scripts/publish-new-exhibits.ts --with-user-token",
    resumePlan: prepared.resumePlan,
    writes: [
      {
        step: "A",
        action: "transaction.create",
        documents: prepared.outcomeDocs.map((doc) => ({
          ...doc,
          leadsTo: undefined,
        })),
      },
      ...prepared.artifacts.flatMap((artifact) => [
        artifact.action === "reuse-draft"
          ? {
              step: "B",
              artifactId: artifact.artifact._id,
              action: "reuse existing draft and asset",
              draftId: artifact.draftId,
              assetId: artifact.reusableAsset?._id,
            }
          : {
              step: "B",
              artifactId: artifact.artifact._id,
              action: "assets.upload",
              file: artifact.file,
              filename: artifact.filename,
              contentType: "image/svg+xml",
              bytes: artifact.bytes,
              imageAlt: artifact.jsonAlt,
              svgDesc: artifact.svgAlt,
              altNote:
                artifact.svgAlt === artifact.jsonAlt
                  ? "SVG desc matches JSON imageAlt."
                  : "SVG desc differs; JSON imageAlt will be used for Sanity image alt.",
            },
        {
          step: "B",
          artifactId: artifact.artifact._id,
          action: "create draft, submit review, approve review, guarded publish",
          draftDocument: buildArtifactDraft(
            artifact.artifact,
            "<asset-after-upload>",
            artifact.jsonAlt,
          ),
          draftId: artifact.draftId,
          reviewId: artifact.reviewId,
        },
      ]),
      {
        step: "C",
        action: "transaction.patch.ifRevisionId.set",
        patches: prepared.plannedPatches,
      },
    ],
  };
}

async function createOutcomeDocuments(outcomeDocs: PreparedRun["outcomeDocs"]) {
  if (outcomeDocs.length === 0) {
    return;
  }

  let transaction = client.transaction();

  for (const doc of outcomeDocs) {
    transaction = transaction.create(doc);
  }

  await transaction.commit();
  createdIds.outcomes.push(...outcomeDocs.map((doc) => doc._id));
}

async function publishArtifact(artifact: PreparedArtifact) {
  return step(`B: ${artifact.artifact._id}`, async () => {
    const uploadedAsset =
      artifact.action === "reuse-draft" && artifact.reusableAsset
        ? artifact.reusableAsset
        : await uploadAndVerifyAsset(artifact);
    const plannedDraft = buildArtifactDraft(
      artifact.artifact,
      uploadedAsset._id,
      artifact.jsonAlt,
    );

    if (artifact.action !== "reuse-draft") {
      await step(`${artifact.artifact._id}: create draft`, () =>
        client.create(plannedDraft),
      );
    }
    const submittedDraft = await step(`${artifact.artifact._id}: read draft`, () =>
      requireDocument<StoredDocument>(artifact.draftId),
    );

    if (artifact.action === "reuse-draft") {
      // Time passed between preflight (planResumePublication) and here.
      // Re-verify the draft still matches the plan and the asset we intend
      // to reuse, right before submitting it for review, instead of trusting
      // the earlier read.
      await step(`${artifact.artifact._id}: verify reused draft`, async () => {
        const guard = checkReusableDraftStillMatchesPlan(
          submittedDraft,
          plannedDraft,
          uploadedAsset._id,
        );

        if (!guard.ok) {
          throw new Error(
            `Reused draft ${artifact.draftId} no longer matches the plan: ${guard.reason}.`,
          );
        }
      });
    }

    const submittedReviewResult = submitDraftRevision({
      artifactId: artifact.artifact._id,
      review: null,
      draftRevision: submittedDraft._rev,
      now: new Date().toISOString(),
    });

    if (!submittedReviewResult.ok) {
      throw new Error(
        `Submit transition rejected ${artifact.artifact._id}: ${submittedReviewResult.code}`,
      );
    }

    await step(`${artifact.artifact._id}: submit review`, () =>
      client.create(submittedReviewResult.review),
    );
    createdIds.reviews.push(artifact.reviewId);
    const submittedReview = await step(
      `${artifact.artifact._id}: read submitted review`,
      () => requireDocument<StoredReview>(artifact.reviewId),
    );
    const approvalResult = approveSubmittedRevision({
      review: submittedReview,
      draftRevision: submittedDraft._rev,
      now: new Date().toISOString(),
    });

    if (!approvalResult.ok) {
      throw new Error(
        `Approve transition rejected ${artifact.artifact._id}: ${approvalResult.code}`,
      );
    }

    await step(`${artifact.artifact._id}: approve review`, () =>
      client
        .patch(artifact.reviewId)
        .ifRevisionId(requireRevision(submittedReview, artifact.reviewId))
        .set({
          state: approvalResult.review.state,
          approvedRevision: approvalResult.review.approvedRevision,
          approvedAt: approvalResult.review.approvedAt,
        })
        .commit(),
    );

    const [draftToPublish, reviewToPublish] = await step(
      `${artifact.artifact._id}: guarded publish preflight`,
      () =>
        Promise.all([
          requireDocument<StoredDocument>(artifact.draftId),
          requireDocument<StoredReview>(artifact.reviewId),
        ]),
    );
    const publishEligibility = getPublishEligibility({
      review: reviewToPublish,
      draftRevision: draftToPublish._rev,
    });

    if (!publishEligibility.eligible) {
      throw new Error(
        `Guarded publish rejected ${artifact.artifact._id}: ${publishEligibility.reason}`,
      );
    }

    await step(`${artifact.artifact._id}: publish`, () =>
      client
        .transaction()
        .create(toStoredDocument(draftToPublish, artifact.artifact._id))
        .patch(
          client
            .patch(artifact.draftId)
            .ifRevisionId(requireRevision(draftToPublish, artifact.draftId)),
        )
        .delete(artifact.draftId)
        .commit(),
    );
    createdIds.artifacts.push(artifact.artifact._id);

    const [finalPublished, finalDraft, finalReview] = await step(
      `${artifact.artifact._id}: read back`,
      () =>
        Promise.all([
          requireDocument<StoredDocument>(artifact.artifact._id),
          getDocument<StoredDocument>(artifact.draftId),
          requireDocument<StoredReview>(artifact.reviewId),
        ]),
    );

    assertPublishedArtifact({
      artifact,
      asset: uploadedAsset,
      finalPublished,
      finalDraft,
      finalReview,
      publishedDraftRevision: draftToPublish._rev,
    });

    return {
      artifactId: artifact.artifact._id,
      assetId: uploadedAsset._id,
      assetUrl: uploadedAsset.url,
      dimensions: uploadedAsset.metadata?.dimensions,
      reviewId: artifact.reviewId,
      approvedRevision: finalReview.approvedRevision,
    };
  });
}

async function uploadAndVerifyAsset(artifact: PreparedArtifact): Promise<AssetDocument> {
  const uploaded = (await step(`${artifact.artifact._id}: upload asset`, () =>
    client.assets.upload("image", artifact.buffer, {
      filename: artifact.filename,
      contentType: "image/svg+xml",
    }),
  )) as AssetDocument;
  const asset =
    hasDimensions(uploaded) && uploaded.url
      ? uploaded
      : await step(`${artifact.artifact._id}: read uploaded asset`, () =>
          requireDocument<AssetDocument>(uploaded._id),
        );
  const check = checkUploadedAsset(asset);

  if (!check.ok) {
    throw new Error(`Uploaded asset ${asset._id} failed validation: ${check.reason}`);
  }

  createdIds.assets.push(asset._id);
  return asset;
}

async function setLeadsToPatches(parsedValue: ParsedNewExhibits) {
  const outcomeIds = [
    ...parsedValue.outcomes.map((outcome) => outcome._id),
    ...parsedValue.rewire.map((rewire) => rewire.outcome),
  ];
  const draftIds = outcomeIds.map((id) => `drafts.${id}`);
  const [docs, drafts] = await Promise.all([
    readDocuments<StoredDocument>(outcomeIds),
    readDocuments<StoredDocument>(draftIds),
  ]);
  const existingDraftIds = compactIds(drafts);

  if (existingDraftIds.length > 0) {
    throw new Error(
      `Outcome drafts exist before Step C; refusing to patch: ${existingDraftIds.join(", ")}`,
    );
  }

  // `docs` is the same fresh read ifRevisionId is drawn from below. Re-verify
  // every new outcome (created or skipped earlier in this run) still matches
  // the planned content with leadsTo still absent before committing the
  // transaction, so a concurrent edit between preflight and Step C aborts
  // the run instead of being patched over.
  const freshOutcomesById = indexDocumentsById(
    docs.filter((doc): doc is StoredDocument => Boolean(doc)),
  );

  for (const plannedOutcome of buildOutcomeDocs(parsedValue)) {
    const guard = verifyOutcomeUnchangedBeforePatch(
      freshOutcomesById[plannedOutcome._id],
      plannedOutcome,
    );

    if (!guard.ok) {
      throw new Error(guard.reason);
    }
  }

  const revisions = revisionStateForPlan(parsedValue, docs);
  const result = buildLeadsToPatches(parsedValue, revisions);

  if (!result.ok) {
    throw new Error(result.reason);
  }

  let transaction = client.transaction();

  for (const patch of result.patches) {
    transaction = transaction.patch(
      client
        .patch(patch.id)
        .ifRevisionId(patch.ifRevisionId)
        .set(patch.set),
    );
  }

  await transaction.commit();
}

async function readBack(
  parsedValue: ParsedNewExhibits,
  artifactSummaries: Awaited<ReturnType<typeof publishArtifact>>[],
) {
  const newIds = newDocumentIds(parsedValue);
  const rewireIds = parsedValue.rewire.map((rewire) => rewire.outcome);
  const draftIds = [...newIds, ...rewireIds].map((id) => `drafts.${id}`);
  const [published, drafts, outcomes, artifacts] = await Promise.all([
    readDocuments<StoredDocument>(newIds),
    readDocuments<StoredDocument>(draftIds),
    readDocuments<StoredDocument>([
      ...parsedValue.outcomes.map((outcome) => outcome._id),
      ...rewireIds,
    ]),
    readArtifactImageDocuments(parsedValue.artifacts.map((artifact) => artifact._id)),
  ]);

  const missingPublished = newIds.filter((_, index) => !published[index]);
  const remainingDrafts = compactIds(drafts);
  const expectedLeadsTo = new Map<string, string>([
    ...parsedValue.outcomes.map((outcome) => [outcome._id, outcome.leadsTo] as const),
    ...parsedValue.rewire.map((rewire) => [rewire.outcome, rewire.to] as const),
  ]);
  const badLeadsTo = outcomes
    .map((doc) => {
      if (!doc) {
        return "missing outcome";
      }

      const expected = expectedLeadsTo.get(doc._id);
      const actual = extractRef(doc.leadsTo);
      return expected === actual ? null : `${doc._id}: ${actual} !== ${expected}`;
    })
    .filter((value): value is string => typeof value === "string");
  const badImages = artifacts
    .map((doc) => validateArtifactImage(doc))
    .filter((value): value is string => typeof value === "string");

  if (
    missingPublished.length > 0 ||
    remainingDrafts.length > 0 ||
    badLeadsTo.length > 0 ||
    badImages.length > 0
  ) {
    throw new Error(
      `Readback failed: ${JSON.stringify({
        missingPublished,
        remainingDrafts,
        badLeadsTo,
        badImages,
      })}`,
    );
  }

  return {
    mode: "executed",
    published: newIds,
    draftsRemaining: 0,
    leadsToVerified: expectedLeadsTo.size,
    artifacts: artifactSummaries,
  };
}

async function readDocuments<T>(ids: string[]): Promise<Array<T | undefined>> {
  return Promise.all(ids.map((id) => getDocument<T>(id)));
}

async function writeEvidence(file: string, value: unknown) {
  await mkdir("evidence/T-011", { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readArtifactImageDocuments(
  ids: string[],
): Promise<Array<StoredDocument | undefined>> {
  const documents = (await client.fetch(
    '*[_id in $ids]{_id,_type,image{asset->{url,metadata{dimensions}},alt}}',
    { ids },
  )) as StoredDocument[];
  const byId = new Map(documents.map((document) => [document._id, document]));

  return ids.map((id) => byId.get(id));
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

async function step<T>(name: string, run: () => Promise<T>): Promise<T> {
  try {
    const result = await run();
    completedSteps.push(name);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Step failed (${name}): ${message}`, { cause: error });
  }
}

function revisionStateForPlan(
  parsedValue: ParsedNewExhibits,
  docs: Array<Partial<StoredDocument> | undefined>,
): Record<string, RevisionState> {
  const states: Record<string, RevisionState> = {};

  for (const doc of docs) {
    if (doc?._id) {
      states[doc._id] = {
        _rev: doc._rev,
        leadsTo: isReference(doc.leadsTo) ? doc.leadsTo : null,
      };
    }
  }

  for (const outcome of parsedValue.outcomes) {
    states[outcome._id] ??= { _rev: "created-in-step-A" };
  }

  return states;
}

function compactIds(docs: Array<StoredDocument | undefined>): string[] {
  return docs.flatMap((doc) => (doc ? [doc._id] : []));
}

function isReference(value: unknown): value is Reference {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    (value as Reference)._type === "reference" &&
    typeof (value as Reference)._ref === "string"
  );
}

function extractRef(value: unknown): string | undefined {
  return isReference(value) ? value._ref : undefined;
}

function extractImageAssetRef(document: StoredDocument): string | undefined {
  const image = document.image;

  if (!image || typeof image !== "object") {
    return undefined;
  }

  const asset = (image as { asset?: unknown }).asset;

  if (!asset || typeof asset !== "object") {
    return undefined;
  }

  const ref = (asset as { _ref?: unknown })._ref;
  return typeof ref === "string" ? ref : undefined;
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

function assertPublishedArtifact(input: {
  artifact: PreparedArtifact;
  asset: AssetDocument;
  finalPublished: StoredDocument;
  finalDraft: StoredDocument | undefined;
  finalReview: StoredReview;
  publishedDraftRevision: string | undefined;
}) {
  const image = input.finalPublished.image as ArtifactDraft["image"] | undefined;

  if (image?.asset?._ref !== input.asset._id) {
    throw new Error(`${input.artifact.artifact._id}: published image asset mismatch.`);
  }

  if (image.alt !== input.artifact.jsonAlt) {
    throw new Error(`${input.artifact.artifact._id}: published image alt mismatch.`);
  }

  if (input.finalDraft) {
    throw new Error(`${input.artifact.artifact._id}: draft still exists after publish.`);
  }

  if (
    input.finalReview.state !== "approved" ||
    input.finalReview.approvedRevision !== input.publishedDraftRevision
  ) {
    throw new Error(`${input.artifact.artifact._id}: final review is not approved.`);
  }
}

function validateArtifactImage(document: StoredDocument | undefined): string | null {
  if (!document) {
    return "missing artifact";
  }

  const image = document.image as
    | {
        asset?: UploadedPlateAsset;
        alt?: string;
      }
    | undefined;
  const url = image?.asset?.url;
  const width = image?.asset?.metadata?.dimensions?.width;
  const height = image?.asset?.metadata?.dimensions?.height;

  if (
    typeof url !== "string" ||
    typeof width !== "number" ||
    width <= 0 ||
    typeof height !== "number" ||
    height <= 0
  ) {
    return `${document._id}: image must include url and positive dimensions`;
  }

  return null;
}

function recoveryNote(steps: string[]): string {
  if (steps.length === 0) {
    return "No write step completed.";
  }

  return `Completed through: ${steps[steps.length - 1]}. Re-run will stop at preflight if created documents, reviews, drafts, or rewired outcomes need manual cleanup.`;
}
