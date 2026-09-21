import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="relative z-10 border-b border-brass-dim/50 px-6 py-6 sm:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4">
        <Link
          className="font-display text-xl tracking-wide text-spotlight motion-safe:transition hover:text-accent"
          href="/"
        >
          Museum of Unfinished Futures
        </Link>
        <nav aria-label="Museum">
          <ul className="flex gap-6 font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
            <li>
              <Link className="motion-safe:transition hover:text-accent" href="/#wings">
                Wings
              </Link>
            </li>
            <li>
              <Link
                className="motion-safe:transition hover:text-accent"
                href="/your-future"
              >
                Your ticket
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
