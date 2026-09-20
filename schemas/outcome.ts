import { defineField, defineType } from "sanity";

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
  ],
});
