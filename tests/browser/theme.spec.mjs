import { test, expect } from '@playwright/test';

test('saved light theme is applied before page content paints, including reloads and navigation', async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ body: '', contentType: 'text/javascript' }));
  await page.addInitScript(() => localStorage.setItem('theme', 'light'));
  let release;
  let gate;
  await page.route('**/assets/js/components.js*', async route => {
    await gate;
    await route.continue();
  });
  for (const path of ['/', '/', '/about.html', '/thoughts.html', '/thoughts/birthday.html', '/missing/nested/page']) {
    gate = new Promise(resolve => { release = resolve; });
    try {
      if (path === '/' && page.url().endsWith('/')) await page.reload({ waitUntil: 'commit' });
      else await page.goto(path, { waitUntil: 'commit' });
      await expect(page.locator('body')).toBeVisible();
      // The body is visible while the late component script is still blocked.
      expect(await page.locator('html').getAttribute('data-theme')).toBe('light');
      expect(await page.locator('body').evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(255, 255, 255)');
    } finally {
      release();
    }
    await expect(page.getByRole('button', { name: 'Toggle theme' })).toBeVisible();
  }
});

test('theme toggle choice survives navigation and reload', async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ body: '', contentType: 'text/javascript' }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.goto('/about.html');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await page.goto('/thoughts/birthday.html');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('blocked storage still loads the default theme and a usable toggle', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ body: '', contentType: 'text/javascript' }));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked'); } });
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(errors).toEqual([]);
});
