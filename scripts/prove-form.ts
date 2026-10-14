// Builds with a placeholder Formspree endpoint, mocks Formspree, and verifies the form end to end.
// No request ever reaches formspree.io. The normal (form-less) build is restored afterwards.
import { execFileSync } from 'node:child_process';
import { chromium, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { startPreview } from './preview';

const endpoint = 'https://formspree.io/f/xproofform';
const build = (env: NodeJS.ProcessEnv) => execFileSync('pnpm', ['build'], { stdio: 'inherit', env: { ...process.env, ...env } });
const out = process.env.FORM_SCREENSHOTS;
let server: Awaited<ReturnType<typeof startPreview>> | undefined;
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;

async function fill(page: Page) {
  await page.getByLabel('Name', { exact: true }).fill('Ada Lovelace');
  await page.getByLabel('Email', { exact: true }).fill('ada@example.org');
  await page.getByLabel('Message', { exact: true }).fill('I would like to talk about a role.');
}

try {
  build({ PUBLIC_FORMSPREE_ENDPOINT: endpoint });
  server = await startPreview(4343);
  browser = await chromium.launch();

  for (const viewport of [{ width: 375, height: 812 }, { width: 1366, height: 900 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const requests: { body: string; accept: string | null }[] = [];
    let reply = { status: 200, body: { ok: true } as object };
    await page.route('https://formspree.io/**', async (route) => {
      requests.push({ body: route.request().postData() ?? '', accept: route.request().headers().accept ?? null });
      await route.fulfill({ status: reply.status, contentType: 'application/json', body: JSON.stringify(reply.body) });
    });
    await page.goto(server.url);
    const form = page.locator('[data-contact-form]');
    await expect(form).toHaveAttribute('action', endpoint);
    await expect(form).toHaveAttribute('method', 'POST');
    await form.scrollIntoViewIfNeeded();

    await page.getByRole('button', { name: 'Send message' }).click();
    expect(requests, 'invalid form must not submit').toHaveLength(0);

    await fill(page);
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByRole('status')).toHaveText('Thank you — your message has been sent.');
    expect(requests).toHaveLength(1);
    expect(requests[0]!.accept).toBe('application/json');
    for (const value of ['Ada Lovelace', 'ada@example.org', 'I would like to talk about a role.', '_gotcha', 'Portfolio enquiry']) expect(requests[0]!.body).toContain(value);
    await expect(page.getByLabel('Message', { exact: true })).toHaveValue('');
    if (out) await form.screenshot({ path: `${out}/form-success-${viewport.width}.png` });

    reply = { status: 422, body: { errors: [{ message: 'Email is invalid.' }] } };
    await fill(page);
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByRole('status')).toContainText('Your message could not be sent. Email is invalid.');
    await expect(page.getByRole('status').getByRole('link', { name: 'kmihingo22@gmail.com' })).toHaveAttribute('href', 'mailto:kmihingo22@gmail.com');
    await expect(page.getByRole('button', { name: 'Send message' })).toBeEnabled();

    await page.unroute('https://formspree.io/**');
    await page.route('https://formspree.io/**', (route) => route.abort('internetdisconnected'));
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByRole('status')).toContainText('Your message could not be sent.');
    await expect(page.getByLabel('Message', { exact: true })).toHaveValue('I would like to talk about a role.');
    if (out) await form.screenshot({ path: `${out}/form-error-${viewport.width}.png` });

    for (const scheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      const scan = await new AxeBuilder({ page }).include('#contact').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
      expect(scan.violations, `axe ${scheme}`).toEqual([]);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow, 'no horizontal overflow').toBe(0);
    await context.close();
  }

  const noJs = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
  const page = await noJs.newPage();
  let posted = '';
  await page.route('https://formspree.io/**', async (route) => {
    posted = `${route.request().method()} ${route.request().postData()}`;
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Formspree</title><p>Thanks</p>' });
  });
  await page.goto(server.url);
  await fill(page);
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page).toHaveTitle('Formspree');
  expect(posted).toMatch(/^POST .*Ada\+Lovelace/);
  await noJs.close();
  console.log('PASS: contact form validates, submits, reports success/errors, keeps input on failure, works without JS and passes axe.');
} finally {
  if (browser) await browser.close();
  if (server) await server.stop();
  build({ PUBLIC_FORMSPREE_ENDPOINT: '' });
  console.log('Restored the default build without a form endpoint.');
}
