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

export type SanityOutcomeById = {
  id: string;
  title: string;
  body: string;
  consequenceTags: string[];
  leadsTo?: {
    title: string;
    slug: string;
  };
  era?: {
    slug: string;
  };
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

export const outcomesByIdQuery = groq`*[_type == "outcome" && _id in $ids] {
  _id,
  title,
  body,
  consequenceTags,
  leadsTo->{
    title,
    "slug": slug.current
  },
  era->{
    "slug": slug.current
  }
}`;

export function createSanityExhibitRepository(
  client: SanityReadClient,
): ExhibitRepository & {
  getOutcomesByIds(ids: string[]): Promise<SanityOutcomeById[]>;
} {
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
    async getOutcomesByIds(ids: string[]): Promise<SanityOutcomeById[]> {
      if (ids.length === 0) {
        return [];
      }

      const values = await client.fetch(outcomesByIdQuery, { ids });
      const outcomes = Array.isArray(values)
        ? values.map(transformSanityOutcomeById).filter(isSanityOutcomeById)
        : [];
      const byId = new Map(outcomes.map((outcome) => [outcome.id, outcome]));

      return ids.flatMap((id) => {
        const outcome = byId.get(id);
        return outcome ? [outcome] : [];
      });
    },
  };
}

function transformSanityOutcomeById(value: unknown): SanityOutcomeById | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as {
    _id?: unknown;
    title?: unknown;
    body?: unknown;
    consequenceTags?: unknown;
    leadsTo?: unknown;
    era?: unknown;
  };

  if (
    typeof candidate._id !== "string" ||
    typeof candidate.title !== "string" ||
    typeof candidate.body !== "string" ||
    !Array.isArray(candidate.consequenceTags)
  ) {
    return null;
  }

  const consequenceTags = candidate.consequenceTags.filter(
    (tag): tag is string => typeof tag === "string",
  );
  const outcome: SanityOutcomeById = {
    id: candidate._id,
    title: candidate.title,
    body: candidate.body,
    consequenceTags,
  };

  const leadsTo = transformOutcomeLink(candidate.leadsTo);

  if (leadsTo) {
    outcome.leadsTo = leadsTo;
  }

  const era = transformOutcomeEra(candidate.era);

  if (era) {
    outcome.era = era;
  }

  return outcome;
}

function isSanityOutcomeById(
  value: SanityOutcomeById | null,
): value is SanityOutcomeById {
  return Boolean(value);
}

function transformOutcomeLink(
  value: unknown,
): SanityOutcomeById["leadsTo"] | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as {
    title?: unknown;
    slug?: unknown;
  };

  return typeof candidate.title === "string" &&
    typeof candidate.slug === "string"
    ? {
        title: candidate.title,
        slug: candidate.slug,
      }
    : null;
}

function transformOutcomeEra(
  value: unknown,
): SanityOutcomeById["era"] | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as {
    slug?: unknown;
  };

  return typeof candidate.slug === "string"
    ? {
        slug: candidate.slug,
      }
    : null;
}

export const sanityClient = createClient({
  ...sanityConfig,
  useCdn: true,
});

export const sanityExhibitRepository =
  createSanityExhibitRepository(sanityClient);
