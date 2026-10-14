import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const site = process.env.SITE_URL || 'https://example.com';
const base = process.env.BASE_PATH || '/';
if (!/^https?:\/\/[^/]+\/?$/.test(site)) {
  throw new Error('SITE_URL must be an absolute origin without a path.');
}
if (!/^\/(?:[a-zA-Z0-9_-]+\/?)*$/.test(base)) {
  throw new Error('BASE_PATH must be / or a slash-prefixed repository path.');
}
if (site === 'https://example.com') {
  console.warn('SITE_URL is not set: using example.com for local SEO previews only.');
}

export default defineConfig({
  site,
  base,
  output: 'static',
  devToolbar: { enabled: false },
  trailingSlash: 'always',
  integrations: [react(), sitemap({ filter: (page) => !page.endsWith('/404/') })],
  vite: { plugins: [tailwindcss()] },
});
