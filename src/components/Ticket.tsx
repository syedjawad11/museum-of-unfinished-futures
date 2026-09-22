import type { ComposedTicket } from "@/domain/ticket";

type TicketProps = {
  accessionNumber: string;
  traceIds: string[];
  ticket: ComposedTicket;
  /** Number of ids in the trace that did not resolve to a published outcome. */
  incompleteCount?: number;
  /** True when none of the trace ids resolved to a published outcome. */
  unresolved?: boolean;
};

/**
 * A printed museum ticket: perforated top and bottom edges (simulated with a
 * repeating radial-gradient punched through to the hall behind it), a
 * mono accession number, and the composed future as the body copy.
 */
export function Ticket({
  accessionNumber,
  traceIds,
  ticket,
  incompleteCount,
  unresolved,
}: TicketProps) {
  return (
    <section
      aria-label="Your printed ticket"
      className="relative mx-auto max-w-xl rounded-lg border border-brass/50 bg-floor/90 px-6 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-10"
    >
      <div
        aria-hidden
        className="-mx-6 h-4 bg-repeat-x [background-image:radial-gradient(circle_at_center,var(--hall)_3.5px,transparent_4px)] [background-position:0_center] [background-size:18px_18px] sm:-mx-10"
      />

      <div className="py-6 sm:py-8">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-brass">
          Museum of Unfinished Futures &middot; Accession No. {accessionNumber}
        </p>
        <h1 className="mt-4 font-display text-3xl text-spotlight sm:text-4xl">
          Your Unfinished Future
        </h1>

        <div className="mt-6 flex flex-col gap-4">
          {ticket.lines.map((line, index) => (
            <p
              key={`${index}-${line.slice(0, 12)}`}
              className={
                index === 0
                  ? "text-lg leading-7 text-ink"
                  : "leading-7 text-ink-muted"
              }
            >
              {line}
            </p>
          ))}
        </div>

        {unresolved ? (
          <p className="mt-6 rounded border border-brass-dim/50 bg-hall/60 px-4 py-3 font-mono text-xs uppercase tracking-[0.16em] text-brass-dim">
            None of the exhibits on this trace could be found. They may have
            been retired from the collection.
          </p>
        ) : incompleteCount ? (
          <p className="mt-6 rounded border border-brass-dim/50 bg-hall/60 px-4 py-3 font-mono text-xs uppercase tracking-[0.16em] text-brass-dim">
            {incompleteCount} stop{incompleteCount === 1 ? "" : "s"} on this
            trace did not survive to print.
          </p>
        ) : null}

        <p className="mt-8 break-all font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-muted">
          Trace &middot; {traceIds.join(" · ")}
        </p>
      </div>

      <div
        aria-hidden
        className="-mx-6 h-4 bg-repeat-x [background-image:radial-gradient(circle_at_center,var(--hall)_3.5px,transparent_4px)] [background-position:0_center] [background-size:18px_18px] sm:-mx-10"
      />
    </section>
  );
}
