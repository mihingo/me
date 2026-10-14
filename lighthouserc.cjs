module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm preview --port 4331',
      startServerReadyPattern: 'localhost|127.0.0.1',
      url: ['http://127.0.0.1:4331/'],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--headless --no-sandbox --disable-dev-shm-usage',
        formFactor: 'mobile',
        screenEmulation: { mobile: true, width: 360, height: 800, deviceScaleFactor: 1, disabled: false },
        throttlingMethod: 'simulate',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95, aggregationMethod: 'median' }],
        'categories:accessibility': ['error', { minScore: 1, aggregationMethod: 'median' }],
        'categories:seo': ['error', { minScore: 1, aggregationMethod: 'median' }],
        'categories:best-practices': ['error', { minScore: 0.95, aggregationMethod: 'median' }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2000, aggregationMethod: 'median' }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05, aggregationMethod: 'median' }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci/reports' },
  },
};
