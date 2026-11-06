import { test, expect } from './fixtures.mjs';

test('hover paints borderless cells without blocking page controls', async ({ page }) => {
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

test('the same grid survives page navigation, reload, and the back button', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.mouse.move(350, 350);
  const image = () => page.locator('#life-background-canvas').evaluate(element => element.toDataURL());
  const initial = await image();
  await page.goto('/thoughts.html');
  await expect(page.locator('#life-background-canvas')).toHaveCount(1);
  expect(await image()).toBe(initial);
  await page.reload();
  await expect(page.locator('#life-background-canvas')).toHaveCount(1);
  expect(await image()).toBe(initial);
  await page.goBack();
  await expect(page.locator('#life-background-canvas')).toHaveCount(1);
  expect(await image()).toBe(initial);
});

test('a released cell fades across animation frames before disappearing', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-06T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-11-06T00:00:01Z'));
  await page.goto('/');
  const alpha = () => page.locator('#life-background-canvas').evaluate(canvas => {
    const scale = canvas.width / innerWidth;
    return canvas.getContext('2d').getImageData(Math.floor(350 * scale), Math.floor(350 * scale), 1, 1).data[3];
  });
  await page.mouse.move(350, 350);
  const alive = await alpha();
  expect(alive).toBeGreaterThan(0);
  await page.mouse.move(20, 20);
  await page.clock.runFor(330);
  const fading = await alpha();
  expect(fading).toBeGreaterThan(0);
  expect(fading).toBeLessThan(alive);
  await page.clock.runFor(500);
  expect(await alpha()).toBe(0);
});
