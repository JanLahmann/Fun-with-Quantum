import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const games = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/games' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    concept: z.string(),
    icon: z.string(),
    order: z.number(),
    duration: z.string(),
    audience: z.string(),
    binderUrl: z.string().url(),
    notebook: z.string(),
    theoryUrl: z.string().url().optional(),
    featured: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    door: z.enum(['play', 'build', 'learn']),
    tagline: z.string(),
    icon: z.string(),
    order: z.number(),
    url: z.string().url().optional(),
    repoUrl: z.string().url().optional(),
    status: z.enum(['live', 'coming-soon', 'legacy']).default('live'),
    facts: z.array(z.string()).default([]),
  }),
});

export const collections = { games, projects };
