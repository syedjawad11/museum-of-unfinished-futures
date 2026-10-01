import { describe, expect, it } from "vitest";
import { context, goodDraft } from "./__fixtures__/drafts";
import {
  buildClerkDocuments,
  buildRevisionSets,
  draftFromDocuments,
  slugify,
  uniqueSlug,
} from "./documents";
import { validateClerkDraft, type ClerkDraft } from "./validate";

function validDraft(): ClerkDraft {
  const result = validateClerkDraft(goodDraft(), context);
  if (!result.ok) throw new Error(result.reasons.join("; "));
  return result.draft;
}

describe("slugs", () => {
  it("slugifies titles to the Studio slug pattern", () => {
    expect(slugify("The Doormat That Learns Who Is Expected!")).toBe(
      "the-doormat-that-learns-who-is-expected",
    );
    expect(slugify("Café — Ünfinished")).toBe("cafe-unfinished");
    expect(slugify("x".repeat(120))).toHaveLength(96);
  });

  it("adds a numeric suffix when the slug is taken", () => {
    expect(uniqueSlug("Doormat", [])).toBe("doormat");
    expect(uniqueSlug("Doormat", ["doormat", "doormat-2"])).toBe("doormat-3");
  });
});

describe("buildClerkDocuments", () => {
  it("writes drafts only, with the choices pointing at not-yet-published endings", () => {
    const documents = buildClerkDocuments({
      draft: validDraft(),
      slug: "doormat",
      eraId: "era-domestic-weather-memory",
    });

    expect(documents.artifactId).toBe("artifact-doormat");
    expect(documents.artifact._id).toBe("drafts.artifact-doormat");
    expect(documents.outcomes.map((outcome) => outcome._id)).toEqual([
      "drafts.outcome-doormat-1",
      "drafts.outcome-doormat-2",
    ]);
    expect(documents.artifact.slug).toEqual({ _type: "slug", current: "doormat" });
    expect(documents.artifact.era).toEqual({
      _type: "reference",
      _ref: "era-domestic-weather-memory",
    });
    expect(documents.artifact.choices).toEqual([
      {
        _key: "wipe-your-feet",
        _type: "object",
        label: "Wipe your feet",
        outcome: {
          _type: "reference",
          _ref: "outcome-doormat-1",
          _weak: true,
          _strengthenOnPublish: { type: "outcome" },
        },
      },
      {
        _key: "step-over-it",
        _type: "object",
        label: "Step over it",
        outcome: {
          _type: "reference",
          _ref: "outcome-doormat-2",
          _weak: true,
          _strengthenOnPublish: { type: "outcome" },
        },
      },
    ]);
    expect(documents.artifact).not.toHaveProperty("image");
  });

  it("links an ending to a published exhibit only when the draft asks for it", () => {
    const [first, second] = buildClerkDocuments({
      draft: validDraft(),
      slug: "doormat",
      eraId: "era-domestic-weather-memory",
    }).outcomes;

    expect(first.leadsTo).toEqual({
      _type: "reference",
      _ref: "artifact-weather-of-visits-kettle",
    });
    expect(second).not.toHaveProperty("leadsTo");
    expect(second.consequenceTags).toEqual(["quiet-refusal", "line-left-open"]);
  });

  it("keeps choice keys unique when labels slugify the same", () => {
    const draft = validDraft();
    draft.choices[1].label = "Wipe your feet!";

    const keys = buildClerkDocuments({
      draft,
      slug: "doormat",
      eraId: "era-x",
    }).artifact.choices.map((choice) => choice._key);

    expect(new Set(keys).size).toBe(2);
  });
});

describe("revisions", () => {
  it("changes content but never ids, slug, era or the choice wiring", () => {
    const sets = buildRevisionSets(validDraft());

    expect(Object.keys(sets.artifact).sort()).toEqual([
      "accessionNote",
      "artifactLabel",
      "choices[0].label",
      "choices[1].label",
      "summary",
      "title",
      "visualDescription",
    ]);
    expect(sets.outcomes[0]).not.toHaveProperty("era");
    expect(sets.unsetLeadsTo).toEqual([false, true]);
  });

  it("round-trips stored drafts back into the generator's shape", () => {
    const documents = buildClerkDocuments({
      draft: validDraft(),
      slug: "doormat",
      eraId: "era-x",
    });

    const result = validateClerkDraft(
      draftFromDocuments(documents.artifact, documents.outcomes),
      { ...context, existingTitles: [] },
    );

    expect(result).toEqual({ ok: true, draft: validDraft() });
  });
});
