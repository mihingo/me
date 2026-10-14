import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { portraitAlt, siteSchema, experienceSchema, projectSchema, educationSchema, skillsSchema, impactSchema, communitySchema, approachSchema } from './lib/schemas';

export const collections = {
  site: defineCollection({
    loader: glob({ pattern: 'site.yaml', base: './src/content' }),
    // image() makes Astro resize, re-encode and strip metadata; the original is never published.
    schema: ({ image }) => siteSchema.extend({ portrait: z.object({ src: image(), alt: portraitAlt }).optional() }),
  }),
  experience: defineCollection({ loader: glob({ pattern: '*.yaml', base: './src/content/experience' }), schema: experienceSchema }),
  projects: defineCollection({ loader: glob({ pattern: '*.yaml', base: './src/content/projects' }), schema: projectSchema }),
  education: defineCollection({ loader: glob({ pattern: '*.yaml', base: './src/content/education' }), schema: educationSchema }),
  skills: defineCollection({ loader: glob({ pattern: '*.yaml', base: './src/content/skills' }), schema: skillsSchema }),
  impact: defineCollection({ loader: glob({ pattern: '*.yaml', base: './src/content/impact' }), schema: impactSchema }),
  approach: defineCollection({ loader: glob({ pattern: '*.yaml', base: './src/content/approach' }), schema: approachSchema }),
  community: defineCollection({ loader: glob({ pattern: '*.yaml', base: './src/content/community' }), schema: communitySchema }),
};
