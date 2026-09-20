import { createClient, groq } from "next-sanity";
import { sanityConfig } from "./sanity-config";
import { transformSanityArtifact, transformSanityArtifacts } from "./sanity-transform";
import type { ExhibitArtifact, ExhibitRepository } from "./types";

type SanityReadClient = {
  fetch<T = unknown>(query: string, params?: Record<string, unknown>): Promise<T>;
};

export const artifactListQuery = groq`*[_type == "artifact" && defined(slug.current)] | order(title asc) {
  "slug": slug.current,
  title,
  accessionNote,
  summary,
  artifactLabel,
  visualDescription,
  choices[] {
    _key,
    label,
    outcome->{
      _id,
      title,
      body
    }
  }
}`;

export const artifactBySlugQuery = groq`*[_type == "artifact" && slug.current == $slug][0] {
  "slug": slug.current,
  title,
  accessionNote,
  summary,
  artifactLabel,
  visualDescription,
  choices[] {
    _key,
    label,
    outcome->{
      _id,
      title,
      body
    }
  }
}`;

export function createSanityExhibitRepository(
  client: SanityReadClient,
): ExhibitRepository {
  return {
    async listExhibits(): Promise<ExhibitArtifact[]> {
      const values = await client.fetch(artifactListQuery);
      return transformSanityArtifacts(values);
    },
    async getExhibitBySlug(slug: string): Promise<ExhibitArtifact | null> {
      const value = await client.fetch(artifactBySlugQuery, { slug });
      return transformSanityArtifact(value);
    },
  };
}

export const sanityClient = createClient({
  ...sanityConfig,
  useCdn: true,
});

export const sanityExhibitRepository =
  createSanityExhibitRepository(sanityClient);
