import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:8765', trace: 'retain-on-failure' },
  webServer: { command: 'npm run preview', url: 'http://127.0.0.1:8765', reuseExistingServer: !process.env.CI },
});
