import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

async function page(t, reducedMotion = false) {
  const dom = new JSDOM('<main><header class="hero"><h1>Ryan</h1></header><section id="education"><h1>education</h1></section><h1>experience</h1><h1>experience</h1></main><nav id="pageNav"></nav>', { runScripts: 'outside-only', pretendToBeVisual: true });
  t.after(() => dom.window.close());
  const { window } = dom;
  await new Promise(resolve => window.document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  const frames = [];
  window.requestAnimationFrame = callback => { frames.push(callback); return frames.length; };
  window.matchMedia = () => ({ matches: reducedMotion });
  let positions = [500, 1000, 1500];
  [...window.document.querySelectorAll('main h1:not(header h1)')].forEach((heading, index) => {
    heading.getBoundingClientRect = () => ({ top: positions[index] - window.scrollY });
  });
  window.eval(readFileSync('docs/assets/js/page-nav.js', 'utf8'));
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
  const refresh = (type, scrollY = window.scrollY) => {
    window.scrollY = scrollY;
    window.dispatchEvent(new window.Event(type));
    while (frames.length) frames.shift()();
  };
  return { window, document: window.document, refresh, layout: values => { positions = values; } };
}

test('sidebar tracks scrolling and uses fresh heading positions after resize', async t => {
  const { document, refresh, layout } = await page(t);
  const active = () => document.querySelector('[aria-current="location"]').textContent;
  assert.equal(active(), 'top');
  assert.equal(document.querySelector('#pageNav').inert, true);
  refresh('scroll', 900);
  assert.equal(active(), 'experience');
  assert.equal(document.querySelector('#pageNav').inert, false);
  layout([500, 1300, 1900]);
  refresh('resize');
  assert.equal(active(), 'education');
  assert.equal(document.querySelectorAll('#education').length, 1);
  assert.ok(document.querySelector('a[href="#education"]'));
  assert.equal(document.querySelectorAll('#experience').length, 1);
  assert.equal(document.querySelectorAll('#experience-2').length, 1);
});

test('section links use current positions and respect reduced motion', async t => {
  for (const reduced of [false, true]) {
    const { window, document, layout } = await page(t, reduced);
    let options;
    window.scrollTo = value => { options = value; };
    layout([600, 1400, 2000]);
    document.querySelector('a[href="#experience"]').click();
    assert.equal(options.top, 1300);
    assert.equal(options.behavior, reduced ? 'instant' : 'smooth');
    document.querySelector('a[href="#"]').click();
    assert.equal(options.top, 0);
  }
});
