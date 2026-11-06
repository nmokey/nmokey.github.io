# Codebase cleanup checklist

Local work only; publishing requires approval. Preserve the pending cell-fade preview.

- [x] 1. Simplify section navigation and test scroll, resize, and link behavior.
- [x] 2. Test build output, draft exclusion, stale cleanup, and read-only checks.
- [x] 3. Validate calendar dates and test duplicate slugs, drafts, and ordering.
- [x] 4. Remove dormant menu code, markup, styling, configuration, and skipped tests.
- [x] 5. Separate Life simulation from browser behavior and test animation lifecycle.
- [x] 6. Share page discovery and generated asset scaffolding.
- [x] 7. Add active mobile and complete page smoke coverage; consolidate CSS.
- [x] Final verification: generated output, site checks, unit tests, browser tests, diff review.

Verified locally:

- `npm run verify`: 14 pages validated; 29 unit/build tests passed, none skipped.
- `npm run test:browser`: 15 tests passed, none skipped. Covers every page on
  desktop/mobile in both themes, sidebar resizing, grid persistence, and actual fades.
- `git diff --check`: passed. No post content, resume, or unrelated settings changed.

Development instructions updated. Local preview: http://127.0.0.1:8765/.
Publishing approved after local verification.
