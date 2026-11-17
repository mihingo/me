import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const site = process.env.SITE_URL || 'https://mihingo.github.io';
const base = process.env.BASE_PATH || '/';
if (!/^https?:\/\/[^/]+\/?$/.test(site)) {
  throw new Error('SITE_URL must be an absolute origin without a path.');
}
if (!/^\/(?:[a-zA-Z0-9_-]+\/?)*$/.test(base)) {
  throw new Error('BASE_PATH must be / or a slash-prefixed repository path.');
}

export default defineConfig({
  site,
  base,
  output: 'static',
  devToolbar: { enabled: false },
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.endsWith('/404/') && !page.includes('/projects/') })],
});
