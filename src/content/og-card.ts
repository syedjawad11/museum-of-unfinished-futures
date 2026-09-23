/**
 * Pure helpers shared by the metadata and social-image code for exhibits,
 * wings and the site root (T-012d). No Sanity access, no React — just
 * string shaping, so it's cheap to unit test on its own.
 */

export const SITE_TITLE = "Museum of Unfinished Futures";

const MAX_DESCRIPTION_LENGTH = 160;
const ELLIPSIS = "…";

/**
 * Trims text to at most `maxLength` characters, breaking on a word
 * boundary rather than mid-word, and marking the cut with an ellipsis.
 * Text already within the limit is returned unchanged (trimmed of
 * surrounding whitespace only).
 */
export function trimDescription(
  text: string,
  maxLength: number = MAX_DESCRIPTION_LENGTH,
): string {
  const trimmed = text.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  const budget = Math.max(0, maxLength - ELLIPSIS.length);
  const cut = trimmed.slice(0, budget);
  const lastSpace = cut.lastIndexOf(" ");
  const atWordBoundary = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;

  return `${atWordBoundary.trimEnd()}${ELLIPSIS}`;
}

/** Builds the "<page title> — Museum of Unfinished Futures" string used
 * anywhere a full title is needed outside the layout's title template
 * (e.g. openGraph/twitter fields, which are not templated). */
export function buildFullTitle(pageTitle: string): string {
  return `${pageTitle} — ${SITE_TITLE}`;
}
