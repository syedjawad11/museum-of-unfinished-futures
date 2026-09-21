import { defineField, defineType } from "sanity";

export const eraType = defineType({
  name: "era",
  title: "Era",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required().min(3).max(80),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required().min(20).max(280),
    }),
    defineField({
      name: "accentColor",
      title: "Wing accent colour",
      description: "Hex colour of this wing's light, e.g. #f2b65a",
      type: "string",
      validation: (rule) =>
        rule
          .regex(/^#[0-9a-fA-F]{6}$/, {
            name: "hex colour",
          })
          .error("Wing accent colour must be a hex colour like #f2b65a."),
    }),
  ],
});
