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
| Rotating roles, contact email, and menu data | [docs/assets/js/config.js](docs/assets/js/config.js) |
| Theme toggle, footer, and home button | [docs/assets/js/components.js](docs/assets/js/components.js) |
| Rotating text and scrolling behavior | [docs/assets/js/main.js](docs/assets/js/main.js) |
| Homepage section navigation | [docs/assets/js/page-nav.js](docs/assets/js/page-nav.js) |
| Game of Life background | [docs/assets/js/life-background.js](docs/assets/js/life-background.js) |
| PocketSolver embed | [docs/poker/index.html](docs/poker/index.html) and [poker.css](docs/assets/css/poker.css) |

`docs/thoughts/` is generated and managed by the sync script. Edit posts or their
template rather than the output, and keep images in `docs/assets/`.

The menu is currently hidden. Restoring it requires uncommenting the menu markup
in the pages and post template, and the `renderNavigation()` call in `components.js`.
The homepage résumé button remains available without the menu.

### Styling and behavior

Use the CSS variables in `main.css`; `:root` defines the default dark theme and
`[data-theme="light"]` overrides it. The saved theme is applied before the page
paints by [theme-init.js](docs/assets/js/theme-init.js).

Links change color on hover without an underline animation. The Game of Life
background responds to pointer movement and pauses for reduced-motion preferences
or a hidden tab. Its grid is saved in session storage between page visits, including
back/forward navigation, so it continues within the same tab. Preserve reduced-motion
support when changing animations.

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
include those changes in the same commit.

Use external JavaScript and CSS files for authored code. The Content Security Policy
blocks executable inline scripts and HTML `style` attributes. JSON-LD hashes and
math styling are handled by sync. YouTube frames are allowed on regular pages;
the poker page has a separate frame policy for its hosted Streamlit app.

New top-level HTML pages are discovered automatically. Nested pages other than
generated posts must be registered in both `sync-site.mjs` and
[check-site.mjs](scripts/check-site.mjs); `/poker/` is the existing example.

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
the affected pages at narrow widths and in both themes.

## Deployment

[.github/workflows/site.yml](.github/workflows/site.yml) runs the checks and browser
tests on pull requests and pushes to `main`. On `main`, it uploads `docs/` and
deploys it to GitHub Pages. The custom domain is set in [docs/CNAME](docs/CNAME).

Review the source and generated diff before pushing. Pushing to `main` publishes
the site, so get the owner's approval before doing so.
