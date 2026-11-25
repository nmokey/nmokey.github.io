/** Only the homepage is eligible for search. New pages are excluded by default. */
export const searchOrigin = 'https://www.nmokey.com';

export function canonicalUrl(name) {
  return `${searchOrigin}/${name === 'index.html' ? '' : name.replace(/\/index\.html$/, '/')}`;
}

export function isSearchable(name, draftPages = new Set()) {
  return name === 'index.html' && !draftPages.has(name);
}
