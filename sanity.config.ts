import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemas";
import {
  sanityApiVersion,
  sanityDataset,
  sanityProjectId,
} from "./src/content/sanity-config";

export default defineConfig({
  name: "museum-of-unfinished-futures",
  title: "Museum of Unfinished Futures",
  projectId: sanityProjectId,
  dataset: sanityDataset,
  basePath: "/studio",
  plugins: [
    structureTool(),
    visionTool({
      defaultApiVersion: sanityApiVersion,
      defaultDataset: sanityDataset,
    }),
  ],
  schema: {
    types: schemaTypes,
  },
});
