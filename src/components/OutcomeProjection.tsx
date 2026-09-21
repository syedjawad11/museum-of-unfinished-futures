type OutcomeProjectionProps =
  | { state: "awaiting" }
  | { state: "outcome"; title: string; body: string }
  | { state: "unavailable" };

/**
 * The projected outcome panel. Three states: awaiting a choice, a resolved
 * outcome, or an unavailable/unpublished choice. Flickers in like a slide
 * projector when a result appears; static under prefers-reduced-motion.
 */
export function OutcomeProjection(props: OutcomeProjectionProps) {
  return (
    <section
      aria-live="polite"
      className="rounded-lg border border-brass-dim/60 bg-hall/70 p-5"
    >
      {props.state === "outcome" ? (
        <div className="animate-projector-flicker" key={`outcome-${props.title}`}>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">
            Linked outcome
          </p>
          <h3 className="mt-3 font-display text-2xl text-spotlight">
            {props.title}
          </h3>
          <p className="mt-3 leading-7 text-ink">{props.body}</p>
        </div>
      ) : props.state === "unavailable" ? (
        <div className="animate-projector-flicker" key="unavailable">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">
            Choice unavailable
          </p>
          <h3 className="mt-3 font-display text-2xl text-spotlight">
            No linked outcome exists.
          </h3>
          <p className="mt-3 leading-7 text-ink-muted">
            The selected trace is not part of this published exhibit.
          </p>
        </div>
      ) : (
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">
            Awaiting choice
          </p>
          <p className="mt-3 leading-7 text-ink-muted">
            Choose a trace above to reveal its linked outcome.
          </p>
        </div>
      )}
    </section>
  );
}
