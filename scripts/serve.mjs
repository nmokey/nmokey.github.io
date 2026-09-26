// Local preview only; binds to loopback and serves the published folder.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('docs');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon','.pdf':'application/pdf','.xml':'application/xml','.txt':'text/plain','.md':'text/markdown; charset=utf-8','.woff2':'font/woff2'};
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let path = resolve(root, `.${pathname}`);
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    if ((await stat(path).catch(() => null))?.isDirectory()) path = resolve(path, 'index.html');
    let status = 200;
    let content = await readFile(path).catch(() => null);
    if (!content) { path = resolve(root, '404.html'); content = await readFile(path); status = 404; }
    res.writeHead(status, {'Content-Type':types[extname(path)] || 'application/octet-stream','Cache-Control':'no-store'});
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch { res.writeHead(400).end('Bad request'); }
}).listen(8765, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:8765'));
