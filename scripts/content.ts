import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { z } from 'astro/zod';
import { siteSchema, experienceSchema, projectSchema, skillsSchema, impactSchema, communitySchema, educationSchema, approachSchema } from '../src/lib/schemas';
import { contrast } from '../src/lib/content';

export function readContent<T extends z.ZodType>(path: string, schema: T): z.infer<T> {
  const result = schema.safeParse(parse(readFileSync(path, 'utf8')));
  if (!result.success) throw new Error(`${path}\n${result.error.issues.map((issue) => `  ${issue.path.join('.')}: ${issue.message}`).join('\n')}`);
  return result.data;
}

export function readEntries<T extends z.ZodType>(collection: string, schema: T) {
  const directory = `src/content/${collection}`;
  return readdirSync(directory).filter((file) => file.endsWith('.yaml')).sort().map((file) => ({
    id: file.replace(/\.yaml$/, ''), data: readContent(`${directory}/${file}`, schema),
  }));
}

export function loadContent() {
  return {
    site: readContent('src/content/site.yaml', siteSchema),
    experience: readEntries('experience', experienceSchema),
    projects: readEntries('projects', projectSchema),
    education: readEntries('education', educationSchema),
    skills: readContent('src/content/skills/skills.yaml', skillsSchema),
    impact: readContent('src/content/impact/impact.yaml', impactSchema),
    approach: readContent('src/content/approach/approach.yaml', approachSchema),
    community: readEntries('community', communitySchema),
  };
}

export function validateContent() {
  const data = loadContent();
  const slugs = new Set<string>();
  for (const { id, data: project } of data.projects) {
    if (slugs.has(project.slug)) throw new Error(`projects: duplicate slug "${project.slug}"`);
    slugs.add(project.slug);
    const images = [project.screens?.desktop, project.screens?.mobile].filter((image) => image !== undefined);
    for (const image of images) {
      for (const width of image.widths) {
        const file = `public${image.base}-${width}.webp`;
        if (!existsSync(file)) throw new Error(`projects/${id}.yaml: missing screenshot ${file}`);
      }
    }
    if (project.image && !existsSync(`public${project.image.src}`)) throw new Error(`projects/${id}.yaml: missing image public${project.image.src}`);
  }
  if (data.site.portrait) {
    const file = path.resolve('src/content', data.site.portrait.src);
    if (!file.startsWith(path.resolve('src'))) throw new Error('site.yaml portrait.src must point inside src/ so the original is never published');
    if (!existsSync(file)) throw new Error(`site.yaml portrait.src: missing ${path.relative('.', file)}`);
  }
  const companies = new Map<string, string>();
  for (const { data: role } of data.experience) {
    const existing = companies.get(role.companyId);
    if (existing && existing !== role.company) throw new Error(`experience: companyId "${role.companyId}" has inconsistent company names`);
    companies.set(role.companyId, role.company);
  }
  const anchors = new Set(['#main', '#hero-title', '#approach', '#capabilities', '#record', '#impact', '#experience', '#community', '#education', '#contact']);
  const visibleProjects = data.projects.filter((entry) => entry.data.visible);
  if (visibleProjects.length) anchors.add('#work');
  for (const entry of visibleProjects) if (entry.data.featured) anchors.add(`#${entry.data.slug}`);
  for (const item of data.site.nav) {
    if (item.href.startsWith('#') && !anchors.has(item.href)) throw new Error(`site.yaml nav: "${item.href}" does not point to a rendered section`);
  }
  for (const mode of ['dark', 'light'] as const) {
    const theme = data.site.theme[mode];
    for (const foreground of ['text', 'muted', 'accent'] as const) {
      for (const background of ['background', 'surface'] as const) {
        const ratio = contrast(theme[foreground], theme[background]);
        if (ratio < 4.5) throw new Error(`site.yaml theme.${mode}: ${foreground}/${background} contrast is ${ratio.toFixed(2)}:1; requires 4.5:1`);
      }
    }
  }
  return data;
}
