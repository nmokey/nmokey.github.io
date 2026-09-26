import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parsePost, renderPostList, renderFeed, renderMathCss, proofDigest } from '../scripts/posts.mjs';

const source = (front, body = 'hello **there**') => `---\n${front}\n---\n\n${body}\n`;
const valid = 'title: "a & b"\ndate: 2026-09-28\ndescription: short <summary>';

test('front matter and file name become the post record', () => {
  const post = parsePost('2026-09-28-first-post.md', source(valid));
  assert.equal(post.slug, 'first-post');
  assert.equal(post.title, 'a & b');
  assert.equal(post.draft, false);
  assert.equal(post.html, '<p>hello <strong>there</strong></p>');
  assert.equal(parsePost('x.md', source(`${valid}\ndraft: true`)).draft, true);
});

test('mistakes are reported with the file name', () => {
  assert.throws(() => parsePost('a.md', 'no front matter'), /a\.md: missing front matter/);
  assert.throws(() => parsePost('a.md', source('date: 2026-09-28')), /needs "title"/);
  assert.throws(() => parsePost('a.md', source('title: t\ndate: sept 28\ndescription: d')), /YYYY-MM-DD/);
  assert.throws(() => parsePost('My Post.md', source(valid)), /lowercase-words-with-dashes/);
  assert.throws(() => parsePost('a.md', source(valid, '# second title')), /use ## for sections/);
});

test('without a description, the list shows none and search results use the opening words', () => {
  const post = parsePost('a.md', source('title: t\ndate: 2026-09-28', `it&#39;s $x$ here. ${'word '.repeat(40)}\n\nsecond paragraph`));
  assert.doesNotMatch(renderPostList([post]), /<p>/);
  assert.match(post.summary, /^it's here\. word word/);
  assert.ok(post.summary.endsWith('word…') && post.summary.length <= 161);
});

test('list and feed escape text and handle having no posts', () => {
  const post = parsePost('first-post.md', source(valid));
  assert.match(renderPostList([post]), /a &#38; b<\/a>[\s\S]*september 28, 2026[\s\S]*short &#60;summary&#62;/);
  assert.match(renderPostList([]), /nothing here yet/);
  const feed = renderFeed([post], 'https://example.test');
  assert.match(feed, /<link>https:\/\/example\.test\/thoughts\/first-post\.html<\/link>/);
  assert.match(feed, /<pubDate>Mon, 28 Sep 2026 00:00:00 GMT<\/pubDate>/);
});

test('math renders to MathML with styles moved into classes', () => {
  const post = parsePost('a.md', source(valid, 'costs \\$5 to $6, and $\\hat{Q}$ too\n\n$$\n\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}\n$$'));
  assert.match(post.html, /^<p>costs \$5 to \$6, and <math>/);
  assert.match(post.html, /<math display="block" class="tml-[0-9a-f]{8} tml-display">/);
  assert.doesNotMatch(post.html, /style=/);
  assert.equal(post.math, true);
  assert.match(renderMathCss([post]), /\.tml-[0-9a-f]{8} \{ display:block math !important; \}/);
  assert.throws(() => parsePost('a.md', source(valid, '$\\frac{1$')), /a\.md: .*end of input/);
});

test('published timestamp proofs match their posts', () => {
  for (const name of ['2026-09-26-learning-stuff.md']) {
    const digest = createHash('sha256').update(readFileSync(`posts/${name}`)).digest('hex');
    assert.equal(proofDigest(readFileSync(`posts/${name}.ots`)), digest);
  }
  assert.throws(() => proofDigest(Buffer.from('not a proof')), /not a sha256 OpenTimestamps proof/);
});
