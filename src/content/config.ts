import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    author: z.string().default('Kushal Patankar'),
    category: z.string().optional(),
    tags: z.array(z.string()).default([]),
    readTime: z.string().optional(),
    draft: z.boolean().default(false),
    ogImage: z.string().optional(),
  }),
});

const workCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    company: z.string(),
    role: z.string(),
    description: z.string(),
    dateRange: z.string(),
    location: z.string(),
    order: z.number(),
    technologies: z.array(z.string()).default([]),
    achievements: z.array(z.string()).default([]),
    ogImage: z.string().optional(),
    externalUrl: z.string().url().optional(),
    stats: z
      .array(
        z.object({
          value: z.string(),
          label: z.string(),
        })
      )
      .optional(),
    outcome: z.string().optional(),
  }),
});

export const collections = {
  blog: blogCollection,
  work: workCollection,
};
