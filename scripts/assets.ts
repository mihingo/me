import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { createElement } from 'react';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { loadContent } from './content';
import { groupRoles, formatMonth, plainText } from '../src/lib/content';
import { ui } from '../src/config/ui';

const data = loadContent();
const { site } = data;
mkdirSync('public', { recursive: true });
const font = readFileSync('node_modules/@fontsource/inter/files/inter-latin-400-normal.woff');
const display = readFileSync('node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff');
const { light } = site.theme;
// Square, top-anchored crop shown as a circle, matching the site; metadata is not carried over.
const portrait = site.portrait
  ? `data:image/jpeg;base64,${(await sharp(resolve('src/content', site.portrait.src)).resize(480, 480, { fit: 'cover', position: 'top' }).jpeg({ quality: 88 }).toBuffer()).toString('base64')}`
  : undefined;
const svg = await satori(createElement('div', {
  style: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px', width: '100%', height: '100%', background: light.background, color: light.text, fontFamily: 'Inter' },
}, [
  createElement('div', { key: 'top', style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 22, borderBottom: `2px solid ${light.text}`, paddingBottom: 20 } }, [
    createElement('div', { key: 'name', style: { display: 'flex', alignItems: 'center' } }, [
      createElement('div', { key: 'mark', style: { width: 14, height: 14, background: light.accent, marginRight: 14 } }),
      site.name,
    ]),
    createElement('div', { key: 'location', style: { display: 'flex', color: light.muted } }, site.location),
  ]),
  createElement('div', { key: 'middle', style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }, [
    createElement('div', { key: 'headline', style: { display: 'flex', flexWrap: 'wrap', columnGap: '0.24em', fontFamily: 'Instrument Serif', fontSize: portrait ? 68 : 76, lineHeight: 1.02, letterSpacing: -1.5, maxWidth: portrait ? 720 : 1000 } },
      // One element per word keeps hyphenated words (e.g. "AI-agent") from breaking at the hyphen.
      plainText(site.headline).split(/\s+/).map((word, index) => createElement('span', { key: index, style: { display: 'flex' } }, word))),
    portrait ? createElement('img', { key: 'portrait', src: portrait, width: 240, height: 240, style: { borderRadius: 9999, border: `1px solid ${light.border}`, boxShadow: `0 0 0 8px ${light.background}, 0 0 0 9px ${light.border}` } }) : null,
  ]),
  createElement('div', { key: 'role', style: { display: 'flex', fontSize: 22, color: light.muted } }, site.lede),
]), { width: 1200, height: 630, fonts: [{ name: 'Inter', data: font, weight: 400, style: 'normal' }, { name: 'Instrument Serif', data: display, weight: 400, style: 'normal' }] });
writeFileSync('public/og.png', new Resvg(svg).render().asPng());
const escapeXml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!);
writeFileSync('public/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${site.theme.dark.background}"/><text x="32" y="42" font-family="Arial,sans-serif" font-size="27" font-weight="bold" text-anchor="middle" fill="${site.theme.dark.accent}">${escapeXml(site.monogram)}</text></svg>`);

if (site.resume.path === '/resume.pdf') {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${site.name} - Resume`);
  pdf.setAuthor(site.name);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([595.28, 841.89]);
  let y = 803;
  const left = 40;
  const width = 515;
  const clean = (value: string) => value.normalize('NFKC').replace(/[—–]/g, '-').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/→/g, 'to').replace(/↗/g, '');
  function line(text: string, size = 9, strong = false, gap = 4) {
    const font = strong ? bold : regular;
    const words = clean(text).split(/\s+/);
    let current = '';
    for (const word of words) {
      if (font.widthOfTextAtSize(word, size) > width) throw new Error('Resume contains a word too long to fit; shorten it or supply your own PDF.');
      const next = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > width) {
        draw(current); current = word;
      } else current = next;
    }
    if (current) draw(current);
    y -= gap;
    function draw(value: string) {
      if (y < 38) throw new Error('Generated resume exceeds one page. Shorten summaries or configure a custom PDF path.');
      page.drawText(value, { x: left, y, size, font, color: rgb(.08, .09, .11) });
      y -= size * 1.35;
    }
  }
  function section(title: string) { y -= 8; line(title.toUpperCase(), 10, true, 6); }
  line(site.name, 25, true, 6);
  line(plainText(site.headline), 10, false, 6);
  line(`${site.location} | ${site.email}`, 9);
  line(site.social.map((link) => link.url).join(' | '), 8);
  line(`${ui.titleBlock.relocation}: ${site.relocation.join(', ')}`, 8);
  section(ui.experience);
  for (const company of groupRoles(data.experience.map((entry) => entry.data))) {
    for (const role of company.roles) {
      line(`${company.company} | ${role.title}`, 10, true);
      line(`${formatMonth(role.start)} - ${role.end === 'present' ? ui.present : formatMonth(role.end)} | ${role.location}`, 8);
      line(role.summary, 9);
      for (const bullet of role.bullets.slice(0, 2)) line(`- ${bullet}`, 8, false, 3);
    }
  }
  section(ui.work.title);
  for (const { data: project } of data.projects.filter((entry) => entry.data.visible && entry.data.featured && entry.data.inResume).sort((a, b) => a.data.order - b.data.order)) {
    line(`${project.name} | ${project.role} | ${ui.status[project.status]}`, 10, true);
    line(project.summary, 9);
    if (project.url) line(project.url, 8);
  }
  section(ui.capabilities.title);
  for (const group of [...data.skills.groups].sort((a, b) => a.order - b.order)) line(`${group.name}: ${group.items.join(', ')}`, 8);
  section(ui.community);
  for (const { data: item } of data.community.filter((entry) => entry.data.visible).sort((a, b) => a.data.order - b.data.order)) line(item.description, 8);
  section(ui.education);
  for (const { data: item } of data.education.filter((entry) => entry.data.visible)) line(`${item.degree}, ${item.institution} | ${item.start}-${item.end} | ${item.classification}`, 9);
  writeFileSync('public/resume.pdf', await pdf.save());
} else if (!existsSync(`public${site.resume.path}`)) {
  throw new Error(`Configured resume is missing: public${site.resume.path}`);
}
console.log('Generated OG image, favicon and verified one-page resume asset.');
