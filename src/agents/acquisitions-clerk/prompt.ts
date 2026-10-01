import type { ClerkDraft } from "./validate";

export type PromptExample = {
  title: string;
  accessionNote: string;
  summary: string;
  artifactLabel: string;
  choices: Array<{ label: string; outcomeTitle: string; outcomeBody: string }>;
};

export type DraftPromptInput = {
  brief: string;
  wing: { title: string; summary?: string };
  examples: readonly PromptExample[];
  /** Tag → the phrase the visitor's ticket prints for it. */
  tagPhrases: Readonly<Record<string, string>>;
  leadsToOptions: ReadonlyArray<{ _id: string; title: string }>;
  /** Present when a curator sent the draft back. */
  revision?: { reason: string; previous: unknown };
  /** Present when the last answer failed validation. */
  validationErrors?: readonly string[];
};

const SHAPE_EXAMPLE: ClerkDraft = {
  title: "Three to one hundred characters: the exhibit's name",
  accessionNote: "Eight to one hundred and twenty characters: where the museum acquired it.",
  summary:
    "Forty to three hundred and twenty characters describing what the object did in its unfinished future.",
  artifactLabel:
    "Twenty to two hundred and forty characters: the museum label beside the case.",
  visualDescription:
    "Thirty to three hundred and twenty characters of plain description for visitors who cannot see the case.",
  choices: [
    {
      label: "Three to eighty characters: the first thing the visitor may do",
      outcome: {
        title: "Three to ninety characters",
        body: "Thirty to five hundred and twenty characters: what happens to the visitor after this choice.",
        consequenceTags: ["borrowed-time"],
        leadsTo: "artifact-example-id",
      },
    },
    {
      label: "Three to eighty characters: the other thing the visitor may do",
      outcome: {
        title: "Three to ninety characters",
        body: "Thirty to five hundred and twenty characters: what happens to the visitor after this choice.",
        consequenceTags: ["quiet-refusal"],
      },
    },
  ],
};

export function buildDraftInstruction(input: DraftPromptInput): string {
  const sections = [
    "You are the Acquisitions Clerk of the Museum of Unfinished Futures, a museum of objects from futures that never quite happened.",
    "Write ONE new exhibit as JSON for the curator's review.",
    `Curator's brief: ${input.brief.trim()}`,
    `Wing: ${input.wing.title}${input.wing.summary ? ` (${input.wing.summary})` : ""}`,
    [
      "House style:",
      "- Calm, precise museum voice. Domestic and civic details. Quietly strange, never jokey, never horror.",
      "- Present tense for the label, past tense for what the object once did.",
      "- No real people, brands or places. No violence. Suitable for all ages.",
      "- The visitor makes one of two choices; each ending says what that choice does to the visitor's future.",
    ].join("\n"),
    [
      "Exhibits already in the collection (match this voice, do not copy them):",
      ...input.examples.map(formatExample),
    ].join("\n"),
    [
      "consequenceTags: pick 1 to 4 per ending, ONLY from this list (tag: what the visitor's ticket prints):",
      ...Object.entries(input.tagPhrases).map(([tag, phrase]) => `- ${tag}: ${phrase}`),
    ].join("\n"),
    [
      "leadsTo: optional. If an ending naturally continues into an existing exhibit, give that exhibit's id from this list; otherwise leave leadsTo out:",
      ...input.leadsToOptions.map((option) => `- ${option._id}: ${option.title}`),
    ].join("\n"),
  ];

  if (input.revision) {
    sections.push(
      [
        "A curator sent your previous draft back. Revise it to address the note, keep what works, and keep the same two choices in the same order.",
        `Curator's note: ${input.revision.reason.trim()}`,
        `Previous draft JSON: ${JSON.stringify(input.revision.previous)}`,
      ].join("\n"),
    );
  }

  if (input.validationErrors && input.validationErrors.length > 0) {
    sections.push(
      [
        "Your last answer was rejected. Fix every problem below:",
        ...input.validationErrors.map((error) => `- ${error}`),
      ].join("\n"),
    );
  }

  sections.push(
    [
      "Respond with JSON only, exactly two choices, in this shape (the character ranges are limits, not content):",
      JSON.stringify(SHAPE_EXAMPLE, null, 2),
    ].join("\n"),
  );

  return sections.join("\n\n");
}

function formatExample(example: PromptExample): string {
  const choices = example.choices
    .map(
      (choice) =>
        `    choice "${choice.label}" → ending "${choice.outcomeTitle}": ${choice.outcomeBody}`,
    )
    .join("\n");

  return [
    `- "${example.title}"`,
    `    accession note: ${example.accessionNote}`,
    `    summary: ${example.summary}`,
    `    label: ${example.artifactLabel}`,
    choices,
  ].join("\n");
}
