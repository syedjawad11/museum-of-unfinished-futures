import { describe, expect, it } from "vitest";
import {
  transformSanityArtifact,
  transformSanityArtifacts,
} from "./sanity-transform";

describe("transformSanityArtifact", () => {
  it("maps a resolved Sanity artifact query result into the exhibit domain shape", () => {
    expect(
      transformSanityArtifact({
        slug: "archive-of-half-built-bridges",
        title: "Archive of Half-Built Bridges",
        accessionNote: "Sanity published artifact.",
        summary:
          "A drawer of civic plans for crossings that stopped just before meeting the opposite bank.",
        artifactLabel: "Blueprint tubes rest in a shallow case.",
        visualDescription:
          "Rolled blueprints and brass clips are arranged in a glass-topped museum drawer.",
        choices: [
          {
            _key: "fund",
            label: "Fund the missing span",
            outcome: {
              _id: "outcome-funded",
              title: "The bridge reaches fog",
              body: "Traffic crosses into a district that was never entered on any map.",
            },
          },
          {
            _key: "leave-open",
            label: "Leave the river visible",
            outcome: {
              _id: "outcome-open",
              title: "The gap becomes a commons",
              body: "People gather at both ends and learn to wave across the water.",
            },
          },
        ],
      }),
    ).toEqual({
      slug: "archive-of-half-built-bridges",
      title: "Archive of Half-Built Bridges",
      accessionNote: "Sanity published artifact.",
      summary:
        "A drawer of civic plans for crossings that stopped just before meeting the opposite bank.",
      artifactLabel: "Blueprint tubes rest in a shallow case.",
      visualDescription:
        "Rolled blueprints and brass clips are arranged in a glass-topped museum drawer.",
      choices: [
        {
          id: "fund",
          label: "Fund the missing span",
          outcomeId: "outcome-funded",
        },
        {
          id: "leave-open",
          label: "Leave the river visible",
          outcomeId: "outcome-open",
        },
      ],
      outcomes: [
        {
          id: "outcome-funded",
          title: "The bridge reaches fog",
          body: "Traffic crosses into a district that was never entered on any map.",
        },
        {
          id: "outcome-open",
          title: "The gap becomes a commons",
          body: "People gather at both ends and learn to wave across the water.",
        },
      ],
    });
  });

  it("returns null for malformed choice references instead of inventing outcomes", () => {
    expect(
      transformSanityArtifact({
        slug: "bad-branch",
        title: "Bad Branch",
        accessionNote: "Sanity published artifact.",
        summary: "A malformed artifact from Content Lake.",
        artifactLabel: "A label remains.",
        visualDescription: "A visible label remains in a plain case.",
        choices: [
          {
            _key: "first",
            label: "First choice",
            outcome: null,
          },
          {
            _key: "second",
            label: "Second choice",
            outcome: {
              _id: "valid-outcome",
              title: "A valid branch",
              body: "Only one branch resolved.",
            },
          },
        ],
      }),
    ).toBeNull();
  });

  it("returns null when required artifact fields are missing", () => {
    expect(
      transformSanityArtifact({
        slug: null,
        title: "Incomplete Artifact",
        accessionNote: "Sanity published artifact.",
        summary: "The slug field is missing.",
        artifactLabel: "A title card without a stable route.",
        visualDescription: "A title card is displayed without a stable route.",
        choices: [],
      }),
    ).toBeNull();
  });

  it("rejects an unexpected list response instead of reporting an empty gallery", () => {
    expect(() => transformSanityArtifacts({ result: [] })).toThrow(
      "Sanity artifact query did not return an array",
    );
  });

  it("rejects malformed published artifacts instead of silently dropping them", () => {
    expect(() =>
      transformSanityArtifacts([
        {
          slug: "broken-artifact",
          title: "Broken Artifact",
          accessionNote: "Published but incomplete.",
          summary: "This document has no valid choices.",
          artifactLabel: "An incomplete display.",
          visualDescription: "An incomplete display case with no visitor choices.",
          choices: [],
        },
      ]),
    ).toThrow("Sanity returned 1 malformed published artifact");
  });
});
