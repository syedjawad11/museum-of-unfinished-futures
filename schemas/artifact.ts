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
      name: "image",
      title: "Blueprint plate",
      type: "image",
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alt text",
          validation: (rule) => rule.required().min(20).max(320),
        }),
      ],
      validation: (rule) =>
        rule.custom((image) => {
          if (!image) {
            return true;
          }

          if (
            typeof image === "object" &&
            "alt" in image &&
            typeof image.alt === "string" &&
            image.alt.trim().length > 0
          ) {
            return true;
          }

          return "Alt text is required when a blueprint plate image is set.";
        }),
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
      validation: (rule) =>
        rule
          .required()
          .min(2)
          .max(4)
          .custom((choices) => {
            if (!Array.isArray(choices)) {
              return true;
            }

            const outcomeRefs = choices
              .map((choice) => {
                if (!choice || typeof choice !== "object") {
                  return undefined;
                }

                const outcome = (choice as { outcome?: unknown }).outcome;

                if (!outcome || typeof outcome !== "object") {
                  return undefined;
                }

                return (outcome as { _ref?: unknown })._ref;
              })
              .filter((ref): ref is string => typeof ref === "string");
            const uniqueRefs = new Set(outcomeRefs);

            if (uniqueRefs.size === outcomeRefs.length) {
              return true;
            }

            return "Each visitor choice must link to a unique outcome.";
          }),
    }),
  ],
});
