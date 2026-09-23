import { describe, expect, it } from "vitest";
import newExhibits from "../../docs/content/new-exhibits.json";
import ticketLines from "../content/ticket-lines.json";
import {
  buildArtifactDraft,
  buildLeadsToPatches,
  buildOutcomeDocs,
  checkReusableDraftStillMatchesPlan,
  deepEqualStructural,
  indexDocumentsById,
  parseNewExhibits,
  planResumePublication,
  planPreflight,
  planPreflightInvariants,
  verifyOutcomeUnchangedBeforePatch,
  type ParsedNewExhibits,
} from "./exhibit-publication";

const validJson = () => JSON.parse(JSON.stringify(newExhibits));

function parseFixture(): ParsedNewExhibits {
  const result = parseNewExhibits(validJson());

  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.reasons.join("\n"));
  }

  return result.value;
}

function expectParseReason(json: unknown, includes: string) {
  const result = parseNewExhibits(json);

  expect(result.ok).toBe(false);
  expect(result.ok ? [] : result.reasons).toEqual(
    expect.arrayContaining([expect.stringContaining(includes)]),
  );
}

describe("parseNewExhibits", () => {
  it("accepts the founder-approved Sep 23 packet", () => {
    const parsed = parseFixture();

    expect(parsed.artifacts.map((artifact) => artifact._id)).toEqual([
      "artifact-future-self-toaster",
      "artifact-unfinished-conversations-switchboard",
      "artifact-weather-of-visits-kettle",
    ]);
    expect(parsed.outcomes).toHaveLength(7);
    expect(parsed.rewire).toHaveLength(3);
  });

  it("rejects a too-long artifact summary with a field-level reason", () => {
    const json = validJson();
    json.artifacts[0].summary = "x".repeat(321);

    expectParseReason(json, "artifacts[0].summary");
  });

  it("rejects a bad consequence tag with a field-level reason", () => {
    const json = validJson();
    json.outcomes[0].consequenceTags[0] = "Bad Tag";

    expectParseReason(json, "outcomes[0].consequenceTags[0]");
  });

  it("rejects an outcome that loops back to its own artifact", () => {
    const json = validJson();
    json.outcomes[0].leadsTo = "artifact-future-self-toaster";

    expectParseReason(json, "self-loop");
  });

  it("rejects an artifact choice with an unknown outcome reference", () => {
    const json = validJson();
    json.artifacts[0].choices[0].outcome = "outcome-not-approved";

    expectParseReason(json, "unknown outcome");
  });
});

describe("publication builders", () => {
  it("builds seven outcome docs without leadsTo", () => {
    const docs = buildOutcomeDocs(parseFixture());

    expect(docs).toHaveLength(7);
    expect(docs[0]).toEqual({
      _id: "outcome-note-in-your-handwriting",
      _type: "outcome",
      title: "The note is in your handwriting",
      body: expect.any(String),
      era: {
        _type: "reference",
        _ref: "era-near-future-civic-time",
      },
      consequenceTags: ["advised-in-advance", "thursday-rearranged"],
    });
    expect(docs.some((doc) => "leadsTo" in doc)).toBe(false);
  });

  it("builds an artifact draft with references, slug object, image, and object choices", () => {
    const parsed = parseFixture();
    const draft = buildArtifactDraft(
      parsed.artifacts[0],
      "image-asset-abc123-svg",
      parsed.artifacts[0].imageAlt,
    );

    expect(draft).toMatchObject({
      _id: "drafts.artifact-future-self-toaster",
      _type: "artifact",
      slug: { _type: "slug", current: "future-self-toaster" },
      era: { _type: "reference", _ref: "era-near-future-civic-time" },
      image: {
        _type: "image",
        asset: { _type: "reference", _ref: "image-asset-abc123-svg" },
        alt: parsed.artifacts[0].imageAlt,
      },
    });
    expect(draft.choices).toEqual([
      {
        _key: "read-the-note",
        _type: "object",
        label: "Read the note while it is warm",
        outcome: {
          _type: "reference",
          _ref: "outcome-note-in-your-handwriting",
        },
      },
      {
        _key: "butter-it-unread",
        _type: "object",
        label: "Butter it without reading",
        outcome: {
          _type: "reference",
          _ref: "outcome-message-under-the-butter",
        },
      },
    ]);
  });

  it("builds ten leadsTo patches and refuses stale rewire source refs", () => {
    const parsed = parseFixture();
    const revisions = Object.fromEntries([
      ...parsed.outcomes.map((outcome) => [
        outcome._id,
        { _rev: `${outcome._id}-rev` },
      ]),
      ...parsed.rewire.map((rewire) => [
        rewire.outcome,
        {
          _rev: `${rewire.outcome}-rev`,
          leadsTo: { _type: "reference", _ref: rewire.from },
        },
      ]),
    ]);

    const result = buildLeadsToPatches(parsed, revisions);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.reason);
    }
    expect(result.patches).toHaveLength(10);
    expect(result.patches[0]).toEqual({
      id: "outcome-note-in-your-handwriting",
      ifRevisionId: "outcome-note-in-your-handwriting-rev",
      set: {
        leadsTo: {
          _type: "reference",
          _ref: "artifact-weather-of-visits-kettle",
        },
      },
    });

    const stale = {
      ...revisions,
      "outcome-missed-call-self": {
        _rev: "outcome-missed-call-self-rev",
        leadsTo: {
          _type: "reference",
          _ref: "artifact-memory-umbrella",
        },
      },
    };

    expect(buildLeadsToPatches(parsed, stale)).toEqual({
      ok: false,
      reason:
        "Rewire outcome outcome-missed-call-self current leadsTo artifact-memory-umbrella does not match expected artifact-extra-mondays-vending-machine.",
    });
  });
});

describe("planPreflight", () => {
  it("lists blockers for existing docs, drafts, rewire drafts/mismatches, and missing eras", () => {
    const parsed = parseFixture();

    expect(
      planPreflight({
        parsed,
        existingPublishedIds: ["artifact-future-self-toaster"],
        existingDraftIds: ["outcome-note-in-your-handwriting"],
        existingReviewIds: ["artifactReview.artifact-weather-of-visits-kettle"],
        missingEraIds: ["era-near-future-civic-time"],
        existingTargetArtifactIds: [
          "artifact-extra-mondays-vending-machine",
          "artifact-memory-umbrella",
          "artifact-roads-not-taken-telephone",
        ],
        rewireDraftIds: ["drafts.outcome-missed-call-self"],
        rewireCurrentRefs: {
          "outcome-missed-call-self": "artifact-memory-umbrella",
          "outcome-soft-refusal": "artifact-memory-umbrella",
          "outcome-room-rains-back": "artifact-roads-not-taken-telephone",
        },
      }),
    ).toEqual([
      "Published document artifact-future-self-toaster already exists.",
      "Draft document drafts.outcome-note-in-your-handwriting already exists.",
      "Review document artifactReview.artifact-weather-of-visits-kettle already exists.",
      "Rewire draft drafts.outcome-missed-call-self already exists.",
      "Rewire outcome outcome-missed-call-self currently leads to artifact-memory-umbrella, expected artifact-extra-mondays-vending-machine.",
      "Era era-near-future-civic-time was not found.",
    ]);
  });

  it("blocks an outcome leadsTo target that is neither new nor published", () => {
    const parsed = parseFixture();
    parsed.rewire[0] = {
      ...parsed.rewire[0],
      to: "artifact-memory-umbrella",
    };

    expect(
      planPreflight({
        parsed,
        existingPublishedIds: [],
        existingDraftIds: [],
        existingReviewIds: [],
        missingEraIds: [],
        existingTargetArtifactIds: [
          "artifact-extra-mondays-vending-machine",
          "artifact-roads-not-taken-telephone",
        ],
        rewireDraftIds: [],
        rewireCurrentRefs: {
          "outcome-missed-call-self": "artifact-extra-mondays-vending-machine",
          "outcome-soft-refusal": "artifact-memory-umbrella",
          "outcome-room-rains-back": "artifact-roads-not-taken-telephone",
        },
      }),
    ).toEqual([
      "Outcome outcome-sentence-resumes leadsTo missing artifact artifact-memory-umbrella.",
      "Rewire outcome outcome-missed-call-self points to missing artifact artifact-memory-umbrella.",
    ]);
  });
});

describe("planResumePublication", () => {
  it("skips matching published outcomes and blocks mismatched published outcomes", () => {
    const parsed = parseFixture();
    const plannedOutcome = buildOutcomeDocs(parsed)[0];

    const plan = planResumePublication({
        parsed,
        publishedOutcomes: {
          [plannedOutcome._id]: {
            ...plannedOutcome,
            _rev: "rev-1",
            _createdAt: "2026-09-23T00:00:00Z",
            _updatedAt: "2026-09-23T00:00:00Z",
          },
        },
        artifactStates: {},
      });

    expect(plan.outcomeActions.slice(0, 2)).toEqual([
      { id: plannedOutcome._id, action: "skip" },
      { id: "outcome-message-under-the-butter", action: "create" },
    ]);
    expect(plan.blockers).toEqual([]);

    expect(
      planResumePublication({
        parsed,
        publishedOutcomes: {
          [plannedOutcome._id]: {
            ...plannedOutcome,
            title: "Changed in Content Lake",
          },
        },
        artifactStates: {},
      }).blockers,
    ).toEqual([
      "Published outcome outcome-note-in-your-handwriting differs from the planned document.",
    ]);
  });

  it("reuses a matching existing artifact draft when its asset is valid", () => {
    const parsed = parseFixture();
    const artifact = parsed.artifacts[0];
    const plannedDraft = buildArtifactDraft(
      artifact,
      "image-after-resume",
      artifact.imageAlt,
    );

    expect(
      planResumePublication({
        parsed,
        publishedOutcomes: {},
        artifactStates: {
          [artifact._id]: {
            draft: {
              ...plannedDraft,
              image: {
                ...plannedDraft.image,
                asset: { _type: "reference", _ref: "existing-asset" },
              },
            },
            draftAsset: {
              url: "https://cdn.sanity.io/images/wa27n68e/production_1/existing.svg",
              metadata: { dimensions: { width: 800, height: 600 } },
            },
          },
        },
      }).artifactActions[0],
    ).toEqual({
      id: artifact._id,
      action: "reuse-draft",
      assetId: "existing-asset",
    });
  });

  it("blocks a draft whose content differs from the planned draft aside from image asset", () => {
    const parsed = parseFixture();
    const artifact = parsed.artifacts[0];
    const plannedDraft = buildArtifactDraft(
      artifact,
      "image-after-resume",
      artifact.imageAlt,
    );

    expect(
      planResumePublication({
        parsed,
        publishedOutcomes: {},
        artifactStates: {
          [artifact._id]: {
            draft: {
              ...plannedDraft,
              summary: "Changed draft summary.",
            },
            draftAsset: {
              url: "https://cdn.sanity.io/images/wa27n68e/production_1/existing.svg",
              metadata: { dimensions: { width: 800, height: 600 } },
            },
          },
        },
      }).blockers,
    ).toEqual([
      "Draft drafts.artifact-future-self-toaster differs from the planned artifact draft.",
    ]);
  });
});

describe("indexDocumentsById", () => {
  // scripts/publish-new-exhibits.ts reads publishedDocs/draftDocs for
  // artifacts-then-outcomes (see newDocumentIds) but the previous zip step
  // assumed outcomes-then-artifacts, silently pairing each outcome id with
  // an unrelated document. Looking documents up by their own _id (never by
  // array position) must be correct regardless of the order or gaps in the
  // array Sanity/Promise.all returns.
  it("maps documents by their own _id, ignoring array position", () => {
    const docs = [
      { _id: "outcome-b", value: "B" },
      { _id: "outcome-a", value: "A" },
      { _id: "outcome-c", value: "C" },
    ];

    expect(indexDocumentsById(docs)).toEqual({
      "outcome-a": { _id: "outcome-a", value: "A" },
      "outcome-b": { _id: "outcome-b", value: "B" },
      "outcome-c": { _id: "outcome-c", value: "C" },
    });
  });

  it("skips nulls and undefined entries without shifting other ids", () => {
    const docs = [
      undefined,
      { _id: "outcome-a", value: "A" },
      null,
      { _id: "outcome-c", value: "C" },
    ];

    expect(indexDocumentsById(docs)).toEqual({
      "outcome-a": { _id: "outcome-a", value: "A" },
      "outcome-c": { _id: "outcome-c", value: "C" },
    });
  });

  it("returns an empty lookup for an all-missing array", () => {
    expect(indexDocumentsById([undefined, null, undefined])).toEqual({});
  });
});

describe("planResumePublication (live Sanity state, T-011c2)", () => {
  // Mirrors the live documents the orchestrator read directly with getDocument
  // on Sep 23 ~20:25 (see docs/task-packets/T-011c2-resume-preflight-fix.md).
  // Key order below matches what Sanity returned (alphabetical system fields
  // first, then content fields in the order noted in the packet) so this test
  // also catches any key-order-sensitive comparison bug, not just id mixups.
  function livePublishedOutcome(outcome: {
    _id: string;
    title: string;
    body: string;
    era: string;
    consequenceTags: string[];
  }) {
    return {
      _createdAt: "2026-09-23T20:10:00Z",
      _id: outcome._id,
      _rev: `${outcome._id}-live-rev`,
      _type: "outcome",
      _updatedAt: "2026-09-23T20:10:00Z",
      body: outcome.body,
      consequenceTags: outcome.consequenceTags,
      era: { _type: "reference", _ref: outcome.era },
      title: outcome.title,
    };
  }

  function livePublishedOutcomes(parsed: ParsedNewExhibits) {
    return Object.fromEntries(
      parsed.outcomes.map((outcome) => [
        outcome._id,
        livePublishedOutcome(outcome),
      ]),
    );
  }

  const liveToasterAssetId =
    "image-f264b1f250a5b6644770c79b0c2edef59c0e41ab-800x600-svg";

  it("skips all 7 published outcomes, reuses the toaster draft and asset, and creates the other two artifacts with zero blockers", () => {
    const parsed = parseFixture();
    const toaster = parsed.artifacts[0];
    const toasterDraft = buildArtifactDraft(toaster, liveToasterAssetId, toaster.imageAlt);

    const plan = planResumePublication({
      parsed,
      publishedOutcomes: livePublishedOutcomes(parsed),
      artifactStates: {
        "artifact-future-self-toaster": {
          draft: {
            _createdAt: "2026-09-23T20:05:00Z",
            _id: toasterDraft._id,
            _rev: "toaster-draft-live-rev",
            _type: "artifact",
            _updatedAt: "2026-09-23T20:05:00Z",
            accessionNote: toasterDraft.accessionNote,
            artifactLabel: toasterDraft.artifactLabel,
            choices: toasterDraft.choices,
            era: toasterDraft.era,
            image: toasterDraft.image,
            slug: toasterDraft.slug,
            summary: toasterDraft.summary,
            title: toasterDraft.title,
            visualDescription: toasterDraft.visualDescription,
          },
          draftAsset: {
            url: `https://cdn.sanity.io/images/wa27n68e/production_1/${liveToasterAssetId.replace(/^image-/, "").replace(/-svg$/, ".svg")}`,
            metadata: { dimensions: { width: 800, height: 600 } },
          },
        },
        "artifact-unfinished-conversations-switchboard": {},
        "artifact-weather-of-visits-kettle": {},
      },
    });

    expect(plan.blockers).toEqual([]);
    expect(plan.outcomeActions).toEqual(
      parsed.outcomes.map((outcome) => ({ id: outcome._id, action: "skip" })),
    );
    expect(plan.artifactActions).toEqual([
      {
        id: "artifact-future-self-toaster",
        action: "reuse-draft",
        assetId: liveToasterAssetId,
      },
      {
        id: "artifact-unfinished-conversations-switchboard",
        action: "upload-create",
      },
      { id: "artifact-weather-of-visits-kettle", action: "upload-create" },
    ]);
  });
});

describe("planPreflightInvariants (resume mode review fix, item 2)", () => {
  // Resume mode must not re-run the "already exists" checks for the new ids
  // (planResumePublication replaces those), but it must keep running every
  // other invariant planPreflight checks: missing eras, missing external
  // leadsTo/rewire target artifacts, rewire drafts, and rewire `from`
  // mismatches. Same fixture as the first planPreflight test, but the
  // "already exists" fields are deliberately populated with values that
  // would block planPreflight, to prove planPreflightInvariants ignores them.
  it("blocks a missing era and a rewire draft while ignoring 'already exists' state", () => {
    const parsed = parseFixture();

    expect(
      planPreflightInvariants({
        parsed,
        existingPublishedIds: ["artifact-future-self-toaster"],
        existingDraftIds: ["outcome-note-in-your-handwriting"],
        existingReviewIds: ["artifactReview.artifact-weather-of-visits-kettle"],
        missingEraIds: ["era-near-future-civic-time"],
        existingTargetArtifactIds: [
          "artifact-extra-mondays-vending-machine",
          "artifact-memory-umbrella",
          "artifact-roads-not-taken-telephone",
        ],
        rewireDraftIds: ["drafts.outcome-missed-call-self"],
        rewireCurrentRefs: {
          "outcome-missed-call-self": "artifact-memory-umbrella",
          "outcome-soft-refusal": "artifact-memory-umbrella",
          "outcome-room-rains-back": "artifact-roads-not-taken-telephone",
        },
      }),
    ).toEqual([
      "Rewire draft drafts.outcome-missed-call-self already exists.",
      "Rewire outcome outcome-missed-call-self currently leads to artifact-memory-umbrella, expected artifact-extra-mondays-vending-machine.",
      "Era era-near-future-civic-time was not found.",
    ]);
  });

  it("still blocks a missing external leadsTo/rewire target artifact", () => {
    const parsed = parseFixture();
    parsed.rewire[0] = { ...parsed.rewire[0], to: "artifact-memory-umbrella" };

    expect(
      planPreflightInvariants({
        parsed,
        existingPublishedIds: [],
        existingDraftIds: [],
        existingReviewIds: [],
        missingEraIds: [],
        existingTargetArtifactIds: [
          "artifact-extra-mondays-vending-machine",
          "artifact-roads-not-taken-telephone",
        ],
        rewireDraftIds: [],
        rewireCurrentRefs: {
          "outcome-missed-call-self": "artifact-extra-mondays-vending-machine",
          "outcome-soft-refusal": "artifact-memory-umbrella",
          "outcome-room-rains-back": "artifact-roads-not-taken-telephone",
        },
      }),
    ).toEqual([
      "Outcome outcome-sentence-resumes leadsTo missing artifact artifact-memory-umbrella.",
      "Rewire outcome outcome-missed-call-self points to missing artifact artifact-memory-umbrella.",
    ]);
  });

  it("returns the same invariant blockers planPreflight would, and planPreflight still runs both groups", () => {
    const parsed = parseFixture();
    const readState = {
      parsed,
      existingPublishedIds: [],
      existingDraftIds: [],
      existingReviewIds: [],
      missingEraIds: ["era-near-future-civic-time"],
      existingTargetArtifactIds: [
        "artifact-extra-mondays-vending-machine",
        "artifact-memory-umbrella",
        "artifact-roads-not-taken-telephone",
      ],
      rewireDraftIds: [],
      rewireCurrentRefs: {
        "outcome-missed-call-self": "artifact-extra-mondays-vending-machine",
        "outcome-soft-refusal": "artifact-memory-umbrella",
        "outcome-room-rains-back": "artifact-roads-not-taken-telephone",
      },
    };

    expect(planPreflightInvariants(readState)).toEqual(planPreflight(readState));
  });
});

describe("checkReusableDraftStillMatchesPlan (review fix, item 1a)", () => {
  // Guards scripts/publish-new-exhibits.ts's reuse-draft branch: after
  // re-fetching the draft it re-reads immediately before submit, so a
  // concurrent edit to the draft between preflight and submit must abort
  // the run instead of submitting stale/wrong content for review.
  it("passes when the re-fetched draft still matches the plan and reused asset", () => {
    const parsed = parseFixture();
    const artifact = parsed.artifacts[0];
    const planned = buildArtifactDraft(artifact, "asset-1", artifact.imageAlt);

    expect(
      checkReusableDraftStillMatchesPlan(
        { ...planned, _rev: "rev-1" },
        planned,
        "asset-1",
      ),
    ).toEqual({ ok: true });
  });

  it("aborts when the draft's image asset changed since preflight", () => {
    const parsed = parseFixture();
    const artifact = parsed.artifacts[0];
    const planned = buildArtifactDraft(artifact, "asset-1", artifact.imageAlt);
    const actual = {
      ...planned,
      _rev: "rev-2",
      image: {
        ...planned.image,
        asset: { _type: "reference", _ref: "asset-2" },
      },
    };

    const result = checkReusableDraftStillMatchesPlan(actual, planned, "asset-1");

    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.reason).toContain("asset-2");
  });

  it("aborts when the draft content changed since preflight", () => {
    const parsed = parseFixture();
    const artifact = parsed.artifacts[0];
    const planned = buildArtifactDraft(artifact, "asset-1", artifact.imageAlt);
    const actual = {
      ...planned,
      _rev: "rev-3",
      summary: "Changed after preflight, before submit.",
    };

    expect(checkReusableDraftStillMatchesPlan(actual, planned, "asset-1").ok).toBe(
      false,
    );
  });
});

describe("verifyOutcomeUnchangedBeforePatch (review fix, item 1b)", () => {
  // Guards Step C: every new outcome's leadsTo patch must be built from a
  // read taken immediately before the transaction, and that read must still
  // match the planned outcome content with leadsTo still absent, or the run
  // must abort before committing the transaction.
  it("passes when the fresh read still matches the plan with no leadsTo yet", () => {
    const parsed = parseFixture();
    const planned = buildOutcomeDocs(parsed)[0];

    expect(
      verifyOutcomeUnchangedBeforePatch({ ...planned, _rev: "rev-1" }, planned),
    ).toEqual({ ok: true });
  });

  it("aborts when the outcome cannot be found before Step C", () => {
    const parsed = parseFixture();
    const planned = buildOutcomeDocs(parsed)[0];

    expect(verifyOutcomeUnchangedBeforePatch(undefined, planned).ok).toBe(false);
  });

  it("aborts when leadsTo was already set by a concurrent run", () => {
    const parsed = parseFixture();
    const planned = buildOutcomeDocs(parsed)[0];
    const actual = {
      ...planned,
      _rev: "rev-2",
      leadsTo: { _type: "reference", _ref: "artifact-weather-of-visits-kettle" },
    };

    expect(verifyOutcomeUnchangedBeforePatch(actual, planned).ok).toBe(false);
  });

  it("aborts when the outcome content changed since preflight", () => {
    const parsed = parseFixture();
    const planned = buildOutcomeDocs(parsed)[0];
    const actual = {
      ...planned,
      _rev: "rev-3",
      title: "Changed after preflight, before Step C.",
    };

    expect(verifyOutcomeUnchangedBeforePatch(actual, planned).ok).toBe(false);
  });
});

describe("deepEqualStructural array holes (review fix, item 3)", () => {
  // Array.prototype.every skips holes in sparse arrays entirely (it never
  // calls the callback for a missing index), so the previous
  // `a.every((item, index) => deepEqualStructural(item, b[index]))` silently
  // treated a hole as equal to anything. An index loop that checks `in`
  // explicitly must tell a hole apart from an explicit value (including an
  // explicit `undefined`) at the same index.
  it("treats a sparse hole as different from an explicit value at the same index", () => {
    const sparse: unknown[] = [1];
    sparse[2] = 3; // index 1 is a hole, not an explicit undefined

    const dense = [1, undefined, 3];

    expect(deepEqualStructural(sparse, dense)).toBe(false);
    expect(deepEqualStructural(dense, sparse)).toBe(false);
  });

  it("treats two arrays with matching holes and values as equal", () => {
    const sparseA: unknown[] = [1];
    sparseA[2] = 3;
    const sparseB: unknown[] = [1];
    sparseB[2] = 3;

    expect(deepEqualStructural(sparseA, sparseB)).toBe(true);
  });
});

describe("ticket tag phrase coverage", () => {
  it("has a ticket phrase for every approved new outcome tag", () => {
    const parsed = parseFixture();
    const phrases = ticketLines.tagPhrases as Record<string, string>;
    const tags = new Set(
      parsed.outcomes.flatMap((outcome) => outcome.consequenceTags),
    );

    for (const tag of tags) {
      expect(phrases[tag], tag).toEqual(expect.any(String));
    }

    for (const [tag, phrase] of Object.entries(newExhibits.newTagPhrases)) {
      expect(phrases[tag], tag).toBe(phrase);
    }
  });
});
