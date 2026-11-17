import { test } from 'node:test';
import assert from 'node:assert/strict';
import { experienceSchema, projectSchema, siteSchema } from '../src/lib/schemas';
import { orderedProjects, orderedRoles, localPath } from '../src/lib/content';
import { validateContent } from '../scripts/content';

const data = validateContent();
const role = data.experience[0]!;
const project = data.projects[0]!;

test('rejects missing, invalid and reversed employment dates', () => {
  for (const dates of [
    { start: undefined }, { start: '2021-13' }, { start: '2026-08', end: '2026-07' },
  ]) assert.equal(experienceSchema.safeParse({ ...role, ...dates }).success, false);
  assert.ok(experienceSchema.safeParse({ ...role, start: '2026-08', end: 'present' }).success);
});

test('orders published roles and work without mutating their source', () => {
  const first = { ...role, title: 'First', start: '2020-01', end: '2020-12' };
  const current = { ...role, title: 'Current', start: '2026-08', end: 'present' };
  const hidden = { ...current, title: 'Draft', visible: false };
  const input = [first, hidden, current];
  assert.deepEqual(orderedRoles(input).map((entry) => entry.title), ['Current', 'First']);
  assert.equal(input[0], first);
  assert.deepEqual(orderedProjects([
    { ...project, name: 'Later', order: 2 },
    { ...project, name: 'Hidden', order: 0, visible: false },
    { ...project, name: 'Earlier', order: 1 },
  ]).map((entry) => entry.name), ['Earlier', 'Later']);
});

test('rejects executable URLs and resume paths outside the public root', () => {
  assert.equal(projectSchema.safeParse({ ...project, link: { label: 'Open', url: 'javascript:alert(1)' } }).success, false);
  assert.equal(siteSchema.safeParse({ ...data.site, resume: { path: '/../resume.pdf', label: 'Resume' } }).success, false);
});

test('projects can list more than five technologies', () => {
  const stack = ['React', 'TypeScript', 'GraphQL', 'Relay', 'Storybook', 'Playwright', '.NET'];
  assert.ok(projectSchema.safeParse({ ...project, stack }).success);
});

test('asset and navigation paths work at both the domain root and a repository subpath', () => {
  for (const base of ['/me', '/me/']) {
    assert.equal(localPath('/resume.pdf', base), '/me/resume.pdf');
    assert.equal(`${localPath('/', base)}#work`, '/me/#work');
  }
  assert.equal(localPath('/resume.pdf', '/'), '/resume.pdf');
});
