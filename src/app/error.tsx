"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 px-6 py-24 sm:px-10">
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-brass">
        Wing fault
      </p>
      <h1 className="font-display text-4xl text-spotlight sm:text-5xl">
        The lights went out in this wing.
      </h1>
      <p className="max-w-xl text-lg leading-8 text-ink-muted">
        Something failed while rendering this case. You can try switching the
        lights back on.
      </p>
      <button
        className="rounded-md border border-brass px-4 py-3 font-mono text-sm uppercase tracking-[0.18em] text-brass motion-safe:transition hover:border-accent hover:text-accent"
        onClick={() => reset()}
        type="button"
      >
        Try again
      </button>
    </div>
  );
}
