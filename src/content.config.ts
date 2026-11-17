import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { siteSchema, experienceSchema, projectSchema } from './lib/schemas';

export const collections = {
  site: defineCollection({ loader: glob({ pattern: 'site.yaml', base: './src/content' }), schema: siteSchema }),
  experience: defineCollection({ loader: glob({ pattern: '*.yaml', base: './src/content/experience' }), schema: experienceSchema }),
  projects: defineCollection({ loader: glob({ pattern: '*.yaml', base: './src/content/projects' }), schema: projectSchema }),
};
