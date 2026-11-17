import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { startPreview } from './preview';

const server = await startPreview(4341);
const url = server.url;
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
  const resources: Promise<number>[] = [];
  const scripts: string[] = [];
  page.on('response', (response) => {
    if (new URL(response.url()).origin === new URL(url).origin) {
      resources.push(response.body().then((body) => body.length));
    }
    if (response.request().resourceType() === 'script') scripts.push(response.url());
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  const inline = await page.locator('script:not([src]):not([type="application/ld+json"])').allTextContents();
  if (scripts.length || inline.some((script) => script.trim())) throw new Error('The portfolio must ship zero executable JavaScript.');
  const bytes = (await Promise.all(resources)).reduce((sum, size) => sum + size, 0);
  console.log(`Initial page resources (uncompressed): ${bytes} bytes; budget < 150,000. Executable JavaScript: 0 bytes.`);
  if (bytes >= 150_000) throw new Error('Initial page resource budget exceeded.');
  const pdf = readFileSync('dist/resume.pdf');
  if (!pdf.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new Error('Resume is not a PDF.');
} finally { await browser.close(); await server.stop(); }
