import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { sanityExhibitRepository } from "@/content/sanity-repository";
import { loadPlateMarkup } from "@/content/plate-markup";
import { buildFullTitle, trimDescription } from "@/content/og-card";
import { caseCountLabel } from "@/domain/wings";
import { Doorway } from "@/components/Doorway";
import { Plaque } from "@/components/Plaque";
import { Vitrine } from "@/components/Vitrine";

type WingPageProps = {
  params: Promise<{ slug: string }>;
};

// ISR (T-015): wing pages read only `params` (not searchParams/cookies/
// headers), so they can be cached per slug and revalidated every 60s — see
// docs/isr.md. `generateStaticParams` must return an array (an empty one is
// fine here) for a `[slug]` route to be eligible for ISR at all; otherwise
// it is always dynamically rendered — see
// node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-static-params.md
// ("All paths at runtime"). `dynamicParams` stays at its default (`true`),
// so a slug not yet cached is rendered on first visit and an unknown slug
// still reaches `notFound()` below, giving a real 404 — see
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/dynamicParams.md.
export const revalidate = 60;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [];
}

const NOT_FOUND_TITLE = "Wing not found";

/**
 * Per-wing title/description/social metadata, mirroring the exhibit page's
 * generateMetadata (T-012d). Unknown slug or a Sanity failure falls back to
 * generic metadata that never throws; the page itself 404s below.
 */
export async function generateMetadata({
  params,
}: WingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const wing = await sanityExhibitRepository
    .getEraBySlug(slug)
    .catch(() => null);

  if (!wing) {
    return { title: NOT_FOUND_TITLE };
  }

  const description = trimDescription(wing.summary);
  const fullTitle = buildFullTitle(wing.title);

  return {
    title: wing.title,
    description,
    openGraph: {
      title: fullTitle,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}

type AccentStyle = CSSProperties & { "--accent"?: string };

const HEX_ACCENT_PATTERN = /^#[0-9a-fA-F]{6}$/;

export default async function WingPage({ params }: WingPageProps) {
  const { slug } = await params;
  const wing = await sanityExhibitRepository.getEraBySlug(slug);

  if (!wing) {
    notFound();
  }

  const plateMarkups = await Promise.all(
    wing.exhibits.map((exhibit) =>
      loadPlateMarkup({ slug: exhibit.slug, imageUrl: exhibit.image?.url }),
    ),
  );

  const style: AccentStyle | undefined =
    wing.accentColor && HEX_ACCENT_PATTERN.test(wing.accentColor)
      ? { "--accent": wing.accentColor }
      : undefined;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10">
      <Doorway href="/" label="Back to the hall" />

      <header className="max-w-3xl border-l-4 border-accent/60 pl-6 sm:pl-8" style={style}>
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-brass">
          Wing · {caseCountLabel(wing.exhibits.length)}
        </p>
        <h1 className="mt-2 font-display text-4xl text-spotlight sm:text-5xl">
          {wing.title}
        </h1>
        <p className="mt-4 text-lg leading-8 text-ink-muted">{wing.summary}</p>
      </header>

      <section aria-label={`${wing.title} exhibits`} style={style}>
        {wing.exhibits.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2">
            {wing.exhibits.map((exhibit, exhibitIndex) => (
              <Link
                className="group rounded-lg"
                href={`/exhibits/${exhibit.slug}`}
                key={exhibit.slug}
              >
                <div className="flex h-full flex-col gap-4">
                  <Vitrine
                    accent={exhibit.era.accentColor}
                    description={exhibit.visualDescription}
                    label={exhibit.artifactLabel}
                    plateMarkup={plateMarkups[exhibitIndex]}
                    title={exhibit.title}
                  />
                  <Plaque
                    accessionNote={exhibit.accessionNote}
                    summary={exhibit.summary}
                    title={exhibit.title}
                  >
                    <span className="font-mono text-sm uppercase tracking-[0.18em] text-brass motion-safe:transition group-hover:text-accent">
                      Enter exhibit →
                    </span>
                  </Plaque>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-ink-muted">
            This wing is still being hung.
          </p>
        )}
      </section>
    </div>
  );
}
