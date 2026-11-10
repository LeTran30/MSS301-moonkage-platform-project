import type { Page } from '@playwright/test';
import { apiGet, gatewayUrl, unwrapData, waitFor } from './helpers';
import { buildVnpayCallback, callbackQuery, sign, vnpaySecret } from './vnpay';

/**
 * Cầu nối thanh toán cho E2E.
 *
 * Vì sao cần: VNPay là cổng thanh toán **bên ngoài**. Trên `localhost`, VNPay
 * không gọi được IPN về máy (IPN chỉ tới được host công khai), nên một luồng
 * E2E không có cách nào thật sự trả tiền. Không có cầu nối này thì các luồng
 * F1, F2, F3 — vốn đi qua thanh toán — chỉ có thể dừng ở bước "tạo giao dịch".
 *
 * Cách làm (đúng như `docs/services/payment/README.md` chỉ ra): ký callback bằng
 * `VNPAY_HASH_SECRET` rồi gọi `GET /api/payments/vnpay/ipn`. payment-service
 * kiểm chữ ký, kiểm số tiền khớp, rồi đánh dấu đã trả — y hệt một IPN thật.
 *
 * Ranh giới quan trọng: cầu nối này **không** giả lập phía server. Server vẫn
 * kiểm chữ ký thật, vẫn kiểm số tiền khớp, vẫn chống xử lý lặp. Nó chỉ
 * thay thế phần "VNPay gửi IPN tới" mà môi trường local không làm được.
 */

/** Thông tin một giao dịch cần trả tiền. */
export interface PendingPayment {
  paymentId: string;
  amount: number;
  /** `vnp_TxnRef` — mã tham chiếu mà VNPay dùng. */
  txnRef: string;
  /** Link VNPay; test không mở link này, chỉ dùng `txnRef`. */
  paymentUrl: string;
}

/**
 * Đọc `vnp_TxnRef` và số tiền từ link VNPay.
 *
 * Link do payment-service dựng có sẵn mọi trường `vnp_` **đã ký**, nên test
 * không cần tự ký lại từ đầu — chỉ cần thêm `vnp_ResponseCode` và
 * `vnp_TransactionStatus` (trường mà VNPay chỉ thêm vào khi trả kết quả).
 */
export function parsePaymentUrl(paymentUrl: string): { txnRef: string; amount: number } {
  const query = paymentUrl.includes('?') ? paymentUrl.slice(paymentUrl.indexOf('?') + 1) : '';
  const params = new URLSearchParams(query);

  const txnRef = params.get('vnp_TxnRef');
  if (!txnRef) {
    throw new Error(`Link thanh toán không có vnp_TxnRef: ${paymentUrl}`);
  }

  // VNPay đếm tiền theo 1/100 đồng.
  const hundredths = Number(params.get('vnp_Amount') ?? '0');
  return { txnRef, amount: Math.round(hundredths / 100) };
}

/** Dựng `PendingPayment` từ câu trả lời của `POST /api/checkouts`. */
export function paymentFromCheckout(
  checkout: { paymentId?: string; paymentUrl: string; totalAmount?: number },
): PendingPayment {
  const { txnRef, amount } = parsePaymentUrl(checkout.paymentUrl);
  return {
    paymentId: checkout.paymentId ?? '',
    amount: checkout.totalAmount ?? amount,
    txnRef,
    paymentUrl: checkout.paymentUrl,
  };
}

/**
 * Gửi IPN đã ký tới gateway.
 *
 * @param payment giao dịch cần đánh dấu đã trả
 * @param paid `true` = thanh toán thành công, `false` = người mua huỷ
 */
async function sendIpn(
  page: Page,
  payment: PendingPayment,
  paid: boolean,
): Promise<{ rspCode: string; message: string }> {
  const secret = vnpaySecret();
  if (!secret) {
    throw new Error(
      'Thiếu VNPAY_HASH_SECRET: không ký được IPN. Xem docs/services/payment/README.md.',
    );
  }

  const callback = buildVnpayCallback(payment.txnRef, payment.amount, secret);
  if (!paid) {
    callback.vnp_ResponseCode = '99';
    callback.vnp_TransactionStatus = '99';
    // Đổi mã phải đổi chữ ký — server kiểm chữ ký trên **mọi** trường `vnp_`.
    delete callback.vnp_SecureHash;
    callback.vnp_SecureHash = sign(callback, secret);
  }

  const url = gatewayUrl(`/api/payments/vnpay/ipn?${callbackQuery(callback)}`);
  const response = await page.evaluate(async (target) => {
    const result = await fetch(target);
    return { status: result.status, text: await result.text() };
  }, url);

  let parsed: { RspCode?: string; Message?: string } = {};
  try {
    parsed = JSON.parse(response.text) as { RspCode?: string; Message?: string };
  } catch {
    /* phản hồi không phải JSON — báo lỗi bằng nội dung thô */
  }
  // `VnpayIpnResponse` dùng tên `RspCode` / `Message` (đúng như VNPay yêu cầu).
  return {
    rspCode: parsed.RspCode ?? '',
    message: parsed.Message ?? response.text,
  };
}

/**
 * Trả tiền cho một giao dịch đang chờ, bằng cách gửi IPN đã ký.
 *
 * @returns mã phản hồi của VNPay (`00` = thành công)
 */
export async function payVnpay(
  page: Page,
  payment: PendingPayment,
): Promise<{ rspCode: string; message: string }> {
  return sendIpn(page, payment, true);
}

/**
 * Trả tiền cho một giao dịch đang chờ và **chờ** nó thành công.
 *
 * Hàm này là điểm vào của mọi luồng có thanh toán: gọi `POST /api/checkouts`
 * (hoặc endpoint tương tự), đưa kết quả vào đây, rồi chờ đơn hàng xuất hiện.
 */
export async function payAndWait(
  page: Page,
  payment: PendingPayment,
  timeout = 25_000,
): Promise<PendingPayment> {
  const result = await payVnpay(page, payment);
  if (result.rspCode !== '00') {
    throw new Error(
      `IPN không thành công: rspCode=${result.rspCode} message=${result.message}`,
    );
  }

  await waitForPaymentSucceeded(page, payment.paymentId, timeout);
  return payment;
}

/**
 * Báo giao dịch thất bại (người mua huỷ ở trang VNPay).
 *
 * Dùng để kiểm tra đường lỗi: giao dịch phải chuyển `FAILED` và không được
 * tạo đơn.
 */
export async function failVnpay(page: Page, payment: PendingPayment): Promise<void> {
  await sendIpn(page, payment, false);
}

/**
 * Đọc trạng thái một giao dịch của chính người đang đăng nhập.
 *
 * `GET /api/payments/{paymentId}` chỉ trả giao dịch của người gọi (hoặc admin
 * thì thấy tất cả) — đúng như trang kết quả của web poll.
 */
export async function paymentStatus(page: Page, paymentId: string): Promise<string | undefined> {
  const payload = await apiGet<unknown>(page, gatewayUrl(`/api/payments/${paymentId}`));
  return unwrapData<{ status?: string }>(payload)?.status;
}

/**
 * Chờ một giao dịch chuyển sang `SUCCEEDED`.
 *
 * Đọc bằng `GET /api/payments/{paymentId}` — endpoint mà trang kết quả của web
 * poll. Vì việc ghi trạng thái đi qua RabbitMQ nên cần chờ.
 */
export async function waitForPaymentSucceeded(
  page: Page,
  paymentId: string,
  timeout = 25_000,
): Promise<void> {
  await waitFor(
    async () => (await paymentStatus(page, paymentId)) === 'SUCCEEDED',
    { timeout },
  );
}

/**
 * Chờ một giao dịch chuyển sang `FAILED`.
 */
export async function waitForPaymentFailed(
  page: Page,
  paymentId: string,
  timeout = 25_000,
): Promise<void> {
  await waitFor(async () => (await paymentStatus(page, paymentId)) === 'FAILED', { timeout });
}
