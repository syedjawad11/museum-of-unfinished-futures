import { describe, expect, it } from "vitest";
import {
  transformSanityArtifact,
  transformSanityArtifacts,
  transformSanityEra,
} from "./sanity-transform";

describe("transformSanityArtifact", () => {
  const era = {
    title: "The Civic Time Expansion Era",
    slug: "civic-time-expansion-era",
    summary:
      "A near future in which cities treated spare hours as public infrastructure.",
    accentColor: "#f2b65a",
  };

  it("maps a resolved Sanity artifact query result into the exhibit domain shape", () => {
    expect(
      transformSanityArtifact({
        slug: "archive-of-half-built-bridges",
        title: "Archive of Half-Built Bridges",
        era,
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
              consequenceTags: ["borrowed-time"],
              leadsTo: {
                title: "The Telephone for Calling Roads Not Taken",
                slug: "roads-not-taken-telephone",
              },
            },
          },
          {
            _key: "leave-open",
            label: "Leave the river visible",
            outcome: {
              _id: "outcome-open",
              title: "The gap becomes a commons",
              body: "People gather at both ends and learn to wave across the water.",
              consequenceTags: ["shared-place"],
            },
          },
        ],
      }),
    ).toEqual({
      slug: "archive-of-half-built-bridges",
      title: "Archive of Half-Built Bridges",
      era,
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
          consequenceTags: ["borrowed-time"],
          leadsTo: {
            title: "The Telephone for Calling Roads Not Taken",
            slug: "roads-not-taken-telephone",
          },
        },
        {
          id: "outcome-open",
          title: "The gap becomes a commons",
          body: "People gather at both ends and learn to wave across the water.",
          consequenceTags: ["shared-place"],
        },
      ],
    });
  });

  it("returns null for malformed choice references instead of inventing outcomes", () => {
    expect(
      transformSanityArtifact({
        slug: "bad-branch",
        title: "Bad Branch",
        era,
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
        era,
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
          era,
          accessionNote: "Published but incomplete.",
          summary: "This document has no valid choices.",
          artifactLabel: "An incomplete display.",
          visualDescription: "An incomplete display case with no visitor choices.",
          choices: [],
        },
      ]),
    ).toThrow("Sanity returned 1 malformed published artifact");
  });

  it("accepts a three-choice artifact", () => {
    expect(
      transformSanityArtifact({
        slug: "three-doors",
        title: "Three Doors",
        era,
        accessionNote: "Sanity published artifact.",
        summary: "A corridor offers a third plausible route.",
        artifactLabel: "Three painted doors share one brass frame.",
        visualDescription: "Three painted doors stand in a row under gallery light.",
        choices: [
          {
            _key: "left",
            label: "Open the left door",
            outcome: {
              _id: "outcome-left",
              title: "Left opens",
              body: "The left door opens onto a room full of alternate maps.",
            },
          },
          {
            _key: "middle",
            label: "Open the middle door",
            outcome: {
              _id: "outcome-middle",
              title: "Middle opens",
              body: "The middle door opens onto a calendar with one day circled.",
            },
          },
          {
            _key: "right",
            label: "Open the right door",
            outcome: {
              _id: "outcome-right",
              title: "Right opens",
              body: "The right door opens onto a quietly waiting platform.",
            },
          },
        ],
      })?.choices,
    ).toHaveLength(3);
  });

  it("rejects artifacts with fewer than two choices", () => {
    expect(
      transformSanityArtifact({
        slug: "one-door",
        title: "One Door",
        era,
        accessionNote: "Sanity published artifact.",
        summary: "Only one route remains.",
        artifactLabel: "A single door waits in a narrow frame.",
        visualDescription: "A single painted door stands under gallery light.",
        choices: [
          {
            _key: "only",
            label: "Open the only door",
            outcome: {
              _id: "outcome-only",
              title: "Only opens",
              body: "The only door opens onto the expected hallway.",
            },
          },
        ],
      }),
    ).toBeNull();
  });

  it("rejects artifacts with more than four choices", () => {
    expect(
      transformSanityArtifact({
        slug: "five-doors",
        title: "Five Doors",
        era,
        accessionNote: "Sanity published artifact.",
        summary: "Too many routes crowd the wall.",
        artifactLabel: "Five painted doors share one brass frame.",
        visualDescription: "Five painted doors stand in a row under gallery light.",
        choices: Array.from({ length: 5 }, (_, index) => ({
          _key: `door-${index}`,
          label: `Open door ${index}`,
          outcome: {
            _id: `outcome-${index}`,
            title: `Door ${index} opens`,
            body: "The door opens onto a possible future.",
          },
        })),
      }),
    ).toBeNull();
  });

  it("returns null when the artifact era is missing", () => {
    expect(
      transformSanityArtifact({
        slug: "missing-era",
        title: "Missing Era",
        accessionNote: "Sanity published artifact.",
        summary: "A malformed artifact from Content Lake.",
        artifactLabel: "A label remains.",
        visualDescription: "A visible label remains in a plain case.",
        choices: [
          {
            _key: "first",
            label: "First choice",
            outcome: {
              _id: "valid-outcome",
              title: "A valid branch",
              body: "Only one branch resolved.",
            },
          },
          {
            _key: "second",
            label: "Second choice",
            outcome: {
              _id: "second-outcome",
              title: "Another valid branch",
              body: "Another branch resolved.",
            },
          },
        ],
      }),
    ).toBeNull();
  });

  it("returns null when an image is present without alt text", () => {
    expect(
      transformSanityArtifact({
        slug: "image-without-alt",
        title: "Image Without Alt",
        era,
        accessionNote: "Sanity published artifact.",
        summary: "A malformed artifact from Content Lake.",
        artifactLabel: "A label remains.",
        visualDescription: "A visible label remains in a plain case.",
        image: {
          asset: {
            url: "https://cdn.sanity.io/images/demo/plate.jpg",
            metadata: {
              dimensions: { width: 1200, height: 800 },
            },
          },
        },
        choices: [
          {
            _key: "first",
            label: "First choice",
            outcome: {
              _id: "valid-outcome",
              title: "A valid branch",
              body: "Only one branch resolved.",
            },
          },
          {
            _key: "second",
            label: "Second choice",
            outcome: {
              _id: "second-outcome",
              title: "Another valid branch",
              body: "Another branch resolved.",
            },
          },
        ],
      }),
    ).toBeNull();
  });

  it("passes through image metadata when alt text is present", () => {
    expect(
      transformSanityArtifact({
        slug: "image-with-alt",
        title: "Image With Alt",
        era,
        accessionNote: "Sanity published artifact.",
        summary: "A valid artifact from Content Lake.",
        artifactLabel: "A label remains.",
        visualDescription: "A visible label remains in a plain case.",
        image: {
          alt: "Blueprint plate showing a vending machine calendar mechanism.",
          asset: {
            url: "https://cdn.sanity.io/images/demo/plate.jpg",
            metadata: {
              lqip: "data:image/jpeg;base64,abc",
              dimensions: { width: 1200, height: 800 },
            },
          },
        },
        choices: [
          {
            _key: "first",
            label: "First choice",
            outcome: {
              _id: "valid-outcome",
              title: "A valid branch",
              body: "Only one branch resolved.",
            },
          },
          {
            _key: "second",
            label: "Second choice",
            outcome: {
              _id: "second-outcome",
              title: "Another valid branch",
              body: "Another branch resolved.",
            },
          },
        ],
      })?.image,
    ).toEqual({
      url: "https://cdn.sanity.io/images/demo/plate.jpg",
      alt: "Blueprint plate showing a vending machine calendar mechanism.",
      width: 1200,
      height: 800,
      lqip: "data:image/jpeg;base64,abc",
    });
  });

  it("defaults missing outcome consequence tags to an empty array", () => {
    expect(
      transformSanityArtifact({
        slug: "missing-tags",
        title: "Missing Tags",
        era,
        accessionNote: "Sanity published artifact.",
        summary: "A valid artifact from Content Lake.",
        artifactLabel: "A label remains.",
        visualDescription: "A visible label remains in a plain case.",
        choices: [
          {
            _key: "first",
            label: "First choice",
            outcome: {
              _id: "valid-outcome",
              title: "A valid branch",
              body: "Only one branch resolved.",
            },
          },
          {
            _key: "second",
            label: "Second choice",
            outcome: {
              _id: "second-outcome",
              title: "Another valid branch",
              body: "Another branch resolved.",
            },
          },
        ],
      })?.outcomes[0]?.consequenceTags,
    ).toEqual([]);
  });

  it("passes through chained outcome links", () => {
    expect(
      transformSanityArtifact({
        slug: "linked-outcome",
        title: "Linked Outcome",
        era,
        accessionNote: "Sanity published artifact.",
        summary: "A valid artifact from Content Lake.",
        artifactLabel: "A label remains.",
        visualDescription: "A visible label remains in a plain case.",
        choices: [
          {
            _key: "first",
            label: "First choice",
            outcome: {
              _id: "valid-outcome",
              title: "A valid branch",
              body: "Only one branch resolved.",
              leadsTo: {
                title: "The Umbrella That Remembers Every Storm",
                slug: "memory-umbrella",
              },
            },
          },
          {
            _key: "second",
            label: "Second choice",
            outcome: {
              _id: "second-outcome",
              title: "Another valid branch",
              body: "Another branch resolved.",
            },
          },
        ],
      })?.outcomes[0]?.leadsTo,
    ).toEqual({
      title: "The Umbrella That Remembers Every Storm",
      slug: "memory-umbrella",
    });
  });
});

describe("transformSanityEra", () => {
  it("groups a resolved era and its artifacts into the exhibit era shape", () => {
    expect(
      transformSanityEra({
        title: "The Civic Time Expansion Era",
        slug: "civic-time-expansion-era",
        summary:
          "A near future in which cities treated spare hours as public infrastructure.",
        accentColor: "#f2b65a",
        exhibits: [
          {
            slug: "extra-mondays-vending-machine",
            title: "The Vending Machine That Sells Extra Mondays",
            era: {
              title: "The Civic Time Expansion Era",
              slug: "civic-time-expansion-era",
              summary:
                "A near future in which cities treated spare hours as public infrastructure.",
              accentColor: "#f2b65a",
            },
            accessionNote: "Sanity published artifact.",
            summary: "A brushed-steel vending machine hums beside a locked gallery door.",
            artifactLabel: "The selector glass is cracked.",
            visualDescription:
              "A cracked vending-machine selector window shows calendar pages.",
            choices: [
              {
                _key: "spend-a-plan",
                label: "Spend a plan",
                outcome: {
                  _id: "outcome-paper-monday",
                  title: "A paper Monday drops",
                  body: "It is warm from the machine.",
                },
              },
              {
                _key: "keep-the-weekend",
                label: "Keep the weekend intact",
                outcome: {
                  _id: "outcome-soft-refusal",
                  title: "The machine keeps humming",
                  body: "Somewhere inside, an extra weekday remains unsold.",
                },
              },
            ],
          },
        ],
      }),
    ).toEqual({
      title: "The Civic Time Expansion Era",
      slug: "civic-time-expansion-era",
      summary:
        "A near future in which cities treated spare hours as public infrastructure.",
      accentColor: "#f2b65a",
      exhibits: [
        expect.objectContaining({
          slug: "extra-mondays-vending-machine",
          title: "The Vending Machine That Sells Extra Mondays",
        }),
      ],
    });
  });
});
