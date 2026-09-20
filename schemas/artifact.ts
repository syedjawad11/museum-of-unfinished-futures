import { defineArrayMember, defineField, defineType } from "sanity";

export const artifactType = defineType({
  name: "artifact",
  title: "Artifact",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required().min(3).max(100),
    }),
    defineField({
      name: "slug",
      title: "Unique slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "era",
      title: "Era",
      type: "reference",
      to: [{ type: "era" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "accessionNote",
      title: "Accession note",
      type: "string",
      validation: (rule) => rule.required().min(8).max(120),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required().min(40).max(320),
    }),
    defineField({
      name: "artifactLabel",
      title: "Artifact display label",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required().min(20).max(240),
    }),
    defineField({
      name: "visualDescription",
      title: "Accessible visual description",
      description:
        "Plain-language description of the artifact display for visitors who cannot see the visual treatment.",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required().min(30).max(320),
    }),
    defineField({
      name: "choices",
      title: "Visitor choices",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "label",
              title: "Label",
              type: "string",
              validation: (rule) => rule.required().min(3).max(80),
            }),
            defineField({
              name: "outcome",
              title: "Linked outcome",
              type: "reference",
              to: [{ type: "outcome" }],
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {
              title: "label",
              subtitle: "outcome.title",
            },
          },
        }),
      ],
      validation: (rule) => rule.required().length(2),
    }),
  ],
});
