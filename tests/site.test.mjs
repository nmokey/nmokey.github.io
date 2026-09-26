import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { runInContext } from 'node:vm';

async function page({ reducedMotion = false, storageBlocked = false } = {}) {
  const dom = new JSDOM(readFileSync('docs/index.html', 'utf8'), {
    url: 'https://www.nmokey.com/', runScripts: 'outside-only', pretendToBeVisual: true
  });
  const { window } = dom;
  await new Promise(resolve => window.document.addEventListener('DOMContentLoaded', resolve, {once:true}));
  const errors = [];
  window.addEventListener('error', event => errors.push(event.error));
  const motion = new window.EventTarget();
  motion.matches = reducedMotion;
  window.matchMedia = () => motion;
  window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  const timers = new Map();
  let id = 0;
  window.setTimeout = callback => { timers.set(++id, callback); return id; };
  window.clearTimeout = timer => timers.delete(timer);
  window.requestAnimationFrame = callback => { timers.set(++id, callback); return id; };
  if (storageBlocked) Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked'); } });
  for (const script of ['config', 'components', 'main', 'page-nav']) {
    runInContext(readFileSync(`docs/assets/js/${script}.js`, 'utf8'), dom.getInternalVMContext());
  }
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
  assert.deepEqual(errors, [], 'No runtime errors during initialization');
  return { dom, window, document: window.document, motion, timers };
}
function pointer(window, target, type, pointerType = 'mouse') {
  const event = new window.Event(type, { bubbles: type === 'pointerdown' });
  Object.defineProperty(event, 'pointerType', { value: pointerType });
  target.dispatchEvent(event);
}

test('hovering across sections only expands; leaving resets the whole menu', async t => {
  const { dom, window, document: d } = await page(); t.after(() => dom.window.close());
  const menu = d.getElementById('siteMenu');
  const trigger = d.getElementById('menuToggle');
  const sections = [...d.querySelectorAll('.submenu-toggle')];
  pointer(window, menu, 'pointerenter');
  for (const section of sections) pointer(window, section.parentElement, 'pointerenter');
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  assert.ok(sections.every(button => button.getAttribute('aria-expanded') === 'true'));
  assert.ok([...d.querySelectorAll('.submenu')].every(list => !list.inert));
  pointer(window, menu, 'pointerleave');
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  assert.ok(sections.every(button => button.getAttribute('aria-expanded') === 'false'));
  assert.ok(d.getElementById('navMenu').inert);
  pointer(window, menu, 'pointerenter');
  assert.ok(sections.every(button => button.getAttribute('aria-expanded') === 'false'));
});

test('keyboard activation, Escape and focus leaving support the whole menu', async t => {
  const { dom, window, document: d } = await page(); t.after(() => dom.window.close());
  const trigger = d.getElementById('menuToggle');
  trigger.focus(); trigger.click();
  const section = d.querySelector('.submenu-toggle');
  section.focus(); section.click();
  section.dispatchEvent(new window.KeyboardEvent('keydown', {key:'Escape', bubbles:true}));
  assert.equal(d.activeElement, trigger);
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  trigger.click();
  d.querySelector('.hero-actions a').focus();
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
});

test('touch ignores hover and can open, expand, and dismiss outside', async t => {
  const { dom, window, document: d } = await page(); t.after(() => dom.window.close());
  const menu = d.getElementById('siteMenu');
  const trigger = d.getElementById('menuToggle');
  pointer(window, menu, 'pointerenter', 'touch');
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  pointer(window, trigger, 'pointerdown', 'touch');
  trigger.dispatchEvent(new window.MouseEvent('click', {bubbles:true, detail:1}));
  d.querySelector('.submenu-toggle').click();
  assert.equal(d.querySelector('.submenu-toggle').getAttribute('aria-expanded'), 'true');
  pointer(window, d.querySelector('main'), 'pointerdown', 'touch');
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
});

test('reduced motion stops typing and skips theme transitions, including preference changes', async t => {
  const { dom, window, document: d, motion, timers } = await page({reducedMotion:true}); t.after(() => dom.window.close());
  assert.equal(d.getElementById('cyclingText').textContent, 'physicist');
  d.querySelector('.theme-toggle').click();
  assert.equal(d.documentElement.dataset.theme, 'light');
  assert.equal(d.querySelector('.theme-transition-overlay'), null);
  assert.equal(timers.size, 0);
  motion.matches = false; motion.dispatchEvent(new window.Event('change'));
  assert.equal(timers.size, 1);
  motion.matches = true; motion.dispatchEvent(new window.Event('change'));
  assert.equal(timers.size, 0);
});

test('storage restrictions do not break theme or navigation initialization', async t => {
  const { dom, document: d } = await page({storageBlocked:true, reducedMotion:true}); t.after(() => dom.window.close());
  d.querySelector('.theme-toggle').click();
  assert.equal(d.documentElement.dataset.theme, 'light');
  d.getElementById('menuToggle').click();
  assert.equal(d.getElementById('menuToggle').getAttribute('aria-expanded'), 'true');
});

test('skip link transfers focus and uses instant scrolling under reduced motion', async t => {
  const { dom, document: d } = await page({reducedMotion:true}); t.after(() => dom.window.close());
  let options;
  d.querySelector('main').scrollIntoView = value => { options = value; };
  d.querySelector('.skip-link').click();
  assert.equal(d.activeElement, d.querySelector('main'));
  assert.equal(options.behavior, 'instant');
});
