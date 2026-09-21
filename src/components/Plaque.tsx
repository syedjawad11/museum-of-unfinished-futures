import type { ReactNode } from "react";
import { AccessionTag } from "./AccessionTag";

type PlaqueProps = {
  accessionNote: string;
  title: string;
  summary: string;
  children?: ReactNode;
  /** Heading level for `title`. Defaults to "h2" (a wall label beside a
   * case). Pass "h1" when the plaque carries the page's primary heading. */
  as?: "h1" | "h2";
};

/**
 * A brass wall label: accession tag, title, summary, and an optional slot
 * (e.g. a choice list) below.
 */
export function Plaque({
  accessionNote,
  title,
  summary,
  children,
  as = "h2",
}: PlaqueProps) {
  const Heading = as;

  return (
    <section className="rounded-lg border border-brass/50 bg-floor/70 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-8">
      <AccessionTag accessionNote={accessionNote} />
      <Heading className="mt-4 font-display text-3xl text-spotlight sm:text-4xl">
        {title}
      </Heading>
      <p className="mt-4 leading-7 text-ink-muted">{summary}</p>
      {children ? <div className="mt-6 flex flex-col gap-6">{children}</div> : null}
    </section>
  );
}
