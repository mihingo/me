import { z } from 'astro/zod';

const text = z.string().trim().min(1);
const httpUrl = z.url({ protocol: /^https?$/ });
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM with a valid month');
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase hyphenated slug');
const link = z.object({ label: text, url: httpUrl });
const metric = z.object({ value: text, label: text });

export const siteSchema = z.object({
  name: text,
  firstName: text,
  lastName: text,
  role: text,
  intro: text,
  current: text,
  availability: text,
  location: text,
  email: z.email(),
  social: z.array(link),
  resume: z.object({ path: z.string().regex(/^\/[a-zA-Z0-9_-]+\.pdf$/), label: text }),
  education: z.object({ degree: text, institution: text, years: text }),
  metrics: z.array(metric).length(3),
  capabilities: z.array(text).min(1),
  openSource: link.extend({ description: text }),
  seo: z.object({ title: text, description: text, ogAlt: text }),
});

export const experienceSchema = z.object({
  company: text,
  title: text,
  focus: text,
  start: month,
  end: z.union([month, z.literal('present')]),
  visible: z.boolean().default(true),
}).refine((role) => role.end === 'present' || role.end >= role.start, {
  path: ['end'], message: 'End must not precede start',
});

export const projectSchema = z.object({
  name: text,
  slug,
  category: text,
  role: text,
  period: text,
  featured: z.boolean().default(false),
  summary: text,
  outcome: text,
  metric,
  challenge: text,
  contribution: text,
  decisions: z.array(text).min(1),
  stack: z.array(text).min(1),
  link: link.optional(),
  order: z.number().int(),
  visible: z.boolean().default(true),
});

export type Experience = z.infer<typeof experienceSchema>;
export type Project = z.infer<typeof projectSchema>;
