import { describe, expect, it } from "vitest";
import { context, goodDraft } from "./__fixtures__/drafts";
import { clerkDraftJsonSchema, validateClerkDraft } from "./validate";

describe("validateClerkDraft", () => {
  it("accepts a draft that fits the schema limits, tag list and exhibit list", () => {
    const result = validateClerkDraft(goodDraft(), context);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.draft.choices[0].outcome.leadsTo).toBe(
        "artifact-weather-of-visits-kettle",
      );
      expect(result.draft.choices[1].outcome.leadsTo).toBeUndefined();
    }
  });

  it("rejects text outside the Studio limits", () => {
    const draft = goodDraft();
    draft.summary = "Too short.";
    draft.choices[0].outcome.body = "x".repeat(521);

    const result = validateClerkDraft(draft, context);

    expect(result).toMatchObject({ ok: false });
    if (!result.ok) {
      expect(result.reasons.some((reason) => reason.startsWith("summary:"))).toBe(true);
      expect(
        result.reasons.some((reason) => reason.startsWith("choices.0.outcome.body:")),
      ).toBe(true);
    }
  });

  it("requires exactly two choices", () => {
    const draft = goodDraft();
    const result = validateClerkDraft(
      { ...draft, choices: [draft.choices[0]] },
      context,
    );

    expect(result.ok).toBe(false);
  });

  it("rejects tags the visitor's ticket has no phrase for", () => {
    const draft = goodDraft();
    draft.choices[1].outcome.consequenceTags = ["quiet-refusal", "made-up-tag"];

    const result = validateClerkDraft(draft, context);

    expect(result).toEqual({
      ok: false,
      reasons: [
        'choices.1.outcome.consequenceTags: "made-up-tag" is not in the tag list',
      ],
    });
  });

  it("rejects an ending that leads to an exhibit that is not published", () => {
    const draft = goodDraft();
    draft.choices[0].outcome.leadsTo = "artifact-does-not-exist";

    const result = validateClerkDraft(draft, context);

    expect(result).toEqual({
      ok: false,
      reasons: [
        'choices.0.outcome.leadsTo: "artifact-does-not-exist" is not a published exhibit',
      ],
    });
  });

  it("rejects a title the collection already has, ignoring case", () => {
    const draft = goodDraft();
    draft.title = "the kettle that brews the weather of past visits";

    const result = validateClerkDraft(draft, context);

    expect(result.ok).toBe(false);
  });

  it("rejects two identical choices and duplicate tags", () => {
    const draft = goodDraft();
    draft.choices[1].label = "WIPE YOUR FEET";
    draft.choices[1].outcome.consequenceTags = ["quiet-refusal", "quiet-refusal"];

    const result = validateClerkDraft(draft, context);

    expect(result).toEqual({
      ok: false,
      reasons: [
        "choices: the two choice labels are the same",
        "choices.1.outcome.consequenceTags: duplicate tags",
      ],
    });
  });

  it("rejects answers that are not JSON objects", () => {
    expect(validateClerkDraft("not json", context).ok).toBe(false);
    expect(validateClerkDraft(null, context).ok).toBe(false);
  });

  it("exposes a JSON Schema with the two-choice rule for constrained generators", () => {
    const schema = clerkDraftJsonSchema() as {
      properties: { choices: { minItems: number; maxItems: number } };
    };

    expect(schema.properties.choices).toMatchObject({ minItems: 2, maxItems: 2 });
  });
});
