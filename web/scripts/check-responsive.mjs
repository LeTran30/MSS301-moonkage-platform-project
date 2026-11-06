/**
 * Cảnh báo CSS Module có bố cục không chịu được màn hình hẹp mà không có
 * `@media` nào.
 *
 * Vì sao: đợt audit UI/UX (05-11-2026) phát hiện phần lớn các CSS Module còn
 * sót lại chưa hề có media query. Với những module đó, không có gì hỏng ngay
 * lập tức — nhưng mỗi lần thêm một lưới nhiều cột, một bảng rộng hay một
 * nhóm nút cố định, màn hình điện thoại sẽ bóp méo hoặc tràn ngang.
 *
 * Script này chặn hồi quy ở mức *cấu trúc*. Nó không phán xét mọi module đều
 * cần media query (một form một cột thì không), mà chỉ báo đúng những module
 * có ít nhất một trong các dấu hiệu sẽ vỡ khi bề rộng co lại:
 *
 *   1. GRID   — lưới có từ 2 cột trở lên khai báo tường minh (`1fr 1fr`,
 *                `repeat(2, 1fr)`, `280px 1fr`…). Lưới dạng `auto-fit` /
 *                `auto-fill` tự co nên không tính.
 *   2. TABLE  — bảng (hoặc khối giả bảng) có `min-width` ≥ 480px mà file
 *                không có `overflow-x: auto` nào để cuộn ngang.
 *   3. WIDTH  — phần tử có `width` cố định ≥ 480px (không phải `max-width`).
 *   4. ROW    — hàng flex ngang không `flex-wrap` mà chứa một *nhóm nút*
 *                (≥ 2 Button/ButtonLink/button) hoặc một *nhóm icon nút*
 *                (≥ 2 Icon) — đây là loại va chạm thật trên điện thoại.
 *                Vì đếm phần tử con trong JSX nên quy tắc này không báo nhầm
 *                cho hàng chỉ có chữ.
 *
 * Một module đã có `@media` thì được miễn trừ: nhiệm vụ của đợt audit này là
 * *bổ sung* media query cho module thiếu, không phải ép mọi module có media
 * query.
 *
 * Chạy: `node scripts/check-responsive.mjs`
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const SRC = resolve(process.cwd(), 'src');

/** Ngưỡng chiều rộng (px) mà từ đó một phần tử bắt đầu tràn màn hình điện thoại. */
const WIDE_PX = 480;

/**
 * Danh sách miễn trừ: module có dấu hiệu "vỡ" nhưng đã được xử lý có chủ đích
 * hoặc không thể vỡ. Mỗi mục kèm lý do để người sau không "dọn" nhầm.
 */
const ALLOWLIST = [
  {
    file: 'shared/ui/Modal/Modal.module.css',
    reason:
      '`.dialog` đã có `max-width: 90vw` nên `.md/.lg/.xl` (520/720/920px) bị chặn còn khoảng ' +
      '90% bề rộng viewport; hộp thoại luôn vừa màn hình dù không có media query.',
  },
];

/** Thu thập mọi file .module.css dưới `src`. */
function collectModuleCss(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectModuleCss(full, acc);
    else if (entry.name.endsWith('.module.css')) acc.push(full);
  }
  return acc;
}

/**
 * Tách CSS thành từng khối `{ selector { thuộc tính } }`.
 *
 * @param {string} css nội dung file
 * @returns {Array<{selector: string, body: string}>} danh sách khối
 */
function blocks(css) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    out.push({ selector: m[1].trim(), body: m[2] });
  }
  return out;
}

/**
 * Đếm số cột thực của một giá trị `grid-template-columns`.
 *
 * `repeat(N, ...)` đếm N cột; hàm lồng nhau (`minmax(...)`) bị coi là một cột;
 * `auto-fit` / `auto-fill` trả về 1 vì lưới tự co theo bề rộng.
 *
 * @param {string} value giá trị thuộc tính
 * @returns {number} số cột
 */
function countTracks(value) {
  if (/auto-fit|auto-fill/.test(value)) return 1;
  const repeat = value.match(/repeat\(\s*(\d+)\s*,/);
  if (repeat) return Number(repeat[1]);
  const flattened = value.replace(/\w+\([^()]*\)/g, 'X');
  return flattened.split(/\s+/).filter(Boolean).length;
}

/**
 * Lấy tên class cuối cùng trong một selector.
 *
 * @param {string} selector selector của khối CSS
 * @returns {string} tên class
 */
function primaryClass(selector) {
  const names = [...selector.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]);
  return names.length > 0 ? names[names.length - 1] : '';
}

/**
 * Tìm phần tử JSX mang class `cls` rồi lấy nội dung bên trong nó.
 *
 * Chỉ cần đủ chính xác để đếm nút / icon, nên quét thẻ mở – thẻ đóng tương
 * ứng với cùng tên thẻ. Trả về `null` khi không tìm thấy (không chắc chắn
 * thì bỏ qua, không báo nhầm).
 *
 * @param {string} tsx nội dung file TSX
 * @param {string} cls tên class trong CSS Module
 * @returns {string | null} nội dung bên trong phần tử
 */
function jsxInner(tsx, cls) {
  const hit = new RegExp(`styles\\.${cls}\\}`).exec(tsx);
  if (!hit) return null;

  const start = tsx.lastIndexOf('<', hit.index);
  if (start < 0) return null;
  const tagMatch = /^<([A-Za-z][\w.]*)/.exec(tsx.slice(start));
  if (!tagMatch) return null;
  const tag = tagMatch[1];

  // Cuộn tới dấu `>` kết thúc thẻ mở (bỏ qua dấu `}` của biểu thức JSX).
  let i = start + 1 + tag.length;
  let depth = 0;
  while (i < tsx.length) {
    const ch = tsx[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') depth -= 1;
    else if (ch === '>' && depth === 0) break;
    i += 1;
  }
  if (i >= tsx.length) return null;
  const openEnd = i;
  if (/\/>$/.test(tsx.slice(start, openEnd + 1).trim())) return '';

  // Tìm thẻ đóng tương ứng, đếm thẻ mở/đóng lồng nhau.
  // `level` bắt đầu từ 1 vì thẻ mở của chính phần tử này đã được tính.
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const openRe = new RegExp(`<${escaped}\\b`, 'g');
  const closeRe = new RegExp(`</${escaped}\\s*>`, 'g');
  let level = 1;
  let p = openEnd + 1;
  while (p < tsx.length) {
    openRe.lastIndex = p;
    closeRe.lastIndex = p;
    const o = openRe.exec(tsx);
    const c = closeRe.exec(tsx);
    if (c && (!o || c.index < o.index)) {
      level -= 1;
      if (level === 0) return tsx.slice(openEnd + 1, c.index);
      p = c.index + c[0].length;
      continue;
    }
    if (o) {
      level += 1;
      p = o.index + o[0].length;
      continue;
    }
    break;
  }
  return null;
}

/**
 * Kiểm tra một module có dấu hiệu "vỡ" hay không.
 *
 * @param {string} css nội dung file
 * @param {string | null} tsx nội dung file TSX đi kèm (nếu có)
 * @returns {string[]} danh sách lý do
 */
function findRisks(css, tsx) {
  const reasons = [];
  const canScroll = /overflow-x:\s*auto/.test(css);

  for (const { selector, body } of blocks(css)) {
    const grid = body.match(/grid-template-columns:\s*([^;]+)/);
    if (grid && countTracks(grid[1].trim()) >= 2) {
      reasons.push(`GRID  ${selector.replace(/\s+/g, ' ')} → ${grid[1].trim()}`);
    }

    const minWidth = body.match(/min-width:\s*(\d+)px/);
    if (minWidth && Number(minWidth[1]) >= WIDE_PX && !canScroll) {
      reasons.push(`TABLE ${selector.replace(/\s+/g, ' ')} → min-width: ${minWidth[1]}px`);
    }

    const fixed = body.match(/(^|[\s;{])width:\s*(\d+)px/);
    if (fixed && Number(fixed[2]) >= WIDE_PX) {
      reasons.push(`WIDTH ${selector.replace(/\s+/g, ' ')} → width: ${fixed[2]}px`);
    }

    const isFlexRow = /display:\s*flex/.test(body);
    const wraps = /flex-wrap:\s*wrap/.test(body);
    const stacks = /flex-direction:\s*column/.test(body);
    if (isFlexRow && !wraps && !stacks && tsx) {
      const cls = primaryClass(selector);
      const inner = cls ? jsxInner(tsx, cls) : null;
      if (inner) {
        const buttons = (inner.match(/<(Button|ButtonLink|button)\b/g) || []).length;
        const icons = (inner.match(/<Icon\b/g) || []).length;
        if (buttons >= 2 || icons >= 2) {
          reasons.push(
            `ROW   ${selector.replace(/\s+/g, ' ')} → nhóm ${buttons >= 2 ? 'nút' : 'icon'} không wrap`,
          );
        }
      }
    }
  }

  return reasons;
}

const files = collectModuleCss(SRC);
const allowlist = new Set(ALLOWLIST.map((entry) => entry.file));

let audited = 0;
let withMedia = 0;
const failures = [];

for (const file of files) {
  const rel = relative(SRC, file).split('\\').join('/');
  const css = readFileSync(file, 'utf8');
  audited += 1;
  if (css.includes('@media')) {
    withMedia += 1;
    continue;
  }
  if (allowlist.has(rel)) continue;

  const tsxPath = join(dirname(file), rel.replace(/\.module\.css$/, '.tsx'));
  const tsx = existsSync(tsxPath) ? readFileSync(tsxPath, 'utf8') : null;

  const risks = findRisks(css, tsx);
  if (risks.length > 0) failures.push({ file: rel, risks });
}

console.log(`Đã quét ${audited} CSS Module trong src/`);
console.log(`  · có @media: ${withMedia}`);
console.log(`  · không có @media: ${audited - withMedia}`);
console.log(`  · cần kiểm tra lại: ${failures.length}`);
console.log(`  · allowlist: ${ALLOWLIST.length}`);

if (failures.length > 0) {
  console.error('\n✗ Các CSS Module sau có bố cục dễ vỡ trên màn hình hẹp nhưng chưa có @media:');
  for (const failure of failures) {
    console.error(`\n   ${failure.file}`);
    for (const risk of failure.risks) console.error(`     - ${risk}`);
  }
  console.error(
    '\n   Cách xử lý: thêm @media (max-width: var(--breakpoint-md)) gộp cột / cho phép cuộn ngang ' +
      'bảng / wrap hàng flex — hoặc ghi vào ALLOWLIST kèm lý do nếu thực sự không thể vỡ.',
  );
  process.exit(1);
}

console.log('\n✓ Mọi CSS Module có bố cục dễ vỡ trên màn hình hẹp đều có @media.');
