import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blogCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
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
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    company: z.string(),
    kind: z.enum(['professional', 'personal']).default('professional'),
    role: z.string(),
    description: z.string(),
    dateRange: z.string(),
    sortDate: z.coerce.date().optional(),
    location: z.string(),
    order: z.number(),
    technologies: z.array(z.string()).default([]),
    achievements: z.array(z.string()).default([]),
    ogImage: z.string().optional(),
    screenshot: z
      .object({
        src: z.string(),
        alt: z.string(),
        caption: z.string(),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
      })
      .optional(),
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
