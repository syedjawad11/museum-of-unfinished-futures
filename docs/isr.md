# ISR (T-015)

What is cached, for how long, what stays dynamic and why, and how a Sanity
outage behaves for the routes touched by T-015.

Doc citations below are all under
`node_modules/next/dist/docs/01-app/...` (Next.js 16.3.5, the version
actually installed in this repo — see `AGENTS.md`). This project does not
set `cacheComponents` in `next.config.ts`, so it uses the "previous model"
of caching (`revalidate`/`dynamic` route segment config), not `use cache`/
`cacheLife`.

## Cached, revalidated every 60 seconds

- `/` (home) — `src/app/page.tsx`
- `/eras/[slug]` (wing pages) — `src/app/eras/[slug]/page.tsx`
- `/sitemap.xml` — `src/app/sitemap.ts`

All three now export `revalidate = 60` instead of `dynamic = "force-dynamic"`.
None of them read a Request-time API (`searchParams`, `cookies()`,
`headers()`), so Next can prerender them and serve the cached copy for up to
60 seconds before regenerating in the background — see
`02-guides/incremental-static-regeneration.md` ("Time-based revalidation")
and `02-guides/caching-without-cache-components.md` ("Route segment config
`revalidate`").

The wing route is a dynamic segment (`[slug]`). To make a `[slug]` route
eligible for ISR at all (rather than always being dynamically rendered), it
must export `generateStaticParams`, even if it returns an empty array — see
`03-api-reference/04-functions/generate-static-params.md` ("All paths at
runtime": *"You must always return an array from `generateStaticParams`,
even if it's empty. Otherwise, the route will be dynamically rendered."*).
`src/app/eras/[slug]/page.tsx` now does this. `dynamicParams` is left at its
default (`true`), so a slug that isn't cached yet is rendered on its first
visit and then cached; an unknown slug still falls through to `notFound()`
in the page body, giving a real HTTP 404 — see
`03-api-reference/03-file-conventions/02-route-segment-config/dynamicParams.md`.

`/sitemap.xml` is a special Route Handler that "is cached by default unless
it uses a Request-time API or dynamic config option" — see
`03-api-reference/03-file-conventions/01-metadata/sitemap.md`. It reads no
Request-time API, so the same `revalidate = 60` applies directly, no
`generateStaticParams` involved (it isn't a dynamic segment).

Cache-control header actually emitted for `/` and `/eras/[slug]` (verified
against this project's own `next start` output on port 3100, not guessed —
see `02-guides/cdn-caching.md`, "What Works Today" > "Cache-Control
headers"):

```
s-maxage=60, stale-while-revalidate=<expire - 60>
```

The default `expire` is one year, so `stale-while-revalidate` is a large
number by default; that's expected and is what a CDN respecting `s-maxage`
needs to serve the cached copy at the edge for up to 60s and keep serving a
stale copy while a fresh one regenerates in the background.

`/sitemap.xml` is different: it doesn't get that header shape at all. Every
metadata-file-convention route (`sitemap.ts`, `robots.ts`, etc.) is wrapped
by Next's build-time metadata route loader, which always sets
`Cache-Control: public, max-age=0, must-revalidate` on the response,
regardless of the userland `revalidate` export — see
`node_modules/next/dist/build/webpack/loaders/next-metadata-route-loader.js`
(`CACHE_HEADERS.REVALIDATE`, used by `getSingleSitemapRouteCode`). This was
found by reading that source after the `cdn-caching.md` "ISR pages" shape
didn't match what this build's own `next start` actually sent for
`/sitemap.xml` (confirmed with `curl -I` and in `tests/e2e/isr.spec.ts`) —
worth recording here since the general doc doesn't call out the exception.
The `revalidate = 60` export still does its job at the framework's own
full-route-cache layer: `next build`'s route table shows `/sitemap.xml` as
`○` with `Revalidate 1m`, meaning Next only re-runs `sitemap()` against
Sanity at most once a minute, it just doesn't advertise a `s-maxage` a CDN
could use to skip Next entirely.

## Stays dynamic — and why

- `/exhibits/[slug]` (exhibit pages) — `src/app/exhibits/[slug]/page.tsx`
- `/your-future` — `src/app/your-future/page.tsx`

Both pages read `searchParams` directly in their component body (exhibit:
`choice`, `trace`; your-future: `trace`) to render one visitor's chosen
outcome or printed ticket. `searchParams` is documented as a **Request-time
API**: *"Using it will opt the page into dynamic rendering at request
time"* — see `03-api-reference/03-file-conventions/page.md`
("`searchParams` (optional)") and `04-glossary.md` ("Request-time APIs").

This is unconditional: reading `searchParams` forces the *whole route* to
render dynamically on **every** visit, not only visits that actually supply
a query string. There is no partial-static/partial-dynamic middle ground
here — that would require Partial Prerendering, which in Next 16 only
exists under Cache Components (`cacheComponents: true` in
`next.config.ts`, plus `use cache` boundaries around the parts that should
be static). Enabling Cache Components is out of scope for this task: it is
not one of this task's allowed files, and adopting it safely would mean
restructuring these pages' JSX into cached/uncached boundaries, which this
task's packet explicitly forbids ("no JSX/design changes").

So both routes keep the plain, safe answer: no `revalidate` export, and no
`dynamic` export either (`dynamic` defaults to `'auto'`, and `searchParams`
usage forces the dynamic render on its own — the same practical outcome
`force-dynamic` produced, but now because of the actual reason instead of a
blanket override). Cache-control for both is the "dynamic page" shape:

```
private, no-cache, no-store, max-age=0, must-revalidate
```

This is deliberate and required by the task: **a chosen outcome
(`?choice=`) or a visitor's ticket trace (`?trace=`) must never be served
from a shared cache to a different visitor.** A `private, no-store`
response can't be cached by a shared CDN cache at all, which is the
strongest available guarantee of that given the constraints above.

Unknown exhibit slugs still 404 exactly as before (`notFound()` in the page
body, after `getExhibitBySlug` resolves to `null`) — that isn't affected by
the dynamic/ISR distinction, it's the same code path either way.

## Outage safety — never caching an empty/fallback museum

`src/content/sanity-repository.ts`'s read methods (`listEras`,
`listExhibits`, `getEraBySlug`, `getExhibitBySlug`, `getOutcomesByIds`)
already throw when the underlying Sanity fetch fails, rather than catching
the error and returning an empty list or `null`. No change was needed there
for T-015 — `src/content/sanity-repository.test.ts` now has explicit unit
tests locking in that "throw, don't swallow" contract for `listEras`,
`listExhibits`, and `getEraBySlug` (mutation-tested: a deliberate
`.catch(() => [])` swallow was temporarily added to `listExhibits` to
confirm the new test fails against it, then reverted).

That contract is what keeps a Sanity outage safe under ISR. Per
`02-guides/incremental-static-regeneration.md` ("Handling uncaught
exceptions"): *"If an error is thrown while attempting to revalidate data,
the last successfully generated data will continue to be served from the
cache. On the next subsequent request, Next.js will retry revalidating the
data."* So if Sanity is down during a background revalidation of `/`, a
wing page, or the sitemap, the previously cached (real) page keeps being
served for that route until Sanity recovers and a revalidation succeeds —
the museum is never replaced by an empty or fallback version just because
one revalidation attempt failed.

`src/app/sitemap.ts` used to catch a Sanity failure itself and fall back to
a single-URL sitemap, so the route (running under `force-dynamic`,
recomputed on every request) would never throw. Under ISR that fallback
would have been the bug this task exists to prevent: the `.catch()` would
have handed Next.js a *successful* render containing the fallback content,
which Next would then cache as the current sitemap for the next 60 seconds,
silently replacing the real one for every visitor and crawler until the
next revalidation. That catch/fallback has been removed; `sitemap()` now
lets `listEras()` throw straight through, so the same "keep serving the
last good page" behavior applies to the sitemap too.

The existing first-visit empty-state behavior for a **genuinely empty**
dataset (zero published wings, not a fetch failure) is unaffected —
`GalleryEmptyState` on `/` and the per-wing "This wing is still being hung"
copy still render exactly as before when Sanity successfully returns zero
results.

`generateMetadata` in `src/app/eras/[slug]/page.tsx` and
`src/app/exhibits/[slug]/page.tsx` still catches a lookup failure and falls
back to a generic `<title>` (pre-existing T-012d behavior, outside this
task's allowed files to change). This does not create the same caching
hazard: the page body's own (uncaught) fetch for the same slug still throws
on the same outage, so the render as a whole still throws and the route
still falls back to the last cached good page; only the `<title>` fallback
logic is unaffected either way.

## `useCdn: true` and worst-case staleness

`src/content/sanity-repository.ts` keeps `useCdn: true` unchanged, as
required. Worst-case delay from publishing new content in Sanity to it
being visible to a visitor is therefore the sum of two independent delays:

- The Sanity CDN's own propagation delay for `useCdn: true` reads (Sanity
  documents this as "up to 60 seconds" in their own API docs; not a Next.js
  concern and not reduced by this task).
- This app's own ISR window: up to 60 seconds before the next visit
  triggers a background revalidation, per `revalidate = 60` above.

So worst case, a newly published wing or exhibit can take **up to roughly
two minutes** (CDN propagation + this app's revalidation window) to appear
on `/`, its wing page, or the sitemap. This is an acceptable trade for
serving cached, edge-cacheable pages instead of rendering every request
live against Sanity.
