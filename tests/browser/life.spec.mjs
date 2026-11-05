import { test, expect } from '@playwright/test';

test('hover paints borderless cells without blocking page controls', async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({body:'',contentType:'text/javascript'}));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const canvas = page.locator('#life-background-canvas');
  await expect(canvas).toHaveCSS('pointer-events', 'none');
  // Paint a small path; reduced motion keeps the result stable for inspection.
  for (let x = 20; x <= 110; x += 18) await page.mouse.move(x, 200);
  const pixels = await canvas.evaluate(element => {
    const ctx = element.getContext('2d');
    const scale = element.width / innerWidth;
    return [20,38,56,74,92,110].map(x => ctx.getImageData(Math.floor(x * scale), Math.floor(200 * scale),1,1).data[3]);
  });
  expect(pixels.every(alpha => alpha > 0)).toBe(true);
  await page.getByRole('button', {name:'Toggle theme'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', {name:'Toggle theme'}).click();
  await page.screenshot({ path: '/tmp/nmokey-life-preview.png' });
});
