import { defineConfig } from '@playwright/test';
import sparticuz from '@sparticuz/chromium';
const testPort = process.env.COURSE_TEST_PORT || '8000';
const baseURL = `http://127.0.0.1:${testPort}`;
export default defineConfig({
  testDir: './tests/browser',
  timeout: 45000,
  expect: { timeout: 10000 },
  workers: 2,
  reporter: [['list'], ['json', { outputFile: 'qa/browser-results.json' }]],
  use: {
    baseURL,
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: 'block',
    launchOptions: {
      executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
      args:
        process.env.CHROMIUM_EXECUTABLE && process.platform === 'linux'
          ? sparticuz.args.filter((arg) => arg !== '--single-process')
          : [],
    },
  },
  webServer: {
    command: 'node start.mjs',
    env: { PORT: testPort },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30000,
  },
});
