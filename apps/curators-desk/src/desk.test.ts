import { describe, expect, it } from "vitest";
import type { ArtifactReview } from "../../../src/domain/artifact-review";
import { buildDeskRows, latestRunBySubject, type RawInstance } from "./desk";

const published = {
  _id: "artifact-kettle",
  _rev: "p1",
  title: "The Kettle",
  slug: "kettle",
  wing: "Domestic Weather Memory Era",
  hasImage: true,
  hasAlt: true,
  choices: [
    { label: "Put it on", outcomeId: "outcome-afternoon" },
    { label: "Leave it", outcomeId: "outcome-cold" },
  ],
};

const clerkDraft = {
  _id: "drafts.artifact-doormat",
  _rev: "d2",
  title: "The Doormat",
  slug: "doormat",
  wing: "Domestic Weather Memory Era",
  hasImage: false,
  hasAlt: false,
  choices: [
    { label: "Wipe your feet", outcomeId: "outcome-doormat-1" },
    { label: "Step over it", outcomeId: "outcome-doormat-2" },
  ],
};

function review(state: ArtifactReview["state"], revision: string): ArtifactReview {
  return {
    _id: "artifactReview.artifact-doormat",
    _type: "artifactReview",
    artifact: { _type: "reference", _ref: "artifact-doormat", _weak: true },
    state,
    submittedRevision: revision,
    ...(state === "approved" ? { approvedRevision: revision } : {}),
  };
}

function run(id: string, subject: string, stage: string, createdAt: string, completedAt?: string): RawInstance {
  return {
    _id: id,
    _createdAt: createdAt,
    currentStage: stage,
    completedAt: completedAt ?? null,
    fields: [{ name: "subject", value: { id: `dataset:wa27n68e:production_1:${subject}`, type: "artifact" } }],
  };
}

const outcomeIds = [
  "outcome-afternoon",
  "outcome-cold",
  "drafts.outcome-doormat-1",
  "drafts.outcome-doormat-2",
];

describe("buildDeskRows", () => {
  it("shows a Clerk draft first, with its endings waiting and no plate yet", () => {
    const rows = buildDeskRows({
      artifacts: [published, clerkDraft],
      reviews: [review("submitted", "d2")],
      outcomeIds,
      instances: [run("wf-1", "artifact-doormat", "curatorial-review", "2026-10-03T10:00:00Z")],
    });

    expect(rows.map((row) => row.id)).toEqual(["artifact-doormat", "artifact-kettle"]);
    expect(rows[0]).toMatchObject({
      status: "draft-only",
      choices: 2,
      endingsLive: 0,
      endingsDraftOnly: 2,
      endingsMissing: 0,
      plate: "missing",
      gate: "submitted",
      publishReady: false,
      stage: "curatorial-review",
      instanceId: "wf-1",
      problems: ["no blueprint plate"],
    });
    expect(rows[1]).toMatchObject({
      status: "live",
      endingsLive: 2,
      plate: "ok",
      gate: "none",
      problems: [],
    });
  });

  it("is ready to publish only while the approved revision is still the draft", () => {
    const ready = buildDeskRows({
      artifacts: [clerkDraft],
      reviews: [review("approved", "d2")],
      outcomeIds,
      instances: [],
    })[0];
    expect(ready.publishReady).toBe(true);

    const edited = buildDeskRows({
      artifacts: [{ ...clerkDraft, _rev: "d3" }],
      reviews: [review("approved", "d2")],
      outcomeIds,
      instances: [],
    })[0];
    expect(edited.publishReady).toBe(false);
    expect(edited.problems).toContain("draft changed after approval");
  });

  it("merges a published exhibit with its pending draft and reads the draft", () => {
    const rows = buildDeskRows({
      artifacts: [published, { ...published, _id: "drafts.artifact-kettle", _rev: "d9", title: "The Kettle, revised", hasAlt: false }],
      reviews: [],
      outcomeIds,
      instances: [],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      status: "live-with-draft",
      title: "The Kettle, revised",
      plate: "missing-alt",
      problems: ["plate has no alt text"],
    });
  });

  it("counts an ending with a pending edit once, as live", () => {
    const [row] = buildDeskRows({
      artifacts: [published],
      reviews: [],
      outcomeIds: [...outcomeIds, "drafts.outcome-afternoon"],
      instances: [],
    });

    expect(row).toMatchObject({ endingsLive: 2, endingsDraftOnly: 0, endingsMissing: 0 });
  });

  it("flags endings that exist nowhere and exhibits with too few choices", () => {
    const [row] = buildDeskRows({
      artifacts: [{ ...published, choices: [{ label: "Only", outcomeId: "outcome-gone" }] }],
      reviews: [],
      outcomeIds,
      instances: [],
    });

    expect(row.problems).toEqual(["fewer than two choices", "1 ending(s) missing"]);
  });
});

describe("latestRunBySubject", () => {
  it("prefers an unfinished run over a newer finished one", () => {
    const runs = latestRunBySubject([
      run("old-open", "artifact-a", "drafting", "2026-10-01T00:00:00Z"),
      run("new-done", "artifact-a", "on-display", "2026-10-02T00:00:00Z", "2026-10-02T01:00:00Z"),
      run("b", "artifact-b", "approved", "2026-10-01T00:00:00Z"),
    ]);

    expect(runs.get("artifact-a")?._id).toBe("old-open");
    expect(runs.get("artifact-b")?._id).toBe("b");
  });

  it("ignores instances without a subject", () => {
    expect(latestRunBySubject([{ _id: "x", fields: [] }]).size).toBe(0);
  });
});
