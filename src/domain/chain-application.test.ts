import { describe, expect, it } from "vitest";
import approvedProposal from "../../docs/content/chain-outcomes.json";
import {
  buildOutcomePatch,
  checkPreconditions,
  parseChainProposal,
  type ChainEntry,
  type PublishedOutcomeDocument,
} from "./chain-application";

const expectedOutcomeIds = [
  "outcome-paper-monday",
  "outcome-soft-refusal",
  "outcome-familiar-stranger",
  "outcome-missed-call-self",
  "outcome-room-rains-back",
  "outcome-forecast-forgets",
];

const validJson = () => JSON.parse(JSON.stringify(approvedProposal));

const validDoc = (
  id = "outcome-paper-monday",
): PublishedOutcomeDocument => ({
  _id: id,
  _type: "outcome",
  _rev: `${id}-rev`,
  title: "Fixture outcome",
  body: "A fixture body long enough to resemble a stored outcome document.",
});

function expectParseError(json: unknown, code: string) {
  const result = parseChainProposal(json);

  expect(result.ok).toBe(false);
  expect(result).toMatchObject({ ok: false, code });
}

describe("parseChainProposal", () => {
  it("accepts the approved proposal for all six real outcomes", () => {
    const result = parseChainProposal(validJson());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.reason);
    }

    expect(result.entries.map((entry) => entry._id)).toEqual(expectedOutcomeIds);
    expect(result.entries).toHaveLength(6);
    expect(result.entries[0]).toEqual({
      _id: "outcome-paper-monday",
      artifact: "artifact-extra-mondays-vending-machine",
      consequenceTags: [
        "borrowed-time",
        "accruing-interest",
        "edited-without-asking",
      ],
      leadsTo: {
        artifactId: "artifact-roads-not-taken-telephone",
        slug: "roads-not-taken-telephone",
        title: "The Telephone for Calling Roads Not Taken",
      },
    });
  });

  it("rejects an outcome id outside the known six", () => {
    const json = validJson();
    json.outcomes[0]._id = "outcome-unapproved";

    expectParseError(json, "unknown-outcome");
  });

  it("rejects a tag that fails the outcome schema pattern", () => {
    const json = validJson();
    json.outcomes[0].consequenceTags[0] = "Borrowed Time";

    expectParseError(json, "invalid-tag");
  });

  it("rejects duplicate tags within an outcome", () => {
    const json = validJson();
    json.outcomes[0].consequenceTags = ["borrowed-time", "borrowed-time"];

    expectParseError(json, "duplicate-tags");
  });

  it("rejects fewer than one consequence tag", () => {
    const json = validJson();
    json.outcomes[0].consequenceTags = [];

    expectParseError(json, "tag-count");
  });

  it("rejects more than four consequence tags", () => {
    const json = validJson();
    json.outcomes[0].consequenceTags = [
      "one",
      "two",
      "three",
      "four",
      "five",
    ];

    expectParseError(json, "tag-count");
  });

  it("rejects a leadsTo artifact that points back to the outcome artifact", () => {
    const json = validJson();
    json.outcomes[0].leadsTo.artifactId =
      "artifact-extra-mondays-vending-machine";

    expectParseError(json, "self-lead");
  });

  it("rejects a missing leadsTo artifact id", () => {
    const json = validJson();
    delete json.outcomes[0].leadsTo.artifactId;

    expectParseError(json, "missing-artifact");
  });

  it("rejects an unknown leadsTo artifact id", () => {
    const json = validJson();
    json.outcomes[0].leadsTo.artifactId = "artifact-unapproved";

    expectParseError(json, "unknown-artifact");
  });
});

describe("buildOutcomePatch", () => {
  it("builds the exact patch payload and leaves stored fields out of scope", () => {
    const entry: ChainEntry = {
      _id: "outcome-paper-monday",
      artifact: "artifact-extra-mondays-vending-machine",
      consequenceTags: ["borrowed-time", "accruing-interest"],
      leadsTo: {
        artifactId: "artifact-roads-not-taken-telephone",
        slug: "roads-not-taken-telephone",
        title: "The Telephone for Calling Roads Not Taken",
      },
    };

    expect(buildOutcomePatch(entry, validDoc())).toEqual({
      consequenceTags: ["borrowed-time", "accruing-interest"],
      leadsTo: {
        _type: "reference",
        _ref: "artifact-roads-not-taken-telephone",
      },
    });
  });
});

describe("checkPreconditions", () => {
  const entry: ChainEntry = {
    _id: "outcome-paper-monday",
    artifact: "artifact-extra-mondays-vending-machine",
    consequenceTags: ["borrowed-time"],
    leadsTo: {
      artifactId: "artifact-roads-not-taken-telephone",
      slug: "roads-not-taken-telephone",
      title: "The Telephone for Calling Roads Not Taken",
    },
  };

  it("accepts a published outcome with empty chain fields", () => {
    expect(checkPreconditions(validDoc(), entry)).toEqual({ ok: true });
    expect(
      checkPreconditions(
        { ...validDoc(), consequenceTags: [] },
        entry,
      ),
    ).toEqual({ ok: true });
  });

  it("refuses a missing published document", () => {
    expect(checkPreconditions(undefined, entry)).toEqual({
      ok: false,
      reason: "Published outcome outcome-paper-monday was not found.",
    });
  });

  it("refuses a stored document with the wrong type", () => {
    expect(checkPreconditions({ ...validDoc(), _type: "artifact" }, entry)).toEqual({
      ok: false,
      reason: "Document outcome-paper-monday is not an outcome.",
    });
  });

  it("refuses existing consequence tags", () => {
    expect(
      checkPreconditions(
        { ...validDoc(), consequenceTags: ["already-curated"] },
        entry,
      ),
    ).toEqual({
      ok: false,
      reason:
        "Outcome outcome-paper-monday already has consequenceTags; refusing to overwrite curated work.",
    });
  });

  it("refuses an existing leadsTo reference", () => {
    expect(
      checkPreconditions(
        {
          ...validDoc(),
          leadsTo: { _type: "reference", _ref: "artifact-memory-umbrella" },
        },
        entry,
      ),
    ).toEqual({
      ok: false,
      reason:
        "Outcome outcome-paper-monday already has leadsTo; refusing to overwrite curated work.",
    });
  });
});
