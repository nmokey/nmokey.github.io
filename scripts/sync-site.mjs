// Page content lives in docs/*.html and posts/*.md. Generated: post pages and their timestamp
// proofs, the thoughts post list, math styles, security metadata, the sitemap and the feed.
// --drafts includes draft posts.
import { readFile, writeFile, readdir, mkdir, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadPosts, renderPostList, renderPostPage, renderFeed, renderMathCss } from './posts.mjs';

const check = process.argv.includes('--check');
const origin = 'https://www.nmokey.com';
const posts = await loadPosts('posts', { drafts: process.argv.includes('--drafts') });
const pages = new Map();
for (const name of (await readdir('docs')).filter(name => name.endsWith('.html')).sort()) {
  pages.set(name, await readFile(`docs/${name}`, 'utf8'));
}
for (const post of posts) pages.set(`thoughts/${post.slug}.html`, renderPostPage(post, origin));
const list = /<!-- Generated post list -->[\s\S]*?<!-- End generated post list -->/;
if (!list.test(pages.get('thoughts.html'))) throw new Error('docs/thoughts.html: missing generated post list markers');
pages.set('thoughts.html', pages.get('thoughts.html').replace(list, () =>
  `<!-- Generated post list -->\n${renderPostList(posts)}\n      <!-- End generated post list -->`));

let stale = false;
async function output(path, content) {
  const current = await readFile(path).catch(() => null);
  if (current?.equals(Buffer.from(content))) return;
  if (check) { console.error(`${path}: generated output is stale; run npm run sync`); stale = true; }
  else await writeFile(path, content);
}
// Math assets are written before pages so their version stamps match.
await mkdir('docs/assets/temml', { recursive: true });
for (const name of ['Temml-Local.css', 'Temml.woff2']) {
  await output(`docs/assets/temml/${name}`, await readFile(`node_modules/temml/dist/${name}`));
}
await output('docs/assets/temml/math.css', renderMathCss(posts));
const files = new Map();
for (const post of posts.filter(post => post.proof)) {
  files.set(`${post.slug}.md`, post.source).set(`${post.slug}.md.ots`, post.proof);
}
await mkdir('docs/thoughts', { recursive: true });
for (const [name, content] of files) await output(`docs/thoughts/${name}`, content);
for (const name of await readdir('docs/thoughts')) {
  if (pages.has(`thoughts/${name}`) || files.has(name)) continue;
  if (check) { console.error(`docs/thoughts/${name}: no matching published post; run npm run sync`); stale = true; }
  else await unlink(`docs/thoughts/${name}`);
}
for (let [name, html] of pages) {
  const hashes = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(match => `'sha256-${createHash('sha256').update(match[1]).digest('base64')}'`);
  const policy = [
    "default-src 'none'",
    `script-src 'self' https://www.googletagmanager.com ${hashes.join(' ')}`.trim(),
    "script-src-attr 'none'",
    "style-src 'self'",
    "img-src 'self' data: https://*.google-analytics.com https://www.googletagmanager.com",
    "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
    "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
    "font-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "form-action 'none'"
  ].join('; ');
  html = html.replace(/\n  <!-- Generated site metadata -->[\s\S]*?<!-- End generated site metadata -->\n/g, '\n');
  html = html.replace(/\s*<link rel="canonical"[^>]*>/g, '');
  for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"?]+\.(?:js|css))(?:\?[^"]*)?"/g)) {
    const digest = createHash('sha256').update(await readFile(`docs${match[1]}`)).digest('hex').slice(0, 12);
    html = html.replace(match[0], match[0].split('=')[0] + `="${match[1]}?v=${digest}"`);
  }
  const canonical = `${origin}/${name === 'index.html' ? '' : name}`;
  const metadata = `\n  <!-- Generated site metadata -->\n  <meta http-equiv="Content-Security-Policy" content="${policy}">\n  <meta name="referrer" content="strict-origin-when-cross-origin">\n  ${name === '404.html' ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${canonical}">`}\n  <!-- End generated site metadata -->\n`;
  html = html.replace(/(<meta charset="utf-8">)\n?/, `$1${metadata}`);
  await output(`docs/${name}`, html);
}
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...pages.keys()].filter(name => name !== '404.html').map(name => `  <url><loc>${origin}/${name === 'index.html' ? '' : name}</loc></url>`).join('\n')}\n</urlset>\n`;
await output('docs/sitemap.xml', sitemap);
await output('docs/feed.xml', renderFeed(posts, origin));
await output('docs/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
if (stale) process.exitCode = 1;
