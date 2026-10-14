import type { Diagram, Experience, ResponsiveImage } from './schemas';

export type PublishedExperience = Experience & { start: string; end: string };

/** Splits `*emphasised*` phrases so components can render them without HTML injection. */
export function emphasis(value: string) {
  return value.split(/(\*[^*]+\*)/).filter(Boolean).map((part) => part.startsWith('*') && part.endsWith('*')
    ? { text: part.slice(1, -1), em: true }
    : { text: part, em: false });
}

export function plainText(value: string) {
  return value.replace(/\*([^*]+)\*/g, '$1');
}

export function srcset(image: ResponsiveImage, base = import.meta.env.BASE_URL) {
  return image.widths.map((width) => `${localPath(`${image.base}-${width}.webp`, base)} ${width}w`).join(', ');
}

export function fallbackSrc(image: ResponsiveImage, base = import.meta.env.BASE_URL) {
  const widths = [...image.widths].sort((a, b) => a - b);
  const width = widths.find((candidate) => candidate >= image.width) ?? widths.at(-1)!;
  return localPath(`${image.base}-${width}.webp`, base);
}

/** Groups diagram nodes into columns by their longest distance from a source node. */
export function diagramLevels(diagram: Diagram) {
  const level = new Map(diagram.nodes.map((node) => [node.id, 0]));
  for (let pass = 0; pass < diagram.nodes.length; pass++) {
    for (const edge of diagram.edges) {
      const next = level.get(edge.from)! + 1;
      if (next > level.get(edge.to)!) level.set(edge.to, next);
    }
  }
  const count = Math.max(...level.values()) + 1;
  return Array.from({ length: count }, (_, index) => diagram.nodes.filter((node) => level.get(node.id) === index));
}

export function isPublishedRole(role: Experience): role is PublishedExperience {
  return role.visible && typeof role.start === 'string' && typeof role.end === 'string';
}

export function groupRoles(roles: Experience[]) {
  const groups = new Map<string, { id: string; company: string; companyUrl?: string; roles: PublishedExperience[] }>();
  const sorted = roles.filter(isPublishedRole).sort((a, b) => b.start.localeCompare(a.start) || a.title.localeCompare(b.title));
  for (const role of sorted) {
    const group = groups.get(role.companyId);
    if (group) group.roles.push(role);
    else groups.set(role.companyId, { id: role.companyId, company: role.company, companyUrl: role.companyUrl, roles: [role] });
  }
  return [...groups.values()];
}

export function formatMonth(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}-01T00:00:00Z`));
}

export function duration(start: string, end: string, now = new Date()) {
  const startDate = new Date(`${start}-01T00:00:00Z`);
  const endDate = end === 'present' ? now : new Date(`${end}-01T00:00:00Z`);
  const months = Math.max(0, (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 + endDate.getUTCMonth() - startDate.getUTCMonth() + (end === 'present' ? 0 : 1));
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  return [years ? `${years} ${years === 1 ? 'yr' : 'yrs'}` : '', remainder ? `${remainder} ${remainder === 1 ? 'mo' : 'mos'}` : ''].filter(Boolean).join(' ') || '< 1 mo';
}

export function localPath(path: string, base = import.meta.env.BASE_URL) {
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export function relativeLuminance(hex: string) {
  const channels = [1, 3, 5].map((index) => {
    const s = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}

export function contrast(a: string, b: string) {
  const values = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}
