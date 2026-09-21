export type ArtifactChoice = {
  id: string;
  label: string;
  outcomeId: string;
};

export type ArtifactOutcome = {
  id: string;
  title: string;
  body: string;
  consequenceTags: string[];
  leadsTo?: {
    title: string;
    slug: string;
  };
};

export type ExhibitArtifact = {
  slug: string;
  title: string;
  era: {
    title: string;
    slug: string;
    summary: string;
    accentColor?: string;
  };
  accessionNote: string;
  summary: string;
  artifactLabel: string;
  visualDescription: string;
  choices: ArtifactChoice[];
  outcomes: ArtifactOutcome[];
  image?: {
    url: string;
    alt: string;
    width: number;
    height: number;
    lqip?: string;
  };
};

export type ExhibitEra = {
  title: string;
  slug: string;
  summary: string;
  accentColor?: string;
  exhibits: ExhibitArtifact[];
};

export type ExhibitRepository = {
  listExhibits(): Promise<ExhibitArtifact[]>;
  getExhibitBySlug(slug: string): Promise<ExhibitArtifact | null>;
  listEras(): Promise<ExhibitEra[]>;
  getEraBySlug(slug: string): Promise<ExhibitEra | null>;
};
