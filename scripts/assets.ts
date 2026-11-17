import { writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { validateContent } from './content';

const { site } = validateContent();
const escapeXml = (value: string) => value.replace(/[&<>"']/g, (char) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f8f7f4"/>
  <g font-family="Arial, Helvetica, sans-serif">
    <text x="72" y="92" fill="#244de0" font-size="32" font-weight="bold">km.</text>
    <text x="1128" y="88" text-anchor="end" fill="#66655f" font-size="20">${escapeXml(site.location)}</text>
    <path d="M72 126h1056M72 540h1056" stroke="#d8d6cf"/>
    <text x="66" y="308" fill="#232321" font-size="114" font-weight="bold" letter-spacing="-6">${escapeXml(site.firstName)} ${escapeXml(site.lastName)}<tspan fill="#244de0">.</tspan></text>
    <text x="72" y="390" fill="#232321" font-size="32">${escapeXml(site.role)}</text>
    <text x="72" y="444" fill="#66655f" font-size="26">Frontend platforms. Applied AI.</text>
    <text x="72" y="586" fill="#244de0" font-size="20">${escapeXml(site.current)}</text>
  </g>
</svg>`;
await sharp(Buffer.from(svg)).png().toFile('public/og.png');
writeFileSync('public/favicon.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="4" fill="#244de0"/><text x="32" y="43" font-family="Arial,sans-serif" font-size="30" font-weight="bold" text-anchor="middle" fill="#fff">km.</text></svg>\n');
console.log('Generated social image and favicon. The supplied resume PDF is preserved unchanged.');
