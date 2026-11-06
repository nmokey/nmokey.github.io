import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const script = resolve('scripts/sync-site.mjs');
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'nmokey-sync-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const directory of ['docs/assets/js', 'docs/assets/css', 'docs/thoughts', 'docs/poker', 'posts']) {
    await mkdir(join(root, directory), { recursive: true });
  }
  await symlink(resolve('node_modules'), join(root, 'node_modules'), 'dir');
  const put = (name, content) => writeFile(join(root, name), content);
  for (const name of ['theme-init', 'analytics', 'config', 'components', 'main', 'life-init']) {
    await put(`docs/assets/js/${name}.js`, '// fixture\n');
  }
  await put('docs/assets/js/life-grid.js', 'export const cells = 1;\n');
  await put('docs/assets/js/life-background.js', "import { cells } from './life-grid.js';\nexport { cells };\n");
  await put('docs/assets/js/life-init.js', "import { cells } from './life-background.js';\nconsole.log(cells);\n");
  for (const name of ['main', 'components', 'poker', '404']) await put(`docs/assets/css/${name}.css`, 'body {}\n');
  const shell = '<!doctype html>\n<html><head>\n  <meta charset="utf-8">\n  <!-- Generated styles -->\n  <!-- End generated styles -->\n</head><body>CONTENT\n  <!-- Generated scripts -->\n  <!-- End generated scripts -->\n</body></html>\n';
  await put('docs/index.html', shell);
  await put('docs/404.html', shell);
  await put('docs/poker/index.html', shell);
  await put('docs/thoughts.html', shell.replace('CONTENT', '<!-- Generated post list --><!-- End generated post list -->'));
  const source = '---\ntitle: published\ndate: 2026-11-04\n---\nhello $\\hat{x}$\n';
  await put('posts/published.md', source);
  await put('posts/published.md.ots', Buffer.concat([
    Buffer.from('004f70656e54696d657374616d7073000050726f6f6600bf89e2e884e892940108', 'hex'),
    createHash('sha256').update(source).digest()
  ]));
  await put('posts/draft.md', '---\ntitle: draft\ndate: 2026-11-05\ndraft: true\n---\nnot published\n');
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' });
  const get = name => readFile(join(root, name), 'utf8');
  return { root, put, run, get };
}
async function snapshot(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name), name = prefix + entry.name;
    if (entry.isDirectory()) files.push(...await snapshot(path, `${name}/`));
    else files.push([name, (await readFile(path)).toString('base64')]);
  }
  return files.sort(([a], [b]) => a.localeCompare(b));
}

test('sync generates repeatable published pages, math, proofs, and metadata', async t => {
  const { root, run, get } = await fixture(t);
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  const post = await get('docs/thoughts/published.html');
  assert.match(post, /<math>/);
  assert.match(post, /Content-Security-Policy/);
  assert.match(post, /sha256-/);
  assert.match(post, /main\.css\?v=[a-f0-9]{12}/);
  assert.match(post, /published\.md\.ots/);
  assert.match(await get('docs/assets/temml/math.css'), /\.tml-/);
  assert.equal(await get('docs/thoughts/published.md'), await get('posts/published.md'));
  assert.match(await get('docs/feed.xml'), /published/);
  assert.doesNotMatch(await get('docs/feed.xml'), /draft/);
  assert.doesNotMatch(await get('docs/sitemap.xml'), /draft|404\.html/);
  assert.match(await get('docs/poker/index.html'), /frame-src https:\/\/nmokey-poker/);
  const before = await snapshot(join(root, 'docs'));
  assert.equal(run().status, 0);
  assert.deepEqual(await snapshot(join(root, 'docs')), before);
  assert.equal(run('--check').status, 0);
  assert.deepEqual(await snapshot(join(root, 'docs')), before);
});

test('check detects stale assets and obsolete output without modifying files', async t => {
  const { root, run, put, get } = await fixture(t);
  assert.equal(run().status, 0);
  await put('docs/thoughts/obsolete.html', 'obsolete');
  await put('docs/assets/js/main.js', '// changed\n');
  const before = await snapshot(join(root, 'docs'));
  const result = run('--check');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /obsolete\.html/);
  assert.match(result.stderr, /generated output is stale/);
  assert.deepEqual(await snapshot(join(root, 'docs')), before);
  assert.equal(run().status, 0);
  await assert.rejects(get('docs/thoughts/obsolete.html'), { code: 'ENOENT' });
  assert.equal(run('--check').status, 0);
});

test('draft preview is rejected by the published check and cleaned by normal sync', async t => {
  const { run, get } = await fixture(t);
  assert.equal(run('--drafts').status, 0);
  assert.match(await get('docs/thoughts.html'), /draft\.html/);
  assert.equal(run('--check').status, 1);
  assert.equal(run().status, 0);
  await assert.rejects(get('docs/thoughts/draft.html'), { code: 'ENOENT' });
  assert.doesNotMatch(await get('docs/thoughts.html'), /draft\.html/);
  assert.equal(run('--check').status, 0);
});


test('check does not recreate missing generated directories', async t => {
  const { root, run } = await fixture(t);
  assert.equal(run().status, 0);
  await rm(join(root, 'docs/thoughts'), { recursive: true });
  await rm(join(root, 'docs/assets/temml'), { recursive: true });
  const before = await snapshot(join(root, 'docs'));
  const result = run('--check');
  assert.equal(result.status, 1, result.stderr);
  assert.deepEqual(await snapshot(join(root, 'docs')), before);
  await assert.rejects(readdir(join(root, 'docs/thoughts')), { code: 'ENOENT' });
  await assert.rejects(readdir(join(root, 'docs/assets/temml')), { code: 'ENOENT' });
});


test('nested pages are discovered and shared assets include versioned module dependencies', async t => {
  const { root, run, put, get } = await fixture(t);
  await mkdir(join(root, 'docs/notes/deep'), { recursive: true });
  await put('docs/notes/deep/index.html', await get('docs/index.html'));
  assert.equal(run().status, 0);
  assert.match(await get('docs/sitemap.xml'), /https:\/\/www.nmokey.com\/notes\/deep\//);
  const nested = await get('docs/notes/deep/index.html');
  assert.match(nested, /life-init.js\?v=[a-f0-9]{12}/);
  assert.match(nested, /components.css\?v=[a-f0-9]{12}/);
  const entry = await get('docs/assets/js/life-init.js');
  const background = await get('docs/assets/js/life-background.js');
  assert.match(background, /life-grid.js\?v=[a-f0-9]{12}/);
  await put('docs/assets/js/life-grid.js', 'export const cells = 2;\n');
  const before = await snapshot(join(root, 'docs'));
  assert.equal(run('--check').status, 1);
  assert.deepEqual(await snapshot(join(root, 'docs')), before);
  assert.equal(run().status, 0);
  assert.notEqual(await get('docs/assets/js/life-init.js'), entry);
  assert.notEqual(await get('docs/assets/js/life-background.js'), background);
  assert.notEqual(await get('docs/notes/deep/index.html'), nested);
  assert.equal(run('--check').status, 0);
});
