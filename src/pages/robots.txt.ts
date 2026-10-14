import type { APIRoute } from 'astro';
import { localPath } from '../lib/content';
export const GET: APIRoute = ({ site }) => new Response(`User-agent: *\nAllow: /\nSitemap: ${new URL(localPath('/sitemap-index.xml'), site).href}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
