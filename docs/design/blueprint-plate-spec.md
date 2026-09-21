# Blueprint plate spec — Museum of Unfinished Futures

Shared style for every artifact plate (SVG), so plate 001 (the Mondays
vending machine), the memory umbrella, and the roads-not-taken telephone
all read as pages from the same drafting set. A plate is stored as a
Sanity image asset and rendered later via `<img>` from the page — it must
be fully self-contained: no external fonts, scripts, CSS, or images.

## Canvas

- `viewBox="0 0 800 600"` (4:3). No `width`/`height` attributes on the
  root so it scales to its container.
- Transparent background — never paint a background rect. The dark hall
  behind the glass case is supplied by the page.

## Colour

- Everything — strokes and the handful of fills — uses `currentColor`.
  The only other allowed paint value is `none`.
- Three opacity levels, applied with `opacity` (not colour), so a single
  `color` on the wrapper retints the whole plate:
  - **1.0** — primary lines: outlines of the object itself.
  - **0.55** — secondary/dimension lines: leaders, dimension lines,
    hatching, minor labels.
  - **0.12** — the background grid.
- Never hard-code a hex/rgb colour. `fill="none"` is fine and expected on
  most shapes (blueprints are drawn in line, not filled).

## Line weights

- Primary outlines: `stroke-width="1.5"`.
- Secondary lines (detail-view outlines, hatching, minor geometry):
  `stroke-width="1"`.
- Dimension/leader lines and arrowheads: `stroke-width="0.75"`.
- `stroke-linecap="round"` and `stroke-linejoin="round"` everywhere.
- Nothing thicker than `2.5` anywhere in the file (title-block rule
  included).

## Grid

- A `<pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">`
  drawing 1px (opacity 0.12) lines every 20px.
- A second, coarser pattern (or a manually drawn overlay) adds a heavier
  line every 100px at the same opacity — implemented here as a nested
  pattern (`grid-major`) that tiles the fine `grid` pattern and adds
  100px-spaced lines on top.
- The grid rect is clipped to a 1px inset frame:
  `x="1" y="1" width="798" height="598"` inside a `<clipPath>`, so the
  grid never touches the very edge of the artboard.

## Anatomy every plate must have

1. **fig. 1** — the main elevation, the largest drawing on the plate,
   inside `<g id="fig-1">`. Front-on or three-quarter view of the whole
   object.
2. **fig. 2** — a detail view, smaller, inside `<g id="fig-2">`, framed
   in a circle or rounded box with its own "fig. 2" label and a leader
   or magnifying line back to the point of interest on fig. 1.
3. **3–5 numbered callouts** (①②③… or plain `1 2 3` in circles) each with
   a thin leader line (`stroke-width="0.75"`, `opacity="0.55"`) pointing
   at a specific feature, and a short uppercase label.
4. **2–4 dimension lines** with plausible-but-fictional millimetre
   measurements, drawn in the classic blueprint style: a straight line
   between two tick marks/arrowheads with the number centred above it in
   monospace text.
5. **Title block**, bottom-right corner, boxed: museum name
   ("MUSEUM OF UNFINISHED FUTURES"), plate number ("PLATE NO. 001" for this
   piece, increment per plate), artifact title, the line
   "DRAWN — NEVER BUILT", and "SHEET 1/1".
6. **Compass/scale mark** — a small circle with a cross and "N" tick (or
   a scale bar like `0 50 100 mm`), placed away from the title block,
   e.g. bottom-left.
7. **"UNFINISHED" stamp** — a rubber-stamp-style outline (rounded
   rectangle or oval, double-ruled border, letter-spaced uppercase text)
   rotated a few degrees off-axis, placed so it looks pressed onto the
   page after the drawing was finished, not part of the drafting.

## Text

- `font-family="ui-monospace, 'IBM Plex Mono', Menlo, Consolas, monospace"`
  on every `<text>` (set once on the root `<svg>` via a `font-family`
  attribute is fine — it inherits).
- Sizes: 10–14px. Use 10–11px for dimension figures and callout labels,
  12–14px for the title block heading and plate title.
- `letter-spacing="0.08em"` on every text element.
- All labels uppercase (author the string uppercase; do not rely on
  `text-transform`, which is a CSS feature and this file ships with no
  CSS).
- Keep total text short — a handful of words per label. The plate is
  decorative; the page's real copy (title, summary, artifactLabel) sits
  next to it in HTML.

## Accessibility

- `<title id="plate-title">` = the artifact's exact title.
- `<desc id="plate-desc">` = the artifact's `visualDescription` field,
  verbatim, unedited.
- Root `<svg>` has `role="img"` and
  `aria-labelledby="plate-title plate-desc"`.
- No text is the *only* carrier of meaning that matters for
  understanding the piece — the real alt text lives in the page's `<img
  alt="...">` (a future task); this SVG's `<title>`/`<desc>` are a second,
  redundant safety net for when the SVG is inlined directly.

## Budget

- ≤ 60 KB per file.
- ≤ 400 elements (`grep -c "<" file.svg` as a rough proxy — count
  includes closing tags, comments, and the XML declaration if present,
  so treat it as an upper-bound estimate, not exact).
- Valid XML (`xml.dom.minidom.parse` must succeed).
- No `<script>`, no `<foreignObject>`, no `href="http…"`, no
  `data:image…`, no raster embeds of any kind, no hard-coded hex/rgb
  colours (`fill="none"` is the only allowed exception the acceptance
  grep should match).

## Motion hooks

- The main figure's group: `id="fig-1"`.
- The detail view's group: `id="fig-2"`.
- Up to two small parts that are safe to animate later get a `class`
  (e.g. `class="coil"` on a rotating calendar coil, `class="flicker"` on
  a marquee glow). No `<animate>`/`<animateTransform>`/SMIL inside the
  file — any motion is added later, in CSS, on the live page, and must
  be gated by `prefers-reduced-motion` there (not this file's job).

## Authoring workflow

1. Start from a skeleton (`<svg>` with just the `viewBox`, `<title>`,
   `<desc>`, empty `<g id="fig-1">`/`<g id="fig-2">`) and run every
   acceptance check against it first — they should all pass on an empty
   file. This proves the checks work before time is spent drawing.
2. Draw fig. 1 first (largest, most important), then fig. 2, then
   callouts/leaders, then dimension lines, then the fixed furniture
   (title block, compass, stamp) last — the fixed furniture is the same
   shape on every plate, so it is fastest to copy from a previous plate
   once one exists.
3. Preview locally: open `evidence/<task>/preview.html` in a browser (or
   `npx playwright screenshot --viewport-size=900,700
   "file://$PWD/evidence/<task>/preview.html"
   evidence/<task>/<name>.png`). Check both the plain `<img>` render and
   the tinted inline-SVG render — they will look different (see note
   below) and only the inline one previews the real production look.
4. Check size and validity before calling a plate done:
   - `python3 -c "import xml.dom.minidom,sys;xml.dom.minidom.parse(sys.argv[1]);print('xml ok')" <file>.svg`
   - `wc -c <file>.svg` (must be ≤ 61440)
   - `grep -c "<" <file>.svg` (report the number; sanity-check against
     the 400-element budget)
   - `grep -n -i -E "script|foreignObject|href=\"http|data:image|#[0-9a-f]{3,6}" <file>.svg`
     (must print nothing except lines that are only `fill="none"` — any
     other hit is a violation and must be fixed)

### Note: `<img>` vs inline SVG and `currentColor`

An `<img src="plate.svg">` renders the SVG in its own document context;
`currentColor` inside it resolves against *that* document's own
inherited colour (effectively black, the SVG/CSS initial value), not the
host page's `color`. A CSS `filter: drop-shadow(...)` on the `<img>`
still works (it operates on the rendered pixels), but the tint will not
change. To tint a plate per wing, the real site must either:
(a) inline the SVG markup directly into the page's HTML/JSX, or
(b) use an `<object>`/inline-`<svg><use>` technique, or
(c) fetch and inject the markup client-side.
This is a decision for the wiring task, not this one — this spec only
notes the constraint so the wiring task isn't surprised by it.

## Checklist to copy into future plate tasks

- [ ] `viewBox="0 0 800 600"`, no background rect, no hard-coded colour
- [ ] All paint via `currentColor` / `none`; opacity only at 1.0 / 0.55 / 0.12
- [ ] Stroke widths only 1.5 / 1 / 0.75 (nothing > 2.5); round caps+joins
- [ ] Grid pattern, 20px + 100px-major, clipped to a 1px inset frame
- [ ] `<g id="fig-1">` main elevation (largest drawing)
- [ ] `<g id="fig-2">` detail view, circled/boxed, labelled
- [ ] 3–5 numbered callouts with leader lines
- [ ] 2–4 dimension lines with fictional mm measurements
- [ ] Title block: museum name, plate number, artifact title,
      "DRAWN — NEVER BUILT", "SHEET 1/1"
- [ ] Compass/scale mark
- [ ] Askew "UNFINISHED" rubber-stamp outline
- [ ] Monospace font-family set; sizes 10–14px; letter-spacing 0.08em;
      labels authored uppercase
- [ ] `<title>` = artifact title; `<desc>` = `visualDescription` verbatim;
      root `role="img"` `aria-labelledby` pointing at both
- [ ] No `<script>`, `<foreignObject>`, external `href`, `data:image`, raster
- [ ] Up to two animatable parts carry a `class`; no SMIL
- [ ] `wc -c` ≤ 61440; `grep -c "<"` ≤ ~400; XML parses; forbidden-pattern
      grep prints nothing but `fill="none"` lines
- [ ] Previewed via `evidence/<task>/preview.html` in both `<img>` and
      inline-SVG variants
