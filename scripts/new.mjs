import { writeFileSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { stringify } from 'yaml';

const [kind, suppliedSlug] = process.argv.slice(2);
const templates = {
  experience: { companyId: 'company-id', company: '[TODO: Company]', title: '[TODO: Role title]', location: '[TODO: Location]', visible: false, featured: false, summary: '[TODO: One-line summary]', bullets: ['[TODO: Confirmed contribution]'], tags: [] },
  projects: { name: '[TODO: Project name]', slug: 'project', kicker: '[TODO: Context, e.g. Founder project]', role: '[TODO: Your role]', status: 'building', layout: 'split', visible: false, featured: false, order: 10, summary: '[TODO: The problem and context]', highlights: [], stack: ['[TODO: Technology]'] },
  education: { degree: '[TODO: Degree]', institution: '[TODO: Institution]', start: 2000, end: 2000, classification: '[TODO: Classification]', visible: false, order: 10 },
  community: { title: '[TODO: Title]', description: '[TODO: Confirmed contribution]', icon: 'mentoring', visible: false, order: 10 },
};
if (!Object.hasOwn(templates, kind)) {
  console.error('Usage: pnpm new <experience|projects|education|community> [lowercase-slug]');
  process.exit(1);
}
const slug = suppliedSlug || `draft-${randomUUID().slice(0, 8)}`;
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error('The filename must be a lowercase hyphenated slug.');
  process.exit(1);
}
const template = { ...templates[kind] };
if (kind === 'projects') template.slug = slug;
const directory = `src/content/${kind}`;
mkdirSync(directory, { recursive: true });
const path = `${directory}/${slug}.yaml`;
const notes = kind === 'experience' ? '# Add quoted start: "YYYY-MM" and end: "YYYY-MM" (or present) before publishing.\n' : '';
writeFileSync(path, `# TODO: Replace all placeholders and verify facts before setting visible: true.\n${notes}${stringify(template)}`, { flag: 'wx' });
console.log(`Created ${path}`);
