import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
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
