import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { HtmlValidate } from 'html-validate';
import { JSDOM } from 'jsdom';
import { createHash } from 'node:crypto';

const root = resolve('docs');
const pages = [
  ...(await readdir(root)).filter(name => name.endsWith('.html')),
  ...(await readdir(resolve(root, 'thoughts')).catch(() => [])).filter(name => name.endsWith('.html')).map(name => `thoughts/${name}`)
];
const validator = new HtmlValidate({ extends: ['html-validate:recommended'] });
const failures = [];
for (const name of pages) {
  const path = resolve(root, name);
  const html = await readFile(path, 'utf8');
  const report = await validator.validateString(html, path);
  for (const result of report.results) for (const message of result.messages) {
    failures.push(`${name}:${message.line}: ${message.message} (${message.ruleId})`);
  }
  const document = new JSDOM(html).window.document;
  for (const element of document.querySelectorAll('[href], [src]')) {
    const value = element.getAttribute('href') ?? element.getAttribute('src');
    if (!value || /^(https?:|mailto:|data:|tel:)/.test(value)) continue;
    const url = new URL(value, `https://local.test/${name}`);
    const target = resolve(root, `.${decodeURIComponent(url.pathname)}`);
    const file = url.pathname.endsWith('/') ? resolve(target, 'index.html') : target;
    try { await stat(file); } catch { failures.push(`${name}: broken local reference ${value}`); continue; }
    if (url.hash && extname(file) === '.html') {
      const targetDocument = file === path ? document : new JSDOM(await readFile(file, 'utf8')).window.document;
      if (!targetDocument.getElementById(decodeURIComponent(url.hash.slice(1)))) failures.push(`${name}: missing anchor ${value}`);
    }
  }
  for (const script of document.querySelectorAll('script:not([src])')) {
    if (script.type !== 'application/ld+json') failures.push(`${name}: executable inline script`);
    else try { JSON.parse(script.textContent); } catch { failures.push(`${name}: invalid JSON-LD`); }
  }
  if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) failures.push(`${name}: missing CSP`);
}
for (const name of await readdir('docs/assets/js')) {
  if (name.endsWith('.js')) {
    try { execFileSync(process.execPath, ['--check', `docs/assets/js/${name}`], {stdio: 'pipe'}); }
    catch (error) { failures.push(String(error.stderr)); }
  }
}
// Check navigation data too: those links are rendered after loading the document.
const config = await readFile('docs/assets/js/config.js', 'utf8');
for (const [, href] of config.matchAll(/link:\s*"([^"]+)"/g)) {
  try { await stat(resolve(root, `.${href}`)); } catch { failures.push(`config.js: missing ${href}`); }
}
const exceptions = JSON.parse(await readFile('scripts/asset-budget.json', 'utf8'));
async function checkAssets(directory) {
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) { await checkAssets(path); continue; }
    const size = (await stat(path)).size;
    if (size <= 1024 * 1024) continue;
    const digest = createHash('sha256').update(await readFile(path)).digest('hex');
    if (exceptions[path]?.sha256 !== digest) failures.push(`${path}: exceeds 1 MiB; optimize it or explicitly review the budget`);
  }
}
await checkAssets('docs/assets');
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`Checked ${pages.length} pages: valid HTML, local links, metadata, JavaScript syntax and asset budgets.`);
