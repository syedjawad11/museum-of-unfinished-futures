import type { CSSProperties } from "react";
import type { PlateMarkup } from "@/content/plate-markup";
import { Plate } from "./Plate";

type VitrineProps = {
  title: string;
  plateMarkup?: PlateMarkup | null;
  label: string;
  description: string;
  accent?: string;
};

type AccentStyle = CSSProperties & { "--accent"?: string };

const HEX_ACCENT_PATTERN = /^#[0-9a-fA-F]{6}$/;

/**
 * A spotlit glass case. When `plateMarkup` is omitted (or the loader found
 * nothing) a placeholder "blueprint sheet" is drawn instead.
 */
export function Vitrine({
  title,
  plateMarkup,
  label,
  description,
  accent,
}: VitrineProps) {
  const style: AccentStyle | undefined =
    accent && HEX_ACCENT_PATTERN.test(accent)
      ? { "--accent": accent }
      : undefined;

  return (
    <div
      className="group relative self-start overflow-hidden rounded-lg border border-brass-dim/60 bg-floor/70 p-4 shadow-[0_0_45px_-18px_rgba(0,0,0,0.9)]"
      data-testid="vitrine-frame"
      style={style}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-10 h-32 opacity-25 transition-opacity duration-500 motion-reduce:transition-none group-hover:opacity-50 group-focus-within:opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at top, var(--accent) 0%, transparent 70%)",
        }}
      />
      <div
        aria-label={description}
        className="relative mx-auto aspect-[4/3] max-w-xl overflow-hidden rounded-md border border-glass/25 bg-hall/80"
        data-testid="vitrine-case"
        role="img"
      >
        <div className="absolute inset-0 flex items-center justify-center p-6">
          {plateMarkup ? (
            <Plate markup={plateMarkup.markup} source={plateMarkup.source} />
          ) : (
            <div className="relative flex h-full w-full flex-col justify-between rounded-sm border border-brass-dim/50 p-4">
              <div
                aria-hidden
                className="animate-plate-glow pointer-events-none absolute inset-0 rounded-sm bg-[length:24px_24px] opacity-90 [background-image:linear-gradient(var(--brass-dim)_1px,transparent_1px),linear-gradient(90deg,var(--brass-dim)_1px,transparent_1px)]"
              />
              <p className="relative font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
                PLATE PENDING · {title}
              </p>
              <p className="relative line-clamp-4 font-display text-lg italic text-spotlight">
                {label}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
