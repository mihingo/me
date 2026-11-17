import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PDFDocument } from 'pdf-lib';

test('identity, concise linear content and the original resume', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kelvin Mihingo.');
  await expect(page.locator('.current')).toHaveText('Applied AI at Microsoft');
  await expect(page.locator('.project h3')).toHaveText(['COPS', 'Microsoft 365 Copilot', 'Kenya Power']);
  await expect(page.locator('#psms .project-summary')).toHaveText('Command, Operations and Policing System.');
  await expect(page.getByRole('link', { name: 'COPS', exact: true })).toHaveAttribute('href', 'https://kenya.psms.africa');
  await expect(page.locator('.experience-row').first()).toContainText('Aug 2026');
  await expect(page.locator('.experience-row').first()).toContainText('LLM post-training & evaluation');
  expect((await page.locator('main').innerText()).split(/\s+/).length).toBeLessThan(350);

  const portrait = page.getByRole('img', { name: 'Portrait of Kelvin Mihingo' });
  await expect.poll(() => portrait.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  expect(await portrait.evaluate((image: HTMLImageElement) => image.currentSrc)).toMatch(/\.webp$/);
  const resumeHref = await page.getByRole('link', { name: 'Full resume' }).getAttribute('href');
  const resume = await request.get(resumeHref!);
  expect(resume.ok()).toBe(true);
  const bytes = await resume.body();
  expect(bytes.equals(readFileSync('public/resume.pdf')), 'build must not regenerate or replace the supplied resume').toBe(true);
  expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('resume labels and dash separators render without broken character codes', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.resume-link')).toHaveText('Resume');
  await expect(page.getByRole('link', { name: 'Full resume', exact: true })).toBeVisible();
  await expect(page.locator('#work .section-heading > .eyebrow')).toHaveText(/^01 — \d{2}$/);
  for (const separator of await page.locator('.role-dates > [aria-hidden="true"]').all()) {
    await expect(separator).toHaveText('—');
  }
  expect(await page.locator('main').innerText()).not.toMatch(/&(?:[a-z]+|#\d+|#x[\da-f]+)\s*;/i);
});

test('every link resolves and old project URLs lead to the corresponding work', async ({ page, request }) => {
  await page.goto('./');
  const hrefs = await page.locator('a[href]').evaluateAll((links) => links.map((link) => link.getAttribute('href')!));
  for (const href of new Set(hrefs)) {
    if (href.startsWith('mailto:')) { expect(href).toBe('mailto:kmihingo22@gmail.com'); continue; }
    if (/^https?:/.test(href)) { expect(href).not.toMatch(/example\.|localhost|#$/); continue; }
    const url = new URL(href, page.url());
    if (url.pathname !== new URL(page.url()).pathname) expect((await request.get(url.pathname)).ok(), href).toBe(true);
    else if (url.hash) await expect(page.locator(url.hash), href).toHaveCount(1);
  }
  for (const slug of ['psms', 'microsoft-365-copilot', 'kenya-power']) {
    await page.goto(`projects/${slug}/`);
    await expect(page).toHaveURL(new RegExp(`/#${slug}$`));
    await expect(page.locator(`#${slug}`)).toBeInViewport();
  }
  for (const path of ['og.png', 'favicon.svg', 'sitemap-index.xml', 'robots.txt']) {
    expect((await request.get(path)).ok(), path).toBe(true);
  }
});

test('project, social and resume links open isolated new tabs', async ({ page, context }) => {
  // Keep navigation deterministic; the identity test verifies the actual PDF separately.
  await context.route((url) => ['kenya.psms.africa', 'github.com', 'linkedin.com'].includes(url.hostname) || url.pathname.endsWith('/resume.pdf'),
    (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Link destination</title>' }));
  await page.goto('./');
  const portfolioUrl = page.url();
  const links = page.locator('.project-title-link, .resume-link, .open-source a, .social-links a, #experience .text-link');
  await expect(links).toHaveCount(6);
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).not.toHaveAttribute('download');
    if (!await link.isVisible()) continue;
    const destination = new URL((await link.getAttribute('href'))!, portfolioUrl).href;
    const [tab] = await Promise.all([page.waitForEvent('popup'), link.click()]);
    await tab.waitForURL(destination);
    expect(await tab.evaluate(() => window.opener === null)).toBe(true);
    await expect(page).toHaveURL(portfolioUrl);
    await tab.close();
  }
});

test('responsive layout has readable typography, no overflow or undersized links', async ({ page }) => {
  const viewportWidth = page.viewportSize()!.width;
  const widths = viewportWidth === 375 ? [320, 360, 375]
    : viewportWidth === 1366 ? [1024, 1280, 1366, 1440] : [viewportWidth];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./');
    await page.evaluate(() => document.fonts.ready);
    const failures = await page.evaluate(() => {
      const issues: string[] = [];
      if (document.documentElement.scrollWidth > innerWidth) issues.push('Horizontal overflow');
      for (const link of document.querySelectorAll<HTMLAnchorElement>('a')) {
        if (!link.checkVisibility() || link.classList.contains('skip-link')) continue;
        const rect = link.getBoundingClientRect();
        if (rect.height < 43.9 || rect.width < 23.9) issues.push(`Small target: ${link.textContent?.trim()} (${rect.width}x${rect.height})`);
      }
      if (innerWidth >= 1024) {
        const minimumSizes: [string, number][] = [
          ['.project-summary', 17],
          ['.project-outcome, .role-detail p, .education p, .current, .site-header a, .social-links a, .text-link, .open-source a, .open-source p', 16],
          ['.eyebrow, .index-number, .stack li, .project-meta, .role-dates, .site-footer', 14],
        ];
        for (const [selector, minimum] of minimumSizes) {
          for (const element of document.querySelectorAll<HTMLElement>(selector)) {
            if (!element.checkVisibility()) continue;
            const size = Number.parseFloat(getComputedStyle(element).fontSize);
            if (size < minimum) issues.push(`Small text: ${element.textContent?.trim()} (${size}px < ${minimum}px)`);
          }
        }
      }
      return issues;
    });
    expect(failures, `${width}px`).toEqual([]);
    const portrait = page.getByRole('img', { name: 'Portrait of Kelvin Mihingo' });
    const bounds = await portrait.boundingBox();
    expect(bounds!.width, `circular portrait at ${width}px`).toBe(bounds!.height);
    await expect(portrait).toHaveCSS('border-radius', '50%');
    await expect(portrait).toHaveCSS('border-top-style', 'solid');
    await expect(portrait).toHaveCSS('border-top-width', '1px');
  }
});

test('keyboard navigation and the complete experience work without JavaScript', async ({ browser, baseURL, page: configuredPage }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: configuredPage.viewportSize()! });
  const page = await context.newPage();
  await page.goto('./');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  for (const [label, id] of [['Work', 'work'], ['Experience', 'experience'], ['Contact', 'contact']]) {
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
  await expect(page.locator('.project')).toHaveCount(3);
  await expect(page.locator('.experience-row')).toHaveCount(5);
  await expect(page.getByRole('link', { name: 'Full resume' })).toHaveAttribute('target', '_blank');
  await context.close();
});

test('WCAG AA accessibility on the portfolio and 404', async ({ page }) => {
  for (const path of ['./', '404/']) {
    await page.goto(path);
    const scan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
    expect(scan.violations).toEqual([]);
  }
});

test('SEO, zero runtime scripts, no third parties and reduced motion', async ({ page, baseURL }) => {
  const thirdParties: string[] = [];
  const scripts: string[] = [];
  page.on('request', (request) => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(baseURL!).origin) thirdParties.push(request.url());
    if (request.resourceType() === 'script') scripts.push(request.url());
  });
  await page.goto('./');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Nairobi/);
  for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) {
    await expect(page.locator(selector)).toHaveAttribute('content', /COPS, a unified platform for modern policing/);
  }
  const origin = process.env.SITE_URL || 'https://mihingo.github.io';
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new URL(new URL(baseURL!).pathname, origin).href);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og.png$/);
  const person = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
  expect(person['@type']).toBe('Person');
  await expect(page.locator('script:not([type="application/ld+json"])')).toHaveCount(0);
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(248, 247, 244)');
  expect(thirdParties).toEqual([]);
  expect(scripts).toEqual([]);
  await page.goto('404/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});

test('print layout remains a single clean A4 page', async ({ page }) => {
  test.skip(page.viewportSize()!.width !== 1600, 'Print output is viewport independent.');
  await page.goto('./');
  await page.emulateMedia({ media: 'print' });
  const bytes = await page.pdf({ preferCSSPageSize: true });
  expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
});
