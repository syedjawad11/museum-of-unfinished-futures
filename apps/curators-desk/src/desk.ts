import {
  getPublishEligibility,
  type ArtifactReview,
  type ArtifactReviewState,
} from "../../../src/domain/artifact-review";

// One row per exhibit: what a curator needs to know before acting on it.

export type RawArtifact = {
  _id: string;
  _rev: string;
  title?: string | null;
  slug?: string | null;
  wing?: string | null;
  hasImage?: boolean | null;
  hasAlt?: boolean | null;
  choices?: Array<{ label?: string | null; outcomeId?: string | null }> | null;
};

export type RawInstance = {
  _id: string;
  _createdAt?: string;
  currentStage?: string;
  completedAt?: string | null;
  fields?: ReadonlyArray<{ name: string; value?: unknown }>;
};

export type DeskStatus = "live" | "live-with-draft" | "draft-only";

export type DeskRow = {
  id: string;
  title: string;
  slug?: string;
  wing?: string;
  status: DeskStatus;
  choices: number;
  endingsLive: number;
  endingsDraftOnly: number;
  endingsMissing: number;
  plate: "ok" | "missing" | "missing-alt";
  gate: ArtifactReviewState | "none";
  publishReady: boolean;
  stage?: string;
  instanceId?: string;
  problems: string[];
};

export function buildDeskRows(input: {
  artifacts: readonly RawArtifact[];
  reviews: ReadonlyArray<ArtifactReview & { _rev?: string }>;
  outcomeIds: readonly string[];
  instances: readonly RawInstance[];
}): DeskRow[] {
  const outcomeIds = new Set(input.outcomeIds);
  const reviews = new Map(input.reviews.map((review) => [review.artifact._ref, review]));
  const runs = latestRunBySubject(input.instances);
  const byId = new Map<string, { published?: RawArtifact; draft?: RawArtifact }>();

  for (const artifact of input.artifacts) {
    const id = publishedId(artifact._id);
    const entry = byId.get(id) ?? {};
    if (artifact._id.startsWith("drafts.")) entry.draft = artifact;
    else entry.published = artifact;
    byId.set(id, entry);
  }

  return [...byId.entries()]
    .map(([id, { published, draft }]) => {
      const current = (draft ?? published)!;
      const choices = current.choices ?? [];
      const endings = choices.map((choice) => choice.outcomeId ?? "");
      const endingsLive = endings.filter((ref) => outcomeIds.has(ref)).length;
      const endingsDraftOnly = endings.filter(
        (ref) => !outcomeIds.has(ref) && outcomeIds.has(`drafts.${ref}`),
      ).length;
      const endingsMissing = endings.length - endingsLive - endingsDraftOnly;
      const plate = !current.hasImage ? "missing" : current.hasAlt ? "ok" : "missing-alt";
      const review = reviews.get(id) ?? null;
      const run = runs.get(id);
      const status: DeskStatus = published
        ? draft
          ? "live-with-draft"
          : "live"
        : "draft-only";
      const publishReady =
        !!draft && getPublishEligibility({ review, draftRevision: draft._rev }).eligible;

      const problems: string[] = [];
      if (choices.length < 2) problems.push("fewer than two choices");
      if (endingsMissing > 0) problems.push(`${endingsMissing} ending(s) missing`);
      if (plate === "missing") problems.push("no blueprint plate");
      if (plate === "missing-alt") problems.push("plate has no alt text");
      if (draft && review?.state === "approved" && !publishReady) {
        problems.push("draft changed after approval");
      }

      return {
        id,
        title: current.title?.trim() || id,
        slug: current.slug ?? undefined,
        wing: current.wing ?? undefined,
        status,
        choices: choices.length,
        endingsLive,
        endingsDraftOnly,
        endingsMissing,
        plate,
        gate: review?.state ?? "none",
        publishReady,
        stage: run?.currentStage,
        instanceId: run?._id,
        problems,
      } satisfies DeskRow;
    })
    .sort(
      (a, b) =>
        statusOrder(a.status) - statusOrder(b.status) || a.title.localeCompare(b.title),
    );
}

/** The newest unfinished run per subject, falling back to the newest finished one. */
export function latestRunBySubject(
  instances: readonly RawInstance[],
): Map<string, RawInstance> {
  const runs = new Map<string, RawInstance>();

  for (const instance of instances) {
    const subject = instance.fields?.find((field) => field.name === "subject")?.value;
    const gdr = (subject as { id?: unknown } | undefined)?.id;
    if (typeof gdr !== "string") continue;

    const id = gdr.slice(gdr.lastIndexOf(":") + 1);
    const existing = runs.get(id);
    if (!existing || isNewerRun(instance, existing)) {
      runs.set(id, instance);
    }
  }

  return runs;
}

function isNewerRun(candidate: RawInstance, existing: RawInstance): boolean {
  const candidateOpen = !candidate.completedAt;
  const existingOpen = !existing.completedAt;
  if (candidateOpen !== existingOpen) return candidateOpen;
  return (candidate._createdAt ?? "") > (existing._createdAt ?? "");
}

function statusOrder(status: DeskStatus): number {
  return status === "draft-only" ? 0 : status === "live-with-draft" ? 1 : 2;
}

function publishedId(id: string): string {
  return id.replace(/^drafts\./, "");
}
