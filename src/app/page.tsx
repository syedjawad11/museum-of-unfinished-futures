import Link from "next/link";
import type { CSSProperties } from "react";
import { sanityExhibitRepository } from "@/content/sanity-repository";
import { loadPlateMarkup } from "@/content/plate-markup";
import { wingSubtitle } from "@/domain/wings";
import { GalleryEmptyState } from "./gallery-empty-state";
import { Plaque } from "@/components/Plaque";
import { Vitrine } from "@/components/Vitrine";
import { WingMap } from "@/components/WingMap";

export const dynamic = "force-dynamic";

type AccentStyle = CSSProperties & { "--accent"?: string };

const HEX_ACCENT_PATTERN = /^#[0-9a-fA-F]{6}$/;

export default async function Home() {
  const wings = await sanityExhibitRepository.listEras();
  const wingsWithPlates = await Promise.all(
    wings.map(async (wing) => ({
      wing,
      plateMarkups: await Promise.all(
        wing.exhibits.map((exhibit) =>
          loadPlateMarkup({ slug: exhibit.slug, imageUrl: exhibit.image?.url }),
        ),
      ),
    })),
  );

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

      <div className="flex flex-col gap-14" id="wings">
        {wingsWithPlates.length > 0 ? (
          <>
            <WingMap wings={wingsWithPlates.map(({ wing }) => wing)} />

            {wingsWithPlates.map(({ wing, plateMarkups }, wingIndex) => {
              const style: AccentStyle | undefined =
                wing.accentColor && HEX_ACCENT_PATTERN.test(wing.accentColor)
                  ? { "--accent": wing.accentColor }
                  : undefined;

              return (
                <section
                  aria-labelledby={`wing-${wing.slug}-title`}
                  key={wing.slug}
                  style={style}
                >
                  <div className="border-l-4 border-accent/60 pl-6 sm:pl-8">
                    <p className="font-mono text-xs uppercase tracking-[0.24em] text-brass">
                      {wingSubtitle(wingIndex + 1, wing.exhibits.length)}
                    </p>
                    <h2
                      className="mt-2 font-display text-3xl text-accent sm:text-4xl"
                      id={`wing-${wing.slug}-title`}
                    >
                      {wing.title}
                    </h2>
                    <p className="mt-3 max-w-2xl leading-7 text-ink-muted">
                      {wing.summary}
                    </p>
                    <Link
                      className="mt-4 inline-block font-mono text-sm uppercase tracking-[0.18em] text-brass motion-safe:transition hover:text-accent"
                      href={`/eras/${wing.slug}`}
                    >
                      Enter this wing →
                    </Link>
                  </div>

                  {wing.exhibits.length > 0 ? (
                    <div className="mt-8 grid gap-8 sm:grid-cols-2">
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
                              as="h3"
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
                    <p className="mt-8 font-mono text-sm uppercase tracking-[0.18em] text-ink-muted">
                      This wing is still being hung.
                    </p>
                  )}
                </section>
              );
            })}
          </>
        ) : (
          <GalleryEmptyState />
        )}
      </div>
    </div>
  );
}
