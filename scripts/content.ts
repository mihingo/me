import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';
import { z } from 'astro/zod';
import { siteSchema, experienceSchema, projectSchema } from '../src/lib/schemas';

export function readContent<T extends z.ZodType>(path: string, schema: T): z.infer<T> {
  const result = schema.safeParse(parse(readFileSync(path, 'utf8')));
  if (!result.success) throw new Error(`${path}\n${result.error.issues.map((issue) => `  ${issue.path.join('.')}: ${issue.message}`).join('\n')}`);
  return result.data;
}

function readEntries<T extends z.ZodType>(collection: string, schema: T) {
  const directory = `src/content/${collection}`;
  return readdirSync(directory).filter((file) => file.endsWith('.yaml')).sort()
    .map((file) => readContent(`${directory}/${file}`, schema));
}

export function validateContent() {
  const site = readContent('src/content/site.yaml', siteSchema);
  const projects = readEntries('projects', projectSchema);
  const experience = readEntries('experience', experienceSchema);
  const slugs = new Set(['main', 'work', 'experience', 'contact', 'intro-title', 'work-title', 'experience-title', 'contact-title']);
  for (const project of projects) {
    for (const id of [project.slug, `${project.slug}-title`]) {
      if (slugs.has(id)) throw new Error(`projects: duplicate or reserved ID "${id}"`);
      slugs.add(id);
    }
  }
  const resume = `public${site.resume.path}`;
  if (!existsSync(resume) || !readFileSync(resume).subarray(0, 5).equals(Buffer.from('%PDF-'))) {
    throw new Error(`site.yaml resume.path: missing or invalid PDF at ${resume}`);
  }
  return { site, projects, experience };
}
