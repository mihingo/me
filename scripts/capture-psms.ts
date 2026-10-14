// Re-captures genuine screenshots of the live PSMS public portal.
// Crops above the portal's statistics band: those figures are not verified portfolio facts.
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const url = 'https://kenya.psms.africa/';
const out = 'public/images/psms';
const shots = [
  { name: 'portal-desktop', viewport: { width: 1440, height: 900 }, widths: [960, 1600, 2400] },
  { name: 'portal-mobile', viewport: { width: 390, height: 844 }, widths: [390, 780] },
];

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
try {
  for (const shot of shots) {
    const page = await browser.newPage({ viewport: shot.viewport, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.evaluate(() => document.fonts.ready);
    const search = await page.locator('main a, main button').filter({ hasText: /^\s*Search\s*$/ }).first().boundingBox({ timeout: 10_000 });
    if (!search) throw new Error('Could not locate the portal search button to crop above the statistics.');
    const height = Math.round(search.y + search.height + 36);
    const png = await page.screenshot({ clip: { x: 0, y: 0, width: shot.viewport.width, height } });
    await page.close();
    for (const width of shot.widths) {
      const file = `${out}/${shot.name}-${width}.webp`;
      await sharp(png).resize({ width }).webp({ quality: 78, effort: 6 }).toFile(file);
    }
    console.log(`${shot.name}: ${shot.viewport.width}x${height} CSS px → ${shot.widths.join(', ')}w`);
  }
} finally {
  await browser.close();
}
console.log('Update width/height in src/content/projects/psms.yaml if the reported dimensions changed.');
