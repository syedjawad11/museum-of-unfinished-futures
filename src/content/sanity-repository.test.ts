import { describe, expect, it, vi } from "vitest";
import {
  artifactBySlugQuery,
  artifactListQuery,
  createSanityExhibitRepository,
  eraBySlugQuery,
  eraListQuery,
} from "./sanity-repository";

const era = {
  title: "The Civic Time Expansion Era",
  slug: "civic-time-expansion-era",
  summary: "A near future in which cities treated spare hours as public infrastructure.",
  accentColor: "#f2b65a",
};

describe("createSanityExhibitRepository", () => {
  it("lists transformed Sanity artifacts from the public dataset", async () => {
    const fetch = vi.fn().mockResolvedValue([
      {
        slug: "archive-of-half-built-bridges",
        title: "Archive of Half-Built Bridges",
        era,
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
              consequenceTags: ["borrowed-time"],
              leadsTo: {
                title: "The Umbrella That Remembers Every Storm",
                slug: "memory-umbrella",
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
              consequenceTags: [],
            },
          },
        ],
      },
    ]);

    const repository = createSanityExhibitRepository({ fetch });

    await expect(repository.listExhibits()).resolves.toEqual([
      expect.objectContaining({
        slug: "archive-of-half-built-bridges",
        era,
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
    expect(fetch).toHaveBeenCalledWith(artifactListQuery);
  });

  it("returns null for a missing or malformed Sanity artifact", async () => {
    const fetch = vi.fn().mockResolvedValue({
      slug: "bad-branch",
      title: "Bad Branch",
      era,
      accessionNote: "Sanity published artifact.",
      summary: "A malformed artifact from Content Lake.",
      artifactLabel: "A label remains.",
      visualDescription: "A visible label remains in a plain case.",
      choices: [],
    });

    const repository = createSanityExhibitRepository({ fetch });

    await expect(repository.getExhibitBySlug("bad-branch")).resolves.toBeNull();
    expect(fetch).toHaveBeenCalledWith(artifactBySlugQuery, {
      slug: "bad-branch",
    });
  });

  it("lists eras using the era list query", async () => {
    const fetch = vi.fn().mockResolvedValue([
      {
        ...era,
        exhibits: [
          {
            slug: "archive-of-half-built-bridges",
            title: "Archive of Half-Built Bridges",
            era,
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
        ],
      },
    ]);

    const repository = createSanityExhibitRepository({ fetch });

    await expect(repository.listEras()).resolves.toEqual([
      expect.objectContaining({
        slug: "civic-time-expansion-era",
        exhibits: [
          expect.objectContaining({
            slug: "archive-of-half-built-bridges",
          }),
        ],
      }),
    ]);
    expect(fetch).toHaveBeenCalledWith(eraListQuery);
  });

  it("fetches an era by slug using the era slug query and params", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ...era,
      exhibits: [],
    });

    const repository = createSanityExhibitRepository({ fetch });

    await expect(
      repository.getEraBySlug("civic-time-expansion-era"),
    ).resolves.toEqual({
      ...era,
      exhibits: [],
    });
    expect(fetch).toHaveBeenCalledWith(eraBySlugQuery, {
      slug: "civic-time-expansion-era",
    });
  });

  // T-015 (ISR outage safety): the home, wing and exhibit pages are now
  // cached with `revalidate = 60` (see docs/isr.md). Per
  // node_modules/next/dist/docs/01-app/02-guides/incremental-static-regeneration.md
  // ("Handling uncaught exceptions"), Next.js keeps serving the last
  // successfully generated page when a revalidation throws — but only if
  // the repository actually throws. If any of these methods instead
  // swallowed a Sanity fetch failure and returned an empty list, Next.js
  // would treat that as a *successful* render and cache an empty museum for
  // the next 60 seconds. These tests lock in the "throw, don't swallow"
  // contract these methods already have.
  it("propagates a Sanity fetch failure from listEras instead of returning an empty list", async () => {
    const fetch = vi.fn().mockRejectedValue(new Error("Sanity is unreachable"));
    const repository = createSanityExhibitRepository({ fetch });

    await expect(repository.listEras()).rejects.toThrow(
      "Sanity is unreachable",
    );
  });

  it("propagates a Sanity fetch failure from listExhibits instead of returning an empty list", async () => {
    const fetch = vi.fn().mockRejectedValue(new Error("Sanity is unreachable"));
    const repository = createSanityExhibitRepository({ fetch });

    await expect(repository.listExhibits()).rejects.toThrow(
      "Sanity is unreachable",
    );
  });

  it("propagates a Sanity fetch failure from getEraBySlug instead of returning null", async () => {
    const fetch = vi.fn().mockRejectedValue(new Error("Sanity is unreachable"));
    const repository = createSanityExhibitRepository({ fetch });

    await expect(
      repository.getEraBySlug("civic-time-expansion-era"),
    ).rejects.toThrow("Sanity is unreachable");
  });
});
