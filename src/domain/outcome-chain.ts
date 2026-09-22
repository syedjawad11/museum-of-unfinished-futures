import type { ArtifactOutcome } from "@/content/types";

export type OutcomeStep = {
  title: string;
  slug: string;
};

export type TrailState =
  | {
      kind: "continue";
      trail: string[];
    }
  | {
      kind: "loop";
      nextSlug: string;
      loop: string[];
    };

/**
 * Pure helpers for chained outcome walks. No React, no I/O; callers provide
 * already-resolved outcome data from the content layer.
 */

export function nextStep(
  outcome: ArtifactOutcome,
  currentArtifactSlug: string,
): OutcomeStep | null {
  if (!outcome.leadsTo || outcome.leadsTo.slug === currentArtifactSlug) {
    return null;
  }

  return outcome.leadsTo;
}

export function visitedTrail(trail: string[], nextSlug: string): TrailState {
  const loopStart = trail.indexOf(nextSlug);

  if (loopStart === -1) {
    return {
      kind: "continue",
      trail: [...trail, nextSlug],
    };
  }

  return {
    kind: "loop",
    nextSlug,
    loop: [...trail.slice(loopStart), nextSlug],
  };
}

export function formatConsequenceTag(tag: string): string {
  const words = tag.split("-").filter(Boolean);

  if (words.length === 0) {
    return "";
  }

  const formatted = words.join(" ");

  return `${formatted.charAt(0).toUpperCase()}${formatted.slice(1)}`;
}
