import { test } from 'node:test';
import assert from 'node:assert/strict';
import { experienceSchema, projectSchema } from '../src/lib/schemas';
import { contrast, diagramLevels, duration, emphasis, groupRoles, localPath, plainText } from '../src/lib/content';
import { validateContent } from '../scripts/content';

const data = validateContent();
const microsoft = data.experience.find((entry) => entry.data.companyId === 'microsoft' && entry.data.visible)!.data;
test('all content validates, including WCAG AA tokens', () => assert.ok(data.site.name));
test('draft dates may be absent, published dates may not', () => {
  assert.ok(experienceSchema.safeParse({ ...microsoft, visible: false, start: undefined, end: undefined }).success);
  assert.equal(experienceSchema.safeParse({ ...microsoft, start: undefined }).success, false);
});
test('invalid and reversed months are rejected', () => {
  assert.equal(experienceSchema.safeParse({ ...microsoft, start: '2021-13' }).success, false);
  assert.equal(experienceSchema.safeParse({ ...microsoft, end: '2020-01' }).success, false);
});
test('new company roles are grouped and sorted without changing older entries', () => {
  const groups = groupRoles([...data.experience.map((entry) => entry.data), { ...microsoft, title: 'Test role', start: '2026-01' }]);
  assert.equal(groups.length, 2);
  assert.equal(groups[0]!.roles.length, 2);
  assert.equal(groups[0]!.roles[0]!.title, 'Test role');
  assert.equal(groups[0]!.roles[1]!.start, '2021-01');
});
test('durations use UTC and completed employment months inclusively', () => {
  assert.equal(duration('2019-01', '2020-12'), '2 yrs');
  assert.equal(duration('2021-01', 'present', new Date('2025-10-31T23:00:00Z')), '4 yrs 9 mos');
  assert.equal(duration('2026-10', 'present', new Date('2026-10-01T00:00:00Z')), '< 1 mo');
});
const psms = data.projects.find((entry) => entry.data.slug === 'psms')!.data;
test('architecture requires unique nodes and real edge references', () => {
  const project = psms;
  const diagram = project.architecture!;
  assert.equal(projectSchema.safeParse({ ...project, architecture: { ...diagram, edges: [{ from: 'missing', to: 'data', label: 'Invalid' }] } }).success, false);
  assert.equal(projectSchema.safeParse({ ...project, architecture: { ...diagram, nodes: [diagram.nodes[0], diagram.nodes[0]] } }).success, false);
});
test('diagrams reject cycles and lay out nodes by depth', () => {
  const diagram = psms.architecture!;
  assert.equal(projectSchema.safeParse({ ...psms, architecture: { ...diagram, edges: [...diagram.edges, { from: 'data', to: 'interface' }] } }).success, false);
  const copilot = data.projects.find((entry) => entry.data.slug === 'microsoft-365-copilot')!.data.architecture!;
  assert.deepEqual(diagramLevels(copilot).map((level) => level.length), [2, 1, 4]);
});
test('headline emphasis is parsed safely and stripped for metadata', () => {
  assert.deepEqual(emphasis('a *b* c'), [{ text: 'a ', em: false }, { text: 'b', em: true }, { text: ' c', em: false }]);
  assert.equal(plainText(data.site.headline).includes('*'), false);
});
test('every featured story is reachable from the hero index and honest about status', () => {
  const featured = data.projects.filter((entry) => entry.data.visible && entry.data.featured);
  assert.ok(featured.length >= 1);
  for (const { data: project } of featured) assert.ok(project.summary && project.role && project.status);
});
test('unsafe links and ambiguous private repositories are rejected', () => {
  const project = psms;
  assert.equal(projectSchema.safeParse({ ...project, url: 'javascript:alert(1)' }).success, false);
  assert.ok(projectSchema.safeParse({ ...project, repo: 'private' }).success);
});
test('asset paths support domain roots and GitHub project subpaths', () => {
  assert.equal(localPath('/resume.pdf', '/portfolio/'), '/portfolio/resume.pdf');
  assert.equal(localPath('/projects/psms/', '/'), '/projects/psms/');
});
test('all theme text combinations meet 4.5:1', () => {
  for (const mode of ['light', 'dark'] as const) {
    const theme = data.site.theme[mode];
    for (const foreground of ['text', 'muted', 'accent'] as const) {
      for (const background of ['background', 'surface'] as const) {
        assert.ok(contrast(theme[foreground], theme[background]) >= 4.5, `${mode}: ${foreground}/${background}`);
      }
    }
  }
});
