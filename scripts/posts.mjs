// Blog posts: posts/*.md (front matter + Markdown) become docs/thoughts/<slug>.html.
// $...$ and $$...$$ render to MathML at build time; posts/<name>.md.ots is an OpenTimestamps proof.
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Marked } from 'marked';
import temml from 'temml';

const tex = (source, displayMode) => temml.renderToString(source.trim(), { displayMode, throwOnError: true });
const marked = new Marked({ gfm: true }, {
  extensions: [
    {
      name: 'displayMath', level: 'block',
      start: src => src.indexOf('$$'),
      tokenizer(src) {
        const match = src.match(/^\$\$([\s\S]+?)\$\$[^\S\n]*(?:\n+|$)/);
        if (match) return { type: 'displayMath', raw: match[0], text: match[1] };
      },
      renderer: token => `${tex(token.text, true)}\n`
    },
    {
      name: 'inlineMath', level: 'inline',
      start: src => src.indexOf('$'),
      tokenizer(src) {
        const match = src.match(/^\$\$((?:\\.|[^\\$])+?)\$\$/) ?? src.match(/^\$(?!\s)((?:\\.|[^\\$\n])+?)(?<!\s)\$(?!\d)/);
        if (match) return { type: 'inlineMath', raw: match[0], text: match[1], displayMode: match[0].startsWith('$$') };
      },
      renderer: token => tex(token.text, token.displayMode)
    }
  ]
});
// The CSP blocks style attributes, so Temml's inline styles become classes in a generated stylesheet.
function classifyMathStyles(html, styles) {
  return html.replace(/<math[\s\S]*?<\/math>/g, math => math.replace(/<(\w+)([^>]*?) style="([^"]*)"([^>]*)>/g, (_, tag, before, style, after) => {
    const name = `tml-${createHash('sha256').update(style).digest('hex').slice(0, 8)}`;
    styles.set(name, style);
    const attributes = before + after;
    return /\bclass="/.test(attributes)
      ? `<${tag}${attributes.replace(/\bclass="/, `class="${name} `)}>`
      : `<${tag}${attributes} class="${name}">`;
  }));
}
const escape = text => String(text).replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`);
const displayDate = date => new Date(`${date}T00:00:00Z`)
  .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).toLowerCase();

export function parsePost(filename, source) {
  const match = source.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`${filename}: missing front matter (--- title/date ---)`);
  const fields = {};
  for (const line of match[1].split('\n')) {
    if (!line.trim()) continue;
    const field = line.match(/^(\w+):\s*(.*)$/);
    if (!field) throw new Error(`${filename}: cannot read front matter line "${line}"`);
    fields[field[1]] = field[2].replace(/^(["'])(.*)\1$/, '$2');
  }
  for (const key of ['title', 'date']) {
    if (!fields[key]) throw new Error(`${filename}: front matter needs "${key}"`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.date) || Number.isNaN(Date.parse(fields.date))) {
    throw new Error(`${filename}: date must be YYYY-MM-DD`);
  }
  const slug = filename.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`${filename}: use lowercase-words-with-dashes for the file name`);
  const tokens = marked.lexer(match[2]);
  if (tokens.some(token => token.type === 'heading' && token.depth === 1)) {
    throw new Error(`${filename}: the title is the page heading; use ## for sections`);
  }
  let html;
  try { html = marked.parser(tokens).trim(); }
  catch (error) { throw new Error(`${filename}: ${error.message}`); }
  const styles = new Map();
  html = classifyMathStyles(html, styles);
  // Search results and the feed need a summary; without a description, use the opening words.
  const opening = (html.match(/<p>([\s\S]*?)<\/p>/)?.[1] ?? '').replace(/<math[\s\S]*?<\/math>/g, '')
    .replace(/<[^>]+>/g, '').replace(/&(amp|lt|gt|quot|#39);/g, (_, entity) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[entity])
    .replace(/\s+/g, ' ').trim();
  const excerpt = opening.length > 160 ? `${opening.slice(0, 160).replace(/\s+\S*$/, '')}…` : opening;
  return {
    slug, title: fields.title, date: fields.date, description: fields.description ?? '', summary: fields.description || excerpt,
    draft: fields.draft === 'true', math: html.includes('<math'), styles, html
  };
}

// An OpenTimestamps proof starts with a fixed header, version 1, the sha256 tag and the file digest.
const proofHeader = Buffer.from('004f70656e54696d657374616d7073000050726f6f6600bf89e2e884e892940108', 'hex');
export function proofDigest(proof) {
  if (proof.length < proofHeader.length + 32 || !proof.subarray(0, proofHeader.length).equals(proofHeader)) {
    throw new Error('not a sha256 OpenTimestamps proof');
  }
  return proof.subarray(proofHeader.length, proofHeader.length + 32).toString('hex');
}

export function renderMathCss(posts) {
  const styles = new Map(posts.flatMap(post => [...post.styles]));
  const rules = [...styles].sort(([a], [b]) => a.localeCompare(b)).map(([name, style]) => {
    const declarations = style.split(';').map(part => part.trim()).filter(Boolean).map(part => `${part} !important;`);
    return `.${name} { ${declarations.join(' ')} }`;
  });
  return `/* Generated by scripts/sync-site.mjs from Temml's inline styles (important keeps inline precedence). */\n${rules.join('\n')}\n`;
}

export async function loadPosts(directory, { drafts = false } = {}) {
  const names = (await readdir(directory).catch(() => [])).filter(name => name.endsWith('.md')).sort();
  const posts = [];
  for (const name of names) {
    const source = await readFile(`${directory}/${name}`, 'utf8');
    const post = parsePost(name, source);
    const proof = await readFile(`${directory}/${name}.ots`).catch(() => null);
    if (proof) {
      let digest;
      try { digest = proofDigest(proof); } catch (error) { throw new Error(`${name}.ots: ${error.message}`); }
      if (digest !== createHash('sha256').update(source).digest('hex')) {
        throw new Error(`${name} changed after it was timestamped; revert the edit, or delete ${name}.ots and run npm run stamp -- ${directory}/${name}`);
      }
      Object.assign(post, { source, proof });
    }
    posts.push(post);
  }
  const seen = new Set();
  for (const post of posts) {
    if (seen.has(post.slug)) throw new Error(`posts: two files produce thoughts/${post.slug}.html`);
    seen.add(post.slug);
  }
  return posts.filter(post => drafts || !post.draft)
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export function renderPostList(posts) {
  if (!posts.length) return '      <p class="post-list-empty">nothing here yet.</p>';
  const items = posts.map(post => `        <li>
          <a href="/thoughts/${post.slug}.html">${escape(post.title)}</a>
          <time datetime="${post.date}">${displayDate(post.date)}</time>${post.description ? `
          <p>${escape(post.description)}</p>` : ''}
        </li>`);
  return `      <ul class="post-list">\n${items.join('\n')}\n      </ul>`;
}

export function renderPostPage(post, origin) {
  const url = `${origin}/thoughts/${post.slug}.html`;
  const structured = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title,
    description: post.summary, datePublished: post.date, url,
    author: { '@type': 'Person', name: 'Ryan Zheng', url: `${origin}/` }
  }).replace(/</g, '\\u003c');
  const body = post.html.replace(/^/gm, '      ');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(post.title)} - ryan zheng</title>
  <meta name="description" content="${escape(post.summary)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${escape(post.title)}">
  <meta property="og:description" content="${escape(post.summary)}">
  <link rel="alternate" type="application/rss+xml" title="thoughts - ryan zheng" href="/feed.xml">
  <link rel="stylesheet" href="/assets/css/main.css">
  <link rel="stylesheet" href="/assets/css/components.css">${post.math ? `
  <link rel="stylesheet" href="/assets/temml/Temml-Local.css">
  <link rel="stylesheet" href="/assets/temml/math.css">` : ''}
  <link rel="icon" type="image/x-icon" href="/assets/favicons/favicon.ico">
  <script type="application/ld+json">${structured}</script>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-NK15EEMEB2"></script>
  <script src="/assets/js/analytics.js"></script>
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <!-- Menu hidden so visitors only see the front page; uncomment this and renderNavigation() in components.js to restore.
  <div class="site-menu" id="siteMenu">
    <button type="button" class="menu-toggle" id="menuToggle" aria-label="Toggle menu" aria-expanded="false" aria-controls="navMenu">
      <span class="menu-icon" aria-hidden="true"><span></span><span></span><span></span></span>
    </button>
    <nav class="nav-menu" id="navMenu" aria-label="Main navigation" inert></nav>
  </div>
  -->

  <main class="page-content" aria-label="Content" id="main-content" tabindex="-1">
    <article class="container-narrow post">
      <p class="post-back"><a href="/thoughts.html">&larr; thoughts</a></p>
      <h1>${escape(post.title)}</h1>
      <p class="post-meta"><time datetime="${post.date}">${displayDate(post.date)}</time></p>
${body}${post.proof ? `
      <p class="post-proof">timestamped with <a href="https://opentimestamps.org">opentimestamps</a>: <a href="/thoughts/${post.slug}.md" download>source</a> &middot; <a href="/thoughts/${post.slug}.md.ots" download>proof</a></p>` : ''}
    </article>
  </main>

  <footer class="site-footer" id="footer"></footer>

  <script src="/assets/js/config.js"></script>
  <script src="/assets/js/components.js"></script>
  <script src="/assets/js/main.js"></script>
  <script src="/assets/js/gravity-background.js"></script>
</body>
</html>
`;
}

export function renderFeed(posts, origin) {
  const items = posts.map(post => `    <item>
      <title>${escape(post.title)}</title>
      <link>${origin}/thoughts/${post.slug}.html</link>
      <guid>${origin}/thoughts/${post.slug}.html</guid>
      <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${escape(post.summary)}</description>
    </item>`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>thoughts - ryan zheng</title>
    <link>${origin}/thoughts.html</link>
    <description>stories and thoughts that ryan wants to write about</description>
${items.join('\n')}
  </channel>
</rss>
`;
}
