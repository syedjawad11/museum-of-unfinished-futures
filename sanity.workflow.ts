import type { WorkflowDeploymentInput } from "@sanity/workflow-engine";
import { defineWorkflowConfig } from "@sanity/workflow-engine/define";
import { exhibitReview } from "./workflows/exhibit-review";

const workflowResource = {
  type: "dataset",
  id: "wa27n68e.production_1",
} as const;

export const production = {
  name: "production",
  tag: "production",
  expectedMinReaderModel: 10,
  workflowResource,
  definitions: [exhibitReview],
} satisfies WorkflowDeploymentInput;

export default defineWorkflowConfig({
  deployments: [production],
});
