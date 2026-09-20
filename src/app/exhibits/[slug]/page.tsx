import Link from "next/link";
import { notFound } from "next/navigation";
import { sanityExhibitRepository } from "@/content/sanity-repository";
import { resolveLinkedOutcome } from "@/domain/visitor-trace";

type ExhibitPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ choice?: string | string[] }>;
};

export const dynamic = "force-dynamic";

export default async function ExhibitPage({
  params,
  searchParams,
}: ExhibitPageProps) {
  const { slug } = await params;
  const { choice } = await searchParams;
  const selectedChoice = Array.isArray(choice) ? choice[0] : choice;
  const exhibit = await sanityExhibitRepository.getExhibitBySlug(slug);

  if (!exhibit) {
    notFound();
  }

  const outcome = selectedChoice
    ? resolveLinkedOutcome(exhibit, selectedChoice)
    : undefined;

  return (
    <main className="min-h-screen bg-[#f7f3eb] px-6 py-10 text-[#1f2933] sm:px-10">
      <article className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-[#d7cec0] bg-[#fffaf1] p-6 sm:p-8">
          <Link className="font-semibold text-[#5b431f] hover:underline" href="/">
            Back to gallery
          </Link>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-[#7f6843]">
            {exhibit.accessionNote}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal sm:text-5xl">
            {exhibit.title}
          </h1>
          <p className="mt-6 text-lg leading-8 text-[#44505a]">
            {exhibit.summary}
          </p>
          <div className="mt-8 rounded-lg border border-[#b8aa95] bg-[#e7ded0] p-6">
            <div
              aria-label={exhibit.visualDescription}
              className="mx-auto flex aspect-[4/3] max-w-xl items-center justify-center rounded-md border-2 border-[#6d6357] bg-[#26323a] p-6 text-center text-[#f8ead1] shadow-inner"
              role="img"
            >
              <p className="text-xl leading-8">{exhibit.artifactLabel}</p>
            </div>
          </div>
        </section>

        <aside className="rounded-lg border border-[#d7cec0] bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">Choose a trace</h2>
          <div className="mt-5 grid gap-3">
            {exhibit.choices.map((artifactChoice) => (
              <Link
                aria-current={
                  selectedChoice === artifactChoice.id ? "true" : undefined
                }
                className="rounded-md border border-[#cbbda9] px-4 py-3 font-semibold text-[#243642] transition hover:border-[#8f6f3d] hover:bg-[#fff7e8] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#5b431f] aria-[current=true]:border-[#243642] aria-[current=true]:bg-[#eef1f2]"
                href={`/exhibits/${exhibit.slug}?choice=${artifactChoice.id}`}
                key={artifactChoice.id}
              >
                {artifactChoice.label}
              </Link>
            ))}
          </div>

          <section
            aria-live="polite"
            className="mt-8 rounded-lg border border-[#d7cec0] bg-[#f7f3eb] p-5"
          >
            {selectedChoice && outcome ? (
              <>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7f6843]">
                  Linked outcome
                </p>
                <h3 className="mt-3 text-2xl font-semibold">{outcome.title}</h3>
                <p className="mt-3 leading-7 text-[#44505a]">{outcome.body}</p>
              </>
            ) : selectedChoice ? (
              <>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7f6843]">
                  Choice unavailable
                </p>
                <h3 className="mt-3 text-2xl font-semibold">
                  No linked outcome exists.
                </h3>
                <p className="mt-3 leading-7 text-[#44505a]">
                  The selected trace is not part of this published exhibit.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7f6843]">
                  Awaiting choice
                </p>
                <p className="mt-3 leading-7 text-[#44505a]">
                  Select one of the two choices to reveal its linked outcome.
                </p>
              </>
            )}
          </section>
        </aside>
      </article>
    </main>
  );
}
