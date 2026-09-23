import type { Metadata } from "next";
import { sanityExhibitRepository } from "@/content/sanity-repository";
import ticketLines from "@/content/ticket-lines.json";
import { composeTicket, parseTrace } from "@/domain/ticket";
import { Doorway } from "@/components/Doorway";
import { Ticket } from "@/components/Ticket";

export const dynamic = "force-dynamic";

type YourFuturePageProps = {
  searchParams: Promise<{ trace?: string | string[] }>;
};

const SITE_TITLE = "Museum of Unfinished Futures";
const NO_TRACE_DESCRIPTION =
  "No ticket has been printed yet. Walk the museum's wings and choices to compose your unfinished future.";
const UNREADABLE_DESCRIPTION =
  "This ticket could not be read. Walk the museum again to print a fresh one.";

export async function generateMetadata({
  searchParams,
}: YourFuturePageProps): Promise<Metadata> {
  const { trace } = await searchParams;
  const parsed = parseTrace(trace);

  // The root layout now applies a "%s — Museum of Unfinished Futures" title
  // template (T-012d), so `title` below is the short, page-specific part —
  // the template supplies the suffix for the <title> tag. openGraph/twitter
  // titles aren't templated, so those are still built as full strings.
  if ("error" in parsed) {
    return {
      title: "Ticket unreadable",
      description: UNREADABLE_DESCRIPTION,
    };
  }

  if (parsed.ids.length === 0) {
    return {
      title: "Print your ticket",
      description: NO_TRACE_DESCRIPTION,
    };
  }

  const outcomes = await sanityExhibitRepository.getOutcomesByIds(parsed.ids);
  const ticket = composeTicket({
    traceIds: parsed.ids,
    outcomes,
    ticketLines,
  });

  const shortTitle = "Your Unfinished Future";
  const fullTitle = `${shortTitle} — ${SITE_TITLE}`;
  const description = ticket.summary;

  return {
    title: shortTitle,
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

/** Small stable (non-cryptographic) hash, used only for cosmetic accession numbering. */
function accessionNumberFor(ids: string[]): string {
  const seed = ids.join("|");
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  const value = (hash >>> 0) % 1_000_000;
  return value.toString().padStart(6, "0");
}

function NoTraceYet() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 px-6 py-24 sm:px-10">
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-brass">
        No ticket yet
      </p>
      <h1 className="font-display text-4xl text-spotlight sm:text-5xl">
        You have not walked far enough to print one.
      </h1>
      <p className="max-w-xl text-lg leading-8 text-ink-muted">
        Every ticket is composed from the exhibits you actually reach. Start
        in the hall, follow a few consequences, and a ticket will be waiting
        for you here, with your trace attached to the link.
      </p>
      <Doorway href="/" label="Enter the museum" />
    </div>
  );
}

function UnreadableTicket() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 px-6 py-24 sm:px-10">
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-brass">
        Ticket illegible
      </p>
      <h1 className="font-display text-4xl text-spotlight sm:text-5xl">
        This ticket could not be read.
      </h1>
      <p className="max-w-xl text-lg leading-8 text-ink-muted">
        The trace printed on it does not match anything this museum issued.
        Walk the halls again and a new ticket will compose itself as you go.
      </p>
      <Doorway href="/" label="Back to the hall" />
    </div>
  );
}

export default async function YourFuturePage({
  searchParams,
}: YourFuturePageProps) {
  const { trace } = await searchParams;
  const parsed = parseTrace(trace);

  if ("error" in parsed) {
    return <UnreadableTicket />;
  }

  if (parsed.ids.length === 0) {
    return <NoTraceYet />;
  }

  const outcomes = await sanityExhibitRepository.getOutcomesByIds(parsed.ids);
  const ticket = composeTicket({
    traceIds: parsed.ids,
    outcomes,
    ticketLines,
  });
  const incompleteCount = parsed.ids.length - outcomes.length;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10 sm:px-10">
      <Doorway href="/" label="Back to the hall" />
      <Ticket
        accessionNumber={accessionNumberFor(parsed.ids)}
        incompleteCount={incompleteCount > 0 ? incompleteCount : undefined}
        ticket={ticket}
        traceIds={parsed.ids}
        unresolved={outcomes.length === 0}
      />
    </div>
  );
}
