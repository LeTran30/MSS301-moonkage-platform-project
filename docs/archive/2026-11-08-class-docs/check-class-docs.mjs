import { readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, basename, sep } from 'node:path';

/**
 * Chặn tài liệu class nặng bị bỏ quên — file `docs/services/<service>/classes/<Class>.md`
 * mà class Java tương ứng **không còn tồn tại** trong `api/`.
 *
 * Vì sao: tài liệu class trong `docs/services/<service>/classes/` là tài liệu
 * **sinh tay** (xem `docs/conventions/coding-rules.md` Phần 5). Khi code đổi tên
 * class, đổi package, hoặc gỡ class đi, file tài liệu cũ không tự báo lỗi — người đọc
 * tưởng class đó còn tồn tại và còn làm việc đúng như mô tả.
 *
 * Đây là bước CI rẻ nhất để bắt lỗi đó: không đọc nội dung tài liệu, chỉ kiểm
 * **class được tài liệu hoá còn tồn tại trong mã nguồn không**. Khi class bị đổi
 * tên hoặc xoá, tài liệu phải được sửa lại (đổi tên file, hoặc xoá file nếu class
 * không còn đáng viết tài liệu).
 *
 * Quy tắc được đặt ở `docs/README.md` (quy tắc 9) và
 * `docs/architecture/architecture-standards.md` §7.6.
 *
 * Chạy: `node docs/archive/2026-11-08-class-docs/check-class-docs.mjs`
 */
const DOCS_SERVICES = join('docs', 'services');
const API_DIR = 'api';

/**
 * Thư mục tài liệu `docs/services/<tên>` không trùng tên module Maven
 * (`docs/services/order` ↔ `api/order-service`), nên cần bảng ánh xạ.
 */
const MODULE_BY_SERVICE = {
  identity: 'identity-service',
  catalog: 'catalog-service',
  quotation: 'quotation-service',
  vendor: 'vendor-service',
  order: 'order-service',
  payment: 'payment-service',
  orchestrator: 'orchestrator-service',
  'common-storage': 'common-storage',
};

/** Thu thập mọi file `.java` của một module Maven. */
function javaFilesOf(module) {
  const root = join(API_DIR, module, 'src', 'main', 'java');
  if (!existsSync(root)) return [];
  const found = [];
  (function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.java')) found.push(full);
    }
  })(root);
  return found;
}

/** Mọi file tài liệu class: `{ service, className, file }`. */
function classDocs() {
  if (!existsSync(DOCS_SERVICES)) return [];
  const docs = [];
  for (const entry of readdirSync(DOCS_SERVICES, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const classesDir = join(DOCS_SERVICES, entry.name, 'classes');
    if (!existsSync(classesDir) || !statSync(classesDir).isDirectory()) continue;
    for (const file of readdirSync(classesDir, { withFileTypes: true })) {
      if (!file.isFile() || !file.name.endsWith('.md')) continue;
      docs.push({
        service: entry.name,
        className: basename(file.name, '.md'),
        file: join(classesDir, file.name),
      });
    }
  }
  return docs;
}

const docs = classDocs();

if (docs.length === 0) {
  console.log('✓ Không có tài liệu class nào trong docs/services/*/classes/ để kiểm.');
  process.exit(0);
}

/** Cache: module → Set tên class trong module đó. */
const classNamesByModule = new Map();
function classNamesOf(module) {
  if (!classNamesByModule.has(module)) {
    classNamesByModule.set(module, new Set(javaFilesOf(module).map((f) => basename(f, '.java'))));
  }
  return classNamesByModule.get(module);
}

const stale = [];
const unknownService = [];

for (const doc of docs) {
  const module = MODULE_BY_SERVICE[doc.service];
  if (!module) {
    unknownService.push(doc);
    continue;
  }
  if (!classNamesOf(module).has(doc.className)) {
    stale.push(doc);
  }
}

const problems = [];

if (unknownService.length > 0) {
  problems.push(
    `${unknownService.length} tài liệu class nằm ở thư mục service chưa biết (không có module Maven tương ứng):`,
  );
  for (const doc of unknownService) {
    problems.push(`   ${relative('.', doc.file)} → thêm ánh xạ vào MODULE_BY_SERVICE trong script này`);
  }
}

if (stale.length > 0) {
  problems.push(`${stale.length} tài liệu class không còn khớp với mã nguồn (class đã bị đổi tên hoặc xoá):`);
  for (const doc of stale) {
    const module = MODULE_BY_SERVICE[doc.service];
    problems.push(
      `   ${relative('.', doc.file)} → không tìm thấy ${doc.className}.java trong ${API_DIR}${sep}${module}${sep}src${sep}main${sep}java`,
    );
  }
}

if (problems.length > 0) {
  console.log(`✗ ${problems.length} vấn đề với tài liệu class:\n`);
  for (const line of problems) console.log(line);
  console.log(
    '\n   Sửa tài liệu (đổi tên file theo class mới, hoặc xoá file nếu class không còn đáng viết tài liệu).',
  );
  process.exit(1);
}

console.log(`✓ ${docs.length} tài liệu class đều còn khớp với mã nguồn trong ${API_DIR}/.`);
process.exit(0);
