import {readFileSync, statSync, rmSync, mkdirSync, writeFileSync, existsSync} from 'node:fs';

// Next exports GET route handlers as extensionless files, even with trailingSlash.
// Directory indexes are required for GitHub Pages to serve HTML at /commercial/.
const route = 'out/commercial';
if (statSync(route).isFile()) {
  const html = readFileSync(route, 'utf8');
  if (!html.toLowerCase().startsWith('<!doctype html')) throw Error('Invalid commercial export');
  rmSync(route);
  mkdirSync(route);
  writeFileSync(`${route}/index.html`, html);
}
const html = readFileSync(`${route}/index.html`, 'utf8');
const paths = [...html.matchAll(/(?:src|href)="((?:\/mainhall-platform)?\/legacy-mainhall\/assets\/[^"#]+)"/g)];
if (!paths.length) throw Error('Commercial assets missing from export');
for (const [, path] of paths) {
  if (!existsSync('out' + path.replace('/mainhall-platform', ''))) throw Error(`Missing exported asset: ${path}`);
}
console.log(`Commercial export ready: ${paths.length} local asset references verified`);
