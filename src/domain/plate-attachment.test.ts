import { describe, expect, it } from "vitest";
import {
  buildDraftWithPlate,
  checkUploadedAsset,
  extractPlateAlt,
  PLATE_ATTACHMENTS,
} from "./plate-attachment";

const validPlateMarkup = (desc: string) => `<svg viewBox="0 0 800 600" role="img">
  <title id="plate-title">Fixture Plate</title>
  <desc id="plate-desc">${desc}</desc>
</svg>`;

describe("extractPlateAlt", () => {
  it("returns collapsed desc text as the alt text", () => {
    expect(
      extractPlateAlt(
        validPlateMarkup(`
          A translucent umbrella is displayed
          above a dark pedestal.
        `),
      ),
    ).toEqual({
      ok: true,
      alt: "A translucent umbrella is displayed above a dark pedestal.",
    });
  });

  it("decodes XML entities in desc text", () => {
    expect(
      extractPlateAlt(
        validPlateMarkup(
          "An umbrella &amp; phone marked &quot;KEEP&quot; &lt;museum case&gt;.",
        ),
      ),
    ).toEqual({
      ok: true,
      alt: 'An umbrella & phone marked "KEEP" <museum case>.',
    });
  });

  it("fails when the desc is missing", () => {
    expect(
      extractPlateAlt(
        '<svg viewBox="0 0 800 600" role="img"><title>Missing desc</title></svg>',
      ),
    ).toEqual({ ok: false, reason: "missing desc" });
  });

  it("accepts desc text at the length boundaries", () => {
    expect(extractPlateAlt(validPlateMarkup("x".repeat(20)))).toEqual({
      ok: true,
      alt: "x".repeat(20),
    });

    expect(extractPlateAlt(validPlateMarkup("x".repeat(320)))).toEqual({
      ok: true,
      alt: "x".repeat(320),
    });
  });

  it("fails when the desc is too short or too long", () => {
    expect(extractPlateAlt(validPlateMarkup("Too short."))).toEqual({
      ok: false,
      reason: "desc must be between 20 and 320 characters",
    });

    expect(extractPlateAlt(validPlateMarkup("x".repeat(321)))).toEqual({
      ok: false,
      reason: "desc must be between 20 and 320 characters",
    });
  });
});

describe("checkUploadedAsset", () => {
  it("accepts an allowed Sanity SVG URL with positive dimensions", () => {
    expect(
      checkUploadedAsset({
        url: "https://cdn.sanity.io/images/wa27n68e/production_1/plate.svg",
        metadata: { dimensions: { width: 800, height: 600 } },
      }),
    ).toEqual({ ok: true });
  });

  it("rejects assets outside the allowed plate URL contract", () => {
    expect(
      checkUploadedAsset({
        url: "https://example.com/plate.svg",
        metadata: { dimensions: { width: 800, height: 600 } },
      }),
    ).toEqual({ ok: false, reason: "asset URL is not an allowed plate URL" });
  });

  it("rejects missing or non-positive dimensions", () => {
    expect(
      checkUploadedAsset({
        url: "https://cdn.sanity.io/images/wa27n68e/production_1/plate.svg",
      }),
    ).toEqual({
      ok: false,
      reason: "asset dimensions must include positive width and height",
    });

    expect(
      checkUploadedAsset({
        url: "https://cdn.sanity.io/images/wa27n68e/production_1/plate.svg",
        metadata: { dimensions: { width: 0, height: 600 } },
      }),
    ).toEqual({
      ok: false,
      reason: "asset dimensions must include positive width and height",
    });
  });
});

describe("buildDraftWithPlate", () => {
  it("builds the draft artifact document and removes stored metadata", () => {
    const published = {
      _id: "artifact-memory-umbrella",
      _rev: "published-rev",
      _createdAt: "2026-09-20T10:00:00.000Z",
      _updatedAt: "2026-09-20T11:00:00.000Z",
      _type: "artifact",
      slug: { current: "memory-umbrella" },
      title: "The Umbrella That Remembers Every Storm",
      summary: "A museum artifact summary long enough for the schema.",
    };

    expect(
      buildDraftWithPlate(
        published,
        "image-asset-id",
        "A translucent umbrella is displayed open above a dark pedestal.",
      ),
    ).toEqual({
      _id: "drafts.artifact-memory-umbrella",
      _type: "artifact",
      slug: { current: "memory-umbrella" },
      title: "The Umbrella That Remembers Every Storm",
      summary: "A museum artifact summary long enough for the schema.",
      image: {
        _type: "image",
        asset: { _type: "reference", _ref: "image-asset-id" },
        alt: "A translucent umbrella is displayed open above a dark pedestal.",
      },
    });
  });

  it("uses the manifest ids for all required plates", () => {
    expect(PLATE_ATTACHMENTS).toEqual([
      {
        slug: "extra-mondays-vending-machine",
        artifactId: "artifact-extra-mondays-vending-machine",
        draftId: "drafts.artifact-extra-mondays-vending-machine",
        reviewId: "artifactReview.artifact-extra-mondays-vending-machine",
        file: "public/illustrations/extra-mondays-vending-machine.svg",
        filename: "extra-mondays-vending-machine.svg",
      },
      {
        slug: "memory-umbrella",
        artifactId: "artifact-memory-umbrella",
        draftId: "drafts.artifact-memory-umbrella",
        reviewId: "artifactReview.artifact-memory-umbrella",
        file: "public/illustrations/memory-umbrella.svg",
        filename: "memory-umbrella.svg",
      },
      {
        slug: "roads-not-taken-telephone",
        artifactId: "artifact-roads-not-taken-telephone",
        draftId: "drafts.artifact-roads-not-taken-telephone",
        reviewId: "artifactReview.artifact-roads-not-taken-telephone",
        file: "public/illustrations/roads-not-taken-telephone.svg",
        filename: "roads-not-taken-telephone.svg",
      },
    ]);
  });
});
