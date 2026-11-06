import { test as base, expect } from '@playwright/test';

// Keep third-party availability and analytics traffic out of regression tests.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ body: '', contentType: 'text/javascript' }));
    for (const host of ['www.youtube.com', 'www.youtube-nocookie.com', '*.streamlit.app']) {
      await page.route(`https://${host}/**`, route => route.fulfill({ body: '<!doctype html><title>Embed fixture</title>', contentType: 'text/html' }));
    }
    await use(page);
  }
});
export { expect };
