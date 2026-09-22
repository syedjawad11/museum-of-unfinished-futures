import { describe, expect, it } from "vitest";
import type { ArtifactOutcome } from "@/content/types";
import {
  formatConsequenceTag,
  nextStep,
  visitedTrail,
} from "./outcome-chain";

const LIVE_ARTIFACT_SLUGS = [
  "extra-mondays-vending-machine",
  "roads-not-taken-telephone",
  "memory-umbrella",
] as const;

describe("nextStep", () => {
  it("returns the onward exhibit step for each live chain slug", () => {
    for (const slug of LIVE_ARTIFACT_SLUGS) {
      expect(
        nextStep(
          {
            id: `${slug}-outcome`,
            title: "A door remembers you",
            body: "The route continues.",
            consequenceTags: [],
            leadsTo: {
              title: "The next case",
              slug: `${slug}-next`,
            },
          },
          slug,
        ),
      ).toEqual({
        title: "The next case",
        slug: `${slug}-next`,
      });
    }
  });

  it("returns null when leadsTo is missing", () => {
    expect(
      nextStep(
        {
          id: "quiet-outcome",
          title: "The gallery settles",
          body: "Nothing opens.",
          consequenceTags: [],
        },
        "extra-mondays-vending-machine",
      ),
    ).toBeNull();
  });

  it("returns null for a self-referential leadsTo", () => {
    expect(
      nextStep(
        {
          id: "self-loop",
          title: "You are already here",
          body: "The sign points at itself.",
          consequenceTags: ["borrowed-time"],
          leadsTo: {
            title: "Vending Machine for Extra Mondays",
            slug: "extra-mondays-vending-machine",
          },
        },
        "extra-mondays-vending-machine",
      ),
    ).toBeNull();
  });
});

describe("visitedTrail", () => {
  it("continues the walk when the next slug has not been visited", () => {
    expect(
      visitedTrail(["extra-mondays-vending-machine"], "roads-not-taken-telephone"),
    ).toEqual({
      kind: "continue",
      trail: [
        "extra-mondays-vending-machine",
        "roads-not-taken-telephone",
      ],
    });
  });

  it("labels a two-step loop", () => {
    expect(
      visitedTrail(
        ["extra-mondays-vending-machine", "roads-not-taken-telephone"],
        "extra-mondays-vending-machine",
      ),
    ).toEqual({
      kind: "loop",
      nextSlug: "extra-mondays-vending-machine",
      loop: [
        "extra-mondays-vending-machine",
        "roads-not-taken-telephone",
        "extra-mondays-vending-machine",
      ],
    });
  });

  it("labels a three-step loop without recursing", () => {
    expect(
      visitedTrail(
        [
          "extra-mondays-vending-machine",
          "roads-not-taken-telephone",
          "memory-umbrella",
        ],
        "extra-mondays-vending-machine",
      ),
    ).toEqual({
      kind: "loop",
      nextSlug: "extra-mondays-vending-machine",
      loop: [
        "extra-mondays-vending-machine",
        "roads-not-taken-telephone",
        "memory-umbrella",
        "extra-mondays-vending-machine",
      ],
    });
  });

  it("labels a repeated-slug loop from the first matching visit", () => {
    expect(visitedTrail(["a", "b", "a", "c"], "a")).toEqual({
      kind: "loop",
      nextSlug: "a",
      loop: ["a", "b", "a", "c", "a"],
    });
  });
});

describe("formatConsequenceTag", () => {
  it("formats a zero-tag outcome as an empty display list through the real mapper", () => {
    const outcomeWithNoTags = {
      id: "zero-tags",
      title: "The tags stay absent",
      body: "The content layer supplied no consequence tags.",
      consequenceTags: [],
    };
    const outcomeWithOneTag = {
      id: "one-tag",
      title: "The tags arrive",
      body: "The content layer supplied one consequence tag.",
      consequenceTags: ["borrowed-time"],
    };
    const displayTags = (outcome: Pick<ArtifactOutcome, "consequenceTags">) =>
      outcome.consequenceTags.map((tag) => ({
        raw: tag,
        label: formatConsequenceTag(tag),
      }));

    expect(displayTags(outcomeWithNoTags)).toEqual([]);
    expect(displayTags(outcomeWithOneTag)).toEqual([
      {
        raw: "borrowed-time",
        label: "Borrowed time",
      },
    ]);
  });

  it("formats one tag", () => {
    expect(formatConsequenceTag("borrowed-time")).toBe("Borrowed time");
  });

  it("formats four tags", () => {
    expect(
      [
        "borrowed-time",
        "memory-debt",
        "civic-delay",
        "weathered-proof",
      ].map(formatConsequenceTag),
    ).toEqual([
      "Borrowed time",
      "Memory debt",
      "Civic delay",
      "Weathered proof",
    ]);
  });

  it("handles empty, single-word, and edge-hyphen tags without throwing", () => {
    expect(formatConsequenceTag("")).toBe("");
    expect(formatConsequenceTag("solitude")).toBe("Solitude");
    expect(formatConsequenceTag("-borrowed-time-")).toBe("Borrowed time");
    expect(formatConsequenceTag("--")).toBe("");
    expect(formatConsequenceTag("a".repeat(32))).toBe("A".concat("a".repeat(31)));
  });
});
