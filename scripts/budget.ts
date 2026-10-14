import { chromium } from '@playwright/test';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { startPreview } from './preview';

const server = await startPreview(4341);
const url = server.url;
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
  const scripts = new Map<string, Promise<number>>();
  page.on('response', (response) => {
    if (response.request().resourceType() === 'script' && new URL(response.url()).origin === new URL(url).origin) {
      scripts.set(response.url(), response.body().then((body) => gzipSync(body).length));
    }
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  const inline = await page.locator('script:not([src]):not([type="application/ld+json"])').allTextContents();
  const bytes = (await Promise.all(scripts.values())).reduce((a, b) => a + b, 0) + inline.reduce((sum, script) => sum + gzipSync(script).length, 0);
  console.log(`Initial first-party JavaScript (gzip, external + inline): ${bytes} bytes; budget < 50,000.`);
  if (bytes >= 50_000) throw new Error('Initial JavaScript budget exceeded.');
  const pdf = readFileSync('dist/resume.pdf');
  if (!pdf.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new Error('Resume is not a PDF.');
} finally { await browser.close(); await server.stop(); }
