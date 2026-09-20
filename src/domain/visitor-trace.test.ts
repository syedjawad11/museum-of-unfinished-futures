import { describe, expect, it } from "vitest";
import { localExhibitRepository } from "../content/local-repository";
import { resolveLinkedOutcome } from "./visitor-trace";

describe("resolveLinkedOutcome", () => {
  it("resolves the outcome linked to a selected artifact choice", () => {
    const artifact = {
      slug: "extra-mondays",
      title: "Vending Machine for Extra Mondays",
      choices: [
        {
          id: "buy",
          label: "Insert a coin",
          outcomeId: "receipt",
        },
        {
          id: "walk-away",
          label: "Leave it humming",
          outcomeId: "silence",
        },
      ],
      outcomes: [
        {
          id: "receipt",
          title: "A receipt curls out",
          body: "The machine prints a Monday dated three weeks from now.",
        },
        {
          id: "silence",
          title: "The corridor relaxes",
          body: "No extra week begins. The lights dim in relief.",
        },
      ],
    };

    expect(resolveLinkedOutcome(artifact, "buy")).toEqual({
      id: "receipt",
      title: "A receipt curls out",
      body: "The machine prints a Monday dated three weeks from now.",
    });
  });

  it("returns no outcome for an unknown choice", () => {
    const artifact = {
      slug: "extra-mondays",
      title: "Vending Machine for Extra Mondays",
      choices: [
        {
          id: "buy",
          label: "Insert a coin",
          outcomeId: "receipt",
        },
        {
          id: "walk-away",
          label: "Leave it humming",
          outcomeId: "silence",
        },
      ],
      outcomes: [
        {
          id: "receipt",
          title: "A receipt curls out",
          body: "The machine prints a Monday dated three weeks from now.",
        },
      ],
    };

    expect(resolveLinkedOutcome(artifact, "press-hidden-button")).toBeUndefined();
  });

  it("returns null when the local repository cannot find an artifact", async () => {
    await expect(
      localExhibitRepository.getExhibitBySlug("missing-artifact"),
    ).resolves.toBeNull();
  });
});
