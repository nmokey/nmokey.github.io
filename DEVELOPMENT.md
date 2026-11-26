# Development

The published site lives in `docs/`. Pages use plain HTML, CSS, and JavaScript;
Node scripts generate blog pages and shared metadata. Generated files are committed.

## Run locally

Use Node.js 24.15.0 or newer. From the repository root:

```sh
npm ci
npm run sync
npm run preview
```

Open [http://127.0.0.1:8765](http://127.0.0.1:8765). The server serves `docs/`
without live reload; refresh the browser after edits. Run `npm run sync` again
after changing posts, templates, CSS, or JavaScript.

## Where to edit

| Change | Source |
| --- | --- |
| Homepage content and search/share descriptions | [docs/index.html](docs/index.html) |
| Résumé download | [docs/assets/resume.pdf](docs/assets/resume.pdf) |
| Other page content | HTML files directly under `docs/` |
| Thoughts introduction | [docs/thoughts.html](docs/thoughts.html), outside the generated post list |
| Blog content | Markdown files in `posts/` |
| Post template, length indicators, and Markdown/math rendering | [scripts/posts.mjs](scripts/posts.mjs) |
| Theme colors, typography, spacing, and base styles | [docs/assets/css/main.css](docs/assets/css/main.css) |
| Component and page layouts | [docs/assets/css/components.css](docs/assets/css/components.css) |
| Rotating roles and contact email | [docs/assets/js/config.js](docs/assets/js/config.js) |
| Theme toggle, footer, and home button | [docs/assets/js/components.js](docs/assets/js/components.js) |
| Rotating text and scrolling behavior | [docs/assets/js/main.js](docs/assets/js/main.js) |
| Homepage section navigation | [docs/assets/js/page-nav.js](docs/assets/js/page-nav.js) |
| Game of Life rules | [docs/assets/js/life-grid.js](docs/assets/js/life-grid.js) |
| Background rendering, fading, and persistence | [docs/assets/js/life-background.js](docs/assets/js/life-background.js) |
| Shared styles/scripts and page discovery | [scripts/assets.mjs](scripts/assets.mjs) and [scripts/pages.mjs](scripts/pages.mjs) |
| PocketSolver embed | [docs/poker/index.html](docs/poker/index.html) and [poker.css](docs/assets/css/poker.css) |

`docs/thoughts/` is generated and managed by the sync script. Edit posts or their
template rather than the output, and keep images in `docs/assets/`.

### Styling and behavior

Use the CSS variables in `main.css`; `:root` defines the default dark theme and
`[data-theme="light"]` overrides it. The saved theme is applied before the page
paints by [theme-init.js](docs/assets/js/theme-init.js).

Links change color on hover without an underline animation. The Game of Life
background responds to pointer movement and pauses for reduced-motion preferences
or a hidden tab. Its grid is saved in session storage between page visits, including
back/forward navigation, so it continues within the same tab. Preserve reduced-motion
support when changing animations. Dead cells fade for 440 ms without affecting the
simulation. `life-init.js` mounts the canvas; `life-grid.js` has no browser dependencies.

When changing the first rotating role, update `cyclingRoles` in `config.js`, the
initial text and accessible description in `index.html`, and the fallback in
`main.js`. Adjust the existing reduced-motion test expectations too.

## Write a post

Create a file such as `posts/2026-11-04-example.md`:

```markdown
---
title: example
date: 2026-11-04
draft: true
---

The post goes here.

## A section
```

The filename, minus the optional date prefix, becomes `/thoughts/example.html`.
Front matter supports `title`, `date`, `draft`, and an optional `description`.
A description appears below the title in the list; otherwise the opening paragraph
provides a summary for the feed and search metadata. Use `##` for sections because
the title supplies the page's main heading.

Run `npm run drafts` to generate a preview including drafts, then use the local
preview server. Before committing, run `npm run sync` to restore output containing
only published posts. The generated-file check rejects draft output.

Math uses `$...$` inline or `$$...$$` on separate lines for display equations.
Escape a literal dollar sign as `\$`. Temml renders MathML during sync; invalid
LaTeX stops generation and identifies the post.

### Publish and timestamp

Timestamp finished posts with OpenTimestamps. The stamping command requires
[uv](https://docs.astral.sh/uv/).

1. Remove `draft: true` or set it to `false`, and finish all edits.
2. Run `npm run stamp -- posts/2026-11-04-example.md` to create the adjacent `.ots` proof.
3. Run `npm run sync` and `npm run verify`.
4. Review and commit the Markdown, proof, and generated files together. Check that
   the post page includes its source and proof links.

The generator checks the proof against the exact Markdown bytes. Editing a stamped
post makes that check fail; delete the old proof and stamp the revised file again.

Once the proof's Bitcoin attestation is available, upgrade it and regenerate:

```sh
uvx --from opentimestamps-client ots upgrade posts/2026-11-04-example.md.ots
npm run sync
```

## Generated files and constraints

[scripts/sync-site.mjs](scripts/sync-site.mjs) generates post pages, the Thoughts
list, RSS feed, sitemap, robots file, MathML styles, canonical URLs, Content Security
Policy metadata, and CSS/JavaScript version hashes. Keep the generated markers in
authored pages. Changes to shared assets can update references across many pages;
include those changes in the same commit. Shared style and script lists belong in
`assets.mjs`, inside the generated styles/scripts markers. Analytics and the early
theme script are part of generated metadata. The build also versions local static
module imports (`import ... from './file.js'`); leave those generated query strings
to sync. Keep browser scripts in `docs/assets/js/`.

Use external JavaScript and CSS files for authored code. The Content Security Policy
blocks executable inline scripts and HTML `style` attributes. JSON-LD hashes and
math styling are handled by sync. YouTube frames are allowed on regular pages;
the poker page has a separate frame policy for its hosted Streamlit app.

HTML pages are discovered recursively by generation, validation, and browser smoke
tests. `docs/thoughts/` remains exclusively generated. New authored pages should
include the generated styles/scripts markers (copy an existing page). `/poker/`
keeps its separate embed layout and asset list.

Assets over 1 MiB fail validation unless their exact SHA-256 digest is listed in
[scripts/asset-budget.json](scripts/asset-budget.json). Optimize new assets first;
review intentional exceptions when updating that file.

## Check changes

```sh
npm run sync
npm run verify
```

`verify` checks generated output, HTML, local links, metadata, JavaScript syntax,
asset sizes, and unit tests. For changes to layout or browser behavior, also run:

```sh
npx playwright install chromium
npm run test:browser
```

Playwright starts the local preview server or reuses one already running. Check
the affected pages at narrow widths and in both themes. The browser suite covers
every discovered page on desktop and mobile in both themes, with external embeds
stubbed. Unit tests cover grid rules and browser lifecycle; temporary-directory
build tests cover publishing, cleanup, read-only checks, and cache versions.

## Deployment

[.github/workflows/site.yml](.github/workflows/site.yml) runs the checks and browser
tests on pull requests and pushes to `main`. On `main`, it uploads `docs/` and
deploys it to GitHub Pages. The custom domain is set in [docs/CNAME](docs/CNAME).

Review the source and generated diff before pushing. Pushing to `main` publishes
the site, so get the owner's approval before doing so.

## PocketSolver research article

The standalone article lives at `/poker/writeup/`. Build it in the
`Poker-Decision-Model` repository, then import the reviewed output here:

```sh
node scripts/import-poker-writeup.mjs /absolute/path/to/report/_site
npm run sync
npm run verify
npm run test:browser
```

The importer preserves the article layout and figures, externalizes static styles,
renders equations as local MathML, and removes unused Quarto browser dependencies.
The article participates in page discovery, link/CSP validation, the sitemap, and
browser smoke checks. Its embedded JSON is data; executable inline scripts remain
blocked. Shared site theme controls are omitted from this standalone article.

## Search visibility and hosting essentials

`npm run sync` generates `docs/robots.txt`, `docs/sitemap.xml`, canonical URLs,
and indexing directives. `scripts/search.mjs` permits only `index.html` in search.
Every other HTML page receives `noindex` and is excluded from the sitemap,
including newly added pages by default. Homepage links to the other sections
are omitted at the owner's request. Draft posts are omitted from published
builds; `--drafts` previews also mark them `noindex` and omit them from the sitemap.
These controls affect search eligibility, not access: excluded URLs remain public.

| Piece | Purpose and current behavior |
| --- | --- |
| robots.txt | Allows crawling and advertises the sitemap. Does not hide pages. |
| sitemap.xml | Lists only eligible HTML pages at their canonical HTTPS URLs. |
| Canonical URLs | Prefer `https://www.nmokey.com`, `/` for home, `/poker/` for the demo, and existing `.html` URLs for other pages. |
| noindex | Excludes every HTML page except the homepage after recrawling. Crawling stays allowed so engines can read the directive. |
| Titles/descriptions | Authored in each HTML head; post descriptions come from front matter or opening text. These are suggestions for search snippets. |
| Internal links | Home does not link to the other sections; Thoughts still links to posts for visitors with that URL. |
| Structured data | Home has Person data; posts have BlogPosting data. Keep this consistent with visible content. |
| 404 handling | `404.html` is excluded and marked noindex; the preview server returns HTTP 404 for missing paths. Verify the deployed host also returns a real 404. |
| Custom domain | `docs/CNAME` names `www.nmokey.com`; publishing uses the checked GitHub Pages artifact. |

`npm run verify` checks generated output, HTML, local links, assets, and tests
sitemap membership, canonical URLs, descriptions, and exclusion rules. Do not
add guessed sitemap `lastmod` dates: use actual content update dates if needed.

After deployment, use the existing domain property in
[Google Search Console](https://search.google.com/search-console):

1. Submit `https://www.nmokey.com/sitemap.xml` in Sitemaps and check for Success.
2. Inspect home with URL Inspection, run Test Live URL, and request indexing.
   Inspect a post to verify its live `noindex` directive. For already-indexed
   secondary URLs, request recrawling or use temporary URL-specific removals
   while Google processes the permanent `noindex` instruction. Do not remove
   the entire domain or root prefix, which would also hide the homepage.
3. Review Page indexing for errors and the canonical URL Google selected. Excluded
   `noindex` pages are expected. Google can also choose not to index eligible pages.
4. Verify HTTPS enforcement in GitHub Pages settings, redirects from HTTP and the
   apex domain to `https://www.nmokey.com`, and an HTTP 404 for an unknown path.

The November 24, 2026 source audit did not verify those live host/Search Console
states: direct network access was unavailable and browser access stopped responding.
Publication and Search Console submission remain separate follow-up steps.
The sitemap is already advertised via robots.txt; manual submission adds reporting
visibility and does not guarantee indexing. Search visibility changes take effect
after deployment and recrawling. PDFs such as the public resume can also be indexed;
this HTML policy does not apply a noindex header to downloadable files.

## Analytics tracking

The site uses GA4 measurement ID `G-NK15EEMEB2`, web stream `3985763001`,
and property `327323340` (Personal Website). The stream URL is
`https://www.nmokey.com`.

`scripts/sync-site.mjs` includes one `/assets/js/analytics.js` initializer in
every page, including `/poker/` and the 404 page. The initializer loads Google's
tag asynchronously only on `www.nmokey.com` and `nmokey.com`; previews and test
hosts send nothing. GA4 sends the initial page view automatically. Do not add a
second tag or a manual page-view event alongside it. The poker page tracks visits
to the wrapper; actions inside the separately hosted Streamlit iframe are outside
this implementation.

The generated CSP permits Google's non-advertising Analytics endpoints, including
`https://*.google.com` in `connect-src`, following
[Google's CSP guidance](https://developers.google.com/tag-platform/security/guides/csp).
`npm run check` checks every page for one initializer and the required CSP
allowances, and rejects direct Google script tags that bypass the host guard.
Unit tests verify the measurement ID, initialization commands, async loading,
and exclusion of local, GitHub Pages, and preview hosts.

Verified in the signed-in Analytics UI on November 24, 2026: the measurement ID
matches this web stream; collection is active in the past 48 hours. The Home
report showed 37 active users and 60 views for November 17–23. Enhanced
measurement is enabled for page loads/history changes, scrolls, outbound clicks,
site search, video engagement, and file downloads; form interactions are off.
No Analytics account settings were changed during this audit. Video engagement
requires YouTube embeds with JS API support; enabling it in Analytics alone does
not establish that an embed reports events.

Local audit validation: all 14 generated pages pass `npm run check`, and all 37
unit/build tests pass. Browser regression tests could not start because the
execution environment rejected the loopback preview listener (`listen EPERM`).
The coverage/CSP changes are local until publication; this audit did not push or
deploy them or verify a fresh collection request from the changed code.

After publishing changes, open the live homepage and a post and check their
`page_view` events in Realtime (or DebugView with a Tag Assistant session).
The code checks and local tests cannot confirm receipt by Google's servers.
Visitor-count export credentials below are separate from browser tracking and
are not required for GA4 collection.

