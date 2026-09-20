import { z } from "zod";
import type { ExhibitArtifact } from "./types";

const resolvedOutcomeSchema = z.object({
  _id: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
});

const resolvedChoiceSchema = z.object({
  _key: z.string().min(1),
  label: z.string().min(1),
  outcome: resolvedOutcomeSchema,
});

const resolvedArtifactSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  accessionNote: z.string().min(1),
  summary: z.string().min(1),
  artifactLabel: z.string().min(1),
  visualDescription: z.string().min(1),
  choices: z.tuple([resolvedChoiceSchema, resolvedChoiceSchema]),
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
  }));

  return {
    slug: parsed.data.slug,
    title: parsed.data.title,
    accessionNote: parsed.data.accessionNote,
    summary: parsed.data.summary,
    artifactLabel: parsed.data.artifactLabel,
    visualDescription: parsed.data.visualDescription,
    choices: [
      {
        id: parsed.data.choices[0]._key,
        label: parsed.data.choices[0].label,
        outcomeId: parsed.data.choices[0].outcome._id,
      },
      {
        id: parsed.data.choices[1]._key,
        label: parsed.data.choices[1].label,
        outcomeId: parsed.data.choices[1].outcome._id,
      },
    ],
    outcomes,
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
