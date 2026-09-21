import Link from "next/link";

/**
 * A lit exit link, styled as a doorway out of the current room.
 */
export function Doorway({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="group inline-flex items-center gap-2 font-mono text-sm uppercase tracking-[0.2em] text-brass motion-safe:transition hover:text-accent"
      href={href}
    >
      <span
        aria-hidden
        className="h-2 w-2 rounded-full bg-accent shadow-[0_0_6px_1px_var(--accent)] transition-shadow duration-300 motion-reduce:transition-none group-hover:shadow-[0_0_14px_4px_var(--accent)]"
      />
      {label}
    </Link>
  );
}
