import { ImageResponse } from "next/og";
import { sanityExhibitRepository } from "@/content/sanity-repository";

// NOTE ON TRACE-SPECIFIC IMAGES
// -------------------------------------------------------------------------
// Next.js 16.3.5 compiles a plain (non `generateImageMetadata`) file-convention
// image route to `GET(_, ctx) { return handler({ params: ctx.params }) }`
// (see node_modules/next/dist/build/webpack/loaders/next-metadata-route-loader.js,
// `getSingleImageRouteCode`) — the incoming Request, and therefore its
// `?trace=` query string, is discarded before this module's default export is
// ever called. There is no dynamic segment here (the page's shareable URL is
// `/your-future?trace=...`, a query string, not a route param), so this
// module cannot read which outcomes a given visitor reached. It renders a
// museum-branded image using the wings' real accent colours (read live from
// content, not hard-coded) rather than a trace-specific one. The page's own
// `generateMetadata` (in `page.tsx`) *does* receive `searchParams` and sets a
// trace-specific title/description, so shared links still read differently
// per visitor even though the attached image does not.

export const alt = "Museum of Unfinished Futures — a printed ticket";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Mirrors the design tokens in src/app/globals.css. ImageResponse renders
// through Satori/resvg, an isolated SVG/PNG renderer with no access to this
// app's cascade, so `var(--token)` cannot be resolved here — these literals
// are the only way to reuse the same palette.
const HALL = "#07090d";
const FLOOR = "#0c0f14";
const SPOTLIGHT = "#f5efe3";
const BRASS = "#c9a24b";
const INK_MUTED = "#b9b0a0";
const FALLBACK_ACCENT = "#f2b65a";

const HEX_ACCENT_PATTERN = /^#[0-9a-fA-F]{6}$/;

export default async function Image() {
  const eras = await sanityExhibitRepository.listEras().catch(() => []);
  const accents = eras
    .map((era) => era.accentColor)
    .filter(
      (accentColor): accentColor is string =>
        typeof accentColor === "string" && HEX_ACCENT_PATTERN.test(accentColor),
    );
  const swatches = accents.length > 0 ? accents : [FALLBACK_ACCENT];

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
              marginTop: 28,
              fontSize: 68,
              color: SPOTLIGHT,
              lineHeight: 1.1,
            }}
          >
            Your Unfinished Future
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 24,
              maxWidth: 900,
              fontSize: 28,
              lineHeight: 1.4,
              color: INK_MUTED,
            }}
          >
            A ticket composed from the wings you walked, and the consequences
            you carried out of them.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              gap: 14,
              marginBottom: 20,
            }}
          >
            {swatches.map((color, index) => (
              <div
                key={`${color}-${index}`}
                style={{
                  display: "flex",
                  width: 120,
                  height: 10,
                  backgroundColor: color,
                  borderRadius: 4,
                }}
              />
            ))}
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
              color: BRASS,
            }}
          >
            <div style={{ display: "flex" }}>A walk after closing time</div>
            <div style={{ display: "flex" }}>museum-of-unfinished-futures</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
