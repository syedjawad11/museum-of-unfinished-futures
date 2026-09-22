export type ChainReferenceProposal = {
  artifactId: string;
  slug: string;
  title: string;
};

export type ChainEntry = {
  _id: KnownOutcomeId;
  artifact: KnownArtifactId;
  consequenceTags: string[];
  leadsTo: ChainReferenceProposal & { artifactId: KnownArtifactId };
};

export type PublishedOutcomeDocument = Record<string, unknown> & {
  _id: string;
  _type: string;
  _rev?: string;
  consequenceTags?: unknown;
  leadsTo?: unknown;
};

export type OutcomePatch = {
  consequenceTags: string[];
  leadsTo: {
    _type: "reference";
    _ref: KnownArtifactId;
  };
};

export type ParseChainProposalResult =
  | { ok: true; entries: ChainEntry[] }
  | { ok: false; code: ParseChainProposalErrorCode; reason: string };

export type ParseChainProposalErrorCode =
  | "invalid-shape"
  | "unknown-outcome"
  | "duplicate-outcome"
  | "missing-outcome"
  | "unknown-artifact"
  | "missing-artifact"
  | "tag-count"
  | "invalid-tag"
  | "duplicate-tags"
  | "self-lead";

export type PreconditionResult =
  | { ok: true }
  | { ok: false; reason: string };

const tagPattern = /^[a-z0-9-]{2,32}$/;

export const CHAIN_OUTCOME_IDS = [
  "outcome-paper-monday",
  "outcome-soft-refusal",
  "outcome-familiar-stranger",
  "outcome-missed-call-self",
  "outcome-room-rains-back",
  "outcome-forecast-forgets",
] as const;

const artifactIds = [
  "artifact-extra-mondays-vending-machine",
  "artifact-roads-not-taken-telephone",
  "artifact-memory-umbrella",
] as const;

export type KnownOutcomeId = (typeof CHAIN_OUTCOME_IDS)[number];
export type KnownArtifactId = (typeof artifactIds)[number];

const outcomeArtifacts = {
  "outcome-paper-monday": "artifact-extra-mondays-vending-machine",
  "outcome-soft-refusal": "artifact-extra-mondays-vending-machine",
  "outcome-familiar-stranger": "artifact-roads-not-taken-telephone",
  "outcome-missed-call-self": "artifact-roads-not-taken-telephone",
  "outcome-room-rains-back": "artifact-memory-umbrella",
  "outcome-forecast-forgets": "artifact-memory-umbrella",
} satisfies Record<KnownOutcomeId, KnownArtifactId>;

const knownOutcomeIds = new Set<string>(CHAIN_OUTCOME_IDS);
const knownArtifactIds = new Set<string>(artifactIds);

export function parseChainProposal(json: unknown): ParseChainProposalResult {
  if (!isRecord(json) || !Array.isArray(json.outcomes)) {
    return {
      ok: false,
      code: "invalid-shape",
      reason: "Chain proposal must include an outcomes array.",
    };
  }

  const seenOutcomeIds = new Set<KnownOutcomeId>();
  const entries: ChainEntry[] = [];

  for (const rawEntry of json.outcomes) {
    if (!isRecord(rawEntry)) {
      return {
        ok: false,
        code: "invalid-shape",
        reason: "Each chain proposal outcome must be an object.",
      };
    }

    const outcomeId = rawEntry._id;
    if (typeof outcomeId !== "string" || !isKnownOutcomeId(outcomeId)) {
      return {
        ok: false,
        code: "unknown-outcome",
        reason: `Outcome ${String(outcomeId)} is not in the approved set.`,
      };
    }

    if (seenOutcomeIds.has(outcomeId)) {
      return {
        ok: false,
        code: "duplicate-outcome",
        reason: `Outcome ${outcomeId} appears more than once.`,
      };
    }
    seenOutcomeIds.add(outcomeId);

    const artifact = rawEntry.artifact;
    if (typeof artifact !== "string" || !isKnownArtifactId(artifact)) {
      return {
        ok: false,
        code: "unknown-artifact",
        reason: `Outcome ${outcomeId} has an unknown source artifact.`,
      };
    }

    const tags = rawEntry.consequenceTags;
    if (!Array.isArray(tags) || tags.length < 1 || tags.length > 4) {
      return {
        ok: false,
        code: "tag-count",
        reason: `Outcome ${outcomeId} must have 1-4 consequence tags.`,
      };
    }

    const seenTags = new Set<string>();
    for (const tag of tags) {
      if (typeof tag !== "string" || !tagPattern.test(tag)) {
        return {
          ok: false,
          code: "invalid-tag",
          reason: `Outcome ${outcomeId} has an invalid consequence tag.`,
        };
      }

      if (seenTags.has(tag)) {
        return {
          ok: false,
          code: "duplicate-tags",
          reason: `Outcome ${outcomeId} has duplicate consequence tags.`,
        };
      }
      seenTags.add(tag);
    }

    const leadsTo = rawEntry.leadsTo;
    if (!isRecord(leadsTo) || typeof leadsTo.artifactId !== "string") {
      return {
        ok: false,
        code: "missing-artifact",
        reason: `Outcome ${outcomeId} is missing a leadsTo artifactId.`,
      };
    }

    if (!isKnownArtifactId(leadsTo.artifactId)) {
      return {
        ok: false,
        code: "unknown-artifact",
        reason: `Outcome ${outcomeId} leads to an unknown artifact.`,
      };
    }

    if (leadsTo.artifactId === artifact || leadsTo.artifactId === outcomeArtifacts[outcomeId]) {
      return {
        ok: false,
        code: "self-lead",
        reason: `Outcome ${outcomeId} leads to its own artifact.`,
      };
    }

    entries.push({
      _id: outcomeId,
      artifact,
      consequenceTags: [...tags],
      leadsTo: {
        artifactId: leadsTo.artifactId,
        slug: typeof leadsTo.slug === "string" ? leadsTo.slug : "",
        title: typeof leadsTo.title === "string" ? leadsTo.title : "",
      },
    });
  }

  for (const outcomeId of CHAIN_OUTCOME_IDS) {
    if (!seenOutcomeIds.has(outcomeId)) {
      return {
        ok: false,
        code: "missing-outcome",
        reason: `Outcome ${outcomeId} is missing from the proposal.`,
      };
    }
  }

  return { ok: true, entries };
}

export function buildOutcomePatch(
  entry: ChainEntry,
  publishedDoc: PublishedOutcomeDocument,
): OutcomePatch {
  if (publishedDoc._id !== entry._id) {
    throw new Error(`Patch entry ${entry._id} does not match document ${publishedDoc._id}.`);
  }

  return {
    consequenceTags: [...entry.consequenceTags],
    leadsTo: {
      _type: "reference",
      _ref: entry.leadsTo.artifactId,
    },
  };
}

export function checkPreconditions(
  publishedDoc: PublishedOutcomeDocument | undefined,
  entry: ChainEntry,
): PreconditionResult {
  if (!publishedDoc) {
    return {
      ok: false,
      reason: `Published outcome ${entry._id} was not found.`,
    };
  }

  if (publishedDoc._type !== "outcome") {
    return {
      ok: false,
      reason: `Document ${entry._id} is not an outcome.`,
    };
  }

  if (
    Array.isArray(publishedDoc.consequenceTags) &&
    publishedDoc.consequenceTags.length > 0
  ) {
    return {
      ok: false,
      reason: `Outcome ${entry._id} already has consequenceTags; refusing to overwrite curated work.`,
    };
  }

  if (publishedDoc.leadsTo !== undefined && publishedDoc.leadsTo !== null) {
    return {
      ok: false,
      reason: `Outcome ${entry._id} already has leadsTo; refusing to overwrite curated work.`,
    };
  }

  return { ok: true };
}

function isKnownOutcomeId(value: string): value is KnownOutcomeId {
  return knownOutcomeIds.has(value);
}

function isKnownArtifactId(value: string): value is KnownArtifactId {
  return knownArtifactIds.has(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
