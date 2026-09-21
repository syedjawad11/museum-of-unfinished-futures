import { defineArrayMember, defineField, defineType } from "sanity";

export const outcomeType = defineType({
  name: "outcome",
  title: "Outcome",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required().min(3).max(90),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "text",
      rows: 4,
      validation: (rule) => rule.required().min(30).max(520),
    }),
    defineField({
      name: "era",
      title: "Era",
      type: "reference",
      to: [{ type: "era" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "consequenceTags",
      title: "Consequence tags",
      description:
        "1-4 short lowercase tags that describe what this outcome does to the visitor's future, e.g. borrowed-time",
      type: "array",
      of: [
        defineArrayMember({
          type: "string",
          validation: (rule) =>
            rule
              .regex(/^[a-z0-9-]{2,32}$/, {
                name: "lowercase tag",
              })
              .error(
                "Consequence tags must be 2-32 lowercase letters, numbers, or hyphens.",
              ),
        }),
      ],
      validation: (rule) => rule.min(1).max(4).unique(),
    }),
    defineField({
      name: "leadsTo",
      title: "Leads to (next exhibit)",
      type: "reference",
      to: [{ type: "artifact" }],
      weak: false,
    }),
  ],
});
