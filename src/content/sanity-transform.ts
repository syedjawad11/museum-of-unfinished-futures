import { z } from "zod";
import type { ExhibitArtifact, ExhibitEra } from "./types";

const optionalNullable = <Schema extends z.ZodTypeAny>(schema: Schema) =>
  z.preprocess((value) => (value === null ? undefined : value), schema.optional());

const resolvedEraSummarySchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: z.string().min(1),
  accentColor: optionalNullable(z.string().min(1)),
});

const resolvedLeadsToSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
});

const resolvedOutcomeSchema = z.object({
  _id: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  consequenceTags: optionalNullable(z.array(z.string().min(1))).default([]),
  leadsTo: optionalNullable(resolvedLeadsToSchema),
});

const resolvedChoiceSchema = z.object({
  _key: z.string().min(1),
  label: z.string().min(1),
  outcome: resolvedOutcomeSchema,
});

const resolvedImageSchema = z.object({
  asset: z.object({
    url: z.string().min(1),
    metadata: z.object({
      lqip: optionalNullable(z.string().min(1)),
      dimensions: z.object({
        width: z.number().positive(),
        height: z.number().positive(),
      }),
    }),
  }),
  alt: z.string().min(1),
});

const resolvedArtifactSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  era: resolvedEraSummarySchema,
  accessionNote: z.string().min(1),
  summary: z.string().min(1),
  artifactLabel: z.string().min(1),
  visualDescription: z.string().min(1),
  image: optionalNullable(resolvedImageSchema),
  choices: z.array(resolvedChoiceSchema).min(2).max(4),
});

const resolvedEraSchema = resolvedEraSummarySchema.extend({
  exhibits: z.array(resolvedArtifactSchema),
});

export type SanityArtifactResult = z.input<typeof resolvedArtifactSchema>;

export function transformSanityArtifact(
  value: unknown,
): ExhibitArtifact | null {
  const parsed = resolvedArtifactSchema.safeParse(value);

  if (!parsed.success) {
    return null;
  }

  const outcomes = parsed.data.choices.map((choice) => ({
    id: choice.outcome._id,
    title: choice.outcome.title,
    body: choice.outcome.body,
    consequenceTags: choice.outcome.consequenceTags,
    ...(choice.outcome.leadsTo ? { leadsTo: choice.outcome.leadsTo } : {}),
  }));

  return {
    slug: parsed.data.slug,
    title: parsed.data.title,
    era: {
      title: parsed.data.era.title,
      slug: parsed.data.era.slug,
      summary: parsed.data.era.summary,
      ...(parsed.data.era.accentColor
        ? { accentColor: parsed.data.era.accentColor }
        : {}),
    },
    accessionNote: parsed.data.accessionNote,
    summary: parsed.data.summary,
    artifactLabel: parsed.data.artifactLabel,
    visualDescription: parsed.data.visualDescription,
    choices: parsed.data.choices.map((choice) => ({
      id: choice._key,
      label: choice.label,
      outcomeId: choice.outcome._id,
    })),
    outcomes,
    ...(parsed.data.image
      ? {
          image: {
            url: parsed.data.image.asset.url,
            alt: parsed.data.image.alt,
            width: parsed.data.image.asset.metadata.dimensions.width,
            height: parsed.data.image.asset.metadata.dimensions.height,
            ...(parsed.data.image.asset.metadata.lqip
              ? { lqip: parsed.data.image.asset.metadata.lqip }
              : {}),
          },
        }
      : {}),
  };
}

export function transformSanityArtifacts(values: unknown): ExhibitArtifact[] {
  if (!Array.isArray(values)) {
    throw new Error("Sanity artifact query did not return an array");
  }

  const artifacts = values.map(transformSanityArtifact);
  const malformedCount = artifacts.filter((artifact) => artifact === null).length;

  if (malformedCount > 0) {
    const noun = malformedCount === 1 ? "artifact" : "artifacts";
    throw new Error(
      `Sanity returned ${malformedCount} malformed published ${noun}`,
    );
  }

  return artifacts as ExhibitArtifact[];
}

export function transformSanityEra(value: unknown): ExhibitEra | null {
  const parsed = resolvedEraSchema.safeParse(value);

  if (!parsed.success) {
    return null;
  }

  const exhibits = parsed.data.exhibits.map(transformSanityArtifact);

  if (exhibits.some((exhibit) => exhibit === null)) {
    return null;
  }

  return {
    title: parsed.data.title,
    slug: parsed.data.slug,
    summary: parsed.data.summary,
    ...(parsed.data.accentColor ? { accentColor: parsed.data.accentColor } : {}),
    exhibits: exhibits as ExhibitArtifact[],
  };
}

export function transformSanityEras(values: unknown): ExhibitEra[] {
  if (!Array.isArray(values)) {
    throw new Error("Sanity era query did not return an array");
  }

  const eras = values.map(transformSanityEra);
  const malformedCount = eras.filter((era) => era === null).length;

  if (malformedCount > 0) {
    const noun = malformedCount === 1 ? "era" : "eras";
    throw new Error(`Sanity returned ${malformedCount} malformed published ${noun}`);
  }

  return eras as ExhibitEra[];
}
