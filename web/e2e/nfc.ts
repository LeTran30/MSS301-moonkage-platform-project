import {
  constants,
  createCipheriv,
  createPrivateKey,
  createPublicKey,
  randomBytes,
  publicEncrypt,
} from 'node:crypto';
import { apiGet, apiPost, gatewayUrl, unwrapData } from './helpers';
import { nfcTransportPrivateKey } from './env';

/**
 * Xác minh danh tính bằng thẻ NFC — phía **test**, thay cho ứng dụng Moonkage Verify.
 *
 * Luồng thật (FR-04, AC-04.1 → AC-04.12):
 *
 * 1. Web mở một phiên xác minh: `POST /api/nfc/sessions` → `sessionId`.
 * 2. Người dùng quét QR bằng app trên điện thoại; app đọc chip CCCD và gửi
 *    thẻ **mã hoá** lên `POST /api/nfc/sessions/{sessionId}/card`.
 * 3. `identity-service` mở payload bằng khoá riêng tư của nó, kiểm tra định
 *    dạng thẻ và lưu hồ sơ pháp lý → tài khoản thành `VERIFIED`.
 *
 * Vì sao test cần làm được bước 2: E2E chạy trên máy không có app điện
 * thoại và không có đầu đọc NFC. Nhưng **phần cần kiểm thử** là phía server:
 * nó có mở được JWE của ứng dụng thật không, có kiểm tra đúng định dạng thẻ
 * không, và có ghi hồ sơ pháp lý đúng không. Vì vậy test dựng **đúng** JWE mà
 * app sinh ra (RSA-OAEP-256 + A256GCM, compact serialization) và gửi đi.
 *
 * Ranh giới quan trọng: test **không** giả lập kết quả. Server vẫn giải mã,
 * vẫn kiểm tra từng trường của thẻ (A-08), vẫn từ chối thẻ hết hạn, vẫn chặn
 * một số CCCD đã gắn với tài khoản khác. Chỉ có "đọc chip" là thao tác của
 * con người ngoài hệ thống mà thay bằng được.
 */

/** Header JWE của ứng dụng Verify (AC-04.10). */
const JWE_HEADER = { alg: 'RSA-OAEP-256', enc: 'A256GCM' } as const;

/**
 * Sinh một số CCCD 12 chữ số chưa từng dùng.
 *
 * Cơ sở dữ liệu seed đã dùng `079190000001` … `079191000009`; phần cuối sinh
 * từ `Date.now()` nên không đụng số seed.
 */
export function freshIdNumber(): string {
  const stamp = String(Date.now() % 1_000_000_000).padStart(9, '0');
  return `079${stamp}`;
}

/**
 * Khoá công khai RSA của identity-service, suy ra từ khoá riêng tư.
 *
 * Vì sao suy ra: `NFC_TRANSPORT_PRIVATE_KEY_V1` là khoá **riêng tư** của
 * identity-service (PKCS#8, Base64, một dòng). Ứng dụng Verify chỉ có khoá
 * công khai — nhưng trong môi trường E2E, backend và test dùng chung một
 * `.env`, nên test lấy khoá công khai từ khoá riêng tư đó. Hành vi này giống
 * hệt ứng dụng thật: nó mã hoá bằng khoá công khai, chỉ server mở được.
 */
function publicKey(): ReturnType<typeof createPublicKey> {
  const pem = nfcTransportPrivateKey();
  if (!pem) {
    throw new Error(
      'Thiếu NFC_TRANSPORT_PRIVATE_KEY_V1: không mã hoá được thẻ NFC. Xem docs/services/identity/README.md.',
    );
  }
  const privateKey = createPrivateKey({ key: Buffer.from(pem, 'base64'), format: 'der', type: 'pkcs8' });
  return createPublicKey(privateKey);
}

/** Ba trường của thẻ được mã hoá (AC-04.10). */
export interface EncryptedCardFields {
  idNumber: string;
  dateOfBirth: string;
  placeOfResidence: string;
}

/**
 * Mã hoá ba trường của thẻ thành JWE compact, đúng như ứng dụng Verify làm.
 *
 * Cấu trúc: `protected.encryptedKey.iv.ciphertext.tag`
 *
 * - `protected` = header Base64url — cũng là AAD của bước GCM.
 * - `encryptedKey` = CEK (khoá 256 bit ngẫu nhiên) mã hoá RSA-OAEP-256.
 * - `iv` = 12 byte ngẫu nhiên.
 * - `ciphertext` / `tag` = AES-256-GCM với CEK trên.
 */
export function encryptCardFields(fields: EncryptedCardFields): string {
  const header = Buffer.from(JSON.stringify(JWE_HEADER), 'utf8').toString('base64url');
  const contentKey = randomBytes(32);
  const iv = randomBytes(12);

  const encryptedKey = publicEncrypt(
    {
      key: publicKey(),
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    contentKey,
  );

  const cipher = createCipheriv('aes-256-gcm', contentKey, iv);
  cipher.setAAD(Buffer.from(header, 'utf8'));
  const ciphertext = Buffer.concat([
    cipher.update(Buffer.from(JSON.stringify(fields), 'utf8')),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    header,
    encryptedKey.toString('base64url'),
    iv.toString('base64url'),
    ciphertext.toString('base64url'),
    tag.toString('base64url'),
  ].join('.');
}

/** Một thẻ CCCD hợp lệ theo A-08. */
export interface TestCard {
  fullName: string;
  gender: 'MALE' | 'FEMALE';
  nationality: string;
  placeOfBirth: string;
  dateOfIssue: string;
  dateOfExpiry: string;
}

/**
 * Dựng một thẻ hợp lệ: họ tên không dấu, ngày cấp sau ngày sinh, ngày hết hạn
 * sau ngày cấp và còn ở tương lai (nếu không thì CARD_EXPIRED).
 */
export function validCard(dateOfBirth = '1990-03-15'): TestCard {
  const issueYear = Number(dateOfBirth.slice(0, 4)) + 20;
  return {
    // A-08: `^[A-Z]+( [A-Z]+)*$` — không dấu, viết hoa.
    fullName: 'NGUYEN THI LAN',
    gender: 'FEMALE',
    nationality: 'Việt Nam',
    placeOfBirth: 'Ha Noi',
    dateOfIssue: `${issueYear}-05-10`,
    // +20 năm kể từ ngày cấp: thẻ còn hiệu lực ở mọi thời điểm test chạy.
    dateOfExpiry: `${issueYear + 20}-05-10`,
  };
}

/** Kết quả submit thẻ: server luôn trả HTTP 200, kết quả nằm ở `status`. */
export interface SubmitCardResult {
  status: 'VERIFIED' | 'REJECTED';
  reasonCode: string | null;
  attemptsLeft: number | null;
  lockedUntil: string | null;
}

/** Mở một phiên xác minh (bước 1 của luồng NFC). */
export async function createNfcSession(page: import('@playwright/test').Page): Promise<string> {
  const session = await apiPost<{ sessionId: string }>(page, gatewayUrl('/api/nfc/sessions'), {});
  if (!session?.sessionId) {
    throw new Error('Không mở được phiên xác minh NFC.');
  }
  return session.sessionId;
}

/**
 * Gửi thẻ đã mã hoá vào một phiên (bước 2, thay cho ứng dụng Verify).
 *
 * @param card các trường in trên thẻ
 * @param encryptedFields payload đã mã hoá; mặc định dựng từ `fields`
 */
export async function submitCard(
  page: import('@playwright/test').Page,
  sessionId: string,
  card: TestCard,
  fields: EncryptedCardFields,
): Promise<SubmitCardResult> {
  return apiPost<SubmitCardResult>(
    page,
    gatewayUrl(`/api/nfc/sessions/${sessionId}/card`),
    {
      ...card,
      encryptedFields: encryptCardFields(fields),
      appVersion: '1.0.0',
    },
  );
}

/**
 * Gửi một thẻ với payload **tùy ý** (bỏ qua việc mã hoá mặc định).
 *
 * Dùng cho các ca âm tính: thẻ sai định dạng (A-08), thẻ hết hạn
 * (CARD_EXPIRED) hoặc số CCCD đã gắn với tài khoản khác (BR-23). Server vẫn
 * kiểm tra thật — test không giả lập kết quả.
 *
 * @param card các trường in trên thẻ (có thể cố tình sai)
 * @param encryptedFields payload JWE đã mã hoá
 */
export async function submitRawCard(
  page: import('@playwright/test').Page,
  sessionId: string,
  card: Record<string, unknown>,
  encryptedFields: string,
): Promise<SubmitCardResult> {
  return apiPost<SubmitCardResult>(
    page,
    gatewayUrl(`/api/nfc/sessions/${sessionId}/card`),
    {
      ...card,
      encryptedFields,
      appVersion: '1.0.0',
    },
  );
}

/**
 * Đọc trạng thái của một phiên xác minh (fallback khi WebSocket push bị lỡ).
 *
 * `410` (hết hạn) và `403` (thuộc tài khoản khác) là lỗi — helper này chỉ
 * dùng cho phiên do chính test mở.
 */
export async function nfcSessionStatus(
  page: import('@playwright/test').Page,
  sessionId: string,
): Promise<{ sessionId: string; status: 'PENDING' | 'VERIFIED'; expiresAt: string }> {
  const payload = await apiGet<unknown>(page, gatewayUrl(`/api/nfc/sessions/${sessionId}`));
  const data = unwrapData<{ sessionId: string; status: 'PENDING' | 'VERIFIED'; expiresAt: string }>(
    payload,
  );
  if (!data) {
    throw new Error('Máy chủ không trả về trạng thái phiên xác minh.');
  }
  return data;
}

/**
 * Xác minh thẻ cho tài khoản đang đăng nhập: mở phiên rồi gửi thẻ.
 *
 * Đây là helper mà các luồng khác (F4 — đăng ký người bán) dùng để có một
 * tài khoản **đã định danh** mà không phải chờ ứng dụng điện thoại.
 *
 * @param dateOfBirth ngày sinh trên thẻ (chuẩn `uuuu-MM-dd`)
 */
export async function verifyNfc(
  page: import('@playwright/test').Page,
  options: { idNumber?: string; dateOfBirth?: string; card?: TestCard } = {},
): Promise<SubmitCardResult> {
  const idNumber = options.idNumber ?? freshIdNumber();
  const dateOfBirth = options.dateOfBirth ?? '1990-03-15';
  const card = options.card ?? validCard(dateOfBirth);

  const sessionId = await createNfcSession(page);
  return submitCard(page, sessionId, card, {
    idNumber,
    dateOfBirth,
    placeOfResidence: 'Ha Noi',
  });
}

/** Trạng thái định danh của tài khoản đang đăng nhập. */
export async function nfcStatus(
  page: import('@playwright/test').Page,
): Promise<{ nfcStatus?: string; legalName?: string; idNumberMasked?: string } | null> {
  const payload = await apiGet<unknown>(page, gatewayUrl('/api/nfc/status'));
  return unwrapData<{ nfcStatus?: string; legalName?: string; idNumberMasked?: string } | null>(payload);
}
