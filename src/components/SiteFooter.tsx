import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-brass-dim/50 px-6 py-8 sm:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 font-mono text-xs uppercase tracking-[0.18em] text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-6">
          <Link className="motion-safe:transition hover:text-accent" href="/about">
            How this museum was built
          </Link>
          <a
            className="motion-safe:transition hover:text-accent"
            href="https://github.com/syedjawad11/museum-of-unfinished-futures"
            rel="noopener noreferrer"
            target="_blank"
          >
            Source on GitHub
          </a>
        </div>
        <p>Sanity project wa27n68e · dataset production_1</p>
      </div>
    </footer>
  );
}
