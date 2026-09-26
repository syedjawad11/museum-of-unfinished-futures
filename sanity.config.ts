import { visionTool } from "@sanity/vision";
import {
  workflowDefaultDocumentNode,
  workflowStudioPlugin,
} from "@sanity/workflow-studio-plugin";
import { defineConfig, type DocumentActionComponent } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemas";
import {
  sanityApiVersion,
  sanityDataset,
  sanityProjectId,
} from "./src/content/sanity-config";
import {
  artifactReviewActions,
  guardedPublishAction,
} from "./studio/actions/artifactReviewActions";

export default defineConfig({
  name: "museum-of-unfinished-futures",
  title: "Museum of Unfinished Futures",
  projectId: sanityProjectId,
  dataset: sanityDataset,
  basePath: "/studio",
  plugins: [
    structureTool({
      defaultDocumentNode: workflowDefaultDocumentNode(),
    }),
    workflowStudioPlugin({
      tag: "production",
      mappings: [
        {
          docType: "artifact",
          definition: "exhibit-review",
          label: "Exhibit review",
        },
      ],
    }),
    visionTool({
      defaultApiVersion: sanityApiVersion,
      defaultDataset: sanityDataset,
    }),
  ],
  schema: {
    types: schemaTypes,
  },
  document: {
    actions: (previousActions, context) => {
      if (context.schemaType !== "artifact" || context.releaseId) {
        return previousActions;
      }

      return previousActions.flatMap((previousAction): DocumentActionComponent[] =>
        previousAction.action === "publish"
          ? [...artifactReviewActions, guardedPublishAction]
          : [previousAction],
      );
    },
  },
});
