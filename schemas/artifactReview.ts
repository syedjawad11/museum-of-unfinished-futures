import { defineField, defineType } from "sanity";

export const artifactReviewType = defineType({
  name: "artifactReview",
  title: "Artifact Review",
  type: "document",
  fields: [
    defineField({
      name: "artifact",
      title: "Artifact",
      type: "reference",
      to: [{ type: "artifact" }],
      weak: true,
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "state",
      title: "State",
      type: "string",
      options: {
        list: [
          { title: "Editing", value: "editing" },
          { title: "Submitted", value: "submitted" },
          { title: "Changes requested", value: "changesRequested" },
          { title: "Approved", value: "approved" },
        ],
      },
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "submittedRevision",
      title: "Submitted revision",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "approvedRevision",
      title: "Approved revision",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "changeRequestReason",
      title: "Change request reason",
      description:
        "Public-safe curator feedback. Do not include private notes, credentials, raw errors, email addresses, or personal data.",
      type: "text",
      rows: 3,
      readOnly: true,
      validation: (rule) => rule.max(500),
    }),
    defineField({
      name: "submittedAt",
      title: "Submitted at",
      type: "datetime",
      readOnly: true,
    }),
    defineField({
      name: "changeRequestedAt",
      title: "Change requested at",
      type: "datetime",
      readOnly: true,
    }),
    defineField({
      name: "approvedAt",
      title: "Approved at",
      type: "datetime",
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: "artifact.title",
      subtitle: "state",
    },
  },
});
