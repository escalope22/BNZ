import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title:       z.string(),
    description: z.string(),
    pubDate:     z.coerce.date(),
    location:    z.string(),
    tags:        z.array(z.string()).default([]),
    draft:       z.boolean().default(false),
  }),
});

const projets = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projets' }),
  schema: ({ image }) => z.object({
    title:       z.string(),
    ariane:      z.string().optional(),
    location:    z.string(),
    date:        z.string(),
    imageAvant:  image(),
    imageApres:  image(),
    description: z.string(),
    lienYT:      z.string().optional(),
  }),
});

export const collections = { blog, projets };
