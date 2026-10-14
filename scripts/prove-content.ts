import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { parse, stringify } from 'yaml';
import { chromium, expect } from '@playwright/test';
import { startPreview } from './preview';

const id = `proof-${Date.now()}`;
const rolePath = `src/content/experience/${id}.yaml`;
const projectPaths = [`src/content/projects/${id}-a.yaml`, `src/content/projects/${id}-b.yaml`];
const run = (args: string[]) => execFileSync('pnpm', args, { stdio: 'inherit' });
let server: Awaited<ReturnType<typeof startPreview>> | undefined;
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  run(['new', 'experience', id]);
  const role = parse(readFileSync(rolePath, 'utf8'));
  Object.assign(role, { companyId: 'microsoft', company: 'Microsoft', title: 'Configurability test role', start: '2026-09', end: 'present', location: 'Nairobi', visible: true, summary: 'Temporary test entry.', bullets: ['Temporary test contribution.'], tags: ['Test'] });
  writeFileSync(rolePath, stringify(role));
  for (const [index, path] of projectPaths.entries()) {
    const slug = `${id}-${index === 0 ? 'a' : 'b'}`;
    run(['new', 'projects', slug]);
    const project = parse(readFileSync(path, 'utf8'));
    Object.assign(project, { name: `Temporary project ${index}`, role: 'Test', summary: 'Temporary filter fixture.', visible: true, stack: [index === 0 ? 'TypeScript' : 'Java'], order: index, repo: 'private' });
    writeFileSync(path, stringify(project));
  }
  run(['build']);
  server = await startPreview(4342);
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(server.url);
  await expect(page.locator('[data-company="microsoft"]')).toHaveCount(1);
  await expect(page.locator('[data-company="microsoft"] .role-title')).toHaveText(['Configurability test role', 'Software Engineer']);
  await expect(page.locator('[data-company]')).toHaveCount(2);
  await page.locator('.project-browser').scrollIntoViewIfNeeded();
  await page.locator('astro-island').evaluate((element) => new Promise<void>((resolve) => {
    if (!element.hasAttribute('ssr')) resolve();
    else element.addEventListener('astro:hydrate', () => resolve(), { once: true });
  }));
  await page.getByRole('button', { name: 'Java', exact: true }).click();
  await expect(page.locator('.small-project h4')).toHaveText(['Temporary project 1']);
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(page.locator('.small-project h4')).toHaveText(['Temporary project 0', 'Temporary project 1']);
  const noJsContext = await browser.newContext({ javaScriptEnabled: false });
  const noJs = await noJsContext.newPage();
  await noJs.goto(server.url);
  await expect(noJs.locator('.small-project h4')).toHaveCount(2);
  await expect(noJs.getByRole('button', { name: 'All', exact: true })).toBeHidden();
  await noJsContext.close();
  console.log('PASS: data-only experience groups/sorts; project filtering works; all projects remain available without JS.');
  await browser.close(); browser = undefined;
  await server.stop(); server = undefined;

  role.visible = false;
  writeFileSync(rolePath, stringify(role));
  run(['build']);
  const built = readFileSync('dist/index.html', 'utf8');
  if (built.includes('Configurability test role')) throw new Error('Hidden role leaked into built HTML');
  console.log('PASS: visible:false removes the new role from generated HTML.');

  role.visible = true;
  role.start = '2026-13';
  writeFileSync(rolePath, stringify(role));
  const malformed = spawnSync('pnpm', ['build'], { encoding: 'utf8' });
  const output = `${malformed.stdout}\n${malformed.stderr}`;
  if (malformed.status === 0 || !output.includes('Use YYYY-MM with a valid month') || !output.includes(rolePath)) throw new Error(`Malformed entry did not fail with the expected path and message:\n${output}`);
  console.log(`PASS: malformed YAML build rejected clearly:\n${output.split('\n').filter((line) => line.includes(rolePath) || line.includes('Use YYYY-MM')).join('\n')}`);
} finally {
  if (browser) await browser.close();
  if (server) await server.stop();
  for (const path of [rolePath, ...projectPaths]) if (existsSync(path)) unlinkSync(path);
  run(['build']);
  console.log('Temporary entries removed; clean production build restored.');
}
