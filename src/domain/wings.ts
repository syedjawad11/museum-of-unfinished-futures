/**
 * Pure helpers for the wings/wing-map UI. No React, no I/O — the era data
 * itself (title, slug, summary, accentColor, exhibits) comes from
 * `sanityExhibitRepository.listEras()` / `.getEraBySlug()`.
 */

const ROMAN_NUMERAL_TABLE: ReadonlyArray<readonly [number, string]> = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

/** Roman numeral for a 1-based wing position ("WING I", "WING II", ...). */
export function romanNumeralForPosition(position: number): string {
  if (!Number.isInteger(position) || position < 1) {
    throw new RangeError(
      `position must be a positive integer, received ${position}`,
    );
  }

  let remaining = position;
  let numeral = "";

  for (const [value, symbol] of ROMAN_NUMERAL_TABLE) {
    while (remaining >= value) {
      numeral += symbol;
      remaining -= value;
    }
  }

  return numeral;
}

/** "1 CASE" / "3 CASES" / "0 CASES" — correct singular/plural, no assumption
 * that a wing has exactly one exhibit. */
export function caseCountLabel(exhibitCount: number): string {
  return `${exhibitCount} CASE${exhibitCount === 1 ? "" : "S"}`;
}

/** The wall-placard mono line, e.g. "WING I · 1 CASE". */
export function wingSubtitle(position: number, exhibitCount: number): string {
  return `WING ${romanNumeralForPosition(position)} · ${caseCountLabel(exhibitCount)}`;
}

/** Whether `wingSlug` is the wing currently being viewed (WingMap's
 * optional `currentSlug` prop). */
export function isWingCurrent(
  wingSlug: string,
  currentSlug: string | null | undefined,
): boolean {
  return Boolean(currentSlug) && wingSlug === currentSlug;
}

/**
 * Greedy word-wrap for a wing's floor-plan room label (`WingMap.tsx`). Pure
 * presentation logic — no React — so it is unit-testable on its own:
 * - normalises internal/leading/trailing whitespace before wrapping;
 * - hard-truncates (with a trailing ellipsis) a single word that alone is
 *   longer than one line, so it never renders unbounded past the room;
 * - if the wrapped title still needs more than `maxLines` lines, the last
 *   visible line always ends with an ellipsis — words are never silently
 *   dropped without a visible sign that content was omitted.
 * The full, untruncated title is always available separately as the
 * room link's `aria-label`, so a truncated visible label loses nothing for
 * assistive tech.
 */
export function wrapWingLabel(
  rawTitle: string,
  maxCharsPerLine = 15,
  maxLines = 3,
): string[] {
  const words = rawTitle.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return [];
  }

  const safeMax = Math.max(2, maxCharsPerLine);

  const normalizedWords = words.map((word) =>
    word.length > safeMax ? `${word.slice(0, safeMax - 1)}…` : word,
  );

  const allLines: string[] = [];
  let current = "";

  for (const word of normalizedWords) {
    const candidate = current ? `${current} ${word}` : word;

    if (current && candidate.length > safeMax) {
      allLines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) {
    allLines.push(current);
  }

  if (allLines.length <= maxLines) {
    return allLines;
  }

  const visibleLines = allLines.slice(0, maxLines);
  const lastIndex = visibleLines.length - 1;
  const lastLine = visibleLines[lastIndex];

  visibleLines[lastIndex] = lastLine.endsWith("…")
    ? lastLine
    : lastLine.length > safeMax - 1
      ? `${lastLine.slice(0, safeMax - 1)}…`
      : `${lastLine}…`;

  return visibleLines;
}
