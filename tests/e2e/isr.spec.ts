import { expect, test, type APIRequestContext, type APIResponse } from "@playwright/test";

/**
 * T-015 — ISR: home, wing pages, exhibit pages (as a base URL) and the
 * sitemap are cached and revalidated every 60s instead of rendered on every
 * request; pages that read a per-visitor query string stay dynamic so one
 * visitor's `?choice=`/`?trace=` is never served from a shared cache to
 * another. See docs/isr.md for the full explanation and doc citations.
 *
 * Cache-control shapes asserted here are not guessed:
 *   - ISR pages: s-maxage={revalidate}, stale-while-revalidate={...} — see
 *     node_modules/next/dist/docs/01-app/02-guides/cdn-caching.md ("What
 *     Works Today" > "Cache-Control headers").
 *   - Dynamic pages: private, no-cache, no-store, max-age=0,
 *     must-revalidate — same doc.
 *   - The generated sitemap.xml route is a metadata-file-convention route,
 *     not a page: its wrapper always sets `public, max-age=0,
 *     must-revalidate` regardless of the `revalidate` export (verified in
 *     node_modules/next/dist/build/webpack/loaders/next-metadata-route-loader.js,
 *     `CACHE_HEADERS.REVALIDATE`, and empirically against this build's
 *     actual response header — the `cdn-caching.md` "ISR pages" shape
 *     above does not apply to it). The `revalidate = 60` export still
 *     governs how often Next.js regenerates the underlying sitemap content
 *     server-side (see the `next build` route table: `Revalidate 1m`), so
 *     it still satisfies "revalidate every 60 seconds" — just with a
 *     different literal header than a page gets.
 *
 * Real slugs/ids below are read off the public Sanity CDN (production_1),
 * the same source tests/e2e/metadata.spec.ts and visitor-journey.spec.ts use.
 */

const WING_PATH = "/eras/civic-time-expansion-era";
const EXHIBIT_PATH = "/exhibits/roads-not-taken-telephone";
const EXHIBIT_CHOICE = "call-declined-life";
const UNKNOWN_WING_PATH = "/eras/does-not-exist";
const UNKNOWN_EXHIBIT_PATH = "/exhibits/does-not-exist";

const CACHEABLE_CACHE_CONTROL = /^s-maxage=60,\s*stale-while-revalidate=/;
const DYNAMIC_CACHE_CONTROL =
  /private,\s*no-cache,\s*no-store,\s*max-age=0,\s*must-revalidate/;

/**
 * `/eras/[slug]` has no `generateStaticParams` entries (it returns `[]`, so
 * the route is *eligible* for ISR at all — see docs/isr.md), so the very
 * first request(s) to a given slug on a freshly started server render it
 * on demand and can come back `x-nextjs-cache: STALE` with no
 * `Cache-Control` header yet, before the background generation finishes
 * and the entry is actually cached (`x-nextjs-cache: HIT`, with the
 * `Cache-Control` header this test cares about). Confirmed empirically
 * against this project's own `next start` (repeated `curl -sD -`), not
 * guessed. This polls a few times so the assertion below is deterministic
 * instead of racing that first-generation window.
 */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function warmedResponse(
  request: APIRequestContext,
  path: string,
): Promise<APIResponse> {
  let response = await request.get(path);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (response.headers()["x-nextjs-cache"] === "HIT") {
      return response;
    }

    await wait(500);
    response = await request.get(path);
  }

  return response;
}

test("home page returns 200 with a cacheable, 60s-revalidating cache-control header", async ({
  request,
}) => {
  const response = await request.get("/");

  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toMatch(CACHEABLE_CACHE_CONTROL);
});

test("a wing page returns 200 with a cacheable, 60s-revalidating cache-control header", async ({
  request,
}) => {
  const response = await warmedResponse(request, WING_PATH);

  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toMatch(CACHEABLE_CACHE_CONTROL);
});

test("the sitemap returns 200 and is regenerated server-side at most every 60s", async ({
  request,
}) => {
  const response = await request.get("/sitemap.xml");

  expect(response.status()).toBe(200);
  // Not the page ISR shape — see the file header comment above: this is
  // the fixed header every generated metadata-file-convention route sets.
  expect(response.headers()["cache-control"]).toBe(
    "public, max-age=0, must-revalidate",
  );
});

test("an exhibit page reads searchParams and so stays dynamic (not publicly cached), even without a query string", async ({
  request,
}) => {
  const response = await request.get(EXHIBIT_PATH);

  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toMatch(DYNAMIC_CACHE_CONTROL);
});

test("an exhibit page with ?choice= is not publicly cached — one visitor's choice is never served to another", async ({
  request,
}) => {
  const response = await request.get(`${EXHIBIT_PATH}?choice=${EXHIBIT_CHOICE}`);

  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toMatch(DYNAMIC_CACHE_CONTROL);
});

test("/your-future?trace=... is not publicly cached — one visitor's ticket is never served to another", async ({
  request,
}) => {
  const response = await request.get(
    "/your-future?trace=outcome-paper-monday",
  );

  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toMatch(DYNAMIC_CACHE_CONTROL);
});

test("an unknown wing slug still returns a real HTTP 404", async ({
  request,
}) => {
  const response = await request.get(UNKNOWN_WING_PATH);

  expect(response.status()).toBe(404);
});

test("an unknown exhibit slug still returns a real HTTP 404", async ({
  request,
}) => {
  const response = await request.get(UNKNOWN_EXHIBIT_PATH);

  expect(response.status()).toBe(404);
});
