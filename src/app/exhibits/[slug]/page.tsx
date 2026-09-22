import Link from "next/link";
import { notFound } from "next/navigation";
import { sanityExhibitRepository } from "@/content/sanity-repository";
import { loadPlateMarkup } from "@/content/plate-markup";
import { formatConsequenceTag, nextStep } from "@/domain/outcome-chain";
import { parseTrace } from "@/domain/ticket";
import { resolveLinkedOutcome } from "@/domain/visitor-trace";
import { Doorway } from "@/components/Doorway";
import { Plaque } from "@/components/Plaque";
import { Vitrine } from "@/components/Vitrine";
import { OutcomeProjection } from "@/components/OutcomeProjection";

type ExhibitPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    choice?: string | string[];
    trace?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

/**
 * Parses the incoming `?trace=`, dropping it silently if malformed — a
 * corrupted trace shouldn't break the exhibit it arrived at.
 */
function parseIncomingTrace(
  incomingTrace: string | string[] | undefined,
): string[] {
  const parsed = parseTrace(incomingTrace);
  return "ids" in parsed ? parsed.ids : [];
}

/**
 * Appends a newly resolved outcome's id to the incoming trace, reusing
 * `parseTrace`'s own dedupe/cap rules by round-tripping the combined string
 * through it.
 */
function appendOutcomeToTrace(
  incomingIds: string[],
  outcomeId: string | undefined,
): string[] {
  if (!outcomeId) {
    return incomingIds;
  }

  const combined = parseTrace([...incomingIds, outcomeId].join(","));
  return "ids" in combined ? combined.ids : incomingIds;
}

export default async function ExhibitPage({
  params,
  searchParams,
}: ExhibitPageProps) {
  const { slug } = await params;
  const { choice, trace } = await searchParams;
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
  const incomingTraceIds = parseIncomingTrace(trace);
  const incomingTraceParam =
    incomingTraceIds.length > 0 ? incomingTraceIds.join(",") : undefined;
  const traceIds = appendOutcomeToTrace(incomingTraceIds, outcome?.id);
  const traceParam = traceIds.length > 0 ? traceIds.join(",") : undefined;

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
                  href={`/exhibits/${exhibit.slug}?choice=${artifactChoice.id}${incomingTraceParam ? `&trace=${incomingTraceParam}` : ""}`}
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
                  href={`/exhibits/${onwardStep.slug}${traceParam ? `?trace=${traceParam}` : ""}`}
                >
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full bg-accent shadow-[0_0_6px_1px_var(--accent)] transition-shadow duration-300 motion-reduce:transition-none group-hover:shadow-[0_0_14px_4px_var(--accent)]"
                  />
                  Continue to <span aria-hidden>→</span> {onwardStep.title}
                </Link>
              ) : null}

              <Link
                aria-label="Print your ticket for this trace"
                className="group inline-flex w-fit items-center gap-2 font-mono text-sm uppercase tracking-[0.2em] text-brass-dim motion-safe:transition hover:text-accent"
                href={`/your-future${traceParam ? `?trace=${traceParam}` : ""}`}
              >
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full bg-brass-dim transition-colors duration-300 motion-reduce:transition-none group-hover:bg-accent"
                />
                Print your ticket <span aria-hidden>→</span>
              </Link>
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
