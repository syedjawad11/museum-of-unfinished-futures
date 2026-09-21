import Link from "next/link";
import { sanityExhibitRepository } from "@/content/sanity-repository";
import { GalleryEmptyState } from "./gallery-empty-state";
import { Plaque } from "@/components/Plaque";
import { Vitrine } from "@/components/Vitrine";

export const dynamic = "force-dynamic";

export default async function Home() {
  const exhibits = await sanityExhibitRepository.listExhibits();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-14 sm:px-10 lg:px-12">
      <header className="max-w-3xl">
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-brass">
          After hours · self-guided
        </p>
        <h1 className="mt-4 font-display text-5xl text-spotlight sm:text-6xl">
          Museum of Unfinished Futures
        </h1>
        <p className="mt-5 text-lg leading-8 text-ink">
          Wander the wings after closing time. Each case holds a blueprint of
          an invention from a future that never arrived — choose a path
          through it to see where it leads.
        </p>
      </header>

      <div id="wings">
        {exhibits.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2">
            {exhibits.map((exhibit) => (
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
          <GalleryEmptyState />
        )}
      </div>
    </div>
  );
}
