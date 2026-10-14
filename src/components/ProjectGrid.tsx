import { useState } from 'react';
import type { Project } from '../lib/schemas';
import { ui } from '../config/ui';

export default function ProjectGrid({ projects, base }: { projects: Project[]; base: string }) {
  const [filter, setFilter] = useState<string | null>(null);
  const tags = [...new Set(projects.flatMap((project) => project.stack))].sort();
  const visible = projects.filter((project) => filter === null || project.stack.includes(filter));
  return <div className="project-browser">
    <div className="project-filters js-only" role="group" aria-label={ui.filters}>
      {[null, ...tags].map((tag) => <button type="button" key={tag ?? 'all'} aria-pressed={filter === tag} onClick={() => setFilter(tag)}>{tag ?? ui.allProjects}</button>)}
    </div>
    <p className="filter-count js-only" role="status">{visible.length} {ui.results}</p>
    <ul className="project-grid">
      {visible.map((project) => <li className="small-project" key={project.slug}>
        <p className="status"><span className="status-mark" aria-hidden="true"></span>{ui.status[project.status]}</p>
        <h4>{project.name}</h4>
        <p>{project.summary}</p>
        {project.image && <img src={`${base}${project.image.src.replace(/^\//, '')}`} alt={project.image.alt} loading="lazy" width="1600" height="900" />}
        {project.highlights.length > 0 && <ul className="list">{project.highlights.map((item) => <li key={item}>{item}</li>)}</ul>}
        <p className="stack"><span className="meta">{ui.stack}</span> <span>{project.stack.join(' · ')}</span></p>
        <div className="actions">
          {project.caseStudy && <a className="text-link" href={`${base}projects/${project.slug}/`}>{ui.caseStudy} →</a>}
          {project.url && <a className="text-link" href={project.url}>{project.urlLabel || ui.projectLink} ↗</a>}
          {project.repo === 'private' ? <span className="muted small">{ui.privateRepo}</span> : project.repo && <a className="text-link" href={project.repo}>{ui.source} ↗</a>}
        </div>
      </li>)}
    </ul>
  </div>;
}
