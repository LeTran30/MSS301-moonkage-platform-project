/* eslint-disable no-console */
/**
 * Report the CSS classes a TSX uses but its CSS module does not define.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const SRC = resolve(process.cwd(), 'src');

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.tsx')) check(full);
  }
}

function check(tsxPath) {
  const source = readFileSync(tsxPath, 'utf8');
  const importMatch = source.match(/import\s+(\w+)\s+from\s+'(\.[^']+\.module\.css)'/);
  if (!importMatch) return;
  const [, localName, cssImport] = importMatch;

  const cssPath = resolve(dirname(tsxPath), cssImport);
  if (!existsSync(cssPath)) {
    console.log(`${tsxPath}: MISSING CSS MODULE ${cssImport}`);
    return;
  }

  const css = readFileSync(cssPath, 'utf8');
  const defined = new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));
  const used = new Set(
    [...source.matchAll(new RegExp(`${localName}\\.(\\w+)`, 'g'))].map((m) => m[1]),
  );

  const missing = [...used].filter((n) => !defined.has(n));
  if (missing.length > 0) {
    console.log(`${tsxPath}\n  -> ${missing.join(', ')}`);
  }
}

walk(SRC);
