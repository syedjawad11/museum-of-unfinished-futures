import type { ExhibitArtifact, ExhibitEra } from "./types";

const civicTimeEra = {
  title: "The Civic Time Expansion Era",
  slug: "civic-time-expansion-era",
  summary:
    "A near future in which cities treated spare hours as public infrastructure, issuing extra weekdays through experimental municipal machines.",
  accentColor: "#f2b65a",
};

export const localDemoExhibits = [
  {
    slug: "extra-mondays-vending-machine",
    title: "The Vending Machine That Sells Extra Mondays",
    era: civicTimeEra,
    accessionNote: "Local demo fixture, not live Sanity content.",
    summary:
      "A brushed-steel vending machine hums beside a locked gallery door, promising one more Monday to anyone willing to pay in plans.",
    artifactLabel:
      "The selector glass is cracked. Behind it, tiny calendar pages rotate like candy coils.",
    visualDescription:
      "A cracked vending-machine selector window shows miniature calendar pages coiled like candy behind smudged glass.",
    choices: [
      {
        id: "spend-a-plan",
        label: "Spend a plan",
        outcomeId: "paper-monday",
      },
      {
        id: "keep-the-weekend",
        label: "Keep the weekend intact",
        outcomeId: "soft-refusal",
      },
    ],
    outcomes: [
      {
        id: "paper-monday",
        title: "A paper Monday drops",
        body: "It is warm from the machine and already annotated with chores you do not remember accepting.",
        consequenceTags: ["borrowed-time"],
      },
      {
        id: "soft-refusal",
        title: "The machine keeps humming",
        body: "Somewhere inside, an extra weekday remains unsold. The corridor feels briefly spacious.",
        consequenceTags: [],
      },
    ],
  },
] satisfies ExhibitArtifact[];

export const localDemoEras = [
  {
    ...civicTimeEra,
    exhibits: localDemoExhibits,
  },
] satisfies ExhibitEra[];
