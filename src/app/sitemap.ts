import type { MetadataRoute } from "next";
import { sanityExhibitRepository } from "@/content/sanity-repository";

const SITE_URL = "https://museum-of-unfinished-futures.netlify.app";

// ISR (T-015): `sitemap.ts` reads no Request-time API, so — like the home
// page — it is a cacheable route that is regenerated at most every 60s
// instead of on every request; see
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md
// ("sitemap.js is a special Route Handler that is cached by default unless
// it uses a Request-time API or dynamic config option"). New exhibits or
// wings published in Sanity appear in the sitemap within ~60s.
export const revalidate = 60;

// T-015: this used to catch a Sanity failure and fall back to a single-URL
// sitemap so the route would never throw under `force-dynamic` (recomputed,
// uncached, on every request). Under ISR that fallback would itself get
// cached as the "successfully generated" sitemap for the next 60s, wiping
// out the real one for every visitor and crawler until the next
// revalidation — exactly the outage behaviour this task must prevent (see
// docs/isr.md). So `listEras()` is left to throw here: Next.js then keeps
// serving the last successfully generated sitemap instead — see
// node_modules/next/dist/docs/01-app/02-guides/incremental-static-regeneration.md
// ("Handling uncaught exceptions").
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const wings = await sanityExhibitRepository.listEras();

  const wingUrls: MetadataRoute.Sitemap = wings.map((wing) => ({
    url: `${SITE_URL}/eras/${wing.slug}`,
  }));

  const exhibitUrls: MetadataRoute.Sitemap = wings.flatMap((wing) =>
    wing.exhibits.map((exhibit) => ({
      url: `${SITE_URL}/exhibits/${exhibit.slug}`,
    })),
  );

  return [
    { url: SITE_URL },
    ...wingUrls,
    ...exhibitUrls,
    { url: `${SITE_URL}/your-future` },
    // /about does not exist yet (a separate task will add it); it's listed
    // here so the sitemap doesn't need a second edit once it does.
    { url: `${SITE_URL}/about` },
  ];
}
