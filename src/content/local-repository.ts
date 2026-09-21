import { localDemoEras, localDemoExhibits } from "./local-fixtures";
import type { ExhibitRepository } from "./types";

export const localExhibitRepository: ExhibitRepository = {
  async listExhibits() {
    return localDemoExhibits;
  },
  async getExhibitBySlug(slug) {
    return localDemoExhibits.find((exhibit) => exhibit.slug === slug) ?? null;
  },
  async listEras() {
    return localDemoEras;
  },
  async getEraBySlug(slug) {
    return localDemoEras.find((era) => era.slug === slug) ?? null;
  },
};
