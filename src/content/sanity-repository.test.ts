import { describe, expect, it, vi } from "vitest";
import { createSanityExhibitRepository } from "./sanity-repository";

describe("createSanityExhibitRepository", () => {
  it("lists transformed Sanity artifacts from the public dataset", async () => {
    const fetch = vi.fn().mockResolvedValue([
      {
        slug: "archive-of-half-built-bridges",
        title: "Archive of Half-Built Bridges",
        accessionNote: "Sanity published artifact.",
        summary: "A drawer of civic plans.",
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
      },
    ]);

    const repository = createSanityExhibitRepository({ fetch });

    await expect(repository.listExhibits()).resolves.toEqual([
      expect.objectContaining({
        slug: "archive-of-half-built-bridges",
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
      }),
    ]);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("*[_type == \"artifact\""));
  });

  it("returns null for a missing or malformed Sanity artifact", async () => {
    const fetch = vi.fn().mockResolvedValue({
      slug: "bad-branch",
      title: "Bad Branch",
      accessionNote: "Sanity published artifact.",
      summary: "A malformed artifact from Content Lake.",
      artifactLabel: "A label remains.",
      visualDescription: "A visible label remains in a plain case.",
      choices: [],
    });

    const repository = createSanityExhibitRepository({ fetch });

    await expect(repository.getExhibitBySlug("bad-branch")).resolves.toBeNull();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("$slug"), {
      slug: "bad-branch",
    });
  });
});
