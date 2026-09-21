import { createClient, groq } from "next-sanity";
import { sanityConfig } from "./sanity-config";
import {
  transformSanityArtifact,
  transformSanityArtifacts,
  transformSanityEra,
  transformSanityEras,
} from "./sanity-transform";
import type { ExhibitArtifact, ExhibitEra, ExhibitRepository } from "./types";

type SanityReadClient = {
  fetch<T = unknown>(query: string, params?: Record<string, unknown>): Promise<T>;
};

const artifactProjection = groq`{
  "slug": slug.current,
  title,
  era->{
    title,
    "slug": slug.current,
    summary,
    accentColor
  },
  accessionNote,
  summary,
  artifactLabel,
  visualDescription,
  image{
    asset->{
      url,
      metadata{
        lqip,
        dimensions{
          width,
          height
        }
      }
    },
    alt
  },
  choices[] {
    _key,
    label,
    outcome->{
      _id,
      title,
      body,
      consequenceTags,
      leadsTo->{
        title,
        "slug": slug.current
      }
    }
  }
}`;

export const artifactListQuery = groq`*[_type == "artifact" && defined(slug.current)] | order(title asc) ${artifactProjection}`;

export const artifactBySlugQuery = groq`*[_type == "artifact" && slug.current == $slug][0] ${artifactProjection}`;

export const eraListQuery = groq`*[_type == "era" && defined(slug.current)] | order(title asc) {
  title,
  "slug": slug.current,
  summary,
  accentColor,
  "exhibits": *[_type == "artifact" && references(^._id) && defined(slug.current)] | order(title asc) ${artifactProjection}
}`;

export const eraBySlugQuery = groq`*[_type == "era" && slug.current == $slug][0] {
  title,
  "slug": slug.current,
  summary,
  accentColor,
  "exhibits": *[_type == "artifact" && references(^._id) && defined(slug.current)] | order(title asc) ${artifactProjection}
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
    async listEras(): Promise<ExhibitEra[]> {
      const values = await client.fetch(eraListQuery);
      return transformSanityEras(values);
    },
    async getEraBySlug(slug: string): Promise<ExhibitEra | null> {
      const value = await client.fetch(eraBySlugQuery, { slug });
      return transformSanityEra(value);
    },
  };
}

export const sanityClient = createClient({
  ...sanityConfig,
  useCdn: true,
});

export const sanityExhibitRepository =
  createSanityExhibitRepository(sanityClient);
