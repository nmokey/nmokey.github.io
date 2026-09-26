// Page content lives in docs/*.html. Only security metadata and the sitemap are generated.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const check = process.argv.includes('--check');
const origin = 'https://www.nmokey.com';
const pages = (await readdir('docs')).filter(name => name.endsWith('.html')).sort();
let stale = false;
async function output(path, content) {
  const current = await readFile(path, 'utf8').catch(() => '');
  if (current === content) return;
  if (check) { console.error(`${path}: generated metadata is stale; run npm run sync`); stale = true; }
  else await writeFile(path, content);
}
for (const name of pages) {
  let html = await readFile(`docs/${name}`, 'utf8');
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
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.filter(name => name !== '404.html').map(name => `  <url><loc>${origin}/${name === 'index.html' ? '' : name}</loc></url>`).join('\n')}\n</urlset>\n`;
await output('docs/sitemap.xml', sitemap);
await output('docs/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
if (stale) process.exitCode = 1;
