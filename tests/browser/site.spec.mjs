import { test, expect } from './fixtures.mjs';

import { discoverPages } from '../../scripts/pages.mjs';

const paths = (await discoverPages('docs')).map(name => name === 'index.html' ? '/' : `/${name.replace(/\/index\.html$/, '/')}`);

async function smoke(page, theme) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /Content Security Policy|Refused to/i.test(message.text())) errors.push(message.text());
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(theme => localStorage.setItem('theme', theme), theme);
  for (const path of [...paths, '/missing/nested/page']) {
    await test.step(path, async () => {
      const response = await page.goto(path);
      expect(response.status()).toBe(path.startsWith('/missing') ? 404 : 200);
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (path === '/poker/') {
        await expect(page.getByTitle('PocketSolver live poker decision model comparison')).toBeVisible();
      } else {
        const toggle = page.getByRole('button', { name: 'Toggle theme' });
        await expect(toggle).toBeVisible();
        await expect(page.locator('#life-background-canvas')).toHaveCount(1);
        const bounds = await toggle.boundingBox();
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize().width);
        await toggle.click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme === 'dark' ? 'light' : 'dark');
      }
    });
  }
  expect(errors).toEqual([]);
}

for (const theme of ['dark', 'light']) {
  test(`every page works in ${theme} theme on desktop`, async ({ page }) => smoke(page, theme));
}

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  for (const theme of ['dark', 'light']) {
    test(`every page fits and controls work in ${theme} theme`, async ({ page }) => smoke(page, theme));
  }
  test('a post can be opened from Thoughts and its back link works', async ({ page }) => {
    await page.goto('/thoughts.html');
    await page.locator('.post-list a').first().tap();
    await expect(page.locator('article.post')).toBeVisible();
    await page.getByRole('link', { name: '← thoughts' }).tap();
    await expect(page).toHaveURL(/thoughts\.html$/);
  });
});

test('reduced motion keeps content still and theme usable', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  const canvas = page.locator('canvas');
  const before = await canvas.evaluate(element => element.toDataURL());
  await expect(page.locator('.hero-image')).toHaveCSS('animation-name','none');
  await expect(page.locator('#cyclingText')).toHaveText('quant trader');
  expect(await canvas.evaluate(element => element.toDataURL())).toBe(before);
  await page.getByRole('button',{name:'Toggle theme'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await expect(page.locator('.theme-transition-overlay')).toHaveCount(0);
});

test('CSP blocks an injected inline script', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const script = document.createElement('script');
    script.textContent = "document.documentElement.dataset.injected = 'yes'";
    document.body.appendChild(script);
  });
  await expect(page.locator('html')).not.toHaveAttribute('data-injected','yes');
});
