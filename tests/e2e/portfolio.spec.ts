import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PDFDocument } from 'pdf-lib';

const isCompact = (page: Page) => page.viewportSize()!.width < 768;
const stories = ['psms', 'microsoft-365-copilot', 'kenya-power'];

test('identity, work index, stories, assets and case study', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kelvin Mihingo N.');
  await expect(page.locator('.hero-statement')).toContainText('AI-agent platforms');
  await expect(page.getByText('[TODO:', { exact: false })).toHaveCount(0);
  await expect(page.getByText('*', { exact: true })).toHaveCount(0);

  const portrait = page.getByRole('img', { name: 'Portrait of Kelvin Mihingo N.' });
  await expect(portrait).toBeVisible();
  await expect.poll(() => portrait.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  expect(await portrait.evaluate((image: HTMLImageElement) => image.currentSrc)).toMatch(/\.(avif|webp)$/);
  expect((await request.get('images/passport.jpeg')).status(), 'original photo must not be published').toBe(404);
  await expect(page.locator('form[data-contact-form]'), 'form only renders when an endpoint is configured').toHaveCount(0);

  const index = page.getByRole('navigation', { name: 'Selected work' }).getByRole('link');
  await expect(index).toHaveCount(stories.length);
  for (const [position, slug] of stories.entries()) {
    await expect(index.nth(position)).toHaveAttribute('href', `#${slug}`);
    await expect(page.locator(`article#${slug}`)).toHaveCount(1);
  }
  await index.nth(1).click();
  await expect(page).toHaveURL(/#microsoft-365-copilot$/);

  await expect(page.locator('[data-company]')).toHaveCount(2);
  const olderRole = page.locator('[data-company="minsait"] details');
  await expect(olderRole).not.toHaveAttribute('open');
  await olderRole.locator('summary').click();
  await expect(olderRole).toHaveAttribute('open');
  await expect(olderRole.getByText('2 yrs', { exact: true })).toBeVisible();

  const resumeUrl = await page.getByRole('link', { name: 'Download résumé' }).first().getAttribute('href');
  const resume = await request.get(resumeUrl!);
  expect(resume.ok()).toBeTruthy();
  expect((await PDFDocument.load(await resume.body())).getPageCount()).toBe(1);
  for (const path of ['og.png', 'favicon.svg', 'sitemap-index.xml', 'robots.txt']) {
    expect((await request.get(path)).ok(), path).toBeTruthy();
  }

  await page.locator('#psms').scrollIntoViewIfNeeded();
  const screenshot = page.locator(isCompact(page) ? '#psms .phone img' : '#psms .browser img');
  await screenshot.scrollIntoViewIfNeeded();
  await expect.poll(() => screenshot.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(page.locator('#psms figcaption')).toContainText('Portal statistics are cropped out');

  await page.getByRole('link', { name: 'Read the case study' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Police Service Management System');
  await expect(page.getByRole('heading', { name: 'Where it stands' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('every link resolves: anchors exist and local files load', async ({ page, request }) => {
  for (const path of ['./', 'projects/psms/']) {
    await page.goto(path);
    const hrefs = await page.locator('a[href]').evaluateAll((links) => links.map((link) => link.getAttribute('href')!));
    for (const href of new Set(hrefs)) {
      if (href.startsWith('mailto:')) { expect(href).toBe('mailto:kmihingo22@gmail.com'); continue; }
      if (/^https?:/.test(href)) { expect(href, 'no placeholder links').not.toMatch(/example\.|localhost|#$/); continue; }
      const url = new URL(href, page.url());
      if (url.pathname !== new URL(page.url()).pathname) expect((await request.get(url.pathname)).ok(), href).toBeTruthy();
      else if (url.hash) await expect(page.locator(url.hash), href).toHaveCount(1);
    }
  }
});

test('no overflow, adequate targets and responsive figures in both themes', async ({ page }) => {
  const widths = page.viewportSize()!.width === 375 ? [375, 360] : [page.viewportSize()!.width];
  for (const width of widths) {
    await page.setViewportSize({ width, height: page.viewportSize()!.height });
    await page.goto('./');
    for (const theme of ['dark', 'light']) {
      await page.getByLabel('Color theme').selectOption(theme);
      await page.evaluate(() => document.fonts.ready);
      const failures = await page.evaluate(() => {
        const issues: string[] = [];
        if (document.documentElement.scrollWidth > innerWidth) issues.push(`Overflow: ${document.documentElement.scrollWidth} > ${innerWidth}`);
        for (const element of document.querySelectorAll<HTMLElement>('a, button, select, summary, input, textarea')) {
          const rect = element.getBoundingClientRect();
          if (!element.checkVisibility() || element.classList.contains('skip-link')) continue;
          if (rect.width < 43.9 || rect.height < 43.9) issues.push(`${element.tagName} "${element.textContent?.trim() || element.getAttribute('aria-label')}" ${rect.width}x${rect.height}`);
        }
        return issues;
      });
      expect(failures, `${width}px ${theme}`).toEqual([]);
      await expect(page.locator(width < 640 ? '.diagram-narrow' : '.diagram-wide').first()).toBeVisible();
      await expect(page.locator(width < 768 ? '#psms .phone' : '#psms .browser')).toBeVisible();
    }
  }
});

test('theme persists before paint and follows the system when requested', async ({ page }) => {
  await page.goto('./');
  await page.getByLabel('Color theme').selectOption('light');
  await page.reload();
  expect(await page.locator('html').getAttribute('data-theme')).toBe('light');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(244, 246, 249)');
  await expect(page.locator('#psms')).toHaveCSS('background-color', 'rgb(10, 13, 20)');
  await page.getByLabel('Color theme').selectOption('system');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(10, 13, 20)');
  await expect(page.locator('#psms')).toHaveCSS('background-color', 'rgb(17, 22, 33)');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(244, 246, 249)');
});

test('keyboard navigation, mobile menu and quick contact', async ({ page }) => {
  await page.goto('./');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  const quick = page.getByRole('complementary', { name: 'Quick contact' }).getByRole('link');
  if (isCompact(page)) {
    const box = await quick.boundingBox();
    expect(box!.y).toBeGreaterThan(page.viewportSize()!.height / 2);
    await page.locator('[data-menu] summary').click();
    await expect(page.getByRole('button', { name: 'Close menu' })).toBeFocused();
    const sheet = await page.locator('.menu-sheet').boundingBox();
    expect(Math.round(sheet!.y + sheet!.height)).toBe(page.viewportSize()!.height);
    await expect(page.locator('.menu-sheet nav a').last()).toBeInViewport();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-menu] summary')).toBeFocused();
    await page.keyboard.press('Enter');
    await page.locator('.menu-sheet a[href$="#work"]').click();
    await expect(page.locator('[data-menu]')).not.toHaveAttribute('open');
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await expect(quick).toBeHidden();
  } else {
    await expect(quick).toBeHidden();
    await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Approach' })).toBeVisible();
  }
  await page.locator('[data-company="minsait"] summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-company="minsait"] details')).toHaveAttribute('open');
});

test('all content remains reachable without JavaScript', async ({ browser, baseURL, page: configuredPage }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: configuredPage.viewportSize()!, colorScheme: 'dark' });
  const page = await context.newPage();
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('[data-theme-control]')).toBeHidden();
  for (const slug of stories) await expect(page.locator(`#${slug} .story-title`)).toBeVisible();
  await expect(page.locator('.principle')).toHaveCount(5);
  const role = page.locator('[data-company="minsait"] details');
  await role.locator('summary').click();
  await expect(role.getByText('Integrated card-present payment capabilities into the revenue collection system.')).toBeVisible();
  if (page.viewportSize()!.width < 768) {
    await page.locator('[data-menu] summary').click();
    await expect(page.locator('.menu-sheet nav a').first()).toBeVisible();
    await page.locator('[data-menu] summary').click();
  }
  await page.getByRole('link', { name: 'Read the case study' }).click();
  await expect(page.getByRole('heading', { name: 'The approach' })).toBeVisible();
  await context.close();
});

test('axe WCAG AA on home, expanded roles and case study in both themes', async ({ page }) => {
  for (const path of ['./', 'projects/psms/', '404/']) {
    await page.goto(path);
    if (path === './') await page.locator('[data-company="minsait"] summary').click();
    for (const theme of ['dark', 'light']) {
      await page.getByLabel('Color theme').selectOption(theme);
      const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
      expect(scan.violations).toEqual([]);
      if (path === './' && isCompact(page)) {
        await page.locator('[data-menu] summary').click();
        const menuScan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
        expect(menuScan.violations).toEqual([]);
        await page.getByRole('button', { name: 'Close menu' }).click();
      }
    }
  }
});

test('SEO, privacy defaults and reduced motion', async ({ page, baseURL }) => {
  const thirdParties: string[] = [];
  page.on('request', (request) => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(baseURL!).origin) thirdParties.push(request.url());
  });
  await page.goto('./');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Nairobi/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https?:\/\//);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og.png$/);
  const person = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
  expect(person['@type']).toBe('Person');
  expect(person.description).not.toContain('*');
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
  await page.locator('#contact').scrollIntoViewIfNeeded();
  expect(thirdParties).toEqual([]);
  await page.goto('404/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});

test('print output fits one A4 page', async ({ page }) => {
  test.skip(page.viewportSize()!.width !== 1600, 'Print layout is viewport independent.');
  await page.goto('./');
  await page.emulateMedia({ media: 'print' });
  const bytes = await page.pdf({ preferCSSPageSize: true });
  expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
});
