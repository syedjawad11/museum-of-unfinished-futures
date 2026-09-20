import type { ArtifactChoice, ArtifactOutcome } from "@/content/types";

type TraceableArtifact = {
  choices: ArtifactChoice[];
  outcomes: ArtifactOutcome[];
};

export function resolveLinkedOutcome(
  artifact: TraceableArtifact,
  selectedChoiceId: string,
): ArtifactOutcome | undefined {
  const selectedChoice = artifact.choices.find(
    (choice) => choice.id === selectedChoiceId,
  );

  if (!selectedChoice) {
    return undefined;
  }

  return artifact.outcomes.find(
    (outcome) => outcome.id === selectedChoice.outcomeId,
  );
}
