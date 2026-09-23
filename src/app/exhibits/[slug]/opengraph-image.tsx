import { ImageResponse } from "next/og";
import { sanityExhibitRepository } from "@/content/sanity-repository";

// NOTE ON THE PLATE
// -------------------------------------------------------------------------
// Each exhibit's plate is stored as a bespoke, hand-authored SVG document
// (see src/content/plate-markup.ts) fetched at render time from the Sanity
// CDN as raw markup — not a React element tree. Satori (the renderer behind
// `next/og`'s ImageResponse) only lays out actual JSX/React elements; it
// does not evaluate arbitrary SVG markup, and there is no
// `dangerouslySetInnerHTML` escape hatch here the way there is in the DOM.
// Parsing each plate's markup into an equivalent JSX tree at request time
// would mean re-implementing a chunk of an SVG parser just for this card,
// which is more risk than a link-preview image is worth. So this card is a
// clean typographic plaque instead — title, wing, and the wing's real
// accent colour — reusing the visual language of
// src/app/your-future/opengraph-image.tsx rather than the plate itself.
//
// Any Sanity failure (unknown slug, network error) falls back to a
// generic museum-branded card below rather than a 500.

export const alt = "Museum of Unfinished Futures — exhibit plaque";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Mirrors src/app/your-future/opengraph-image.tsx, which mirrors the design
// tokens in src/app/globals.css — Satori has no access to this app's
// cascade, so these literals are the only way to reuse the same palette.
const HALL = "#07090d";
const FLOOR = "#0c0f14";
const SPOTLIGHT = "#f5efe3";
const BRASS = "#c9a24b";
const INK_MUTED = "#b9b0a0";
const FALLBACK_ACCENT = "#f2b65a";

const HEX_ACCENT_PATTERN = /^#[0-9a-fA-F]{6}$/;
const FALLBACK_TITLE = "Museum of Unfinished Futures";
const FALLBACK_WING = "An exhibit from the museum";

// The switchboard's title ("The Switchboard for Conversations That Ended
// Too Soon", 55 characters) is the longest in the museum; anything that
// long steps down a size so it still fits within the card at two lines.
const LONG_TITLE_THRESHOLD = 45;

type ImageProps = { params: Promise<{ slug: string }> };

export default async function Image({ params }: ImageProps) {
  const { slug } = await params;
  const exhibit = await sanityExhibitRepository
    .getExhibitBySlug(slug)
    .catch(() => null);

  const title = exhibit?.title ?? FALLBACK_TITLE;
  const wingTitle = exhibit?.era.title ?? FALLBACK_WING;
  const rawAccent = exhibit?.era.accentColor;
  const accent =
    rawAccent && HEX_ACCENT_PATTERN.test(rawAccent)
      ? rawAccent
      : FALLBACK_ACCENT;
  const titleFontSize = title.length > LONG_TITLE_THRESHOLD ? 54 : 68;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: HALL,
          padding: "64px 72px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: BRASS,
            }}
          >
            Museum of Unfinished Futures
          </div>
          <div
            style={{
              display: "flex",
              width: 96,
              height: 6,
              marginTop: 24,
              backgroundColor: accent,
              borderRadius: 4,
            }}
          />
          <div
            style={{
              display: "flex",
              marginTop: 24,
              maxWidth: 1000,
              fontSize: titleFontSize,
              lineHeight: 1.15,
              color: SPOTLIGHT,
            }}
          >
            {title}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: `1px solid ${FLOOR}`,
            paddingTop: 20,
            fontSize: 20,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: INK_MUTED,
          }}
        >
          <div style={{ display: "flex", color: BRASS }}>{wingTitle}</div>
          <div style={{ display: "flex" }}>museum-of-unfinished-futures</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
