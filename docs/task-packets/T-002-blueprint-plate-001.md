# T-002-blueprint-plate-001

```
ID: T-002-blueprint-plate-001
Project: /home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures
Objective: Write the shared blueprint-plate style specification and hand-author the first original SVG plate — "The Vending Machine That Sells Extra Mondays" — so every later plate looks like it belongs to the same museum.

Context: the museum shows each unfinished invention as a glowing engineer's blueprint inside a dark glass case. Plates are drawn as code (SVG), stored later as Sanity image assets and rendered via <img> from the Sanity CDN — so a plate must be self-contained: no external fonts, scripts, images, or CSS files. Strokes use currentColor so the page can tint a plate per wing and add a CSS glow.

Allowed files:
  docs/design/blueprint-plate-spec.md   (new)
  public/illustrations/extra-mondays-vending-machine.svg   (new)
  evidence/T-002/   (preview.html harness + PNG renders)
Forbidden files: everything else, especially src/**, schemas/**, package.json, .env*.

Read first:
  docs/content/first-exhibit.json  (the artifact's title, summary, artifactLabel, visualDescription — the plate must depict *this* object: a battered brushed-steel vending machine, cracked selector window, miniature calendar pages coiled like snacks behind smudged glass)
  docs/content/remaining-exhibits.json  (the other two artifacts; the spec must be general enough for them: a translucent umbrella with suspended droplets and dates engraved on a brass handle; a cream rotary telephone with words on the dial and a second receiver)

Spec requirements (docs/design/blueprint-plate-spec.md, ≤ 2 pages, plain language + exact values):
  - Canvas: viewBox="0 0 800 600" (4:3), transparent background (the page supplies the dark ground).
  - Colour: all drawing in `currentColor` (stroke and the few fills) with 3 opacity levels — primary lines 1.0, secondary/dimension lines 0.55, grid 0.12. No hard-coded colours except `none`.
  - Line weights: primary 1.5, secondary 1, dimension/leader 0.75; round caps and joins; no strokes thicker than 2.5.
  - Grid: a <pattern> of 20 px squares with a heavier line every 100 px, clipped to a 1 px inset frame.
  - Anatomy of every plate: fig. 1 main elevation (largest), fig. 2 a detail view in a circle or box, 3–5 numbered callouts with leader lines, 2–4 dimension lines with plausible-but-fictional measurements (mm), a title block bottom-right (museum name, plate number "PLATE 001", artifact title, "DRAWN — NEVER BUILT", sheet 1/1), a small compass/scale mark, and a stamp-like "UNFINISHED" rubber-stamp outline placed slightly askew.
  - Text: font-family="ui-monospace, 'IBM Plex Mono', Menlo, Consolas, monospace", sizes 10–14 px, letter-spacing 0.08em, uppercase for labels. Keep total text short (it is decorative; the page carries the real copy).
  - Accessibility: <title> = artifact title, <desc> = the artifact's visualDescription verbatim; root has role="img" and aria-labelledby pointing at both.
  - Budget: ≤ 60 KB, ≤ 400 elements, valid XML, no <script>, no <foreignObject>, no external href, no raster.
  - Motion hooks: give the main figure group id="fig-1" and the detail group id="fig-2"; give up to two animatable parts a class name (e.g. class="coil") so a later CSS micro-animation can target them. No SMIL animation inside the file.
  - Authoring workflow: how to preview (the harness below), how to check size and validity, and a checklist to copy into future plate tasks.

Plate requirements (public/illustrations/extra-mondays-vending-machine.svg): follow the spec exactly; depict the machine recognisably (cabinet, cracked selector glass, coils holding tiny calendar pages, coin/plan slot, delivery flap, a "MONDAYS" marquee), with the detail view showing one coil of calendar pages stamped with dates that never entered the year. Hand-author it — no tracing, no generated raster.

Preview harness (evidence/T-002/preview.html): a static HTML page with a #07090d background, the SVG inlined via <img src="../../public/illustrations/extra-mondays-vending-machine.svg"> at 800×600 with `color: #f2b65a; filter: drop-shadow(0 0 6px currentColor)` on a wrapper to simulate the page glow. Note: an <img> does not inherit currentColor — so also inline the SVG source directly once in the same page to show the tinted version; report which variant you rendered.

Tests first: create the harness and run the validity + size checks against an empty skeleton SVG first (they should pass), then draw.

Acceptance checks (run all, paste raw output):
  python3 -c "import xml.dom.minidom,sys;xml.dom.minidom.parse(sys.argv[1]);print('xml ok')" public/illustrations/extra-mondays-vending-machine.svg   (xmllint is not installed)
  wc -c public/illustrations/extra-mondays-vending-machine.svg            (≤ 61440)
  grep -c "<" public/illustrations/extra-mondays-vending-machine.svg      (rough element count, report it)
  grep -n -i -E "script|foreignObject|href=\"http|data:image|#[0-9a-f]{3,6}" public/illustrations/extra-mondays-vending-machine.svg  (must print nothing except the fill=\"none\" lines; explain any hit)
  npx playwright screenshot --viewport-size=900,700 "file://$PWD/evidence/T-002/preview.html" evidence/T-002/plate-001-preview.png
  git status --short   (only the allowed paths)

Required output:
  - Status: done | partial | blocked
  - Changed files
  - Raw output of every acceptance command
  - A short description of the drawing (what is in fig. 1, fig. 2, the callouts) and anything you would redraw with more time
  - Actual model ID if visible
Limits: 45 minutes, two repair attempts, then stop and report. Do not touch src/** — wiring the plate into the page is a separate task.
Sandbox/permissions: workspace-write; no installs, network, credentials, or public actions.
Model: sonnet (frontend-designer)
```

## Worker report (frontend-designer, reported model claude-sonnet-5, ~12 min)
Status: done. Files: docs/design/blueprint-plate-spec.md (new), public/illustrations/extra-mondays-vending-machine.svg (new, 15,466 bytes, ~182 elements), evidence/T-002/preview.html + plate-001-preview.png.
Checks (raw): `xml ok`; `wc -c` → 15466; forbidden-pattern grep → no matches; Playwright screenshot captured; `git status` scoped to the three paths shows only new files.
Repairs: (1) `&#8212;` entities tripped the hex-colour grep → replaced with literal em-dashes; (2) two callout labels clipped at x<0 → moved to the right side.
Drawing: fig. 1 front elevation (marquee with 5 lights, cracked selector glass with 3×3 calendar-page coils, "SELECT: MON" readout, plan slot, delivery flap, feet); fig. 2 3:1 detail of one coil with pages "MON 32 / FEB 30 / MON 00 / MON XX"; 5 callouts; 4 dimension lines (640, 1780, 310, 50 mm); scale bar, compass, askew "UNFINISHED" stamp, title block "PLATE NO. 001 · SHEET 1/1 · DRAWN — NEVER BUILT". Hooks: ids fig-1/fig-2, classes coil/flicker.
Flagged constraint: an `<img>` does not inherit `currentColor`, so the plate renders black via `<img>`; tinting needs inline SVG (documented in the spec).

## Orchestrator acceptance — ACCEPTED (Sep 21, 2026)
- Inspected the SVG source and both preview variants (evidence/T-002/plate-001-preview-full.png captured by the orchestrator; the worker's PNG only showed the untinted variant A). Variant B (inline, amber, glow) reads as a real engineer's plate; the object is recognisable; text is short and decorative; a11y title/desc verbatim from the content JSON.
- Spec is 1.4k words with a copyable checklist; suitable for the umbrella and telephone plates.
- Decision taken on the flagged constraint: plates get one permitted hex value — a default tint on the root (`style="color:#f2b65a"`) so an `<img>`/CDN fallback is never black — and the site inlines the SVG server-side so CSS can override the tint per wing and animate the hooks. Spec + plate amendment goes into the wiring task (T-004), not a reopen of T-002.
- Gates not applicable (no src changes). Files outside the allowed list: none.
