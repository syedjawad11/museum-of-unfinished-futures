export const sanityProjectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "wa27n68e";

export const sanityDataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production_1";

export const sanityApiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2026-09-20";

export const sanityConfig = {
  projectId: sanityProjectId,
  dataset: sanityDataset,
  apiVersion: sanityApiVersion,
} as const;
