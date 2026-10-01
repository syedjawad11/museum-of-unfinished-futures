import type { ClerkDraftContext } from "../validate";

export const context: ClerkDraftContext = {
  tagVocabulary: ["borrowed-time", "quiet-refusal", "line-left-open"],
  leadsToOptions: ["artifact-weather-of-visits-kettle"],
  existingTitles: ["The Kettle That Brews the Weather of Past Visits"],
};

export function goodDraft() {
  return {
    title: "The Doormat That Learns Who Is Expected",
    accessionNote: "Collected from the porch of a boarding house on a closed street.",
    summary:
      "A coir doormat once spelled out, in pressed fibres, the name of whoever the household was expecting next, a few hours before they knocked.",
    artifactLabel:
      "The bristles near the edge still lean toward the street, as if someone were about to arrive.",
    visualDescription:
      "A worn brown doormat lies flat on a stone step. Faint letters are pressed into its fibres, and the bristles along one edge lean toward the viewer.",
    choices: [
      {
        label: "Wipe your feet",
        outcome: {
          title: "Your name settles into the fibres",
          body: "The letters rearrange themselves while you stand there. By the time you look down, the mat is expecting you next week, at an hour you have not chosen yet.",
          consequenceTags: ["borrowed-time"],
          leadsTo: "artifact-weather-of-visits-kettle",
        },
      },
      {
        label: "Step over it",
        outcome: {
          title: "The mat goes blank",
          body: "Nothing is spelled out after you pass. Somewhere inside, a kettle is filled for one fewer guest, and nobody can say who was meant to come.",
          consequenceTags: ["quiet-refusal", "line-left-open"],
        },
      },
    ],
  };
}
