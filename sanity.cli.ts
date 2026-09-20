import { defineCliConfig } from "sanity/cli";
import {
  sanityDataset,
  sanityProjectId,
} from "./src/content/sanity-config";

export default defineCliConfig({
  api: {
    projectId: sanityProjectId,
    dataset: sanityDataset,
  },
});
