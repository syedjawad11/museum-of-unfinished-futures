import type { ClerkDraft } from "./validate";

export type StrongReference = { _type: "reference"; _ref: string };

// How Studio stores a reference to a document that is not published yet: weak
// now, made strong when the referring document is published.
export type PendingReference = {
  _type: "reference";
  _ref: string;
  _weak: true;
  _strengthenOnPublish: { type: string };
};

export type ClerkArtifactDraft = {
  _id: string;
  _type: "artifact";
  title: string;
  slug: { _type: "slug"; current: string };
  era: StrongReference;
  accessionNote: string;
  summary: string;
  artifactLabel: string;
  visualDescription: string;
  choices: Array<{
    _key: string;
    _type: "object";
    label: string;
    outcome: PendingReference;
  }>;
};

export type ClerkOutcomeDraft = {
  _id: string;
  _type: "outcome";
  title: string;
  body: string;
  era: StrongReference;
  consequenceTags: string[];
  leadsTo?: StrongReference;
};

export type ClerkDocuments = {
  artifactId: string;
  artifact: ClerkArtifactDraft;
  outcomes: ClerkOutcomeDraft[];
};

const SLUG_MAX_LENGTH = 96;

export function slugify(text: string): string {
  const slug = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug.slice(0, SLUG_MAX_LENGTH).replace(/-+$/g, "");
}

/** A slug for the title that no existing exhibit uses yet. */
export function uniqueSlug(title: string, takenSlugs: readonly string[]): string {
  const taken = new Set(takenSlugs);
  const base = slugify(title) || "acquisition";

  if (!taken.has(base)) {
    return base;
  }

  for (let suffix = 2; ; suffix += 1) {
    const ending = `-${suffix}`;
    const candidate = `${base.slice(0, SLUG_MAX_LENGTH - ending.length)}${ending}`;
    if (!taken.has(candidate)) {
      return candidate;
    }
  }
}

export function outcomeIdsFor(slug: string): [string, string] {
  return [`outcome-${slug}-1`, `outcome-${slug}-2`];
}

export function buildClerkDocuments(input: {
  draft: ClerkDraft;
  slug: string;
  eraId: string;
}): ClerkDocuments {
  const artifactId = `artifact-${input.slug}`;
  const outcomeIds = outcomeIdsFor(input.slug);
  const era: StrongReference = { _type: "reference", _ref: input.eraId };
  const usedKeys = new Set<string>();

  return {
    artifactId,
    artifact: {
      _id: `drafts.${artifactId}`,
      _type: "artifact",
      ...artifactContent(input.draft),
      slug: { _type: "slug", current: input.slug },
      era,
      choices: input.draft.choices.map((choice, index) => ({
        _key: choiceKey(choice.label, index, usedKeys),
        _type: "object",
        label: choice.label,
        outcome: {
          _type: "reference",
          _ref: outcomeIds[index],
          _weak: true,
          _strengthenOnPublish: { type: "outcome" },
        },
      })),
    },
    outcomes: input.draft.choices.map((choice, index) => ({
      _id: `drafts.${outcomeIds[index]}`,
      _type: "outcome",
      ...outcomeContent(choice.outcome),
      era,
    })),
  };
}

/**
 * The fields a revision may change. Ids, slug, era and the choice-to-ending
 * wiring stay fixed, so a revision can never point a choice somewhere new.
 */
export function buildRevisionSets(draft: ClerkDraft): {
  artifact: Record<string, unknown>;
  outcomes: [Record<string, unknown>, Record<string, unknown>];
  unsetLeadsTo: [boolean, boolean];
} {
  const [first, second] = draft.choices;

  return {
    artifact: {
      ...artifactContent(draft),
      "choices[0].label": first.label,
      "choices[1].label": second.label,
    },
    outcomes: [outcomeContent(first.outcome), outcomeContent(second.outcome)],
    unsetLeadsTo: [!first.outcome.leadsTo, !second.outcome.leadsTo],
  };
}

/** Reads a stored draft back into the generator's shape, for a revision prompt. */
export function draftFromDocuments(
  artifact: Partial<ClerkArtifactDraft>,
  outcomes: Array<Partial<ClerkOutcomeDraft> | null | undefined>,
): unknown {
  return {
    title: artifact.title,
    accessionNote: artifact.accessionNote,
    summary: artifact.summary,
    artifactLabel: artifact.artifactLabel,
    visualDescription: artifact.visualDescription,
    choices: (artifact.choices ?? []).map((choice, index) => ({
      label: choice.label,
      outcome: {
        title: outcomes[index]?.title,
        body: outcomes[index]?.body,
        consequenceTags: outcomes[index]?.consequenceTags,
        ...(outcomes[index]?.leadsTo
          ? { leadsTo: outcomes[index]?.leadsTo?._ref }
          : {}),
      },
    })),
  };
}

function artifactContent(draft: ClerkDraft) {
  return {
    title: draft.title,
    accessionNote: draft.accessionNote,
    summary: draft.summary,
    artifactLabel: draft.artifactLabel,
    visualDescription: draft.visualDescription,
  };
}

function outcomeContent(outcome: ClerkDraft["choices"][number]["outcome"]) {
  return {
    title: outcome.title,
    body: outcome.body,
    consequenceTags: outcome.consequenceTags,
    ...(outcome.leadsTo
      ? { leadsTo: { _type: "reference" as const, _ref: outcome.leadsTo } }
      : {}),
  };
}

function choiceKey(label: string, index: number, used: Set<string>): string {
  const base = slugify(label).slice(0, 40).replace(/-+$/g, "") || `choice-${index + 1}`;
  const key = used.has(base) ? `${base}-${index + 1}` : base;
  used.add(key);
  return key;
}
