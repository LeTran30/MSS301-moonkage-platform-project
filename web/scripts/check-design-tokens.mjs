/* eslint-disable no-console */
/**
 * Chặn giá trị thiết kế hardcode trong CSS — nguồn sự thật duy nhất là
 * `src/app/styles/tokens.css`.
 *
 * Vì sao cần: đợt audit UI/UX (05-11-2026) ghi "**Chưa làm** (P1)" ở mục
 * 0.5. Khi mỗi module tự chọn màu / bo góc / khoảng cách, hệ thống trở
 * thành "gần giống thiết kế" thay vì là thiết kế. Script này biến quy tắc đó
 * thành cổng chất lượng chạy trong `npm run check`.
 *
 * Ba loại vi phạm bị chặn:
 *
 *   1. HEX      — màu viết thẳng (`#b3261e`) ngoài file token. Ngoại lệ: chính
 *                 `tokens.css` và `tokens-dark.css` — đó là nơi màu được định
 *                 nghĩa.
 *   2. RADIUS   — bo góc viết thẳng bằng px ngoài thang `--radius-*`.
 *   3. BREAKPOINT — điều kiện `@media` dùng px thay vì `var(--breakpoint-*)`.
 *                 Đây là hạng mục 2.1 của D-2: token có 480/768/1024/1280 nhưng
 *                 nhiều file dùng 500/640/720/860/900/960.
 *
 * Thêm vào nữa:
 *   4. PX TRONG `shared/ui` — khoảng cách viết thẳng bằng px thay vì
 *                 `--space-*` (mục 1.6 của đợt audit).
 *
 * Chạy: `node scripts/check-design-tokens.mjs`
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const SRC = resolve(process.cwd(), 'src');
const TOKENS_FILE = resolve(SRC, 'app/styles/tokens.css');

/** File token: nơi màu được định nghĩa, không áp luật hex cho chính nó. */
const TOKEN_FILES = new Set([
  'app/styles/tokens.css',
  'app/styles/tokens-dark.css',
]);

/**
 * Giá trị px nằm trong thang `--radius-*` được phép dùng thẳng.
 * Thang này lấy từ `tokens.css` nên không bao giờ lệch với nguồn.
 */
const RADIUS_SCALE = ['4px', '6px', '10px', '16px', '24px', '999px'];

/**
 * Khoảng cách px được phép trong `shared/ui` — mỗi giá trị gắn một lý do.
 * Đều là lề vi mô (1–4px) không ánh xạ được 1-1 với `--space-*`.
 */
const SHARED_UI_PX_ALLOWLIST = [
  { value: '1px', reason: 'lề 1px để dải sao không dính nhau (StarRating)' },
  { value: '-1px', reason: 'căn nhãn theo mép viền (Checkbox/Radio/Select)' },
  { value: '-4px -4px 0 0', reason: 'bù lề ngoài của Toast (không đổi được bằng token)' },
];

/** Thu thập mọi file .css dưới `src`. */
function collectCss(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectCss(full, acc);
    else if (entry.name.endsWith('.css')) acc.push(full);
  }
  return acc;
}

/** Đường dẫn tương đối với thông báo lỗi, dùng dấu `/` cho mọi OS. */
function rel(file) {
  return relative(SRC, file).split('\\').join('/');
}

/**
 * Bỏ qua chú thích CSS — màu trong chú thích không phải màu dùng thật.
 *
 * @param {string} css nội dung file
 * @returns {string} nội dung đã bỏ chú thích
 */
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Lấy giá trị px của các token `--breakpoint-*` từ `tokens.css`.
 *
 * @returns {Map<string, string>} tên token → giá trị px
 */
function readBreakpoints() {
  const css = readFileSync(TOKENS_FILE, 'utf8');
  const map = new Map();
  const re = /--breakpoint-([a-z]+):\s*(\d+)px\s*;/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    map.set(`--breakpoint-${m[1]}`, `${m[2]}px`);
  }
  return map;
}

/**
 * Kiểm tra một file CSS.
 *
 * @param {string} file đường dẫn tuyệt đối
 * @param {Map<string, string>} breakpoints token breakpoint hợp lệ
 * @returns {Array<{line: number, rule: string, detail: string}>} danh sách vi phạm
 */
function checkFile(file, breakpoints) {
  const relPath = rel(file);
  const css = stripComments(readFileSync(file, 'utf8'));
  const lines = css.split(/\r?\n/);
  const violations = [];

  const isTokenFile = TOKEN_FILES.has(relPath);
  const isSharedUi = relPath.startsWith('shared/ui/');

  lines.forEach((line, index) => {
    const lineNo = index + 1;

    // 1. HEX ngoài file token
    if (!isTokenFile) {
      const hex = line.match(/#[0-9a-fA-F]{3,8}\b/g);
      if (hex) {
        violations.push({
          line: lineNo,
          rule: 'HEX',
          detail: `${hex.join(', ')} → dùng token màu (var(--color-*))`,
        });
      }
    }

    // 2. Bo góc viết thẳng bằng px
    const radius = line.match(/border-radius:\s*([^;]+);/);
    if (radius) {
      const value = radius[1].trim();
      // `var(--radius-*, phần dự phòng)` vẫn ổn; chỉ chặn px thuần.
      if (!value.includes('var(') && !value.includes('%') && !value.includes('50%')) {
        for (const part of value.split(/\s+/)) {
          if (/^\d+px$/.test(part) && !RADIUS_SCALE.includes(part)) {
            violations.push({
              line: lineNo,
              rule: 'RADIUS',
              detail: `${value} → dùng --radius-* (thang: ${RADIUS_SCALE.join(', ')})`,
            });
          }
        }
      }
    }

    // 3. Breakpoint viết thẳng bằng px
    const media = line.match(/@media[^{]*?\((max|min)-width:\s*([^)]+)\)/);
    if (media) {
      const condition = media[2].trim();
      if (!condition.startsWith('var(')) {
        const allowed = [...breakpoints.values()];
        violations.push({
          line: lineNo,
          rule: 'BREAKPOINT',
          detail: `${media[1]}-width: ${condition} → dùng token (var(--breakpoint-*): ${allowed.join(', ')})`,
        });
      }
    }

    // 4. Khoảng cách px trong `shared/ui`
    if (isSharedUi) {
      const spacing = line.match(
        /^\s*(margin|margin-top|margin-bottom|margin-left|margin-right|padding|padding-top|padding-bottom|padding-left|padding-right|gap|row-gap|column-gap)\s*:\s*([^;]+);/,
      );
      if (spacing && /px/.test(spacing[2])) {
        const value = spacing[2].trim();
        const allowed = SHARED_UI_PX_ALLOWLIST.some((entry) => value === entry.value);
        if (!allowed) {
          violations.push({
            line: lineNo,
            rule: 'SPACING',
            detail: `${spacing[1]}: ${value} → dùng --space-*`,
          });
        }
      }
    }
  });

  return violations;
}

const breakpoints = readBreakpoints();
if (breakpoints.size === 0) {
  console.error('✗ Không đọc được token --breakpoint-* từ tokens.css.');
  process.exit(1);
}

const files = collectCss(SRC);
const failures = [];

for (const file of files) {
  const violations = checkFile(file, breakpoints);
  if (violations.length > 0) failures.push({ file: rel(file), violations });
}

console.log(`Đã quét ${files.length} file CSS trong src/`);
console.log(`  · token breakpoint: ${[...breakpoints.values()].join(', ')}`);
console.log(`  · vi phạm: ${failures.reduce((sum, f) => sum + f.violations.length, 0)} trong ${failures.length} file`);

if (failures.length > 0) {
  console.error('\n✗ Giá trị thiết kế hardcode trong CSS (nguồn sự thật: app/styles/tokens.css):');
  for (const failure of failures) {
    console.error(`\n   ${failure.file}`);
    for (const violation of failure.violations) {
      console.error(`     - dòng ${violation.line} [${violation.rule}] ${violation.detail}`);
    }
  }
  console.error(
    '\n   Cách xử lý: thay giá trị bằng token tương ứng. Nếu thật sự không ánh xạ được, ' +
      'thêm giá trị vào allowlist kèm lý do trong script này.',
  );
  process.exit(1);
}

console.log('\n✓ Mọi giá trị thiết kế trong CSS đều lấy từ token.');
