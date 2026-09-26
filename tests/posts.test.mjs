import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePost, renderPostList, renderFeed } from '../scripts/posts.mjs';

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
  assert.throws(() => parsePost('a.md', source('title: t\ndate: 2026-09-28')), /needs "description"/);
  assert.throws(() => parsePost('a.md', source('title: t\ndate: sept 28\ndescription: d')), /YYYY-MM-DD/);
  assert.throws(() => parsePost('My Post.md', source(valid)), /lowercase-words-with-dashes/);
  assert.throws(() => parsePost('a.md', source(valid, '# second title')), /use ## for sections/);
});

test('list and feed escape text and handle having no posts', () => {
  const post = parsePost('first-post.md', source(valid));
  assert.match(renderPostList([post]), /a &#38; b<\/a>[\s\S]*september 28, 2026[\s\S]*short &#60;summary&#62;/);
  assert.match(renderPostList([]), /nothing here yet/);
  const feed = renderFeed([post], 'https://example.test');
  assert.match(feed, /<link>https:\/\/example\.test\/thoughts\/first-post\.html<\/link>/);
  assert.match(feed, /<pubDate>Mon, 28 Sep 2026 00:00:00 GMT<\/pubDate>/);
});
