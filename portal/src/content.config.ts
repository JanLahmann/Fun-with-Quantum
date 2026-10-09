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
    // Playable right on the page (no Binder): the game page renders its web component first.
    webGame: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      door: z.enum(['play', 'build', 'learn']),
      tagline: z.string(),
      icon: z.string(),
      order: z.number(),
      url: z.string().url().optional(),
      repoUrl: z.string().url().optional(),
      status: z.enum(['live', 'coming-soon', 'legacy']).default('live'),
      facts: z.array(z.string()).default([]),
      // The Qiskit ecosystem page (ibm.com/quantum/ecosystem) — only for projects
      // that are (part of) a listed member; controls the ecosystem badge. Entangible is a member but
      // not on that page yet (2026-10), so its badge links to its member file.
      ecosystemUrl: z.string().url().optional(),
      // Photo shown on the right of the project row.
      image: image().optional(),
      imageAlt: z.string().optional(),
      // Looping gameplay clip from /public, shown where a photo would be (used when there is no image).
      video: z.string().optional(),
    }),
});

export const collections = { games, projects };
