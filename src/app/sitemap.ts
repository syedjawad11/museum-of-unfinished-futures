import type { MetadataRoute } from "next";
import { sanityExhibitRepository } from "@/content/sanity-repository";

const SITE_URL = "https://museum-of-unfinished-futures.netlify.app";

// Without this, sitemap.xml is a statically-optimized route (see
// node_modules/next/dist/docs/.../metadata/sitemap.md) generated once at
// build time and cached — new exhibits or wings published after the build
// would silently stay off the sitemap. Every other Sanity-backed route in
// this app (home, exhibit, wing pages) already opts out of that caching the
// same way.
export const dynamic = "force-dynamic";

// A single-URL fallback (the home page only) keeps the sitemap valid — and
// keeps this route from ever throwing — if Sanity is unreachable, mirroring
// the "never a 500" rule the OG images follow.
const FALLBACK_ROUTES: MetadataRoute.Sitemap = [{ url: SITE_URL }];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const wings = await sanityExhibitRepository.listEras().catch(() => null);

  if (!wings) {
    return FALLBACK_ROUTES;
  }

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
