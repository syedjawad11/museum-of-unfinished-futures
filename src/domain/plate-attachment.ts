import { isAllowedPlateUrl } from "../content/plate-markup";
import { getArtifactReviewId } from "./artifact-review";

export type PlateAttachment = {
  slug: string;
  artifactId: string;
  draftId: string;
  reviewId: string;
  file: string;
  filename: string;
};

export type UploadedPlateAsset = {
  url: string;
  metadata?: {
    dimensions?: {
      width?: number;
      height?: number;
    };
  };
};

const slugs = [
  "extra-mondays-vending-machine",
  "memory-umbrella",
  "roads-not-taken-telephone",
] as const;

export const PLATE_ATTACHMENTS: PlateAttachment[] = slugs.map((slug) => {
  const artifactId = `artifact-${slug}`;

  return {
    slug,
    artifactId,
    draftId: `drafts.${artifactId}`,
    reviewId: getArtifactReviewId(artifactId),
    file: `public/illustrations/${slug}.svg`,
    filename: `${slug}.svg`,
  };
});

export function extractPlateAlt(
  markup: string,
): { ok: true; alt: string } | { ok: false; reason: string } {
  const descMatch = markup.match(/<desc\b[^>]*>([\s\S]*?)<\/desc>/i);

  if (!descMatch) {
    return { ok: false, reason: "missing desc" };
  }

  const alt = decodeXmlEntities(stripTags(descMatch[1]))
    .replace(/\s+/g, " ")
    .trim();

  if (alt.length < 20 || alt.length > 320) {
    return {
      ok: false,
      reason: "desc must be between 20 and 320 characters",
    };
  }

  return { ok: true, alt };
}

export function checkUploadedAsset(
  asset: UploadedPlateAsset,
): { ok: true } | { ok: false; reason: string } {
  if (!isAllowedPlateUrl(asset.url)) {
    return { ok: false, reason: "asset URL is not an allowed plate URL" };
  }

  const width = asset.metadata?.dimensions?.width;
  const height = asset.metadata?.dimensions?.height;

  if (
    typeof width !== "number" ||
    typeof height !== "number" ||
    width <= 0 ||
    height <= 0
  ) {
    return {
      ok: false,
      reason: "asset dimensions must include positive width and height",
    };
  }

  return { ok: true };
}

export function buildDraftWithPlate(
  published: Record<string, unknown> & { _id: string; _type: string },
  assetId: string,
  alt: string,
): Record<string, unknown> & { _id: string; _type: string } {
  const content = { ...published };
  delete content._rev;
  delete content._createdAt;
  delete content._updatedAt;

  return {
    ...content,
    _id: `drafts.${published._id}`,
    image: {
      _type: "image",
      asset: { _type: "reference", _ref: assetId },
      alt,
    },
  };
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, "");
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}
