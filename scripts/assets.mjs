import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { posix } from 'node:path';

export const digest = content => createHash('sha256').update(content).digest('hex').slice(0, 12);

/** Version local static module imports from leaves upward so dependency edits bust caches. */
export async function versionScripts(directory) {
  const sources = new Map();
  for (const name of (await readdir(directory)).filter(name => name.endsWith('.js'))) {
    sources.set(name, await readFile(`${directory}/${name}`, 'utf8'));
  }
  const output = new Map();
  function visit(name, ancestors = []) {
    if (output.has(name)) return output.get(name);
    if (ancestors.includes(name)) throw new Error(`Circular module imports: ${[...ancestors, name].join(' -> ')}`);
    if (!sources.has(name)) throw new Error(`Missing local script: ${name}`);
    const content = sources.get(name).replace(/(\bfrom\s+['"])(\.{1,2}\/[^'"]+\.js)(?:\?v=[a-f0-9]+)?(['"])/g,
      (_, before, relative, after) => {
        const dependency = posix.join(posix.dirname(name), relative);
        return `${before}${relative}?v=${digest(visit(dependency, [...ancestors, name]))}${after}`;
      });
    output.set(name, content);
    return content;
  }
  for (const name of sources.keys()) visit(name);
  return output;
}

/** Shared assets are generated inside explicit markers; page content stays authored. */
export function renderPageAssets(name, html) {
  const poker = name === 'poker/index.html';
  const styles = poker ? ['css/poker.css'] : ['css/main.css', 'css/components.css'];
  if (name === '404.html') styles.push('css/404.css');
  if (html.includes('<math')) styles.push('temml/Temml-Local.css', 'temml/math.css');
  const scripts = poker ? [] : ['config', 'components', 'main', 'life-init'];
  if (html.includes('id="pageNav"')) scripts.push('page-nav');
  const blocks = {
    styles: styles.map(path => `  <link rel="stylesheet" href="/assets/${path}">`).join('\n'),
    scripts: scripts.map(name => `  <script${name === 'life-init' ? ' type="module"' : ''} src="/assets/js/${name}.js"></script>`).join('\n')
  };
  for (const [kind, content] of Object.entries(blocks)) {
    const marker = new RegExp(`  <!-- Generated ${kind} -->[\\s\\S]*?  <!-- End generated ${kind} -->`);
    if (!marker.test(html)) throw new Error(`${name}: missing generated ${kind} markers`);
    html = html.replace(marker, `  <!-- Generated ${kind} -->\n${content}${content ? '\n' : ''}  <!-- End generated ${kind} -->`);
  }
  return html;
}
