// Liệt kê mọi hằng số GATEWAY mà FE thực sự dùng, để đối chiếu với controller của BE.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2];
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.tsx?$/.test(name) && !full.includes('__tests__') && !full.includes('gateway.ts')) {
      files.push(full);
    }
  }
})(root);

const used = new Map();
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const re = /GATEWAY\.([A-Z_]+)\.([A-Z_]+)/g;
  let m;
  while ((m = re.exec(text))) {
    const key = `${m[1]}.${m[2]}`;
    used.set(key, (used.get(key) ?? 0) + 1);
  }
}
console.log([...used.entries()].sort().map(([k, n]) => `${String(n).padStart(3)}  ${k}`).join('\n'));
