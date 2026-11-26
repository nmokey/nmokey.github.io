import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

test('analytics only loads on production hosts, excluding previews and test hosts', t => {
  for (const host of ['www.nmokey.com', 'nmokey.com', '127.0.0.1:8765', 'localhost:8765', 'preview.example', 'nmokey.github.io', 'www.nmokey.com.preview.example']) {
    const dom = new JSDOM('<head></head><body></body>', { url: `https://${host}`, runScripts: 'outside-only' });
    t.after(() => dom.window.close());
    dom.window.eval(readFileSync('docs/assets/js/analytics.js', 'utf8'));
    const production = ['www.nmokey.com', 'nmokey.com'].includes(host);
    assert.equal(dom.window.document.querySelectorAll('script[src*="googletagmanager"]').length, production ? 1 : 0);
    assert.equal(dom.window.dataLayer?.length ?? 0, production ? 2 : 0);
    if (production) {
      const loader = dom.window.document.querySelector('script[src*="googletagmanager"]');
      assert.equal(loader.src, 'https://www.googletagmanager.com/gtag/js?id=G-NK15EEMEB2');
      assert.equal(loader.async, true);
      assert.deepEqual(Array.from(dom.window.dataLayer[0]).slice(0, 1), ['js']);
      assert.deepEqual(Array.from(dom.window.dataLayer[1]), ['config', 'G-NK15EEMEB2']);
    } else {
      assert.equal(dom.window.gtag, undefined);
    }
  }
});
