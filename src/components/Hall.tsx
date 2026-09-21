import type { ReactNode } from "react";

/**
 * Page wrapper that draws the dark hall: a receding floor grid, a soft
 * overhead light beam and a vignette toward the walls. Pure CSS — no
 * canvas or SVG needed for this static backdrop.
 */
export function Hall({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-full flex-col overflow-hidden bg-hall">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-x-0 bottom-0 h-[55vh] opacity-40"
          style={{ perspective: "500px" }}
        >
          <div
            className="h-full w-full origin-bottom bg-floor"
            style={{
              transform: "rotateX(62deg)",
              backgroundImage:
                "linear-gradient(var(--brass-dim) 1px, transparent 1px), linear-gradient(90deg, var(--brass-dim) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage:
                "linear-gradient(to top, black, transparent)",
              WebkitMaskImage:
                "linear-gradient(to top, black, transparent)",
            }}
          />
        </div>
        <div
          className="absolute left-1/2 top-[-10vh] h-[70vh] w-[120vw] -translate-x-1/2 opacity-[0.10]"
          style={{
            background:
              "radial-gradient(ellipse at top, var(--spotlight) 0%, transparent 62%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 35%, var(--hall) 100%)",
          }}
        />
      </div>
      <div className="relative z-0 flex min-h-full flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
