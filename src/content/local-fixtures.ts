import type { ExhibitArtifact } from "./types";

export const localDemoExhibits = [
  {
    slug: "extra-mondays-vending-machine",
    title: "The Vending Machine That Sells Extra Mondays",
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
      },
      {
        id: "soft-refusal",
        title: "The machine keeps humming",
        body: "Somewhere inside, an extra weekday remains unsold. The corridor feels briefly spacious.",
      },
    ],
  },
] satisfies ExhibitArtifact[];
