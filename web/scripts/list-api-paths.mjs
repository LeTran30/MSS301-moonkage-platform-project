// Trích xuất mọi URL API mà FE gọi trực tiếp, để đối chiếu với controller của BE.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2];
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.tsx?$/.test(name) && !full.includes('__tests__')) files.push(full);
  }
})(root);

const paths = new Set();
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const re = /apiClient\.(get|post|put|patch|delete)(?:<[^>]*>)?\(\s*[`'"]([^`'"]+)[`'"]/g;
  let m;
  while ((m = re.exec(text))) paths.add(`${m[1].toUpperCase().padEnd(6)} ${m[2]}`);
}
console.log([...paths].sort().join('\n'));
