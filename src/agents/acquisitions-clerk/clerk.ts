import type { Generator } from "./generate";
import { buildDraftInstruction, type DraftPromptInput } from "./prompt";
import {
  validateClerkDraft,
  type ClerkDraft,
  type ClerkDraftContext,
} from "./validate";

export const MAX_GENERATION_ATTEMPTS = 2;

export type DraftAttempt = { instruction: string; answer: unknown; reasons: string[] };

export type ProduceDraftResult =
  | { ok: true; draft: ClerkDraft; attempts: DraftAttempt[] }
  | { ok: false; reasons: string[]; attempts: DraftAttempt[] };

/**
 * Asks the generator for a draft and validates it. A rejected answer is sent
 * back once with the reasons; after that the Clerk gives up and writes nothing.
 */
export async function produceValidDraft(input: {
  generator: Generator;
  prompt: Omit<DraftPromptInput, "validationErrors">;
  context: ClerkDraftContext;
  maxAttempts?: number;
}): Promise<ProduceDraftResult> {
  const maxAttempts = input.maxAttempts ?? MAX_GENERATION_ATTEMPTS;
  const attempts: DraftAttempt[] = [];
  let reasons: string[] = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const instruction = buildDraftInstruction({
      ...input.prompt,
      ...(reasons.length > 0 ? { validationErrors: reasons } : {}),
    });
    const answer = await input.generator.generate(instruction);
    const result = validateClerkDraft(answer, input.context);

    if (result.ok) {
      attempts.push({ instruction, answer, reasons: [] });
      return { ok: true, draft: result.draft, attempts };
    }

    reasons = result.reasons;
    attempts.push({ instruction, answer, reasons });
  }

  return { ok: false, reasons, attempts };
}
