import { describe, expect, it } from "vitest";
import { context, goodDraft } from "./__fixtures__/drafts";
import { produceValidDraft } from "./clerk";
import { createFakeGenerator } from "./generate";

const prompt = {
  brief: "A doormat that knows who is coming.",
  wing: { title: "Domestic Weather Memory Era" },
  examples: [],
  tagPhrases: { "borrowed-time": "carrying a day that was never yours to keep" },
  leadsToOptions: [],
};

describe("produceValidDraft", () => {
  it("returns the first valid answer without a second request", async () => {
    const generator = createFakeGenerator([goodDraft()]);

    const result = await produceValidDraft({ generator, prompt, context });

    expect(result.ok).toBe(true);
    expect(generator.instructions).toHaveLength(1);
    expect(generator.instructions[0]).toContain("A doormat that knows who is coming.");
    expect(generator.instructions[0]).toContain("JSON");
  });

  it("sends the validation reasons back once and accepts the corrected answer", async () => {
    const broken = { ...goodDraft(), summary: "Too short." };
    const generator = createFakeGenerator([broken, goodDraft()]);

    const result = await produceValidDraft({ generator, prompt, context });

    expect(result.ok).toBe(true);
    expect(generator.instructions).toHaveLength(2);
    expect(generator.instructions[0]).not.toContain("Your last answer was rejected");
    expect(generator.instructions[1]).toContain("Your last answer was rejected");
    expect(generator.instructions[1]).toContain("- summary:");
  });

  it("gives up after two bad answers and reports why", async () => {
    const generator = createFakeGenerator(["nope", { title: "x" }, goodDraft()]);

    const result = await produceValidDraft({ generator, prompt, context });

    expect(result.ok).toBe(false);
    expect(generator.instructions).toHaveLength(2);
    if (!result.ok) {
      expect(result.reasons.length).toBeGreaterThan(0);
      expect(result.attempts).toHaveLength(2);
    }
  });

  it("puts the curator's note and the previous draft into a revision prompt", async () => {
    const generator = createFakeGenerator([goodDraft()]);

    await produceValidDraft({
      generator,
      prompt: {
        ...prompt,
        revision: { reason: "The second ending repeats the first.", previous: goodDraft() },
      },
      context,
    });

    expect(generator.instructions[0]).toContain(
      "Curator's note: The second ending repeats the first.",
    );
    expect(generator.instructions[0]).toContain('"title":"The Doormat That Learns Who Is Expected"');
  });
});
