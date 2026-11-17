import type { Experience, Project } from './schemas';

export function orderedProjects(projects: Project[]) {
  return projects.filter((project) => project.visible)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export function orderedRoles(roles: Experience[]) {
  return roles.filter((role) => role.visible)
    .sort((a, b) => b.start.localeCompare(a.start) || a.title.localeCompare(b.title));
}

export function formatMonth(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${value}-01T00:00:00Z`));
}

export function localPath(path: string, base = import.meta.env.BASE_URL) {
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
