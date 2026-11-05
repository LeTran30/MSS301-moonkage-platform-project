/**
 * Chặn mã đặc tả lọt vào chuỗi hiển thị ra giao diện.
 *
 * Vì sao: trong quá trình phát triển, mã yêu cầu (`FR-06`), mã luồng
 * (`FLOW 3`), mã trang (`M6.1.2`) được ghi rất tiện lề vào nhãn hiển thị.
 * Người dùng cuối không biết những mã đó là gì — họ chỉ thấy giao diện bị
 * "rò rỉ" tài liệu kỹ thuật ra ngoài.
 *
 * Quy tắc của script này:
 * - Chỉ quét **chuỗi và JSX text** — comment trong mã nguồn thì được phép
 *   nhắc tới đặc tả, vì đó là tài liệu dành cho người phát triển.
 * - Bỏ qua thư mục test (`__tests__`, `*.test.tsx`, `*.spec.ts`): tên test
 *   thường ghi rõ mã đặc tả để truy vết.
 *
 * Chạy: `node scripts/check-no-spec-ids.mjs`
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const SRC = resolve(process.cwd(), 'src');

/**
 * Mã đặc tả cần bắt.
 *
 * - `FR-xx` / `BR-xx` / `NFR-xx` / `UC-xx` / `AC-xx` : yêu cầu chức năng,
 *   nghiệp vụ, phi chức năng, ca kiểm thử, tiêu chí chấp nhận.
 * - `M1.0` / `B1.0` / `Q1.0` : mã trang theo bảng nhãn IA.
 * - `FLOW 1` / `Flow 3` : mã luồng nghiệp vụ.
 * - `Zone M` / `Zone Q` : tên khu vực trong tài liệu kiến trúc.
 */
const SPEC_ID_PATTERNS = [
  { label: 'yêu cầu chức năng', regex: /\b(?:FR|BR|NFR|UC|AC)-\d+(?:\.\d+)*\b/gi },
  { label: 'mã trang IA', regex: /\b[MBQ]\d+\.\d+(?:\.\d+)?\b/g },
  { label: 'mã luồng', regex: /\b(?:FLOW|Flow|flow)\s*\d+\b/g },
  { label: 'mã khu vực', regex: /\bZone\s+[MBQ]\b/g },
];

/** Thư mục/file được miễn trừ. */
const IGNORED_DIRS = new Set(['node_modules', 'dist', 'coverage', 'playwright-report']);
const IGNORED_FILE = /(__tests__|\.test\.|\.spec\.)/;

/**
 * Một chuỗi có phải **dữ liệu đường nét SVG** không?
 *
 * Ví dụ `M4 9.5 5.5 4h13L20 9.5` là path của icon. Nếu không loại trừ, chuỗi đó
 * bị nhận nhầm là "mã trang IA" (`M4.9`) — dữ liệu hình học, không phải mã.
 *
 * Cách nhận: path SVG chỉ gồm **lệnh** (chữ cái viết hoa/thường trong bảng
 * lệnh SVG) cộng số và dấu phân cách. Bất kỳ chữ cái nào khác (tiếng Việt)
 * đều loại trừ, nên `"Mua ngay"` hay `"M4.0"` không bị coi là path.
 */
const SVG_PATH_LETTERS = 'MmLlHhVvCcSsQqTtAaZz';

function isSvgPathData(content) {
  if (!/^[Mm][A-Za-z0-9\s.,-]+$/.test(content)) return false;
  // Chỉ còn lệnh SVG, số và dấu phân cách.
  return !content.replace(new RegExp(`[${SVG_PATH_LETTERS}0-9\\s.,-]`, 'g'), '').length;
}

/**
 * Xoá comment khỏi mã nguồn, giữ nguyên chuỗi và template literal.
 *
 * Nhờ vậy mã đặc tả trong `/** ... FR-06 ... *\/` không bị báo nhầm, còn mã
 * đặc tả nằm trong một chuỗi hiển thị vẫn bị bắt.
 *
 * Chuỗi là dữ liệu đường nét SVG cũng được làm rỗng, vì đó không phải văn
 * bản hiển thị.
 */
function stripComments(source) {
  let out = '';
  let i = 0;
  const n = source.length;

  // `state` mô tả chúng ta đang ở trong loại ký tự nào:
  // 'code' | 'line-comment' | 'block-comment' | "'" | '"' | '`'
  let state = 'code';
  let literal = '';

  while (i < n) {
    const ch = source[i];
    const next = source[i + 1];

    if (state === 'code') {
      if (ch === '/' && next === '/') {
        state = 'line-comment';
        i += 2;
        continue;
      }
      if (ch === '/' && next === '*') {
        state = 'block-comment';
        i += 2;
        continue;
      }
      if (ch === "'") {
        state = "'";
        literal = '';
        i += 1;
        continue;
      }
      if (ch === '"') {
        state = '"';
        literal = '';
        i += 1;
        continue;
      }
      if (ch === '`') {
        state = '`';
        literal = '';
        i += 1;
        continue;
      }
      out += ch;
      i += 1;
      continue;
    }

    if (state === 'line-comment') {
      if (ch === '\n') {
        state = 'code';
        out += ch;
      }
      i += 1;
      continue;
    }

    if (state === 'block-comment') {
      if (ch === '*' && next === '/') {
        state = 'code';
        i += 2;
        continue;
      }
      // Giữ newline để số dòng không bị lệch khi báo lỗi.
      if (ch === '\n') out += ch;
      i += 1;
      continue;
    }

    // Trong chuỗi: thoát ký tự và nối dấu nháy.
    if (ch === '\\') {
      literal += ch + (next ?? '');
      i += 2;
      continue;
    }
    if ((state === "'" && ch === "'") || (state === '"' && ch === '"') || (state === '`' && ch === '`')) {
      // Dữ liệu đường nét SVG bị làm rỗng: đó là hình học, không phải văn bản
      // hiển thị. Khoảng trắng giữ nguyên số ký tự để số dòng không lệch.
      out += isSvgPathData(literal) ? ' '.repeat(literal.length) : literal;
      literal = '';
      state = 'code';
      i += 1;
      continue;
    }
    literal += ch;
    i += 1;
  }

  return out;
}

/** Số dòng (1-based) của một chỉ số ký tự trong mã nguồn gốc. */
function lineOf(source, index) {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i += 1) {
    if (source[i] === '\n') line += 1;
  }
  return line;
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

if (!readdirSync) {
  console.error('✗ Không đọc được thư mục src.');
  process.exit(1);
}

const files = walk(SRC);
const findings = [];

for (const file of files) {
  if (IGNORED_FILE.test(relative(SRC, file))) continue;

  const source = readFileSync(file, 'utf8');
  // Vị trí trong mã đã bỏ comment không khớp với mã gốc, nên báo theo
  // số dòng xấp xỉ bằng cách đếm newline tới trước vị trí đó.
  const stripped = stripComments(source);

  for (const { label, regex } of SPEC_ID_PATTERNS) {
    const pattern = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`);
    let match;
    while ((match = pattern.exec(stripped)) !== null) {
      // Bỏ qua kết quả trùng lặp do regex có cờ `i` + `g`.
      findings.push({
        file: relative(process.cwd(), file),
        label,
        code: match[0],
        line: lineOf(stripped, match.index),
      });
      if (match[0].length === 0) pattern.lastIndex += 1;
    }
  }
}

if (findings.length === 0) {
  console.log('✓ Không có mã đặc tả nào lọt vào giao diện.');
  process.exit(0);
}

console.log(`✗ Tìm thấy ${findings.length} mã đặc tả trong chuỗi hiển thị:\n`);
for (const item of findings) {
  console.log(`   ${item.file}:${item.line}  ${item.code}  (${item.label})`);
}
console.log(
  '\n   Gỡ mã đặc tả khỏi chuỗi hiển thị. Nếu cần giữ truy vết, đặt nó trong',
);
console.log('   comment ngay cạnh chuỗi, hoặc dùng hằng số trong `config/`.');
process.exit(1);
