import { readFile } from "node:fs/promises";
import path from "node:path";

export type PlateSource = { slug: string; imageUrl?: string | null };
export type PlateMarkup = {
  markup: string;
  source: "sanity" | "local";
  bytes: number;
};
export type PlateLoaderDeps = {
  fetchText?: (url: string) => Promise<{
    ok: boolean;
    status: number;
    text: () => Promise<string>;
  }>;
  readLocalFile?: (absolutePath: string) => Promise<string>;
  localDir?: string;
};

const MAX_PLATE_BYTES = 61_440;
const MAX_MARKUP_OPENINGS = 400;
const LOCAL_SLUG_PATTERN = /^[a-z0-9-]{2,64}$/;

// These public Sanity identifiers are part of the content CDN URL contract for
// this project; no content constants currently export them.
const SANITY_PROJECT_ID = "wa27n68e";
const SANITY_DATASET = "production_1";
const SANITY_PLATE_PATH_PREFIX = `/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/`;

const forbiddenElementPatterns = [
  /<script\b/i,
  /<foreignobject\b/i,
  /<iframe\b/i,
  /<embed\b/i,
  /<object\b/i,
  /<image\b/i,
  /<animate\b/i,
  /<set\b/i,
  /<animateTransform\b/i,
  /<animateMotion\b/i,
];

export function sanitizePlateMarkup(
  raw: string,
): { ok: true; markup: string } | { ok: false; reason: string } {
  const byteLength = Buffer.byteLength(raw, "utf8");

  if (byteLength > MAX_PLATE_BYTES) {
    return { ok: false, reason: "plate markup is too large" };
  }

  const openingCount = (raw.match(/</g) ?? []).length;

  if (openingCount > MAX_MARKUP_OPENINGS) {
    return { ok: false, reason: "plate markup has too many elements" };
  }

  // This is a denylist with strict size/count caps, not a general-purpose SVG
  // sanitizer. That is acceptable here because plates are authored in this repo
  // or uploaded by the curator to the museum's own Sanity project; this check is
  // defense in depth before inlining trusted plate assets.
  const markup = raw
    .replace(/^\uFEFF/, "")
    .replace(/^\s*<\?xml\b[\s\S]*?\?>/i, "")
    .replace(/^\s*<!doctype\b[\s\S]*?>/i, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();

  if (!markup.startsWith("<svg") || !markup.endsWith("</svg>")) {
    return { ok: false, reason: "plate must be an svg document" };
  }

  const rootTag = markup.match(/^<svg\b[^>]*>/i)?.[0];

  if (!rootTag?.includes('viewBox="0 0 800 600"')) {
    return { ok: false, reason: "plate must use the standard viewBox" };
  }

  if (!/\brole\s*=\s*["']img["']/i.test(rootTag)) {
    return { ok: false, reason: "plate must have role img" };
  }

  if (!/<title\b[^>]*>[\s\S]*?<\/title>/i.test(markup)) {
    return { ok: false, reason: "plate must include a title" };
  }

  for (const pattern of forbiddenElementPatterns) {
    if (pattern.test(markup)) {
      return { ok: false, reason: "plate contains forbidden svg elements" };
    }
  }

  if (/\son[a-z]+\s*=/i.test(markup)) {
    return { ok: false, reason: "plate contains event handler attributes" };
  }

  if (/\bstyle\s*=\s*[^"'\s>]/i.test(markup)) {
    return { ok: false, reason: "plate contains unquoted style attributes" };
  }

  if (/\b(?:java)?script\s*:/i.test(markup)) {
    return { ok: false, reason: "plate contains script URLs" };
  }

  if (
    /\b(?:href|src)\s*=\s*["']?\s*data\s*:/i.test(markup) ||
    /url\s*\(\s*["']?\s*data\s*:/i.test(markup)
  ) {
    return { ok: false, reason: "plate contains data URLs" };
  }

  const cssFragments = [
    ...collectAttributeValues(markup, "style"),
    ...collectStyleBlockBodies(markup),
  ];

  if (cssFragments.some(hasExternalStyleReference)) {
    return { ok: false, reason: "plate contains external style references" };
  }

  if (hasUnsafeHref(markup)) {
    return { ok: false, reason: "plate contains unsafe href attributes" };
  }

  if (
    hasHexColour(markup) ||
    cssFragments.some(hasCssHexColour) ||
    /\b(?:rgb|hsl)a?\s*\(/i.test(markup)
  ) {
    return { ok: false, reason: "plate contains hard-coded paint colours" };
  }

  return { ok: true, markup };
}

export async function loadPlateMarkup(
  source: PlateSource,
  deps: PlateLoaderDeps = {},
): Promise<PlateMarkup | null> {
  const fetchText = deps.fetchText ?? fetch;
  const readLocalFile =
    deps.readLocalFile ??
    ((absolutePath: string) => readFile(absolutePath, "utf8"));
  const localDir =
    deps.localDir ?? path.join(process.cwd(), "public", "illustrations");

  const imageUrl = source.imageUrl?.trim();

  if (imageUrl && isAllowedPlateUrl(imageUrl)) {
    try {
      const response = await fetchText(imageUrl);

      if (response.ok) {
        const raw = await response.text();
        const sanitized = sanitizePlateMarkup(raw);

        if (sanitized.ok) {
          return toPlateMarkup(sanitized.markup, "sanity");
        }
      }
    } catch {
      // Missing or invalid remote plates fall through to the local placeholder.
    }
  }

  if (!LOCAL_SLUG_PATTERN.test(source.slug)) {
    return null;
  }

  let rawLocalMarkup: string;

  try {
    rawLocalMarkup = await readLocalFile(path.join(localDir, `${source.slug}.svg`));
  } catch (error) {
    if (isErrnoException(error) && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }

  const sanitizedLocal = sanitizePlateMarkup(rawLocalMarkup);

  if (!sanitizedLocal.ok) {
    return null;
  }

  return toPlateMarkup(sanitizedLocal.markup, "local");
}

export function isAllowedPlateUrl(url: string): boolean {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  return (
    parsed.protocol === "https:" &&
    parsed.hostname === "cdn.sanity.io" &&
    parsed.pathname.startsWith(SANITY_PLATE_PATH_PREFIX) &&
    parsed.pathname.endsWith(".svg")
  );
}

function toPlateMarkup(
  markup: string,
  source: PlateMarkup["source"],
): PlateMarkup {
  return {
    markup,
    source,
    bytes: Buffer.byteLength(markup, "utf8"),
  };
}

function hasUnsafeHref(markup: string): boolean {
  const quotedHrefPattern = /\b(?:xlink:)?href\s*=\s*(["'])(.*?)\1/gi;
  let quotedMatch: RegExpExecArray | null;

  while ((quotedMatch = quotedHrefPattern.exec(markup)) !== null) {
    if (!quotedMatch[2].startsWith("#")) {
      return true;
    }
  }

  const unquotedHrefPattern = /\b(?:xlink:)?href\s*=\s*([^\s>"']+)/gi;
  let unquotedMatch: RegExpExecArray | null;

  while ((unquotedMatch = unquotedHrefPattern.exec(markup)) !== null) {
    if (!unquotedMatch[1].startsWith("#")) {
      return true;
    }
  }

  return false;
}

function hasHexColour(markup: string): boolean {
  return /\b(?:fill|stroke|color|stop-color|flood-color|lighting-color)\s*=\s*(["'])[^"']*#[0-9a-f]{3}(?:[0-9a-f]{3})?[^"']*\1/i.test(
    markup,
  );
}

function collectAttributeValues(markup: string, attributeName: string): string[] {
  const values: string[] = [];
  const attributePattern = new RegExp(
    `\\b${attributeName}\\s*=\\s*(["'])(.*?)\\1`,
    "gis",
  );
  let match: RegExpExecArray | null;

  while ((match = attributePattern.exec(markup)) !== null) {
    values.push(match[2]);
  }

  return values;
}

function collectStyleBlockBodies(markup: string): string[] {
  const bodies: string[] = [];
  const styleBlockPattern = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let match: RegExpExecArray | null;

  while ((match = styleBlockPattern.exec(markup)) !== null) {
    bodies.push(match[1]);
  }

  return bodies;
}

function hasExternalStyleReference(css: string): boolean {
  return /@import\b|url\s*\(|expression\s*\(|\bbehavior\s*:|-moz-binding\b/i.test(
    css,
  );
}

function hasCssHexColour(css: string): boolean {
  return /#[0-9a-f]{3,8}\b/i.test(css);
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
