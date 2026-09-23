import type { ArtifactOutcome } from "@/content/types";

const TRACE_ID_PATTERN = /^[a-z0-9-]{3,64}$/;
const MAX_TRACE_IDS = 12;
const MAX_TAG_PHRASES_PER_SENTENCE = 3;
const TAG_SENTENCE_STEMS = [
  "You leave here",
  "You also go out",
  "And you walk on",
] as const;
const MAX_RENDERED_TAG_PHRASES =
  TAG_SENTENCE_STEMS.length * MAX_TAG_PHRASES_PER_SENTENCE;
const EMPTY_TAG_SENTENCE =
  "Your trace is quiet; no consequence has settled yet.";
const EMPTY_SUMMARY = "Your unfinished future is still waiting for its first trace.";
const SUMMARY_LIMIT = 199;

export type TicketLinesContent = {
  openings: string[];
  eraLines: Record<string, string>;
  tagPhrases: Record<string, string>;
  closings: string[];
};

export type TraceParseError =
  | {
      code: "invalid_id";
      id: string;
    }
  | {
      code: "too_many_ids";
      limit: typeof MAX_TRACE_IDS;
    };

export type TraceParseResult =
  | {
      ids: string[];
    }
  | {
      error: TraceParseError;
    };

export type TicketOutcome = Pick<
  ArtifactOutcome,
  "id" | "title" | "body" | "consequenceTags" | "leadsTo"
> & {
  era?:
    | {
        slug?: string | null;
      }
    | string
    | null;
};

export type ComposeTicketInput = {
  traceIds: string[];
  outcomes: TicketOutcome[];
  ticketLines: TicketLinesContent;
};

export type ComposedTicket = {
  opening: string;
  tagSentence: string;
  eraLines: string[];
  closing: string;
  lines: string[];
  summary: string;
};

export function parseTrace(raw: string | string[] | undefined): TraceParseResult {
  const value = Array.isArray(raw) ? raw[0] : raw;

  if (!value) {
    return { ids: [] };
  }

  const ids: string[] = [];
  const seen = new Set<string>();

  for (const segment of value.split(",")) {
    const id = segment.trim();

    if (!id) {
      continue;
    }

    if (!TRACE_ID_PATTERN.test(id)) {
      return {
        error: {
          code: "invalid_id",
          id,
        },
      };
    }

    if (seen.has(id)) {
      continue;
    }

    if (ids.length === MAX_TRACE_IDS) {
      return {
        error: {
          code: "too_many_ids",
          limit: MAX_TRACE_IDS,
        },
      };
    }

    seen.add(id);
    ids.push(id);
  }

  return { ids };
}

export function composeTicket(input: ComposeTicketInput): ComposedTicket {
  const seed = input.traceIds.join("|");
  const opening = chooseDeterministic(input.ticketLines.openings, seed, "opening");
  const closing = chooseDeterministic(input.ticketLines.closings, seed, "closing");
  const tagPhrases = collectTagPhrases(input.outcomes, input.ticketLines);
  const tagSentence =
    tagPhrases.length > 0
      ? formatTagSentences(tagPhrases)
      : EMPTY_TAG_SENTENCE;
  const eraLines = collectEraLines(input.outcomes, input.ticketLines);
  const summary =
    tagPhrases.length > 0
      ? truncateSummary(
          `Your unfinished future: ${formatReadableList(tagPhrases)}.`,
        )
      : EMPTY_SUMMARY;
  const lines = [opening, tagSentence, ...eraLines, closing].filter(Boolean);

  return {
    opening,
    tagSentence,
    eraLines,
    closing,
    lines,
    summary,
  };
}

function collectTagPhrases(
  outcomes: TicketOutcome[],
  ticketLines: TicketLinesContent,
): string[] {
  const phrases: string[] = [];
  const seen = new Set<string>();

  for (const outcome of outcomes) {
    for (const tag of outcome.consequenceTags) {
      if (seen.has(tag)) {
        continue;
      }

      seen.add(tag);

      const phrase = ticketLines.tagPhrases[tag];

      if (phrase) {
        phrases.push(phrase);
      }
    }
  }

  return phrases;
}

function collectEraLines(
  outcomes: TicketOutcome[],
  ticketLines: TicketLinesContent,
): string[] {
  const lines: string[] = [];
  const seen = new Set<string>();

  for (const outcome of outcomes) {
    const slug =
      typeof outcome.era === "string" ? outcome.era : outcome.era?.slug;

    if (!slug || seen.has(slug)) {
      continue;
    }

    seen.add(slug);

    const line = ticketLines.eraLines[slug];

    if (line) {
      lines.push(line);
    }
  }

  return lines;
}

function chooseDeterministic(
  values: string[],
  seed: string,
  salt: string,
): string {
  if (values.length === 0) {
    return "";
  }

  if (!seed) {
    return values[0];
  }

  return values[stableHash(`${salt}:${seed}`) % values.length];
}

function stableHash(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function formatReadableList(values: string[]): string {
  if (values.length === 1) {
    return values[0];
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function formatTagSentences(values: string[]): string {
  const sentences: string[] = [];
  const renderedValues = values.slice(0, MAX_RENDERED_TAG_PHRASES);

  for (
    let index = 0;
    index < renderedValues.length;
    index += MAX_TAG_PHRASES_PER_SENTENCE
  ) {
    const sentenceIndex = index / MAX_TAG_PHRASES_PER_SENTENCE;
    const stem = TAG_SENTENCE_STEMS[sentenceIndex]!;
    const chunk = renderedValues.slice(index, index + MAX_TAG_PHRASES_PER_SENTENCE);

    sentences.push(`${stem} ${formatReadableList(chunk)}.`);
  }

  return sentences.join(" ");
}

function truncateSummary(summary: string): string {
  if (summary.length <= SUMMARY_LIMIT) {
    return summary;
  }

  return `${summary.slice(0, SUMMARY_LIMIT - 3).trimEnd()}...`;
}
