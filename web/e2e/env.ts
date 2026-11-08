/**
 * Nạp biến môi trường của stack backend cho test E2E.
 *
 * Vì sao cần: E2E chạy với backend **thật** (docker compose), và backend đọc
 * cấu hình từ file `.env` ở thư mục gốc repo. Test cần đúng những bí mật đó:
 *
 * - `VNPAY_HASH_SECRET` — ký callback VNPay để trả tiền (xem `vnpay.ts`).
 * - `NFC_TRANSPORT_PRIVATE_KEY_V1` — khóa RSA mở payload thẻ NFC (xem `nfc.ts`).
 * - `SEED_PASSWORD` — mật khẩu của các tài khoản seed.
 *
 * Vì sao không dựa vào `web/.env`: file đó là cục bộ của developer (gitignore),
 * CI checkout sạch nên không có. Nạp `.env` ở thư mục gốc giúp local và CI
 * đọc **cùng một** nguồn — và `playwright.config.ts` chạy trước test nên các
 * biến này có mặt khi test bắt đầu.
 *
 * Quy tắc: biến đã có trong `process.env` (CI truyền vào) thắng — không đè.
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** Thư mục gốc của repo: `web/` nằm ngay dưới nó. */
const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');

/** File `.env` của stack backend, ở thư mục gốc repo. */
const ROOT_ENV = path.join(REPO_ROOT, '.env');

/**
 * Đọc một biến từ file `.env` kiểu `KEY=value`.
 *
 * Bỏ qua dòng comment (`#`) và dòng trống; giữ nguyên phần sau dấu `=` đầu
 * tiên (giá trị có thể chứa `=`).
 */
function readEnvFile(file: string): Record<string, string> {
  if (!existsSync(file)) return {};

  const values: Record<string, string> = {};
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator <= 0) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    // Giá trị đã được quote trong file: bỏ quote cho khớp với `process.env`.
    values[key] = value.replace(/^["'](.*)["']$/, '$1');
  }
  return values;
}

/**
 * Nạp `.env` ở thư mục gốc vào `process.env` (biến sẵn có thắng).
 *
 * Gọi một lần ở đầu file; các module khác của E2E đọc biến qua
 * `process.env` nên không cần truyền tham số.
 */
function loadRootEnv(): void {
  const values = readEnvFile(ROOT_ENV);
  for (const [key, value] of Object.entries(values)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadRootEnv();

/** Bí mật VNPay để ký callback; `undefined` khi thiếu (luồng thanh toán bị bỏ qua). */
export function vnpayHashSecret(): string | undefined {
  const secret = process.env.VNPAY_HASH_SECRET;
  return secret && secret.trim() !== '' ? secret.trim() : undefined;
}

/**
 * Khóa riêng tư RSA (PKCS#8, Base64) mà identity-service dùng để mở payload
 * thẻ NFC; `undefined` khi thiếu (luồng xác minh NFC bị bỏ qua).
 */
export function nfcTransportPrivateKey(): string | undefined {
  const key = process.env.NFC_TRANSPORT_PRIVATE_KEY_V1;
  if (!key || key.trim() === '') return undefined;

  // Bỏ header/footer PEM nếu có: backend cũng vậy (`NfcTransportDecryptor`).
  return key.replace(/-----[A-Z ]+-----|\s/g, '');
}

/** Origin của MinIO mà trình duyệt (và test) dùng để tải file lên. */
export function minioBrowserUrl(): string {
  const url =
    process.env.MINIO_BROWSER_URL ??
    `http://localhost:${process.env.MINIO_API_PORT ?? '9000'}`;
  return url.replace(/\/+$/, '');
}
