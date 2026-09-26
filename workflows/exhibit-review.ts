import {
  defineAction,
  defineActivity,
  defineField,
  defineGuard,
  defineOp,
  defineStage,
  defineTransition,
  defineWorkflow,
} from "@sanity/workflow-engine/define";

function publishHold(name: string, title: string) {
  return defineGuard({
    name,
    title,
    match: {
      idRefs: [{ type: "fieldRead", field: "subject" }],
      actions: ["publish"],
    },
  });
}

const draftingPublishHold = publishHold(
  "hold-publish-drafting",
  "Hold publishing",
);
const reviewPublishHold = publishHold(
  "hold-publish-review",
  "Hold publishing during review",
);

export const exhibitReview = defineWorkflow({
  name: "exhibit-review",
  title: "Exhibit review",
  description:
    "Moves an artifact from drafting through curatorial review, approval, and display.",
  initialStage: "drafting",
  fields: [
    defineField({
      type: "subject",
      name: "subject",
      title: "Artifact",
      types: ["artifact"],
      initialValue: { type: "input" },
      required: true,
    }),
    defineField({
      type: "string",
      name: "reviewDecision",
      title: "Review decision",
      options: {
        list: [
          { title: "Request changes", value: "request-changes" },
          { title: "Approve", value: "approve" },
        ],
      },
    }),
    defineField({
      type: "string",
      name: "changeRequestReason",
      title: "Change request reason",
      validation: { min: 1, max: 500 },
    }),
  ],
  stages: [
    defineStage({
      name: "drafting",
      title: "Drafting",
      guards: [draftingPublishHold],
      activities: [
        defineActivity({
          name: "draft",
          title: "Prepare the artifact",
          actions: [
            defineAction({
              name: "submit",
              title: "Submit for curatorial review",
              status: "done",
              ops: [
                defineOp({
                  type: "field.unset",
                  target: { field: "reviewDecision" },
                }),
              ],
            }),
          ],
        }),
      ],
      transitions: [
        defineTransition({
          name: "submit",
          title: "Submit",
          to: "curatorial-review",
        }),
      ],
    }),
    defineStage({
      name: "curatorial-review",
      title: "Curatorial review",
      guards: [reviewPublishHold],
      activities: [
        defineActivity({
          name: "review",
          title: "Review the artifact",
          actions: [
            defineAction({
              name: "request-changes",
              title: "Request changes",
              params: [
                {
                  type: "string",
                  name: "reason",
                  title: "Reason",
                  required: true,
                  validation: { min: 1, max: 500 },
                },
              ],
              status: "done",
              ops: [
                defineOp({
                  type: "field.set",
                  target: { field: "reviewDecision" },
                  value: { type: "literal", value: "request-changes" },
                }),
                defineOp({
                  type: "field.set",
                  target: { field: "changeRequestReason" },
                  value: { type: "param", param: "reason" },
                }),
              ],
            }),
            defineAction({
              name: "approve",
              title: "Approve",
              status: "done",
              ops: [
                defineOp({
                  type: "field.set",
                  target: { field: "reviewDecision" },
                  value: { type: "literal", value: "approve" },
                }),
              ],
            }),
          ],
        }),
      ],
      transitions: [
        defineTransition({
          name: "request-changes",
          title: "Request changes",
          to: "drafting",
          when: "$allActivitiesDone && $fields.reviewDecision == 'request-changes'",
        }),
        defineTransition({
          name: "approve",
          title: "Approve",
          to: "approved",
          when: "$allActivitiesDone && $fields.reviewDecision == 'approve'",
        }),
      ],
    }),
    defineStage({
      name: "approved",
      title: "Approved",
      activities: [
        defineActivity({
          name: "display",
          title: "Put on display",
          actions: [
            defineAction({
              name: "put-on-display",
              title: "Put on display",
              status: "done",
            }),
          ],
        }),
      ],
      transitions: [
        defineTransition({
          name: "put-on-display",
          title: "Put on display",
          to: "on-display",
        }),
      ],
    }),
    defineStage({
      name: "on-display",
      title: "On display",
    }),
  ],
});
