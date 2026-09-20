import Link from "next/link";
import { sanityExhibitRepository } from "@/content/sanity-repository";
import { GalleryEmptyState } from "./gallery-empty-state";

export const dynamic = "force-dynamic";

export default async function Home() {
  const exhibits = await sanityExhibitRepository.listExhibits();

  return (
    <main className="min-h-screen bg-[#f7f3eb] text-[#1f2933]">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-12 sm:px-10 lg:px-12">
        <header className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-[#6b5d46]">
            Live Sanity gallery
          </p>
          <h1 className="text-4xl font-semibold tracking-normal text-[#172026] sm:text-6xl">
            Museum of Unfinished Futures
          </h1>
          <p className="mt-5 text-lg leading-8 text-[#44505a]">
            Explore published artifacts from futures that never happened, choose
            how to approach them, and reveal their linked outcomes.
          </p>
        </header>

        {exhibits.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {exhibits.map((exhibit) => (
              <Link
                className="group rounded-lg border border-[#d7cec0] bg-[#fffaf1] p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#8f6f3d] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#5b431f]"
                href={`/exhibits/${exhibit.slug}`}
                key={exhibit.slug}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7f6843]">
                  {exhibit.accessionNote}
                </p>
                <h2 className="mt-4 text-2xl font-semibold text-[#172026]">
                  {exhibit.title}
                </h2>
                <p className="mt-4 leading-7 text-[#52616b]">
                  {exhibit.summary}
                </p>
                <span className="mt-6 inline-block font-semibold text-[#5b431f] group-hover:underline">
                  Enter exhibit
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <GalleryEmptyState />
        )}
      </section>
    </main>
  );
}
