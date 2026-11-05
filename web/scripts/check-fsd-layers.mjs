/**
 * Kiểm tra ranh giới tầng FSD (Feature-Sliced Design).
 *
 * Vì sao: FSD quy định luồng phụ thuộc chỉ đi từ tầng cao xuống tầng thấp
 * (`pages` → `widgets` → `features` → `entities` → `shared`). Khi tầng thấp
 * import ngược lại tầng cao, mã trở nên khó test và dễ sinh vòng lặp.
 *
 * Quy tắc của script này:
 * - `shared` không được import từ bất kỳ tầng nào khác.
 * - `entities` chỉ được import `shared`.
 * - `features` chỉ được import `entities` và `shared`.
 * - `widgets` chỉ được import `features`, `entities` và `shared`.
 * - `pages` được import tất cả.
 *
 * Bỏ qua: file test (`__tests__`, `*.test.*`, `*.spec.*`) — test thường cố
 * ý import cả hai vế để dựng dữ liệu.
 *
 * Chạy: `node scripts/check-fsd-layers.mjs`
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const SRC = resolve(process.cwd(), 'src');

/** Thứ tự tầng từ cao xuống thấp. */
const LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];

/** Tầng mà mỗi tầng được phép import. */
const ALLOWED = {
  app: new Set(LAYERS),
  pages: new Set(['widgets', 'features', 'entities', 'shared']),
  widgets: new Set(['features', 'entities', 'shared']),
  features: new Set(['entities', 'shared']),
  entities: new Set(['shared']),
  shared: new Set(),
};

const IGNORED_DIRS = new Set(['node_modules', 'dist', 'coverage', 'playwright-report']);
const IGNORED_FILE = /(__tests__|\.test\.|\.spec\.)/;

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

/** Tầng sở hữu của một file (thư mục con trực tiếp của `src`). */
function layerOf(file) {
  const rel = relative(SRC, file);
  const top = rel.split(/[\\/]/)[0];
  return LAYERS.includes(top) ? top : null;
}

const files = walk(SRC);
const violations = [];

for (const file of files) {
  if (IGNORED_FILE.test(relative(SRC, file))) continue;
  const layer = layerOf(file);
  if (!layer) continue;

  const source = readFileSync(file, 'utf8');
  // Chỉ quan tâm import tương đối nội bộ: `from '...'` và alias `@/`.
  const importRe = /from\s+'([^']+)'/g;
  let match;
  while ((match = importRe.exec(source)) !== null) {
    const spec = match[1];

    let resolved;
    if (spec.startsWith('@/')) {
      // Alias tuyệt đối: `@/entities/product` → `src/entities/product`.
      resolved = resolve(SRC, spec.slice(2));
    } else if (spec.startsWith('.')) {
      resolved = resolve(file, '..', spec);
    } else {
      continue;
    }

    const relResolved = relative(SRC, resolved);
    if (relResolved.startsWith('..')) continue;
    const targetLayer = layerOf(resolved);
    if (!targetLayer) continue;
    if (targetLayer === layer) continue;

    if (!ALLOWED[layer].has(targetLayer)) {
      violations.push({
        file: relative(process.cwd(), file),
        layer,
        targetLayer,
        spec,
      });
    }
  }
}

if (violations.length === 0) {
  console.log('✓ Ranh giới tầng FSD hợp lệ.');
  process.exit(0);
}

console.log(`✗ Tìm thấy ${violations.length} import vi phạm ranh giới tầng FSD:\n`);
for (const v of violations) {
  console.log(`   ${v.file}  [${v.layer}] → [${v.targetLayer}]  ${v.spec}`);
}
console.log('\n   Tầng cao được phép import tầng thấp hơn, không ngược lại.');
process.exit(1);
