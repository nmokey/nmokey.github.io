import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { discoverPages } from '../scripts/pages.mjs';
import { canonicalUrl, isSearchable, searchOrigin } from '../scripts/search.mjs';

test('only the homepage is searchable, including when new pages are added', () => {
  assert.equal(canonicalUrl('index.html'), `${searchOrigin}/`);
  assert.equal(canonicalUrl('poker/index.html'), `${searchOrigin}/poker/`);
  assert.equal(isSearchable('music.html'), false);
  assert.equal(isSearchable('404.html'), false);
  assert.equal(isSearchable('thoughts/draft.html', new Set(['thoughts/draft.html'])), false);
  assert.equal(isSearchable('thoughts/birthday.html'), false);
  assert.equal(isSearchable('future-page.html'), false);
  assert.equal(isSearchable('poker/index.html'), false);
  assert.equal(isSearchable('index.html'), true);
});

test('generated search inventory matches page canonicals and noindex directives', async () => {
  const sitemap = new JSDOM(await readFile('docs/sitemap.xml', 'utf8'), { contentType: 'text/xml' });
  const urls = [...sitemap.window.document.querySelectorAll('loc')].map(node => node.textContent);
  assert.equal(new Set(urls).size, urls.length);
  assert.deepEqual(urls, [`${searchOrigin}/`]);
  const expected = [];
  for (const name of await discoverPages('docs')) {
    const dom = new JSDOM(await readFile(`docs/${name}`, 'utf8'));
    const document = dom.window.document;
    const excluded = /\bnoindex\b/.test(document.querySelector('meta[name="robots"]')?.content || '');
    assert.equal(excluded, !isSearchable(name), name);
    if (isSearchable(name)) {
      expected.push(canonicalUrl(name));
      assert.equal(document.querySelectorAll('link[rel="canonical"]').length, 1, name);
      assert.equal(document.querySelector('link[rel="canonical"]').href, canonicalUrl(name), name);
      assert.ok(document.querySelector('meta[name="description"]')?.content.trim(), `${name}: description`);
    }
    dom.window.close();
  }
  assert.deepEqual(urls.sort(), expected.sort());
  assert.match(await readFile('docs/robots.txt', 'utf8'), /Sitemap: https:\/\/www\.nmokey\.com\/sitemap\.xml/);
  sitemap.window.close();
});
