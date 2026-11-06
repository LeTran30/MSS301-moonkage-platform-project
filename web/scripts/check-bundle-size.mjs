/**
 * Kiểm tra ngân sách kích thước bundle (bundle budget).
 *
 * Mục đích: một thay đổi vô tình kéo thêm 100 kB vào bundle (ví dụ thêm một
 * thư viện nặng) sẽ bị chặn ở CI thay vì chỉ được phát hiện khi người dùng
 * báo "app chậm hơn".
 *
 * Ngân sách đặt theo mức hiện tại + một khoảng đệm nhỏ, để CI báo đỏ khi có
 * hồi quy thật sự.
 *
 * Chạy: `node scripts/check-bundle-size.mjs`
 */
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(process.cwd(), 'dist', 'assets');

/** Ngân sách (kB, chưa nén) cho từng nhóm. */
const BUDGETS = {
  /** Tổng JS của toàn bộ app. */
  totalJs: 1100,
  /** Chunk lớn nhất được phép. */
  largestChunk: 250,
};

/** Ngưỡng cảnh báo khi vượt ngân sách (không chặn CI). */
const WARN_RATIO = 0.95;

function collectJsFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectJsFiles(full));
    } else if (entry.endsWith('.js')) {
      files.push(full);
    }
  }
  return files;
}

function toKb(bytes) {
  return Math.round((bytes / 1024) * 10) / 10;
}

let files;
try {
  files = collectJsFiles(DIST);
} catch {
  console.error('✗ Không tìm thấy dist/assets. Hãy chạy `npm run build` trước.');
  process.exit(1);
}

if (files.length === 0) {
  console.error('✗ dist/assets không có file JS nào.');
  process.exit(1);
}

const sizes = files
  .map((file) => ({ file: file.split(/[\\/]/).pop(), kb: toKb(statSync(file).size) }))
  .sort((a, b) => b.kb - a.kb);

const totalKb = toKb(sizes.reduce((sum, item) => sum + item.kb * 1024, 0));
const largest = sizes[0];

console.log('📦 Kiểm tra ngân sách bundle\n');
console.log(`   Tổng JS:        ${totalKb} kB (ngân sách ${BUDGETS.totalJs} kB)`);
console.log(`   Chunk lớn nhất: ${largest.kb} kB — ${largest.file} (ngân sách ${BUDGETS.largestChunk} kB)`);
console.log('\n   Top 5 chunk:');
sizes.slice(0, 5).forEach((item) => {
  console.log(`     ${item.kb.toFixed(1).padStart(7)} kB  ${item.file}`);
});

const failures = [];

if (totalKb > BUDGETS.totalJs) {
  failures.push(`Tổng JS ${totalKb} kB vượt ngân sách ${BUDGETS.totalJs} kB`);
} else if (totalKb > BUDGETS.totalJs * WARN_RATIO) {
  console.warn(`\n⚠ Tổng JS đã dùng ${Math.round((totalKb / BUDGETS.totalJs) * 100)}% ngân sách.`);
}

if (largest.kb > BUDGETS.largestChunk) {
  failures.push(`Chunk lớn nhất ${largest.kb} kB (${largest.file}) vượt ${BUDGETS.largestChunk} kB`);
}

if (failures.length > 0) {
  console.error('\n✗ Vượt ngân sách bundle:');
  failures.forEach((failure) => console.error(`   - ${failure}`));
  process.exit(1);
}

console.log('\n✓ Bundle nằm trong ngân sách.');
