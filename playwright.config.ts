import { defineConfig } from '@playwright/test';
const base = process.env.BASE_PATH || '/';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:4322${base.replace(/\/$/, '')}/`,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile-375', use: { viewport: { width: 375, height: 812 } } },
    { name: 'mobile-430', use: { viewport: { width: 430, height: 932 } } },
    { name: 'tablet-768', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'laptop-1366', use: { viewport: { width: 1366, height: 768 } } },
    { name: 'desktop-1600', use: { viewport: { width: 1600, height: 1000 } } },
  ],
  webServer: {
    command: 'pnpm preview --port 4322',
    url: `http://127.0.0.1:4322${base.replace(/\/$/, '')}/`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
