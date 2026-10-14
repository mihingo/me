import { z } from 'astro/zod';

const text = z.string().trim().min(1);
const httpUrl = z.url({ protocol: /^https?$/ });
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM with a valid month');
const color = z.string().regex(/^#[0-9a-f]{6}$/i, 'Use a six-digit hex color');
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase hyphenated slug');
const publicPath = z.string().regex(/^\/[a-zA-Z0-9/_.-]+$/, 'Use a path inside public/, starting with /');
const theme = z.object({
  background: color, surface: color, border: color, text: color, muted: color, accent: color,
});
const font = z.enum(['Instrument Serif', 'Inter Variable', 'JetBrains Mono Variable']);
const link = z.object({ label: text, url: httpUrl });

export const siteSchema = z.object({
  name: text,
  monogram: text,
  role: text,
  // Wrap words in *asterisks* to set them in the italic display face.
  headline: text,
  lede: text,
  about: text,
  // Path is relative to site.yaml; Astro optimises it and strips metadata (see content.config.ts).
  portrait: z.object({ src: z.string().regex(/^\.{1,2}\/[a-zA-Z0-9/_.-]+\.(jpe?g|png|webp|avif)$/, 'Use a relative path to an image in src/, e.g. ../assets/portrait.jpeg'), alt: text }).optional(),
  location: text,
  relocation: z.array(text),
  email: z.email(),
  phone: text.optional(),
  social: z.array(link),
  resume: z.object({ path: z.string().regex(/^\/[a-zA-Z0-9/_.-]+\.pdf$/), label: text }),
  now: z.array(text),
  nav: z.array(z.object({ label: text, href: z.union([z.string().regex(/^#[a-z][a-z0-9-]*$/), httpUrl]) })),
  seo: z.object({ title: text, description: text, ogAlt: text }),
  theme: z.object({
    dark: theme, light: theme,
    fonts: z.object({ heading: font, body: font, mono: font }),
    radius: z.string().regex(/^\d+(?:\.\d+)?(?:px|rem)$/),
  }),
  analytics: z.discriminatedUnion('enabled', [
    z.object({ enabled: z.literal(false) }),
    z.object({ enabled: z.literal(true), provider: z.literal('cloudflare'), token: z.uuid() }),
  ]),
});

export const experienceSchema = z.object({
  companyId: slug,
  company: text,
  companyUrl: httpUrl.optional(),
  title: text,
  start: month.optional(),
  end: z.union([month, z.literal('present')]).optional(),
  location: text,
  mode: z.enum(['onsite', 'hybrid', 'remote']).optional(),
  visible: z.boolean().default(true),
  featured: z.boolean().default(false),
  summary: text,
  bullets: z.array(text),
  tags: z.array(text),
  client: text.optional(),
}).superRefine((role, ctx) => {
  if (role.visible) {
    for (const field of ['start', 'end'] as const) {
      if (!role[field]) ctx.addIssue({ code: 'custom', path: [field], message: 'Published roles require a date' });
    }
    if (!role.bullets.length) ctx.addIssue({ code: 'custom', path: ['bullets'], message: 'Published roles require at least one bullet' });
  }
  if (role.start && role.end && role.end !== 'present' && role.end < role.start) {
    ctx.addIssue({ code: 'custom', path: ['end'], message: 'End must not precede start' });
  }
});

const architecture = z.object({
  label: text,
  description: text,
  nodes: z.array(z.object({ id: slug, label: text, detail: text.optional() })).min(1).max(10),
  edges: z.array(z.object({ from: slug, to: slug, label: text.optional() })),
}).superRefine((diagram, ctx) => {
  const ids = new Set(diagram.nodes.map((node) => node.id));
  if (ids.size !== diagram.nodes.length) ctx.addIssue({ code: 'custom', path: ['nodes'], message: 'Node IDs must be unique' });
  diagram.edges.forEach((edge, index) => {
    for (const field of ['from', 'to'] as const) {
      if (!ids.has(edge[field])) ctx.addIssue({ code: 'custom', path: ['edges', index, field], message: `Unknown node "${edge[field]}"` });
    }
    if (edge.from === edge.to) ctx.addIssue({ code: 'custom', path: ['edges', index], message: 'An edge cannot point to its own node' });
  });
  const outgoing = new Map(diagram.nodes.map((node) => [node.id, diagram.edges.filter((edge) => edge.from === node.id).map((edge) => edge.to)]));
  const visiting = new Set<string>();
  const done = new Set<string>();
  const cyclic = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (done.has(id)) return false;
    visiting.add(id);
    const found = (outgoing.get(id) ?? []).some(cyclic);
    visiting.delete(id);
    done.add(id);
    return found;
  };
  if (diagram.nodes.some((node) => cyclic(node.id))) ctx.addIssue({ code: 'custom', path: ['edges'], message: 'Diagram edges must not form a cycle' });
});

const responsiveImage = z.object({
  // Files are named `${base}-${width}.webp`, e.g. /images/psms/portal-desktop-960.webp
  base: publicPath,
  widths: z.array(z.number().int().positive()).min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: text,
});

export const projectSchema = z.object({
  name: text,
  shortName: text.optional(),
  slug,
  kicker: text.optional(),
  role: text,
  status: z.enum(['live', 'building', 'shipped', 'delivered', 'archived']),
  statusNote: text.optional(),
  layout: z.enum(['feature', 'split', 'ledger']).default('split'),
  url: httpUrl.optional(),
  urlLabel: text.optional(),
  repo: z.union([httpUrl, z.literal('private')]).optional(),
  summary: text,
  highlights: z.array(text),
  outcome: text.optional(),
  stack: z.array(text).min(1),
  image: z.object({ src: publicPath, alt: text }).optional(),
  screens: z.object({
    label: text,
    caption: text,
    desktop: responsiveImage,
    mobile: responsiveImage.optional(),
  }).optional(),
  comparison: z.object({
    label: text,
    unit: text,
    before: z.object({ label: text, value: z.number().positive(), display: text }),
    after: z.object({ label: text, value: z.number().positive(), display: text }),
    caption: text,
  }).optional(),
  metrics: z.array(z.object({ value: text, label: text, detail: text.optional() })).default([]),
  featured: z.boolean().default(false),
  // Set false when the work is already covered by an experience entry in the generated résumé.
  inResume: z.boolean().default(true),
  order: z.number().int().default(0),
  visible: z.boolean().default(true),
  caseStudy: z.object({
    problem: text, approach: text, outcomes: z.array(text),
    sections: z.array(z.object({ heading: text, body: text })).default([]),
  }).optional(),
  architecture: architecture.optional(),
});

export const educationSchema = z.object({
  degree: text, institution: text,
  start: z.number().int().min(1900), end: z.number().int().min(1900),
  classification: text, order: z.number().int().default(0), visible: z.boolean().default(true),
}).refine((entry) => entry.end >= entry.start, 'End must not precede start');
export const skillsSchema = z.object({
  groups: z.array(z.object({
    name: text,
    evidence: text.optional(),
    items: z.array(text).min(1),
    order: z.number().int().default(0),
  })),
});
export const impactSchema = z.object({
  items: z.array(z.object({ value: text, label: text, detail: text })),
});
export const approachSchema = z.object({
  principles: z.array(z.object({ title: text, body: text, evidence: text })).min(1),
});
export const communitySchema = z.object({
  title: text, description: text,
  icon: z.enum(['mentoring', 'teaching', 'curriculum']),
  order: z.number().int().default(0), visible: z.boolean().default(true),
});
export type Site = z.infer<typeof siteSchema>;
export const portraitAlt = text;
export type Experience = z.infer<typeof experienceSchema>;
export type Project = z.infer<typeof projectSchema>;
export type ResponsiveImage = z.infer<typeof responsiveImage>;
export type Diagram = z.infer<typeof architecture>;
