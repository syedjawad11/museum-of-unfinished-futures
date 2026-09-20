export type ArtifactChoice = {
  id: string;
  label: string;
  outcomeId: string;
};

export type ArtifactOutcome = {
  id: string;
  title: string;
  body: string;
};

export type ExhibitArtifact = {
  slug: string;
  title: string;
  accessionNote: string;
  summary: string;
  artifactLabel: string;
  visualDescription: string;
  choices: [ArtifactChoice, ArtifactChoice];
  outcomes: ArtifactOutcome[];
};

export type ExhibitRepository = {
  listExhibits(): Promise<ExhibitArtifact[]>;
  getExhibitBySlug(slug: string): Promise<ExhibitArtifact | null>;
};
