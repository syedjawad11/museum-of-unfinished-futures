import Link from "next/link";
import { notFound } from "next/navigation";
import { sanityExhibitRepository } from "@/content/sanity-repository";
import { loadPlateMarkup } from "@/content/plate-markup";
import { formatConsequenceTag, nextStep } from "@/domain/outcome-chain";
import { resolveLinkedOutcome } from "@/domain/visitor-trace";
import { Doorway } from "@/components/Doorway";
import { Plaque } from "@/components/Plaque";
import { Vitrine } from "@/components/Vitrine";
import { OutcomeProjection } from "@/components/OutcomeProjection";

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

  const plateMarkup = await loadPlateMarkup({
    slug: exhibit.slug,
    imageUrl: exhibit.image?.url,
  });

  const outcome = selectedChoice
    ? resolveLinkedOutcome(exhibit, selectedChoice)
    : undefined;
  const onwardStep = outcome ? nextStep(outcome, exhibit.slug) : null;
  const consequenceTags =
    outcome?.consequenceTags.map(formatConsequenceTag).filter(Boolean) ?? [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10">
      <Doorway href="/" label="Back to the hall" />

      <article className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Vitrine
          accent={exhibit.era.accentColor}
          description={exhibit.visualDescription}
          label={exhibit.artifactLabel}
          plateMarkup={plateMarkup}
          title={exhibit.title}
        />

        <Plaque
          accessionNote={exhibit.accessionNote}
          as="h1"
          summary={exhibit.summary}
          title={exhibit.title}
        >
          <div className="grid gap-3">
            <h2 className="font-mono text-xs uppercase tracking-[0.24em] text-brass">
              Choose a trace
            </h2>
            {exhibit.choices.map((artifactChoice) => {
              const isSelected = selectedChoice === artifactChoice.id;

              return (
                <Link
                  aria-current={isSelected ? "true" : undefined}
                  className="rounded-md border border-brass-dim/60 px-4 py-3 font-mono text-sm uppercase tracking-[0.08em] text-ink motion-safe:transition hover:border-accent hover:text-accent aria-[current=true]:border-accent aria-[current=true]:bg-hall/60 aria-[current=true]:text-accent"
                  href={`/exhibits/${exhibit.slug}?choice=${artifactChoice.id}`}
                  key={artifactChoice.id}
                >
                  <span aria-hidden className="mr-2 inline-block w-3">
                    {isSelected ? "●" : ""}
                  </span>
                  {artifactChoice.label}
                  {isSelected ? (
                    <span aria-hidden className="ml-2 font-mono text-xs text-accent">
                      SELECTED
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>

          {selectedChoice && outcome ? (
            <div className="flex flex-col gap-5">
              {consequenceTags.length > 0 ? (
                <div className="flex flex-wrap gap-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-brass">
                  {consequenceTags.map((tag) => (
                    <span
                      className="rounded border border-brass/45 px-2 py-1"
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <OutcomeProjection
                body={outcome.body}
                state="outcome"
                title={outcome.title}
              />

              {onwardStep ? (
                <Link
                  aria-label={`Continue to ${onwardStep.title}`}
                  className="group inline-flex w-fit items-center gap-2 font-mono text-sm uppercase tracking-[0.2em] text-brass motion-safe:transition hover:text-accent"
                  href={`/exhibits/${onwardStep.slug}`}
                >
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full bg-accent shadow-[0_0_6px_1px_var(--accent)] transition-shadow duration-300 motion-reduce:transition-none group-hover:shadow-[0_0_14px_4px_var(--accent)]"
                  />
                  Continue to <span aria-hidden>→</span> {onwardStep.title}
                </Link>
              ) : null}
            </div>
          ) : selectedChoice ? (
            <OutcomeProjection state="unavailable" />
          ) : (
            <OutcomeProjection state="awaiting" />
          )}
        </Plaque>
      </article>
    </div>
  );
}
