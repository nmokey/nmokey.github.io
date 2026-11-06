import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { LifeGrid } from '../docs/assets/js/life-grid.js';
import { LifeBackground } from '../docs/assets/js/life-background.js';

function board(points) {
  const grid = new LifeGrid(5, 5);
  for (const [x, y] of points) grid.cells[y * 5 + x] = 1;
  return grid;
}
function alive(grid) {
  return Array.from(grid.cells).flatMap((value, i) => value ? [[i % grid.columns, Math.floor(i / grid.columns)]] : []);
}
test('Life preserves a block and oscillates a blinker synchronously', () => {
  const block = board([[1,1],[2,1],[1,2],[2,2]]);
  const before = alive(block);
  block.step(); assert.deepEqual(alive(block), before);
  const blinker = board([[1,2],[2,2],[3,2]]);
  blinker.step(); assert.deepEqual(alive(blinker), [[2,1],[2,2],[2,3]]);
  blinker.step(); assert.deepEqual(alive(blinker), [[1,2],[2,2],[3,2]]);
});
test('isolated cells die, edges do not wrap, and pinned cells are released', () => {
  const grid = board([[0,0],[4,0],[0,4]]);
  grid.step(); assert.deepEqual(alive(grid), []);
  grid.step(12); assert.deepEqual(alive(grid), [[2,2]]);
  grid.step(12); assert.deepEqual(alive(grid), [[2,2]]);
  grid.step(); assert.deepEqual(alive(grid), []);
});
test('grid resizing preserves coordinates and leaves new cells dead', () => {
  const grid = board([[1,1],[4,4]]);
  grid.resize(8, 6);
  assert.deepEqual(alive(grid), [[1,1],[4,4]]);
  grid.resize(3, 3);
  assert.deepEqual(alive(grid), [[1,1]]);
});

function session() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

async function visit(t, storage, width = 64, reducedMotion = true) {
  const dom = new JSDOM('<!doctype html><body></body>', {
    url: 'https://www.nmokey.com/', runScripts: 'outside-only', pretendToBeVisual: true
  });
  t.after(() => dom.window.close());
  const { window } = dom;
  await new Promise(resolve => window.document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  Object.defineProperty(window, 'innerWidth', { value: width });
  Object.defineProperty(window, 'innerHeight', { value: 64 });
  Object.defineProperty(window, 'sessionStorage', { value: storage });
  const motion = new window.EventTarget();
  motion.matches = reducedMotion;
  window.matchMedia = () => motion;
  const intervals = new Map(), frames = new Map();
  let id = 0;
  window.setInterval = callback => { intervals.set(++id, callback); return id; };
  window.clearInterval = key => intervals.delete(key);
  window.requestAnimationFrame = callback => { frames.set(++id, callback); return id; };
  window.cancelAnimationFrame = key => frames.delete(key);
  const errors = [];
  window.addEventListener('error', event => errors.push(event.error));
  const painted = [];
  window.HTMLCanvasElement.prototype.getContext = () => ({
    setTransform() {}, clearRect() { painted.length = 0; },
    fillRect(x, y) { painted.push([x, y, this.globalAlpha]); },
    createLinearGradient: () => ({ addColorStop() {} })
  });
  const life = new LifeBackground(window.document.createElement('canvas'));
  t.after(() => life.destroy());
  const set = points => {
    life.grid.cells.fill(0);
    for (const [x, y] of points) life.grid.cells[y * life.grid.columns + x] = 1;
  };
  const points = () => Array.from(life.grid.cells).flatMap((cell, i) => cell ? [[i % life.grid.columns, Math.floor(i / life.grid.columns)]] : []);
  const leave = () => window.dispatchEvent(new window.PageTransitionEvent('pagehide'));
  return { life, window, set, points, leave, errors, motion, intervals, frames, painted };
}

test('the next page resumes the grid and continues its evolution', async t => {
  const storage = session();
  const first = await visit(t, storage);
  first.set([[1,2], [2,2], [3,2]]);
  first.life.update();
  first.leave();
  const next = await visit(t, storage);
  assert.deepEqual(next.points(), [[2,1], [2,2], [2,3]]);
  next.life.update();
  assert.deepEqual(next.points(), [[1,2], [2,2], [3,2]]);
});

test('navigation preserves empty grids and maps saved cells onto a resized viewport', async t => {
  const storage = session();
  const first = await visit(t, storage);
  first.set([[1,1], [2,1], [1,2], [2,2]]);
  first.leave();
  const wider = await visit(t, storage, 96);
  assert.deepEqual(wider.points(), first.points());
  wider.set([]);
  wider.leave();
  const empty = await visit(t, storage);
  assert.deepEqual(empty.points(), []);
});

test('back-forward cache restores the latest grid rather than the cached page grid', async t => {
  const storage = session();
  const first = await visit(t, storage);
  first.set([[1,1]]);
  first.leave();
  const next = await visit(t, storage);
  next.set([[4,4], [5,4], [4,5], [5,5]]);
  next.leave();
  first.window.dispatchEvent(new first.window.PageTransitionEvent('pageshow', { persisted: true }));
  assert.deepEqual(first.points(), next.points());
});

test('malformed or blocked storage does not break the background', async t => {
  for (const storage of [
    { getItem: () => '{broken', setItem() {} },
    { getItem: () => '{"columns":8,"rows":8,"cells":"bad"}', setItem() {} },
    { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } }
  ]) {
    const page = await visit(t, storage);
    assert.equal(page.life.grid.cells.length, 64);
    page.leave();
    assert.deepEqual(page.errors, []);
  }
});


test('death fades to zero, rebirth clears trails, and reduced motion draws only live cells', async t => {
  const { life, motion, set, painted } = await visit(t, session());
  set([[1,2],[2,2],[3,2]]);
  motion.matches = false;
  life.update(100);
  life.draw(320);
  assert.ok(painted.some(([x, y, alpha]) => x === 8 && y === 16 && alpha === 0.0375));
  life.draw(540);
  assert.equal(painted.length, 3);
  life.update(540);
  assert.equal(life.fading[2 * life.grid.columns + 1], 0);
  assert.deepEqual(alive(life.grid), [[1,2],[2,2],[3,2]]);
  motion.matches = true;
  life.draw(600);
  assert.equal(painted.length, 3);
});

test('visibility and reduced-motion changes cancel animation and resume exactly once', async t => {
  const { life, window, set, motion, intervals, frames, leave } = await visit(t, session(), 64, false);
  const tick = () => [...intervals.values()][0]();
  set([[1,1]]);
  tick();
  assert.equal(intervals.size, 1);
  assert.equal(frames.size, 1);
  Object.defineProperty(window.document, 'hidden', { configurable: true, value: true });
  window.document.dispatchEvent(new window.Event('visibilitychange'));
  assert.equal(intervals.size, 0);
  assert.equal(frames.size, 0);
  Object.defineProperty(window.document, 'hidden', { configurable: true, value: false });
  window.document.dispatchEvent(new window.Event('visibilitychange'));
  window.document.dispatchEvent(new window.Event('visibilitychange'));
  assert.equal(intervals.size, 1);
  set([[1,1]]); tick();
  motion.matches = true;
  motion.dispatchEvent(new window.Event('change'));
  assert.equal(intervals.size, 0);
  assert.equal(frames.size, 0);
  motion.matches = false;
  motion.dispatchEvent(new window.Event('change'));
  assert.equal(intervals.size, 1);
  leave();
  assert.equal(intervals.size, 0);
  window.dispatchEvent(new window.PageTransitionEvent('pageshow', { persisted: true }));
  assert.equal(intervals.size, 1);
  set([[1,1]]); tick();
  assert.equal(frames.size, 1);
  life.destroy();
  assert.equal(intervals.size, 0);
  assert.equal(frames.size, 0);
  motion.dispatchEvent(new window.Event('change'));
  window.dispatchEvent(new window.Event('pageshow'));
  assert.equal(intervals.size, 0);
});

test('pointer events wake and release cells without keeping dead cells alive', async t => {
  const { life, window, set } = await visit(t, session());
  set([]);
  window.dispatchEvent(new window.MouseEvent('pointermove', { clientX: 20, clientY: 20 }));
  life.update();
  assert.deepEqual(alive(life.grid), [[2,2]]);
  window.dispatchEvent(new window.Event('blur'));
  life.update();
  assert.deepEqual(alive(life.grid), []);
});
