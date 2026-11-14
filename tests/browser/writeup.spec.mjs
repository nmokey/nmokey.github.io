import { test, expect } from './fixtures.mjs';

for (const width of [390, 1440]) {
  test(`research article interactions and downloads work at ${width}px`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && /Content Security Policy|Refused to/i.test(message.text())) errors.push(message.text());
    });
    await page.goto('/poker/writeup/');
    await expect(page.locator('.chart-panel svg')).toHaveCount(10);
    await expect(page.locator('.member-name')).toHaveCount(13);
    await expect(page.locator('a.article-home')).toHaveCount(0);
    await expect(page.locator('#live-demo a[target="_blank"]')).toHaveAttribute('href', /streamlit\.app\/$/);
    expect(await page.locator('.math math').count()).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.selectOption('#hand-choice', '2');
    await page.getByRole('button', { name: 'Reveal reference', exact: true }).click();
    await expect(page.locator('.reference')).toContainText('differs');
    await page.selectOption('#metric-choice', 'multi');
    const models = page.locator('[data-widget="models"]');
    await models.locator('.chart-point').first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(models.locator('.chart-readout')).toContainText('Option prior');
    await expect(models.locator('.chart-readout')).toContainText('%');
    expect(await models.locator('.chart-point.is-selected').count()).toBe(2);
    await page.keyboard.press('Escape');
    await expect(models.locator('.chart-point.is-selected')).toHaveCount(0);
    await models.locator('summary').click();
    await expect(models.locator('table')).toBeVisible();
    await expect(page.getByTitle('PocketSolver live held-out hand comparison')).toBeVisible();
    await expect(page.locator('#load-demo')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Reload demo', exact: true })).toBeVisible();
    for (const file of ['index.pdf', 'pocketsolver-latex.zip', 'pocketsolver-web.zip']) {
      expect((await request.get(`/poker/writeup/${file}`)).ok()).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}

 test('demo provides a top-level wake link and can reload its frame', async ({ page }) => {
  let requests = 0;
  await page.route('https://*.streamlit.app/**', route => { requests++; return route.fulfill({ body: '<!doctype html><title>Demo fixture</title>', contentType: 'text/html' }); });
  await page.goto('/poker/');
  const direct = page.getByRole('link', { name: 'Open demo in new tab' });
  await expect(direct).toHaveAttribute('href', /streamlit\.app\/$/);
  await expect(direct).toHaveAttribute('target', '_blank');
  await expect.poll(() => requests).toBe(1);
  await page.getByRole('button', { name: 'Reload demo', exact: true }).click();
  await expect.poll(() => requests).toBe(2);
});

test('writeup embeds the demo immediately and reloads it on request', async ({ page }) => {
  let requests = 0;
  await page.route('https://*.streamlit.app/**', route => { requests++; return route.fulfill({ body: '<!doctype html><title>Demo fixture</title>', contentType: 'text/html' }); });
  await page.goto('/poker/writeup/');
  await expect(page.getByTitle('PocketSolver live held-out hand comparison')).toBeVisible();
  await expect(page.locator('#load-demo')).toHaveCount(0);
  await expect.poll(() => requests).toBe(1);
  await page.getByRole('button', { name: 'Reload demo', exact: true }).click();
  await expect.poll(() => requests).toBe(2);
});
