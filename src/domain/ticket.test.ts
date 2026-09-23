import { describe, expect, it } from "vitest";
import type { ArtifactOutcome } from "@/content/types";
import realTicketLines from "../content/ticket-lines.json";
import {
  composeTicket,
  parseTrace,
  type TicketLinesContent,
  type TicketOutcome,
} from "./ticket";

const ticketLines: TicketLinesContent = {
  openings: [
    "The museum prints a receipt for the future you almost entered.",
    "Your unfinished future begins in the margin of the visitor book.",
    "A small machine behind the desk clears its throat.",
  ],
  eraLines: {
    "civic-time-expansion-era":
      "In civic time, borrowed hours become public infrastructure.",
    "counterfactual-communications-boom":
      "In the counterfactual boom, every missed call finds a second wire.",
    "domestic-weather-memory-era":
      "In domestic weather, shelter keeps the shape of the room.",
  },
  tagPhrases: {
    "borrowed-time": "carrying a day that was never yours to keep",
    "accruing-interest": "quietly owing more than you agreed to spend",
    "edited-without-asking": "amended in a record you were never shown",
    "quiet-refusal": "declining something without ever raising your voice",
    "room-to-breathe": "with more room around you than the corridor promised",
    "almost-recognized": "known by something that cannot quite place your name",
    "another-life-answering": "answered by a life you decided not to live",
    "line-left-open": "with a line still open behind you",
  },
  closings: [
    "Please keep the stub until the future finishes changing.",
    "The attendant stamps it once, then pretends not to know why.",
    "Nothing is settled, but the ink has decided to stay.",
  ],
};

const tagSentenceStems = [
  "You leave here",
  "You also go out",
  "And you walk on",
];

function outcome(
  id: string,
  consequenceTags: string[],
  eraSlug?: string,
): TicketOutcome {
  const baseOutcome: ArtifactOutcome = {
    id,
    title: `${id} title`,
    body: `${id} body`,
    consequenceTags,
  };

  return eraSlug
    ? {
        ...baseOutcome,
        era: {
          slug: eraSlug,
        },
      }
    : baseOutcome;
}

describe("parseTrace", () => {
  it("parses a comma-separated trace, trims whitespace, drops empties, and keeps first-seen ids", () => {
    expect(
      parseTrace(
        " outcome-paper-monday, outcome-soft-refusal ,,outcome-paper-monday,outcome-room-rains-back ",
      ),
    ).toEqual({
      ids: [
        "outcome-paper-monday",
        "outcome-soft-refusal",
        "outcome-room-rains-back",
      ],
    });
  });

  it("treats undefined, empty strings, and comma-only strings as an empty trace", () => {
    expect(parseTrace(undefined)).toEqual({ ids: [] });
    expect(parseTrace("")).toEqual({ ids: [] });
    expect(parseTrace(",,,")).toEqual({ ids: [] });
  });

  it("uses the first string when Next supplies an array value", () => {
    expect(
      parseTrace(["outcome-soft-refusal,outcome-forecast-forgets", "ignored"]),
    ).toEqual({
      ids: ["outcome-soft-refusal", "outcome-forecast-forgets"],
    });
  });

  it("rejects ids outside the allowed lowercase slug alphabet without throwing", () => {
    expect(parseTrace("outcome-paper-monday,../../secret")).toEqual({
      error: {
        code: "invalid_id",
        id: "../../secret",
      },
    });
    expect(parseTrace("outcome_PAPER_monday")).toEqual({
      error: {
        code: "invalid_id",
        id: "outcome_PAPER_monday",
      },
    });
    expect(parseTrace("ab")).toEqual({
      error: {
        code: "invalid_id",
        id: "ab",
      },
    });
  });

  it("rejects more than twelve distinct ids", () => {
    expect(
      parseTrace(
        [
          "outcome-001",
          "outcome-002",
          "outcome-003",
          "outcome-004",
          "outcome-005",
          "outcome-006",
          "outcome-007",
          "outcome-008",
          "outcome-009",
          "outcome-010",
          "outcome-011",
          "outcome-012",
          "outcome-013",
        ].join(","),
      ),
    ).toEqual({
      error: {
        code: "too_many_ids",
        limit: 12,
      },
    });
  });

  it("handles a hostile 10000-character trace as a typed error with no pathological slowdown", () => {
    const result = parseTrace("a".repeat(10000));

    expect(result).toEqual({
      error: {
        code: "invalid_id",
        id: "a".repeat(10000),
      },
    });
  });
});

describe("composeTicket", () => {
  it("composes opening, distinct tag sentence, first-touched era lines, closing, and summary", () => {
    const ticket = composeTicket({
      traceIds: [
        "outcome-paper-monday",
        "outcome-soft-refusal",
        "outcome-room-rains-back",
      ],
      outcomes: [
        outcome(
          "outcome-paper-monday",
          ["borrowed-time", "edited-without-asking"],
          "civic-time-expansion-era",
        ),
        outcome(
          "outcome-soft-refusal",
          ["quiet-refusal", "borrowed-time", "room-to-breathe"],
          "domestic-weather-memory-era",
        ),
        outcome(
          "outcome-room-rains-back",
          ["almost-recognized"],
          "domestic-weather-memory-era",
        ),
      ],
      ticketLines,
    });

    expect(ticket.opening).toBe(
      "The museum prints a receipt for the future you almost entered.",
    );
    expect(ticket.tagSentence).toBe(
      "You leave here carrying a day that was never yours to keep, amended in a record you were never shown, and declining something without ever raising your voice. You also go out with more room around you than the corridor promised and known by something that cannot quite place your name.",
    );
    expect(ticket.eraLines).toEqual([
      "In civic time, borrowed hours become public infrastructure.",
      "In domestic weather, shelter keeps the shape of the room.",
    ]);
    expect(ticket.closing).toBe(
      "Please keep the stub until the future finishes changing.",
    );
    expect(ticket.lines).toEqual([
      ticket.opening,
      ticket.tagSentence,
      ...ticket.eraLines,
      ticket.closing,
    ]);
    expect(ticket.summary).toBe(
      "Your unfinished future: carrying a day that was never yours to keep, amended in a record you were never shown, declining something without ever raising your voice, with more room around you than t...",
    );
  });

  it("is deterministic for a shareable trace", () => {
    const input = {
      traceIds: ["outcome-soft-refusal", "outcome-forecast-forgets"],
      outcomes: [
        outcome(
          "outcome-soft-refusal",
          ["quiet-refusal", "room-to-breathe"],
          "domestic-weather-memory-era",
        ),
        outcome(
          "outcome-forecast-forgets",
          ["room-to-breathe", "edited-without-asking"],
          "domestic-weather-memory-era",
        ),
      ],
      ticketLines,
    };

    const firstTicket = composeTicket(input);
    const secondTicket = composeTicket(input);

    expect(firstTicket).toEqual({
      opening: "The museum prints a receipt for the future you almost entered.",
      tagSentence:
        "You leave here declining something without ever raising your voice, with more room around you than the corridor promised, and amended in a record you were never shown.",
      eraLines: ["In domestic weather, shelter keeps the shape of the room."],
      closing: "Please keep the stub until the future finishes changing.",
      lines: [
        "The museum prints a receipt for the future you almost entered.",
        "You leave here declining something without ever raising your voice, with more room around you than the corridor promised, and amended in a record you were never shown.",
        "In domestic weather, shelter keeps the shape of the room.",
        "Please keep the stub until the future finishes changing.",
      ],
      summary:
        "Your unfinished future: declining something without ever raising your voice, with more room around you than the corridor promised, and amended in a record you were never shown.",
    });
    expect(secondTicket.opening).toBe(
      "The museum prints a receipt for the future you almost entered.",
    );
    expect(secondTicket.closing).toBe(
      "Please keep the stub until the future finishes changing.",
    );
  });

  it("handles an empty or unresolved trace without inventing tags or eras", () => {
    expect(
      composeTicket({
        traceIds: [],
        outcomes: [],
        ticketLines,
      }),
    ).toEqual({
      opening: "The museum prints a receipt for the future you almost entered.",
      tagSentence: "Your trace is quiet; no consequence has settled yet.",
      eraLines: [],
      closing: "Please keep the stub until the future finishes changing.",
      lines: [
        "The museum prints a receipt for the future you almost entered.",
        "Your trace is quiet; no consequence has settled yet.",
        "Please keep the stub until the future finishes changing.",
      ],
      summary: "Your unfinished future is still waiting for its first trace.",
    });

    expect(
      composeTicket({
        traceIds: ["outcome-paper-monday"],
        outcomes: [],
        ticketLines,
      }).tagSentence,
    ).toBe("Your trace is quiet; no consequence has settled yet.");
  });

  it("skips missing tag phrases, missing era slugs, and missing era lines", () => {
    const ticket = composeTicket({
      traceIds: ["outcome-paper-monday", "outcome-familiar-stranger"],
      outcomes: [
        outcome(
          "outcome-paper-monday",
          ["borrowed-time", "not-in-content"],
          "civic-time-expansion-era",
        ),
        outcome(
          "outcome-familiar-stranger",
          ["not-in-content", "almost-recognized"],
          "unknown-era",
        ),
        outcome("outcome-no-era", ["quiet-refusal"]),
      ],
      ticketLines,
    });

    expect(ticket.tagSentence).toBe(
      "You leave here carrying a day that was never yours to keep, known by something that cannot quite place your name, and declining something without ever raising your voice.",
    );
    expect(ticket.eraLines).toEqual([
      "In civic time, borrowed hours become public infrastructure.",
    ]);
    expect(ticket.summary).toBe(
      "Your unfinished future: carrying a day that was never yours to keep, known by something that cannot quite place your name, and declining something without ever raising your voice.",
    );
  });

  it("composes the real multi-outcome trace without colliding with participial tag phrases", () => {
    const ticket = composeTicket({
      traceIds: ["outcome-paper-monday", "outcome-familiar-stranger"],
      outcomes: [
        outcome(
          "outcome-paper-monday",
          ["borrowed-time", "accruing-interest", "edited-without-asking"],
          "civic-time-expansion-era",
        ),
        outcome(
          "outcome-familiar-stranger",
          ["almost-recognized", "another-life-answering", "line-left-open"],
          "counterfactual-communications-boom",
        ),
      ],
      ticketLines,
    });

    expect(ticket.tagSentence).toBe(
      "You leave here carrying a day that was never yours to keep, quietly owing more than you agreed to spend, and amended in a record you were never shown. You also go out known by something that cannot quite place your name, answered by a life you decided not to live, and with a line still open behind you.",
    );
  });

  it("does not repeat a tag sentence stem for six-tag and nine-tag traces", () => {
    const sixTagTicket = composeTicket({
      traceIds: ["six-tag-trace"],
      outcomes: [
        outcome("six-tag-trace", [
          "borrowed-time",
          "accruing-interest",
          "edited-without-asking",
          "quiet-refusal",
          "weekend-intact",
          "room-to-breathe",
        ]),
      ],
      ticketLines: realTicketLines,
    });
    const nineTagTicket = composeTicket({
      traceIds: ["nine-tag-trace"],
      outcomes: [
        outcome("nine-tag-trace", [
          "borrowed-time",
          "accruing-interest",
          "edited-without-asking",
          "quiet-refusal",
          "weekend-intact",
          "room-to-breathe",
          "almost-recognized",
          "another-life-answering",
          "line-left-open",
        ]),
      ],
      ticketLines: realTicketLines,
    });

    for (const ticket of [sixTagTicket, nineTagTicket]) {
      const repeatedStems = tagSentenceStems.filter(
        (stem) => ticket.tagSentence.split(stem).length - 1 > 1,
      );

      expect(repeatedStems).toEqual([]);
      expect(ticket.tagSentence).not.toContain("undefined");
    }
  });

  it("caps a 12-outcome trace at three distinct tag sentences", () => {
    const allTags = Object.keys(realTicketLines.tagPhrases);
    const outcomes = Array.from({ length: 12 }, (_, index) =>
      outcome(`outcome-${index + 1}`, allTags.slice(index * 2, index * 2 + 2)),
    );
    const ticket = composeTicket({
      traceIds: outcomes.map(({ id }) => id),
      outcomes,
      ticketLines: realTicketLines,
    });
    const sentences = ticket.tagSentence.match(/[^.]+\./g) ?? [];

    expect(allTags.length).toBeGreaterThan(20);
    expect(sentences).toHaveLength(3);
    expect(
      sentences.map((sentence) =>
        sentence.trim().split(/\s+/).slice(0, 5).join(" "),
      ),
    ).toEqual([
      "You leave here carrying a",
      "You also go out declining",
      "And you walk on known",
    ]);
    for (const stem of tagSentenceStems) {
      expect(ticket.tagSentence.split(stem).length - 1).toBe(1);
    }
    expect(ticket.tagSentence).not.toMatch(/\blater\b/i);
    expect(ticket.tagSentence).not.toMatch(/\d/);
    expect(ticket.tagSentence).not.toContain("undefined");
  });

  it("renders every real tag phrase verbatim when it is in the first nine", () => {
    const tagEntries = Object.entries(realTicketLines.tagPhrases);

    for (const [tag, phrase] of tagEntries) {
      for (let position = 0; position < 9; position += 1) {
        const fillerTags = tagEntries
          .map(([fillerTag]) => fillerTag)
          .filter((fillerTag) => fillerTag !== tag)
          .slice(0, position);
        const ticket = composeTicket({
          traceIds: [`${tag}-trace`],
          outcomes: [outcome(`${tag}-trace`, [...fillerTags, tag])],
          ticketLines: realTicketLines,
        });

        expect(ticket.tagSentence).toContain(phrase);
      }
    }
  });

  it("does not double a word at any stem and phrase boundary", () => {
    const tagEntries = Object.entries(realTicketLines.tagPhrases);

    for (let stemIndex = 0; stemIndex < tagSentenceStems.length; stemIndex += 1) {
      const stem = tagSentenceStems[stemIndex];

      for (const [tag, phrase] of tagEntries) {
        const fillerTags = tagEntries
          .map(([fillerTag]) => fillerTag)
          .filter((fillerTag) => fillerTag !== tag)
          .slice(0, stemIndex * 3);
        const ticket = composeTicket({
          traceIds: [`${tag}-trace`],
          outcomes: [outcome(`${tag}-trace`, [...fillerTags, tag])],
          ticketLines: realTicketLines,
        });
        const sentence = (ticket.tagSentence.match(/[^.]+\./g) ?? [])[
          stemIndex
        ];
        const stemLastWord = stem
          .match(/\b[\w']+\b(?=\W*$)/)?.[0]
          .toLowerCase();
        const phraseFirstWord = phrase.match(/^\W*([\w']+)/)?.[1].toLowerCase();

        expect(sentence).toContain(stem);
        expect(sentence).toContain(phrase);
        expect(sentence).not.toContain("undefined");
        expect(stemLastWord).not.toBe(phraseFirstWord);
      }
    }
  });

  it("does not repeat a phrase when quiet-refusal appears on two endings", () => {
    const ticket = composeTicket({
      traceIds: ["outcome-soft-refusal", "outcome-missed-call-self"],
      outcomes: [
        outcome(
          "outcome-soft-refusal",
          ["quiet-refusal", "room-to-breathe"],
          "domestic-weather-memory-era",
        ),
        outcome(
          "outcome-missed-call-self",
          ["quiet-refusal", "edited-without-asking"],
          "counterfactual-communications-boom",
        ),
      ],
      ticketLines,
    });

    expect(ticket.tagSentence).toBe(
      "You leave here declining something without ever raising your voice, with more room around you than the corridor promised, and amended in a record you were never shown.",
    );
  });
});
