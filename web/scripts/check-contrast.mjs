/**
 * Đo contrast WCAG 2.1 AA cho các token màu chủ đạo.
 *
 * Vì sao: token `--color-gold` và `--color-text-subtle` từng fail AA ở chế độ
 * sáng. Script này chặn hồi quy: nếu ai đó đổi token màu mà quên kiểm tra
 * contrast, gate sẽ đỏ.
 *
 * Chạy: `node scripts/check-contrast.mjs`
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CSS_DIR = resolve(process.cwd(), 'src/app/styles');

/** Đọc giá trị token đầu tiên tìm thấy trong file. */
function token(css, name) {
  const m = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  return m ? m[1].trim() : null;
}

/** Độ sáng tương đối theo WCAG 2.1. */
function luminance(hex) {
  const clean = hex.replace('#', '');
  const channels = clean.match(/../g).map((h) => parseInt(h, 16) / 255);
  const linear = channels.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

/** Tỉ lệ tương phản giữa hai màu. */
function contrast(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

const light = readFileSync(resolve(CSS_DIR, 'tokens.css'), 'utf8');
const darkFile = readFileSync(resolve(CSS_DIR, 'tokens-dark.css'), 'utf8');

/**
 * Lấy nội dung một khối `:root[data-theme='dark']` trong CSS.
 *
 * @param {string} css nội dung file
 * @returns {string} khối đầu tiên tìm thấy (chuỗi rỗng nếu không có)
 */
function darkBlock(css) {
  const idx = css.indexOf(":root[data-theme='dark']");
  if (idx === -1) return '';
  const start = css.indexOf('{', idx);
  let depth = 0;
  for (let i = start; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    else if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return css.slice(start, i + 1);
    }
  }
  return '';
}

/** Nền chủ đạo của chế độ tối (màu nền trang). */
const darkBg = '#140e0a';

/**
 * Chế độ tối: token nền tảng lấy từ `tokens.css` (khối `data-theme='dark'`),
 * phần override (gradient, glow, shadow) lấy từ `tokens-dark.css`.
 */
const dark = `${darkBlock(light)}\n${darkFile}\n${darkBg}`;

/**
 * Cặp token cần kiểm tra.
 *
 * `min` là ngưỡng tối thiểu: 4.5 cho chữ thường, 3.0 cho chữ lớn / UI.
 */
const CHECKS = [
  { mode: 'light', fg: 'color-text', bg: 'color-bg', min: 4.5, label: 'chữ chính' },
  { mode: 'light', fg: 'color-text-subtle', bg: 'color-bg', min: 4.5, label: 'chữ phụ' },
  { mode: 'light', fg: 'color-text-muted', bg: 'color-bg', min: 4.5, label: 'chữ mờ' },
  { mode: 'light', fg: 'color-primary', bg: 'color-bg', min: 4.5, label: 'thương hiệu' },
  { mode: 'light', fg: 'color-gold', bg: 'color-bg', min: 3, label: 'vàng (chữ lớn)' },
  { mode: 'dark', fg: 'color-text', bg: 'color-bg', min: 4.5, label: 'chữ chính' },
  { mode: 'dark', fg: 'color-text-subtle', bg: 'color-bg', min: 4.5, label: 'chữ phụ' },
  { mode: 'dark', fg: 'color-text-muted', bg: 'color-bg', min: 4.5, label: 'chữ mờ' },
  { mode: 'dark', fg: 'color-primary', bg: 'color-bg', min: 4.5, label: 'thương hiệu' },
  { mode: 'dark', fg: 'color-gold', bg: 'color-bg', min: 3, label: 'vàng (chữ lớn)' },
];

const failures = [];

for (const check of CHECKS) {
  const css = check.mode === 'dark' ? dark : light;
  const fg = token(css, check.fg);
  const bg = token(css, check.bg);
  if (!fg || !bg) {
    failures.push({ ...check, reason: `thiếu token (${check.fg}=${fg}, ${check.bg}=${bg})` });
    continue;
  }
  const ratio = contrast(fg, bg);
  const ok = ratio >= check.min;
  const line = `${ok ? '✓' : '✗'} [${check.mode}] ${check.fg} trên ${check.bg}: ${ratio.toFixed(2)}:1 (cần ≥ ${check.min})`;
  console.log(line);
  if (!ok) failures.push({ ...check, ratio });
}

if (failures.length > 0) {
  console.error(`\n✗ ${failures.length} cặp token không đạt WCAG AA:`);
  for (const f of failures) {
    console.error(`   [${f.mode}] ${f.fg}: ${f.reason ?? `${f.ratio.toFixed(2)}:1 < ${f.min}:1`}`);
  }
  process.exit(1);
}

console.log('\n✓ Mọi token màu chính đạt WCAG 2.1 AA.');
