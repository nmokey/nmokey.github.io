// Import the reviewed Quarto export while keeping the article's own presentation.
// Usage: node scripts/import-poker-writeup.mjs /absolute/path/to/report/_site
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { JSDOM } from 'jsdom';
import temml from 'temml';

const source = resolve(process.argv[2] || '../Poker-Decision-Model/report/_site');
const destination = 'docs/poker/writeup';
await mkdir(`${destination}/assets`, { recursive: true });
for (const name of ['generated', 'index.pdf', 'index.tex', 'references.bib', 'pocketsolver-latex.zip', 'pocketsolver-web.zip']) {
  await cp(join(source, name), join(destination, name), { recursive: true });
}
// Quarto include snippets are not standalone pages or needed by the exported article.
const { rm } = await import('node:fs/promises');
await rm(`${destination}/generated/embedded-data.html`, { force: true });
for (const name of ['article.css', 'article.js']) await cp(join(source, 'assets', name), join(destination, 'assets', name));
const dom = new JSDOM(await readFile(join(source, 'index.html'), 'utf8'));
const d = dom.window.document;
d.documentElement.removeAttribute('xmlns'); d.documentElement.removeAttribute('xml:lang');
const styles = [...d.querySelectorAll('style')].map(node => node.textContent);
d.querySelectorAll('style, link[rel="stylesheet"], script').forEach(node => {
  if (node.tagName === 'SCRIPT' && node.id === 'report-data' && node.type === 'application/json') return;
  node.remove();
});
for (const node of d.querySelectorAll('.math')) {
  const tex = node.textContent.trim().replace(/^\\[([]/, '').replace(/\\[)\]]$/, '');
  node.innerHTML = temml.renderToString(tex, { displayMode: node.classList.contains('display'), throwOnError: true });
}
for (const node of d.querySelectorAll('[role="list"], [role="listitem"]')) {
  const native = d.createElement(node.getAttribute('role') === 'list' ? 'ul' : 'li');
  for (const attr of node.attributes) if (attr.name !== 'role') native.setAttribute(attr.name, attr.value);
  native.append(...node.childNodes); node.replaceWith(native);
}
const declarations = new Map();
for (const node of d.querySelectorAll('[style]')) {
  const rule = node.getAttribute('style');
  if (!declarations.has(rule)) declarations.set(rule, `article-style-${declarations.size}`);
  node.classList.add(declarations.get(rule)); node.removeAttribute('style');
}
styles.push(...[...declarations].map(([rule, name]) => `.${name}{${rule}}`));
await writeFile(`${destination}/assets/export.css`, styles.join('\n') + '\n');
for (const href of ['assets/export.css', '/assets/temml/Temml-Local.css', 'assets/article.css']) {
  const link = d.createElement('link');link.rel = 'stylesheet';link.href = href;d.head.append(link);
}
const script = d.createElement('script'); script.src = 'assets/article.js'; script.defer = true; d.body.append(script);
const home = d.createElement('a'); home.href = '/projects.html'; home.textContent = '← Projects'; home.className = 'article-home';
d.querySelector('main').prepend(home);
await writeFile(`${destination}/index.html`, '<!DOCTYPE html>\n' + d.documentElement.outerHTML.replace(/[ \t]+$/gm, '').replace(/defer=""/g, 'defer') + '\n');
await writeFile(`${destination}/assets/article.css`, (await readFile(`${destination}/assets/article.css`, 'utf8')) + '\n.references{list-style:none;padding-left:0}.article-home{display:block;font: .75rem var(--sans);margin-bottom:2rem;text-decoration:none}\n');
console.log(`Imported research article to ${destination}/`);
