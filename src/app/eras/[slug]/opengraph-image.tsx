import { ImageResponse } from "next/og";
import { sanityExhibitRepository } from "@/content/sanity-repository";
import { trimDescription } from "@/content/og-card";

// Reuses the exhibit card's layout and the same reasoning for not inlining
// a plate (see src/app/exhibits/[slug]/opengraph-image.tsx) — a wing has no
// single plate of its own anyway. Any Sanity failure falls back to a
// generic museum-branded card rather than a 500.

export const alt = "Museum of Unfinished Futures — wing plaque";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const HALL = "#07090d";
const FLOOR = "#0c0f14";
const SPOTLIGHT = "#f5efe3";
const BRASS = "#c9a24b";
const INK_MUTED = "#b9b0a0";
const FALLBACK_ACCENT = "#f2b65a";

const HEX_ACCENT_PATTERN = /^#[0-9a-fA-F]{6}$/;
const FALLBACK_TITLE = "Museum of Unfinished Futures";
const FALLBACK_SUMMARY = "A wing of the museum.";

type ImageProps = { params: Promise<{ slug: string }> };

export default async function Image({ params }: ImageProps) {
  const { slug } = await params;
  const wing = await sanityExhibitRepository.getEraBySlug(slug).catch(() => null);

  const title = wing?.title ?? FALLBACK_TITLE;
  const summary = trimDescription(wing?.summary ?? FALLBACK_SUMMARY);
  const rawAccent = wing?.accentColor;
  const accent =
    rawAccent && HEX_ACCENT_PATTERN.test(rawAccent) ? rawAccent : FALLBACK_ACCENT;

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
            Museum of Unfinished Futures · Wing
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
              fontSize: 62,
              lineHeight: 1.15,
              color: SPOTLIGHT,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 24,
              maxWidth: 900,
              fontSize: 26,
              lineHeight: 1.4,
              color: INK_MUTED,
            }}
          >
            {summary}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            borderTop: `1px solid ${FLOOR}`,
            paddingTop: 20,
            fontSize: 20,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: INK_MUTED,
          }}
        >
          <div style={{ display: "flex" }}>museum-of-unfinished-futures</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
