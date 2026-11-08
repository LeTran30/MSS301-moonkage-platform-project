import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, dirname, basename } from 'node:path';

/**
 * Chặn file CSS Module mồ côi — file `.module.css` không file nào import.
 *
 * Vì sao: một stylesheet không được dùng là dead code. Nó làm người đọc tưởng
 * là còn style đang áp dụng, và làm file CSS lớn dần mà không ai dọn.
 *
 * Cách kiểm tra: một stylesheet là "mồ côi" khi **không có** file `.ts`/`.tsx`
 * nào trong cùng thư mục (hoặc thư mục cha) import nó.
 *
 * Vì sao không dùng cách đặt tên file khớp (`Foo.module.css` ↔ `Foo.tsx`):
 * nhiều thư mục dùng một stylesheet dùng chung cho cả nhóm component
 * (`orderUi.module.css`, `checkoutUi.module.css`…) — đó là nhóm hợp lệ, không
 * phải file mồ côi.
 *
 * Chạy: `node scripts/check-orphan-css.mjs`
 */
const SRC = 'src';

/** Thu thập mọi file nguồn. */
const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else files.push(full);
  }
})(SRC);

/** Nội dung mọi file TS/TSX, gộp lại để tìm import. */
const scriptSources = files
  .filter((f) => /\.(ts|tsx)$/.test(f) && !/\.d\.ts$/.test(f))
  .map((f) => readFileSync(f, 'utf8'));

const cssFiles = files.filter((f) => f.endsWith('.module.css'));
const orphans = [];

for (const css of cssFiles) {
  const cssName = basename(css);
  const cssDir = dirname(css);
  const stem = cssName.replace(/\.module\.css$/, '');

  const isImported = scriptSources.some((src) =>
    // import tương đối trong cùng thư mục: `from './Foo.module.css'`
    src.includes(`'./${cssName}'`) ||
    src.includes(`"./${cssName}"`) ||
    // import tương đối lên thư mục cha: `from '../ui/Foo.module.css'`
    src.includes(`/${cssName}'`) ||
    src.includes(`/${cssName}"`) ||
    // import bằng alias tuyệt đối: `from '@/features/x/ui/Foo.module.css'`
    src.includes(`/${stem}.module.css'`),
  );

  // Không import ở đâu nhưng nằm cùng thư mục với file TS/TSX cùng tên
  // (một stylesheet dùng chung cho nhóm) → vẫn hợp lệ.
  const siblingExists = files.some(
    (f) => dirname(f) === cssDir && /\.(ts|tsx)$/.test(f) && basename(f, '.tsx') === stem,
  );

  if (!isImported && !siblingExists) {
    orphans.push(css);
  }
}

if (orphans.length === 0) {
  console.log('✓ Không còn file CSS Module mồ côi.');
  process.exit(0);
}

console.log(`✗ ${orphans.length} file CSS Module mồ côi (không file nào import):\n`);
for (const o of orphans) console.log(`   ${relative(SRC, o)}`);
console.log('\n   Xoá file, hoặc import nó nơi cần dùng.');
process.exit(1);
