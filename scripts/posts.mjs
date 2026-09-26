// Blog posts: posts/*.md (front matter + Markdown) become docs/thoughts/<slug>.html.
import { readFile, readdir } from 'node:fs/promises';
import { Marked } from 'marked';

const marked = new Marked({ gfm: true });
const escape = text => String(text).replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`);
const displayDate = date => new Date(`${date}T00:00:00Z`)
  .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).toLowerCase();

export function parsePost(filename, source) {
  const match = source.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`${filename}: missing front matter (--- title/date/description ---)`);
  const fields = {};
  for (const line of match[1].split('\n')) {
    if (!line.trim()) continue;
    const field = line.match(/^(\w+):\s*(.*)$/);
    if (!field) throw new Error(`${filename}: cannot read front matter line "${line}"`);
    fields[field[1]] = field[2].replace(/^(["'])(.*)\1$/, '$2');
  }
  for (const key of ['title', 'date', 'description']) {
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
  return {
    slug, title: fields.title, date: fields.date, description: fields.description,
    draft: fields.draft === 'true', html: marked.parser(tokens).trim()
  };
}

export async function loadPosts(directory, { drafts = false } = {}) {
  const names = (await readdir(directory).catch(() => [])).filter(name => name.endsWith('.md')).sort();
  const posts = [];
  for (const name of names) posts.push(parsePost(name, await readFile(`${directory}/${name}`, 'utf8')));
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
          <time datetime="${post.date}">${displayDate(post.date)}</time>
          <p>${escape(post.description)}</p>
        </li>`);
  return `      <ul class="post-list">\n${items.join('\n')}\n      </ul>`;
}

export function renderPostPage(post, origin) {
  const url = `${origin}/thoughts/${post.slug}.html`;
  const structured = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title,
    description: post.description, datePublished: post.date, url,
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
  <meta name="description" content="${escape(post.description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${escape(post.title)}">
  <meta property="og:description" content="${escape(post.description)}">
  <link rel="alternate" type="application/rss+xml" title="thoughts - ryan zheng" href="/feed.xml">
  <link rel="stylesheet" href="/assets/css/main.css">
  <link rel="stylesheet" href="/assets/css/components.css">
  <link rel="icon" type="image/x-icon" href="/assets/favicons/favicon.ico">
  <script type="application/ld+json">${structured}</script>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-NK15EEMEB2"></script>
  <script src="/assets/js/analytics.js"></script>
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <div class="site-menu" id="siteMenu">
    <button type="button" class="menu-toggle" id="menuToggle" aria-label="Toggle menu" aria-expanded="false" aria-controls="navMenu">
      <span class="menu-icon" aria-hidden="true"><span></span><span></span><span></span></span>
    </button>
    <nav class="nav-menu" id="navMenu" aria-label="Main navigation" inert></nav>
  </div>

  <main class="page-content" aria-label="Content" id="main-content" tabindex="-1">
    <article class="container-narrow post">
      <p class="post-back"><a href="/thoughts.html">&larr; thoughts</a></p>
      <h1>${escape(post.title)}</h1>
      <p class="post-meta"><time datetime="${post.date}">${displayDate(post.date)}</time></p>
${body}
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
      <description>${escape(post.description)}</description>
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
