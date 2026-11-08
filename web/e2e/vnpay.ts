import { createHmac } from 'node:crypto';

/**
 * Ký callback VNPay giống hệt `VnpaySigner` của payment-service.
 *
 * Vì sao cần: VNPay không gọi được IPN về `localhost`, nên một lần chạy E2E
 * không có cách nào trả tiền thật. Cách đã được chính tài liệu payment chỉ ra
 * (`docs/services/payment/README.md`): ký đúng bằng `VNPAY_HASH_SECRET` rồi gọi
 * `GET /api/payments/vnpay/ipn`.
 *
 * Vì sao phải giống **từng bước**:
 *
 * - Thuật toán: HMAC-SHA512, hex lowercase.
 * - Chuỗi ký: các trường `vnp_*` **loại trừ** `vnp_SecureHash` và
 *   `vnp_SecureHashType`, sắp xếp theo tên, mỗi cặp `key=value` URL-encode
 *   bằng US-ASCII, nối bằng `&`.
 * - Trường không có giá trị thì bỏ hẳn khỏi chuỗi ký.
 *
 * Sai một chi tiết là payment-service trả `INVALID_SIGNATURE` và đơn không
 * bao giờ chuyển sang PAID — test sẽ đỏ với lý do rất khó đoán. Vì vậy phần
 * này có test riêng ở `e2e/__tests__/vnpay-signature.test.ts`.
 */

/** Các trường `vnp_` mà payment-service loại khỏi chuỗi ký. */
const EXCLUDED_FROM_SIGNATURE = new Set(['vnp_SecureHash', 'vnp_SecureHashType']);

/**
 * `URLEncoder.encode(value, US_ASCII)` của Java.
 *
 * Ba điểm dễ sai, đã đối chiếu bằng `VnpaySignerE2eParityTest` ở
 * payment-service:
 *
 * 1. Chuỗi được chuyển sang **byte US-ASCII** trước; ký tự ngoài ASCII thành
 *    `?` (0x3F) rồi mới mã hoá thành `%3F` — không phải mã hoá theo UTF-8.
 * 2. Khoảng trắng thành `+`, không phải `%20`.
 * 3. Ký tự an toàn là `A-Z a-z 0-9 . - * _`; mọi thứ khác (kể cả `~`) thành
 *    `%XX` viết hoa.
 */
function encodeJava(value: string): string {
  const safe = /[A-Za-z0-9.\-*_]/;
  let out = '';
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    // US-ASCII: byte nào không mã hoá được thì thay bằng `?`.
    const byte = code < 0x80 ? code : 0x3f;
    if (byte === 0x20) {
      out += '+';
    } else if (byte < 0x80 && safe.test(String.fromCharCode(byte))) {
      out += String.fromCharCode(byte);
    } else {
      out += `%${byte.toString(16).toUpperCase().padStart(2, '0')}`;
    }
  }
  return out;
}

/** Chuỗi ký: trường `vnp_` sắp theo tên, bỏ trường rỗng, mỗi cặp URL-encode. */
export function canonicalQuery(fields: Record<string, string>): string {
  return Object.keys(fields)
    .filter((key) => fields[key] !== undefined && fields[key] !== null && fields[key] !== '')
    .sort()
    .map((key) => `${encodeJava(key)}=${encodeJava(fields[key])}`)
    .join('&');
}

/**
 * Chữ ký HMAC-SHA512 của chuỗi ký, hex lowercase — giống `VnpaySigner.sign`.
 *
 * Khác `VnpaySigner.sign` ở một điểm **cố ý**: chỉ trường `vnp_` mới được
 * ký. Đó là quy tắc của `VnpaySigner.verify` — hàm mà payment-service dùng để
 * kiểm callback — nên bản ký ở đây phải khớp đúng quy tắc đó, nếu không
 * server từ chối.
 */
export function sign(fields: Record<string, string>, secret: string): string {
  const signed = Object.fromEntries(
    Object.entries(fields).filter(
      ([key, value]) =>
        key.startsWith('vnp_') &&
        !EXCLUDED_FROM_SIGNATURE.has(key) &&
        value !== undefined &&
        value !== null &&
        value !== '',
    ),
  );
  return createHmac('sha512', secret).update(canonicalQuery(signed), 'utf8').digest('hex');
}

/**
 * Secret của merchant VNPay.
 *
 * Đọc từ biến môi trường để **không** commit secret vào repo. Ở local là
 * `.env` ở thư mục gốc; ở CI, workflow sinh `.env` từ `.env.example` rồi bật
 * `VNPAY_CONFIRM_ON_RETURN` và truyền secret qua `VNPAY_HASH_SECRET`.
 *
 * Thiếu secret thì test **bỏ qua** chứ không đỏ: luồng thanh toán cần secret,
 * còn các luồng khác thì không. Đỏ ở đây sẽ khiến cả pipeline xanh trở nên
 * nhiễu.
 */
export function vnpaySecret(): string | undefined {
  const secret = process.env.VNPAY_HASH_SECRET;
  return secret && secret.trim() !== '' ? secret.trim() : undefined;
}

/**
 * Dựng callback VNPay đã ký, sẵn sàng gửi tới `GET /api/payments/vnpay/ipn`.
 *
 * @param txnRef `vnp_TxnRef` của giao dịch cần đánh dấu đã trả
 * @param amountVnd số tiền **bằng đồng**, không phải xu (VNPay đếm 1/100 VND)
 * @param secret `VNPAY_HASH_SECRET`
 */
export function buildVnpayCallback(
  txnRef: string,
  amountVnd: number,
  secret: string,
): Record<string, string> {
  const fields: Record<string, string> = {
    vnp_TxnRef: txnRef,
    vnp_Amount: String(amountVnd * 100),
    vnp_ResponseCode: '00',
    vnp_TransactionStatus: '00',
    vnp_TransactionNo: `E2E${Date.now()}`,
    vnp_TmnCode: process.env.VNPAY_TMN_CODE ?? '',
    vnp_CurrCode: 'VND',
    vnp_Locale: 'vn',
    vnp_OrderType: 'other',
    vnp_OrderInfo: 'E2E',
    vnp_Command: 'pay',
    vnp_Version: '2.1.0',
  };

  return { ...fields, vnp_SecureHash: sign(fields, secret) };
}

/** Query string của callback, sẵn sàng nối vào URL. */
export function callbackQuery(callback: Record<string, string>): string {
  return Object.entries(callback)
    .map(([key, value]) => `${encodeJava(key)}=${encodeJava(value)}`)
    .join('&');
}
