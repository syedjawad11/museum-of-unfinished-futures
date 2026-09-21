import type { PlateMarkup } from "@/content/plate-markup";

type PlateProps = {
  markup: string;
  source: PlateMarkup["source"];
};

/**
 * Renders an already-sanitized blueprint plate inline (never via `<img>`) so
 * the wing's accent colour can drive `currentColor` inside the SVG. `markup`
 * has already been validated by `sanitizePlateMarkup` (src/content/plate-markup.ts)
 * and comes only from this repo's public/illustrations or the museum's own Sanity CDN.
 */
export function Plate({ markup, source }: PlateProps) {
  return (
    <div className="plate h-full w-full" data-plate-source={source}>
      {/*
        The svg's own <title id="plate-title">/<desc id="plate-desc"> ids
        would repeat when several plates sit on one page, so this markup is
        hidden from assistive tech; the accessible name lives on the
        Vitrine's role="img" aria-label container instead.
      */}
      <div aria-hidden="true" dangerouslySetInnerHTML={{ __html: markup }} />
    </div>
  );
}
