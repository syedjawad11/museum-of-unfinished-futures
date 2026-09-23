import { z } from "zod";
import { getArtifactReviewId } from "./artifact-review";
import { checkUploadedAsset, type UploadedPlateAsset } from "./plate-attachment";

export type Reference = {
  _type: "reference";
  _ref: string;
};

export type ParsedArtifact = {
  _id: string;
  title: string;
  slug: string;
  era: string;
  accessionNote: string;
  summary: string;
  artifactLabel: string;
  visualDescription: string;
  imageAlt: string;
  choices: ParsedChoice[];
};

export type ParsedChoice = {
  _key: string;
  label: string;
  outcome: string;
};

export type ParsedOutcome = {
  _id: string;
  title: string;
  body: string;
  era: string;
  consequenceTags: string[];
  leadsTo: string;
  why: string;
};

export type ParsedRewire = {
  outcome: string;
  from: string;
  to: string;
  why: string;
};

export type ParsedNewExhibits = {
  artifacts: ParsedArtifact[];
  outcomes: ParsedOutcome[];
  rewire: ParsedRewire[];
  newTagPhrases: Record<string, string>;
};

export type OutcomeDoc = {
  _id: string;
  _type: "outcome";
  title: string;
  body: string;
  era: Reference;
  consequenceTags: string[];
};

export type ArtifactDraft = {
  _id: string;
  _type: "artifact";
  title: string;
  slug: {
    _type: "slug";
    current: string;
  };
  era: Reference;
  accessionNote: string;
  summary: string;
  artifactLabel: string;
  visualDescription: string;
  image: {
    _type: "image";
    asset: Reference;
    alt: string;
  };
  choices: Array<{
    _key: string;
    _type: "object";
    label: string;
    outcome: Reference;
  }>;
};

export type LeadsToPatch = {
  id: string;
  ifRevisionId: string;
  set: {
    leadsTo: Reference;
  };
};

export type RevisionState = {
  _rev?: string;
  leadsTo?: Reference | null;
};

export type ReadState = {
  parsed: ParsedNewExhibits;
  existingPublishedIds: string[];
  existingDraftIds: string[];
  existingReviewIds: string[];
  missingEraIds: string[];
  existingTargetArtifactIds: string[];
  rewireDraftIds: string[];
  rewireCurrentRefs: Record<string, string | undefined>;
};

export type ResumeArtifactState = {
  published?: Record<string, unknown>;
  draft?: Record<string, unknown>;
  review?: Record<string, unknown>;
  draftAsset?: UploadedPlateAsset;
};

export type ResumePublicationInput = {
  parsed: ParsedNewExhibits;
  publishedOutcomes: Record<string, Record<string, unknown> | undefined>;
  artifactStates: Record<string, ResumeArtifactState | undefined>;
};

export type ResumePublicationPlan = {
  blockers: string[];
  outcomeActions: Array<{
    id: string;
    action: "create" | "skip";
  }>;
  artifactActions: Array<
    | {
        id: string;
        action: "upload-create";
      }
    | {
        id: string;
        action: "reuse-draft";
        assetId: string;
      }
  >;
};

const tagPattern = /^[a-z0-9-]{2,32}$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const keyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const artifactSchema = z.object({
  _id: z.string().regex(/^artifact-[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(3).max(100),
  slug: z.string().min(1).max(96).regex(slugPattern),
  era: z.string().regex(/^era-[a-z0-9]+(?:-[a-z0-9]+)*$/),
  accessionNote: z.string().min(8).max(120),
  summary: z.string().min(40).max(320),
  artifactLabel: z.string().min(20).max(240),
  visualDescription: z.string().min(30).max(320),
  imageAlt: z.string().min(20).max(320),
  choices: z
    .array(
      z.object({
        _key: z.string().min(1).max(96).regex(keyPattern),
        label: z.string().min(3).max(80),
        outcome: z.string().regex(/^outcome-[a-z0-9]+(?:-[a-z0-9]+)*$/),
      }),
    )
    .min(2)
    .max(4),
});

const outcomeSchema = z.object({
  _id: z.string().regex(/^outcome-[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(3).max(90),
  body: z.string().min(30).max(520),
  era: z.string().regex(/^era-[a-z0-9]+(?:-[a-z0-9]+)*$/),
  consequenceTags: z
    .array(z.string().regex(tagPattern))
    .min(1)
    .max(4)
    .refine((tags) => new Set(tags).size === tags.length, {
      message: "duplicate tags",
    }),
  leadsTo: z.string().regex(/^artifact-[a-z0-9]+(?:-[a-z0-9]+)*$/),
  why: z.string().min(1).max(500),
});

const rewireSchema = z.object({
  outcome: z.string().regex(/^outcome-[a-z0-9]+(?:-[a-z0-9]+)*$/),
  from: z.string().regex(/^artifact-[a-z0-9]+(?:-[a-z0-9]+)*$/),
  to: z.string().regex(/^artifact-[a-z0-9]+(?:-[a-z0-9]+)*$/),
  why: z.string().min(1).max(500),
});

const newExhibitsSchema = z.object({
  artifacts: z.array(artifactSchema).min(1),
  outcomes: z.array(outcomeSchema).min(1),
  rewire: z.array(rewireSchema).min(1),
  newTagPhrases: z.record(z.string().regex(tagPattern), z.string().min(1)),
});

export function parseNewExhibits(
  json: unknown,
): { ok: true; value: ParsedNewExhibits } | { ok: false; reasons: string[] } {
  const parsed = newExhibitsSchema.safeParse(json);
  const reasons: string[] = [];

  if (!parsed.success) {
    reasons.push(
      ...parsed.error.issues.map((issue) => {
        const path = formatPath(issue.path);
        return `${path || "<root>"}: ${issue.message}`;
      }),
    );
    return { ok: false, reasons };
  }

  const value = parsed.data;
  const outcomeIds = new Set(value.outcomes.map((outcome) => outcome._id));
  const outcomeSourceArtifact = new Map<string, string>();

  collectDuplicateIds(
    value.artifacts.map((artifact) => artifact._id),
    "artifacts",
    reasons,
  );
  collectDuplicateIds(
    value.outcomes.map((outcome) => outcome._id),
    "outcomes",
    reasons,
  );

  value.artifacts.forEach((artifact, artifactIndex) => {
    const choiceKeys = new Set<string>();
    const choiceOutcomes = new Set<string>();

    artifact.choices.forEach((choice, choiceIndex) => {
      if (choiceKeys.has(choice._key)) {
        reasons.push(
          `artifacts[${artifactIndex}].choices[${choiceIndex}]._key: duplicate key`,
        );
      }
      choiceKeys.add(choice._key);

      if (choiceOutcomes.has(choice.outcome)) {
        reasons.push(
          `artifacts[${artifactIndex}].choices[${choiceIndex}].outcome: duplicate outcome`,
        );
      }
      choiceOutcomes.add(choice.outcome);

      if (!outcomeIds.has(choice.outcome)) {
        reasons.push(
          `artifacts[${artifactIndex}].choices[${choiceIndex}].outcome: unknown outcome ${choice.outcome}`,
        );
      }
      outcomeSourceArtifact.set(choice.outcome, artifact._id);
    });
  });

  value.outcomes.forEach((outcome, outcomeIndex) => {
    const sourceArtifact = outcomeSourceArtifact.get(outcome._id);

    if (!sourceArtifact) {
      reasons.push(`outcomes[${outcomeIndex}]._id: not referenced by an artifact choice`);
    }

    if (sourceArtifact === outcome.leadsTo) {
      reasons.push(`outcomes[${outcomeIndex}].leadsTo: self-loop`);
    }
  });

  value.rewire.forEach((rewire, rewireIndex) => {
    if (rewire.from === rewire.to) {
      reasons.push(`rewire[${rewireIndex}].to: self-loop`);
    }
  });

  if (reasons.length > 0) {
    return { ok: false, reasons };
  }

  return { ok: true, value };
}

export function buildOutcomeDocs(parsed: ParsedNewExhibits): OutcomeDoc[] {
  return parsed.outcomes.map((outcome) => ({
    _id: outcome._id,
    _type: "outcome",
    title: outcome.title,
    body: outcome.body,
    era: reference(outcome.era),
    consequenceTags: [...outcome.consequenceTags],
  }));
}

export function buildArtifactDraft(
  artifact: ParsedArtifact,
  assetId: string,
  alt: string,
): ArtifactDraft {
  return {
    _id: `drafts.${artifact._id}`,
    _type: "artifact",
    title: artifact.title,
    slug: { _type: "slug", current: artifact.slug },
    era: reference(artifact.era),
    accessionNote: artifact.accessionNote,
    summary: artifact.summary,
    artifactLabel: artifact.artifactLabel,
    visualDescription: artifact.visualDescription,
    image: {
      _type: "image",
      asset: reference(assetId),
      alt,
    },
    choices: artifact.choices.map((choice) => ({
      _key: choice._key,
      _type: "object",
      label: choice.label,
      outcome: reference(choice.outcome),
    })),
  };
}

export function buildLeadsToPatches(
  parsed: ParsedNewExhibits,
  revisions: Record<string, RevisionState | undefined>,
): { ok: true; patches: LeadsToPatch[] } | { ok: false; reason: string } {
  const patches: LeadsToPatch[] = [];

  for (const outcome of parsed.outcomes) {
    const revision = revisions[outcome._id]?._rev;

    if (!revision) {
      return { ok: false, reason: `Outcome ${outcome._id} is missing a revision.` };
    }

    patches.push({
      id: outcome._id,
      ifRevisionId: revision,
      set: { leadsTo: reference(outcome.leadsTo) },
    });
  }

  for (const rewire of parsed.rewire) {
    const state = revisions[rewire.outcome];
    const revision = state?._rev;

    if (!revision) {
      return {
        ok: false,
        reason: `Rewire outcome ${rewire.outcome} is missing a revision.`,
      };
    }

    const currentRef = state.leadsTo?._ref;
    if (currentRef !== rewire.from) {
      return {
        ok: false,
        reason: `Rewire outcome ${rewire.outcome} current leadsTo ${String(
          currentRef,
        )} does not match expected ${rewire.from}.`,
      };
    }

    patches.push({
      id: rewire.outcome,
      ifRevisionId: revision,
      set: { leadsTo: reference(rewire.to) },
    });
  }

  return { ok: true, patches };
}

export function planPreflight(readState: ReadState): string[] {
  return [
    ...existencePreflightBlockers(readState),
    ...invariantPreflightBlockers(readState),
  ];
}

// The subset of planPreflight's checks that stay meaningful in resume mode:
// every invariant EXCEPT "does a new id/draft/review already exist" (resume
// expects some of those and planResumePublication judges them on content,
// not mere existence). Missing eras, missing external leadsTo/rewire target
// artifacts, rewire drafts, and stale rewire `from` refs are never expected
// in resume mode either, so they must still block.
export function planPreflightInvariants(readState: ReadState): string[] {
  return invariantPreflightBlockers(readState);
}

function existencePreflightBlockers(readState: ReadState): string[] {
  const blockers: string[] = [];
  const newIds = newDocumentIds(readState.parsed);

  for (const id of newIds) {
    if (readState.existingPublishedIds.includes(id)) {
      blockers.push(`Published document ${id} already exists.`);
    }
  }

  for (const id of readState.existingDraftIds) {
    blockers.push(`Draft document ${draftId(id)} already exists.`);
  }

  for (const id of readState.existingReviewIds) {
    blockers.push(`Review document ${id} already exists.`);
  }

  return blockers;
}

function invariantPreflightBlockers(readState: ReadState): string[] {
  const blockers: string[] = [];
  const newArtifactIds = new Set(
    readState.parsed.artifacts.map((artifact) => artifact._id),
  );
  const existingTargetArtifactIds = new Set(readState.existingTargetArtifactIds);

  for (const id of readState.rewireDraftIds) {
    blockers.push(`Rewire draft ${id} already exists.`);
  }

  for (const outcome of readState.parsed.outcomes) {
    if (
      !newArtifactIds.has(outcome.leadsTo) &&
      !existingTargetArtifactIds.has(outcome.leadsTo)
    ) {
      blockers.push(
        `Outcome ${outcome._id} leadsTo missing artifact ${outcome.leadsTo}.`,
      );
    }
  }

  for (const rewire of readState.parsed.rewire) {
    const currentRef = readState.rewireCurrentRefs[rewire.outcome];

    if (currentRef !== rewire.from) {
      blockers.push(
        `Rewire outcome ${rewire.outcome} currently leads to ${currentRef}, expected ${rewire.from}.`,
      );
    }

    if (
      !newArtifactIds.has(rewire.to) &&
      !existingTargetArtifactIds.has(rewire.to)
    ) {
      blockers.push(
        `Rewire outcome ${rewire.outcome} points to missing artifact ${rewire.to}.`,
      );
    }
  }

  for (const id of readState.missingEraIds) {
    blockers.push(`Era ${id} was not found.`);
  }

  return blockers;
}

export function planResumePublication(
  input: ResumePublicationInput,
): ResumePublicationPlan {
  const blockers: string[] = [];
  const outcomeActions = input.parsed.outcomes.map((outcome) => {
    const planned = buildOutcomeDocs(input.parsed).find(
      (doc) => doc._id === outcome._id,
    );
    const published = input.publishedOutcomes[outcome._id];

    if (!planned) {
      throw new Error(`No planned outcome for ${outcome._id}.`);
    }

    if (!published) {
      return { id: outcome._id, action: "create" as const };
    }

    if (!deepEqualForResume(published, planned)) {
      blockers.push(
        `Published outcome ${outcome._id} differs from the planned document.`,
      );
    }

    return { id: outcome._id, action: "skip" as const };
  });

  const artifactActions = input.parsed.artifacts.map((artifact) => {
    const state = input.artifactStates[artifact._id];

    if (state?.published) {
      blockers.push(`Published artifact ${artifact._id} already exists.`);
      return { id: artifact._id, action: "upload-create" as const };
    }

    if (state?.review) {
      blockers.push(
        `Review document ${getArtifactReviewId(
          artifact._id,
        )} exists before artifact publication.`,
      );
    }

    if (!state?.draft) {
      return { id: artifact._id, action: "upload-create" as const };
    }

    const assetId = extractImageAssetRef(state.draft);
    const plannedDraft = buildArtifactDraft(
      artifact,
      assetId ?? "<asset-after-upload>",
      artifact.imageAlt,
    );

    if (!assetId || !deepEqualIgnoringDraftAsset(state.draft, plannedDraft)) {
      blockers.push(
        `Draft drafts.${artifact._id} differs from the planned artifact draft.`,
      );
      return { id: artifact._id, action: "upload-create" as const };
    }

    const assetCheck = state.draftAsset
      ? checkUploadedAsset(state.draftAsset)
      : { ok: false as const, reason: "draft image asset was not found" };

    if (!assetCheck.ok) {
      blockers.push(
        `Draft drafts.${artifact._id} image asset ${assetId} is not reusable: ${assetCheck.reason}.`,
      );
      return { id: artifact._id, action: "upload-create" as const };
    }

    return { id: artifact._id, action: "reuse-draft" as const, assetId };
  });

  return { blockers, outcomeActions, artifactActions };
}

// Pairs each fetched document with its request by the document's own _id,
// never by array position. `readDocuments`/`Promise.all` preserve the order
// of the ids they were asked for, but callers must not assume any particular
// slice of that result belongs to any particular id list (e.g. "outcomes
// come before artifacts") — that assumption is what caused T-011c2's resume
// preflight to compare the wrong documents. Missing entries (null/undefined,
// e.g. a document that does not exist yet) are simply omitted.
export function indexDocumentsById<T extends { _id: string }>(
  docs: Array<T | null | undefined>,
): Record<string, T> {
  const byId: Record<string, T> = {};

  for (const doc of docs) {
    if (doc) {
      byId[doc._id] = doc;
    }
  }

  return byId;
}

export function newDocumentIds(parsed: ParsedNewExhibits): string[] {
  return [
    ...parsed.artifacts.map((artifact) => artifact._id),
    ...parsed.outcomes.map((outcome) => outcome._id),
  ];
}

export function artifactReviewIds(parsed: ParsedNewExhibits): string[] {
  return parsed.artifacts.map((artifact) => getArtifactReviewId(artifact._id));
}

export function externalTargetArtifactIds(parsed: ParsedNewExhibits): string[] {
  const newArtifactIds = new Set(parsed.artifacts.map((artifact) => artifact._id));
  const targetIds = [
    ...parsed.outcomes.map((outcome) => outcome.leadsTo),
    ...parsed.rewire.map((rewire) => rewire.to),
  ];

  return Array.from(new Set(targetIds.filter((id) => !newArtifactIds.has(id))));
}

export function eraIds(parsed: ParsedNewExhibits): string[] {
  return Array.from(
    new Set([
      ...parsed.artifacts.map((artifact) => artifact.era),
      ...parsed.outcomes.map((outcome) => outcome.era),
    ]),
  );
}

function reference(_ref: string): Reference {
  return { _type: "reference", _ref };
}

function extractImageAssetRef(document: Record<string, unknown>): string | undefined {
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

function deepEqualForResume(actual: unknown, expected: unknown): boolean {
  return deepEqualStructural(normalizeForResume(actual), expected);
}

function deepEqualIgnoringDraftAsset(
  actual: Record<string, unknown>,
  expected: ArtifactDraft,
): boolean {
  return deepEqualStructural(
    removeDraftAssetRef(normalizeForResume(actual)),
    removeDraftAssetRef(expected),
  );
}

// Re-checks a reuse-draft resume action immediately before it is submitted
// for review, using a fresh read taken right before that step. Time passes
// between preflight (planResumePublication) and submit — another process
// could edit the draft or repoint its image asset in between — so this must
// be re-verified right before we act on it, not trusted from preflight.
export function checkReusableDraftStillMatchesPlan(
  actual: Record<string, unknown>,
  planned: ArtifactDraft,
  expectedAssetId: string,
): { ok: true } | { ok: false; reason: string } {
  const assetId = extractImageAssetRef(actual);

  if (assetId !== expectedAssetId) {
    return {
      ok: false,
      reason: `draft image asset is now ${String(assetId)}, expected the reused asset ${expectedAssetId}`,
    };
  }

  if (!deepEqualIgnoringDraftAsset(actual, planned)) {
    return {
      ok: false,
      reason: "draft content changed since preflight",
    };
  }

  return { ok: true };
}

// Re-checks a new outcome immediately before Step C patches its leadsTo,
// using the same fresh read the patch's ifRevisionId is drawn from. Between
// preflight and Step C, another process could edit the outcome or set its
// leadsTo already (e.g. a concurrent/overlapping resume run) — ifRevisionId
// alone guards against a stale write, but not against faithfully patching an
// outcome whose content no longer matches what was planned.
export function verifyOutcomeUnchangedBeforePatch(
  actual: Record<string, unknown> | undefined,
  planned: OutcomeDoc,
): { ok: true } | { ok: false; reason: string } {
  if (!actual) {
    return {
      ok: false,
      reason: `Outcome ${planned._id} was not found before Step C.`,
    };
  }

  if (!deepEqualForResume(actual, planned)) {
    return {
      ok: false,
      reason: `Outcome ${planned._id} changed since preflight (content differs, or leadsTo was already set).`,
    };
  }

  return { ok: true };
}

// Structural equality that is insensitive to object key order (Sanity returns
// document keys in its own order, not necessarily the order this codebase
// builds planned documents in) while still treating array element order —
// and array holes — as significant (e.g. consequenceTags, choices).
export function deepEqualStructural(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }

    for (let index = 0; index < a.length; index += 1) {
      const aHasIndex = index in a;
      const bHasIndex = index in b;

      if (aHasIndex !== bHasIndex) {
        return false;
      }

      if (aHasIndex && !deepEqualStructural(a[index], b[index])) {
        return false;
      }
    }

    return true;
  }

  if (a && b && typeof a === "object" && typeof b === "object") {
    const aRecord = a as Record<string, unknown>;
    const bRecord = b as Record<string, unknown>;
    const aKeys = Object.keys(aRecord);
    const bKeys = Object.keys(bRecord);

    if (aKeys.length !== bKeys.length) {
      return false;
    }

    return aKeys.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(bRecord, key) &&
        deepEqualStructural(aRecord[key], bRecord[key]),
    );
  }

  return false;
}

function normalizeForResume(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeForResume);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const result: Record<string, unknown> = {};

  for (const [key, child] of Object.entries(value)) {
    if (
      key === "_rev" ||
      key === "_createdAt" ||
      key === "_updatedAt" ||
      key === "_system"
    ) {
      continue;
    }

    result[key] = normalizeForResume(child);
  }

  return result;
}

function removeDraftAssetRef(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const clone = JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  const image = clone.image as { asset?: { _ref?: string } } | undefined;

  if (image?.asset) {
    delete image.asset._ref;
  }

  return clone;
}

function draftId(id: string): string {
  return id.startsWith("drafts.") ? id : `drafts.${id}`;
}

function collectDuplicateIds(ids: string[], label: string, reasons: string[]) {
  const seen = new Set<string>();

  ids.forEach((id, index) => {
    if (seen.has(id)) {
      reasons.push(`${label}[${index}]._id: duplicate id ${id}`);
    }
    seen.add(id);
  });
}

function formatPath(path: PropertyKey[]): string {
  return path
    .map((part) => (typeof part === "number" ? `[${part}]` : `.${String(part)}`))
    .join("")
    .replace(/^\./, "");
}
