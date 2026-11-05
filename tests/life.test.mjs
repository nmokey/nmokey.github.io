import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
const context = vm.createContext({ document: { addEventListener() {} } });
vm.runInContext(readFileSync('docs/assets/js/life-background.js', 'utf8'), context);
const Life = vm.runInContext('LifeBackground', context);
function board(points) {
  const life = Object.create(Life.prototype);
  Object.assign(life, { columns: 5, rows: 5, cellSize: 18, cells: new Uint8Array(25), next: new Uint8Array(25), pointer: null });
  for (const [x, y] of points) life.cells[y * 5 + x] = 1;
  return life;
}
function alive(life) { return Array.from(life.cells).flatMap((v, i) => v ? [[i % 5, Math.floor(i / 5)]] : []); }
test('Life preserves a block and oscillates a blinker synchronously', () => {
  const block = board([[1,1],[2,1],[1,2],[2,2]]);
  const before = alive(block);
  block.update(); assert.deepEqual(alive(block), before);
  const blinker = board([[1,2],[2,2],[3,2]]);
  blinker.update(); assert.deepEqual(alive(blinker), [[2,1],[2,2],[2,3]]);
  blinker.update(); assert.deepEqual(alive(blinker), [[1,2],[2,2],[3,2]]);
});
test('isolated cells die and edges do not wrap', () => {
  const life = board([[0,0],[4,0],[0,4]]);
  life.update(); assert.deepEqual(alive(life), []);
});
test('hover wakes a cell, holds it alive, and releases it to normal evolution', () => {
  const life = board([]);
  life.pointer = {x:40,y:40}; life.wakePointer();
  assert.deepEqual(alive(life), [[2,2]]);
  life.update(); assert.deepEqual(alive(life), [[2,2]]);
  life.pointer = null; life.update(); assert.deepEqual(alive(life), []);
});

function session() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

async function visit(t, storage, width = 64) {
  const dom = new JSDOM('<!doctype html><body></body>', {
    url: 'https://www.nmokey.com/', runScripts: 'outside-only', pretendToBeVisual: true
  });
  t.after(() => dom.window.close());
  const { window } = dom;
  await new Promise(resolve => window.document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  Object.defineProperty(window, 'innerWidth', { value: width });
  Object.defineProperty(window, 'innerHeight', { value: 64 });
  Object.defineProperty(window, 'sessionStorage', { value: storage });
  window.matchMedia = () => ({ matches: true, addEventListener() {} });
  window.Math.random = () => 0.25;
  const errors = [];
  window.addEventListener('error', event => errors.push(event.error));
  window.HTMLCanvasElement.prototype.getContext = () => ({
    setTransform() {}, clearRect() {}, fillRect() {},
    createLinearGradient: () => ({ addColorStop() {} })
  });
  vm.runInContext(readFileSync('docs/assets/js/life-background.js', 'utf8'), dom.getInternalVMContext());
  const Life = vm.runInContext('LifeBackground', dom.getInternalVMContext());
  const life = new Life(window.document.createElement('canvas'));
  const set = points => {
    life.cells.fill(0);
    for (const [x, y] of points) life.cells[y * life.columns + x] = 1;
  };
  const points = () => Array.from(life.cells).flatMap((cell, i) => cell ? [[i % life.columns, Math.floor(i / life.columns)]] : []);
  const leave = () => window.dispatchEvent(new window.PageTransitionEvent('pagehide'));
  return { life, window, set, points, leave, errors };
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
    assert.equal(page.life.cells.length, 64);
    page.leave();
    assert.deepEqual(page.errors, []);
  }
});
