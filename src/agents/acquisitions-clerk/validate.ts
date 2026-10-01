import { z } from "zod";

// Limits mirror schemas/artifact.ts and schemas/outcome.ts, so a draft that
// passes here also passes Studio validation.
const outcomeDraftSchema = z.object({
  title: z.string().trim().min(3).max(90),
  body: z.string().trim().min(30).max(520),
  consequenceTags: z.array(z.string().trim()).min(1).max(4),
  leadsTo: z.string().trim().optional(),
});

const choiceDraftSchema = z.object({
  label: z.string().trim().min(3).max(80),
  outcome: outcomeDraftSchema,
});

export const clerkDraftSchema = z.object({
  title: z.string().trim().min(3).max(100),
  accessionNote: z.string().trim().min(8).max(120),
  summary: z.string().trim().min(40).max(320),
  artifactLabel: z.string().trim().min(20).max(240),
  visualDescription: z.string().trim().min(30).max(320),
  choices: z.array(choiceDraftSchema).length(2),
});

export type ClerkDraft = z.infer<typeof clerkDraftSchema>;

export type ClerkDraftContext = {
  /** Tags the visitor's ticket already has phrases for (ticket-lines.json). */
  tagVocabulary: readonly string[];
  /** Published artifacts an ending may lead to. */
  leadsToOptions: readonly string[];
  /** Titles already in the collection, compared case-insensitively. */
  existingTitles: readonly string[];
};

export type ClerkDraftValidation =
  | { ok: true; draft: ClerkDraft }
  | { ok: false; reasons: string[] };

export function validateClerkDraft(
  json: unknown,
  context: ClerkDraftContext,
): ClerkDraftValidation {
  const parsed = clerkDraftSchema.safeParse(json);

  if (!parsed.success) {
    return {
      ok: false,
      reasons: parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`,
      ),
    };
  }

  const draft = parsed.data;
  const reasons: string[] = [];
  const vocabulary = new Set(context.tagVocabulary);
  const leadsToOptions = new Set(context.leadsToOptions);
  const existingTitles = new Set(
    context.existingTitles.map((title) => title.toLowerCase()),
  );

  if (existingTitles.has(draft.title.toLowerCase())) {
    reasons.push(`title: an exhibit called "${draft.title}" already exists`);
  }

  const [first, second] = draft.choices;
  if (first.label.toLowerCase() === second.label.toLowerCase()) {
    reasons.push("choices: the two choice labels are the same");
  }
  if (first.outcome.title.toLowerCase() === second.outcome.title.toLowerCase()) {
    reasons.push("choices: the two endings have the same title");
  }

  draft.choices.forEach((choice, index) => {
    const tags = choice.outcome.consequenceTags;

    if (new Set(tags).size !== tags.length) {
      reasons.push(`choices.${index}.outcome.consequenceTags: duplicate tags`);
    }

    for (const tag of tags) {
      if (!vocabulary.has(tag)) {
        reasons.push(
          `choices.${index}.outcome.consequenceTags: "${tag}" is not in the tag list`,
        );
      }
    }

    const leadsTo = choice.outcome.leadsTo;
    if (leadsTo !== undefined && leadsTo !== "" && !leadsToOptions.has(leadsTo)) {
      reasons.push(
        `choices.${index}.outcome.leadsTo: "${leadsTo}" is not a published exhibit`,
      );
    }
  });

  if (reasons.length > 0) {
    return { ok: false, reasons };
  }

  return {
    ok: true,
    draft: {
      ...draft,
      choices: draft.choices.map((choice) => ({
        ...choice,
        outcome: {
          ...choice.outcome,
          leadsTo: choice.outcome.leadsTo || undefined,
        },
      })),
    },
  };
}

/** JSON Schema for generators that can constrain their output (Ollama). */
export function clerkDraftJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(clerkDraftSchema) as Record<string, unknown>;
}
