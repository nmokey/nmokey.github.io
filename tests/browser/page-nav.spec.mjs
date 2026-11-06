import { test, expect } from './fixtures.mjs';

test('sidebar follows headings after scrolling and resizing, and links reach their sections', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const experience = page.locator('#experience h1');
  const link = page.locator('#pageNav a[href="#experience"]');
  await experience.evaluate(element => element.scrollIntoView());
  await expect(link).toHaveAttribute('aria-current', 'location');
  await page.setViewportSize({ width: 800, height: 700 });
  await experience.evaluate(element => element.scrollIntoView());
  await expect(link).toHaveAttribute('aria-current', 'location');
  await page.locator('#pageNav a[href="#education"]').click();
  await expect(page.locator('#pageNav a[href="#education"]')).toHaveAttribute('aria-current', 'location');
  await link.click();
  await expect(link).toHaveAttribute('aria-current', 'location');
  expect(Math.abs((await experience.boundingBox()).y - 100)).toBeLessThan(2);
});
