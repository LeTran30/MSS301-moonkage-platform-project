/**
 * Guard: bản build phải khai báo origin của object storage trong CSP.
 *
 * Vì sao cần:
 *
 * - Ảnh sản phẩm / ảnh báo giá do backend trả về từ MinIO — một origin khác
 *   với origin của ứng dụng.
 * - CSP khai báo `img-src 'self' data: blob:` cộng thêm các origin đọc từ
 *   `VITE_MEDIA_BASE_URL` (xem `cspImageSources()` trong
 *   `src/shared/config/security.ts`).
 * - Thiếu origin đó ⇒ trình duyệt chặn ảnh ⇒ ảnh hỏng **và** console ghi
 *   lỗi "violates the following Content Security Policy directive" ⇒ các
 *   test E2E "trang ... không có lỗi console" đỏ.
 *
 * Vì sao guard này tồn tại: `web/.env` / `web/.env.local` là file cục bộ
 * của developer (gitignore). CI checkout sạch nên không có chúng. Nếu ai đó
 * bỏ sót việc truyền `VITE_MEDIA_BASE_URL` cho CI thì E2E đỏ — nhưng
 * lỗi hiện ra muộn, ở bước E2E, và trông như lỗi sản phẩm. Guard này
 * chặn ngay tại bước build, với thông báo lỗi rõ ràng.
 *
 * Cách dùng:
 *   node scripts/check-csp-media-origin.mjs
 *
 * Biến môi trường:
 *   VITE_MEDIA_BASE_URL  origin (hoặc danh sách origin) mà ứng dụng phải
 *                        khai báo cho `img-src`. Bắt buộc — nếu thiếu thì
 *                        guard tự báo lỗi vì bản build cũng không có origin
 *                        nào để khai báo.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const distDir = join(process.cwd(), 'dist', 'assets');

/**
 * Đọc `VITE_MEDIA_BASE_URL` theo **đúng thứ tự ưu tiên của Vite**:
 * `process.env` (biến thật) > `.env.local` > `.env`.
 *
 * Vì sao phải giống hệt Vite: guard này xác nhận bản build có khai báo
 * origin ảnh trong CSP. Nếu guard đọc một nguồn khác với nguồn Vite dùng
 * để build thì guard có thể xanh trong khi bản build vẫn thiếu origin —
 * tức là guard chỉ "có vẻ" bảo vệ mà không bảo vệ thật.
 */
function readEnvFile(name) {
  const path = join(process.cwd(), name);
  if (!existsSync(path)) return undefined;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = /^\s*VITE_MEDIA_BASE_URL\s*=\s*(.*)$/.exec(line);
    if (match) {
      const value = match[1].trim().replace(/^["']|["']$/g, '');
      if (value) return value;
    }
  }
  return undefined;
}

const raw = (
  process.env.VITE_MEDIA_BASE_URL ??
  readEnvFile('.env.local') ??
  readEnvFile('.env') ??
  ''
).trim();

function fail(message) {
  console.error(`[check-csp-media-origin] FAIL: ${message}`);
  process.exit(1);
}

if (!raw) {
  fail(
    'VITE_MEDIA_BASE_URL rỗng — bản build sẽ không khai báo origin ảnh trong ' +
      '`img-src` của CSP, mọi ảnh MinIO bị chặn và test E2E "không có lỗi console" đỏ. ' +
      'CI phải truyền biến này (job `env:` trong .github/workflows/web-quality.yml), ' +
      'không được dựa vào `web/.env` cục bộ (file đó gitignore, CI không có).',
  );
}

/** Origin mà ứng dụng thực sự khai báo cho `img-src` (không có path). */
const expectedOrigins = [];
for (const candidate of raw.split(',')) {
  const value = candidate.trim();
  if (!value) continue;
  try {
    expectedOrigins.push(new URL(value).origin);
  } catch {
    fail(`VITE_MEDIA_BASE_URL không phải URL hợp lệ: "${value}"`);
  }
}

if (expectedOrigins.length === 0) {
  fail(`VITE_MEDIA_BASE_URL không chứa origin hợp lệ nào: "${raw}"`);
}

if (!existsSync(distDir)) {
  fail(`không tìm thấy ${distDir} — hãy chạy \`npm run build\` trước.`);
}

const files = readdirSync(distDir).filter((name) => name.endsWith('.js'));
if (files.length === 0) {
  fail(`không có file JS nào trong ${distDir} — bản build có vấn đề.`);
}

const bundle = files.map((name) => readFileSync(join(distDir, name), 'utf8')).join('\n');

const missing = expectedOrigins.filter((origin) => !bundle.includes(origin));
if (missing.length > 0) {
  fail(
    `bản build KHÔNG chứa origin ảnh ${missing.join(', ')} ⇒ CSP sẽ chặn ảnh ` +
      `(img-src chỉ có 'self' data: blob:) và test E2E "không có lỗi console" sẽ đỏ.`,
  );
}

console.log(
  `[check-csp-media-origin] OK — bản build khai báo img-src cho: ${expectedOrigins.join(', ')}`,
);
