// Detect files whose bytes are not valid UTF-8 (i.e. damaged by a wrong encoding).
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// The path is resolved from this file, not from the current working directory,
// so the check works the same on a developer machine and on CI.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const decoder = new TextDecoder('utf-8', { fatal: true });

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx|css|json|html)$/.test(e.name)) out.push(full);
  }
  return out;
}

let bad = 0;
for (const file of walk(ROOT)) {
  const buf = readFileSync(file);
  try {
    decoder.decode(buf);
  } catch {
    bad++;
    console.log(`INVALID-UTF8 ${file.slice(ROOT.length + 1)}`);
  }
}
console.log(`\n${bad} invalid files.`);
