import { readdir } from 'node:fs/promises';

/** One ordered page inventory for generation, validation, and browser smoke tests. */
export async function discoverPages(directory, prefix = '') {
  const pages = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = `${prefix}${entry.name}`;
    if (entry.isDirectory()) pages.push(...await discoverPages(`${directory}/${entry.name}`, `${name}/`));
    else if (entry.name.endsWith('.html')) pages.push(name);
  }
  return pages.sort();
}
