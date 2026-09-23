# T-012d-metadata-seo

```
ID: T-012d-metadata-seo
Project: /home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures
Objective: Give every exhibit and wing page its own title, description and link-preview image, and add an icon, sitemap and robots file, so links shared on DEV look intentional.

Allowed files:
  src/app/exhibits/[slug]/page.tsx     (ADD a generateMetadata export only; do not touch the JSX or data logic)
  src/app/exhibits/[slug]/opengraph-image.tsx   (new)
  src/app/eras/[slug]/page.tsx         (ADD a generateMetadata export only)
  src/app/eras/[slug]/opengraph-image.tsx       (new, optional — may reuse the exhibit card layout)
  src/app/sitemap.ts, src/app/robots.ts, src/app/icon.svg (new); src/app/favicon.ico (may delete if icon.svg replaces it)
  src/app/layout.tsx                   (metadata object only: title template, openGraph/twitter defaults)
  src/app/your-future/page.tsx         (only if needed to fit the new title template — keep its titles' meaning)
  src/content/og-card.ts + og-card.test.ts (new, optional pure helpers, e.g. description trimming)
  tests/e2e/metadata.spec.ts (new)
  evidence/T-012/og/** (new PNGs)
Forbidden: everything else, including src/components/**, src/domain/**, globals.css, existing e2e specs, schemas/**, .env*. No Sanity writes. No new dependencies. Do not commit.

Read first:
  node_modules/next/dist/docs/ — the Metadata API, generateMetadata, opengraph-image file convention, sitemap.ts, robots.ts pages for THIS Next version (16.3.5). Do not rely on memory.
  src/app/your-future/opengraph-image.tsx — existing card: palette constants, fallback, the documented reason trace images can't be per-trace. Reuse its visual language.
  src/app/layout.tsx (metadataBase already set to https://museum-of-unfinished-futures.netlify.app), src/app/your-future/page.tsx generateMetadata (existing title style "X — Museum of Unfinished Futures").
  src/content/sanity-repository.ts (listExhibits, getExhibitBySlug, listEras, getEraBySlug), src/content/types.ts.

Requirements:
  - Exhibit metadata: title "<exhibit title> — Museum of Unfinished Futures" (via a layout title template is fine), description = exhibit summary trimmed to ≤ 160 chars on a word boundary, openGraph + twitter (summary_large_image). Unknown slug → metadata that does not throw (the page itself 404s).
  - Exhibit OG image 1200×630: dark hall background, wing accent swatch, "MUSEUM OF UNFINISHED FUTURES", the exhibit title, wing name, and the plate if it can be rendered safely by Satori; if the SVG plate cannot be rendered reliably, use a clean typographic card and say so. Any Sanity failure falls back to a generic card, never a 500.
  - Wing pages: same pattern with the wing title and summary.
  - icon.svg: a small original mark in the museum palette (e.g. a brass door/arch outline), no text, ≤ 2 KB.
  - sitemap: /, each wing, each exhibit, /your-future, /about — absolute URLs from metadataBase; exhibits/wings read from Sanity with a static fallback list of just / if Sanity fails.
  - robots: allow all, disallow /studio, point to the sitemap.

Tests first: tests/e2e/metadata.spec.ts asserting, against the production build on port 3100: each of the 6 exhibit pages has the right <title>, meta description ≤ 160 chars, og:image URL that returns 200 with content-type image/png; both a wing page and the home have titles; /sitemap.xml lists all 6 exhibit URLs and 3 wing URLs; /robots.txt disallows /studio; the icon link resolves. Run RED first (before implementing), then GREEN. Mutation proof on one assertion.
Before any e2e run: `ss -ltnp | grep 3100` must print nothing. Trust only the literal "N passed" line.
Save each exhibit's OG PNG to evidence/T-012/og/ and READ at least three of them; fix clipped or overflowing titles (the switchboard title is the longest).

Acceptance (paste raw output): npx playwright test tests/e2e/metadata.spec.ts (RED then GREEN), npm run test:e2e (full), npm run test:unit, npm run typecheck, npm run lint, git status --short.
Required output: changed files, raw outputs, what each OG image looked like, limitations (especially anything about the plate in Satori).
Limits: 60 minutes, two repair attempts. Model: sonnet (builder).
```
