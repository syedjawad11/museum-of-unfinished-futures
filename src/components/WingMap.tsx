import Link from "next/link";
import type { CSSProperties } from "react";
import {
  isWingCurrent,
  romanNumeralForPosition,
  wrapWingLabel,
} from "@/domain/wings";

export type WingMapEntry = {
  slug: string;
  title: string;
  accentColor?: string;
};

type WingMapProps = {
  wings: WingMapEntry[];
  /** The wing currently being viewed, if any — lit brighter, gets
   * `aria-current="page"`. */
  currentSlug?: string;
};

type AccentStyle = CSSProperties & { "--accent"?: string };

const HEX_ACCENT_PATTERN = /^#[0-9a-fA-F]{6}$/;
const ROOM_WIDTH = 220;
const ROOM_HEIGHT = 150;
const GAP = 20;
const MARGIN_Y = 24;

/**
 * An inline SVG floor plan: one room per wing, adapting to however many
 * wings are passed. Each room is a real `<a>` (via `next/link`, so it works
 * without JS and gets prefetching with it) linking to `/eras/<slug>` — never
 * an `onClick` on a shape. Room stroke/glow reads its `--accent` from
 * `era.accentColor`; wings without one fall back to the `brass-dim` token.
 */
export function WingMap({ wings, currentSlug }: WingMapProps) {
  if (wings.length === 0) {
    return null;
  }

  const totalWidth = GAP + wings.length * (ROOM_WIDTH + GAP);
  const totalHeight = MARGIN_Y * 2 + ROOM_HEIGHT;

  return (
    <svg
      aria-label="Museum floor plan"
      className="h-auto w-full max-w-3xl"
      role="group"
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
    >
      <title>Museum floor plan</title>
      {wings.map((wing, index) => {
        const isCurrent = isWingCurrent(wing.slug, currentSlug);
        const numeral = romanNumeralForPosition(index + 1);
        const x = GAP + index * (ROOM_WIDTH + GAP);
        const y = MARGIN_Y;
        const hasAccent =
          typeof wing.accentColor === "string" &&
          HEX_ACCENT_PATTERN.test(wing.accentColor);
        const style: AccentStyle | undefined = hasAccent
          ? { "--accent": wing.accentColor }
          : undefined;
        const roomStroke = hasAccent ? "var(--accent)" : "var(--brass-dim)";
        const labelLines = wrapWingLabel(wing.title);

        return (
          <Link
            aria-current={isCurrent ? "page" : undefined}
            aria-label={`${wing.title} — enter this wing`}
            className="group motion-safe:transition-opacity motion-safe:duration-300"
            href={`/eras/${wing.slug}`}
            key={wing.slug}
            style={style}
          >
            <rect
              className="motion-safe:transition-[opacity,stroke-width] motion-safe:duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
              fill={hasAccent ? "var(--accent)" : "none"}
              fillOpacity={isCurrent ? 0.16 : 0.05}
              height={ROOM_HEIGHT}
              opacity={isCurrent ? 1 : 0.72}
              rx={8}
              stroke={roomStroke}
              strokeWidth={isCurrent ? 2.25 : 1.5}
              width={ROOM_WIDTH}
              x={x}
              y={y}
            />
            <text
              className="fill-spotlight font-display"
              fontSize={30}
              textAnchor="middle"
              x={x + ROOM_WIDTH / 2}
              y={y + 46}
            >
              {numeral}
            </text>
            {labelLines.map((line, lineIndex) => (
              <text
                className="fill-ink font-mono uppercase"
                fontSize={11}
                key={`${wing.slug}-${lineIndex}`}
                letterSpacing="0.06em"
                textAnchor="middle"
                x={x + ROOM_WIDTH / 2}
                y={y + 78 + lineIndex * 15}
              >
                {line}
              </text>
            ))}
          </Link>
        );
      })}
    </svg>
  );
}
