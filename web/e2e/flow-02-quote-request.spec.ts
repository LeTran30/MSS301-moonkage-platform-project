import { expect, test, type Page } from '@playwright/test';
import {
  apiGet,
  apiPost,
  gatewayUrl,
  loginAs,
  unwrapData,
  waitFor,
  SEED_ACCOUNTS,
  SEED_VENDORS,
} from './helpers';
import { paymentFromCheckout, payAndWait } from './payment';

/**
 * FLOW 2 — Yêu cầu báo giá mở & đặt cọc (M3.1, M6.2.2, FR-16).
 *
 * Đây là hành trình B2B quan trọng nhất của sàn: người mua doanh nghiệp gửi
 * yêu cầu, các xưởng báo giá, người mua chấp nhận một báo giá và đặt cọc.
 *
 * Vì sao test phải đi hết chuỗi:
 *
 * - Yêu cầu báo giá **không** tự tạo đơn. Đơn đặt riêng (`CUSTOM_ORDER`) chỉ
 *   xuất hiện sau khi người mua chấp nhận một báo giá **và** trả tiền cọc.
 * - Cọc là bước đi qua `quotation-service` → `payment-service` → `order-service`
 *   (qua RabbitMQ). Đây là đường đi có nhiều điểm gãy nhất, nên test phải kiểm
 *   cả ba bên: giao dịch thành công, đơn đặt riêng được tạo, và tiền cọc được
 *   ghi vào sổ.
 *
 * Vai trò: người mua (`member1`) và Shop (`member4`).
 */

/** Địa chỉ nhận hàng cho yêu cầu báo giá. */
const DELIVERY = {
  recipientName: 'Nguyễn Thị Lan',
  recipientPhone: '0901000011',
  provinceCode: '79',
  addressDetail: '25 Điện Biên Phủ, Phường Ba Đình',
};

/** Số lượng đặt — đủ lớn để đi theo luồng báo giá chứ không phải mua lẻ. */
const QUANTITY = 500;

/** Hạn giao mong muốn. */
const DEADLINE = '2026-12-31';

/** Một yêu cầu báo giá. */
interface QuoteRequest {
  id: string;
  type: 'DIRECT' | 'OPEN';
  status: 'OPEN' | 'AWARDED' | 'CLOSED' | 'EXPIRED';
  targetVendorId?: string;
  quoteCount?: number;
  invitedCount?: number;
}

/** Một báo giá của Shop. */
interface Quote {
  id: string;
  requestId: string;
  vendorId: string;
  vendorName?: string;
  totalAmount?: number;
  depositAmount?: number;
  depositRate?: number;
}

/** Yêu cầu báo giá gần nhất của người mua. */
async function latestRequest(page: Page): Promise<QuoteRequest | null> {
  const payload = await apiGet<unknown>(page, gatewayUrl('/api/quote-requests'));
  const data = unwrapData<QuoteRequest[]>(payload);
  return data?.[0] ?? null;
}

/** Báo giá của một yêu cầu. */
async function quotesOf(page: Page, requestId: string): Promise<Quote[]> {
  const payload = await apiGet<unknown>(
    page,
    gatewayUrl(`/api/quote-requests/${requestId}/quotes`),
  );
  return unwrapData<Quote[]>(payload) ?? [];
}

/**
 * Đơn đặt riêng sinh ra từ một báo giá.
 *
 * Định danh bằng `quoteId`: đơn đặt riêng mang `quoteId` của báo giá đã được
 * chấp nhận, nên đây là cách duy nhất chỉ đúng đơn của lần chạy này.
 */
async function customOrderOfQuote(
  page: Page,
  quoteId: string,
): Promise<{ id: string; status: string; kind: string } | null> {
  const payload = await apiGet<unknown>(
    page,
    gatewayUrl('/api/orders?kind=CUSTOM_ORDER&size=50'),
  );
  const data = unwrapData<{
    content?: Array<{ id: string; status: string; kind: string; quoteId?: string }>;
  }>(payload);
  return (data?.content ?? []).find((order) => order.quoteId === quoteId) ?? null;
}

/**
 * Tạo một yêu cầu báo giá **mở** (OPEN) — mọi Shop phù hợp đều thấy và báo giá.
 */
async function createOpenRequest(page: Page): Promise<QuoteRequest> {
  return apiPost(page, gatewayUrl('/api/quote-requests'), {
    type: 'OPEN',
    quantity: QUANTITY,
    budget: 100_000_000,
    customTypes: ['BAG', 'CARD'],
    customSpec: 'Hộp giấy có in logo công ty, kèm thiệp.',
    deliveryDeadline: DEADLINE,
    delivery: DELIVERY,
  });
}

/**
 * Shop báo giá cho một yêu cầu.
 *
 * Giá đơn vị và cọc được chọn sao cho tổng tiền cọc là con số tròn — dễ đối
 * chiếu khi kiểm tra sổ tiền.
 */
async function submitQuote(page: Page, requestId: string): Promise<Quote> {
  return apiPost(page, gatewayUrl(`/api/quote-requests/${requestId}/quotes`), {
    items: [
      {
        description: 'Bánh trung thu hộp 6 chiếc, in logo lên hộp',
        quantity: QUANTITY,
        unitPrice: 120_000,
      },
    ],
    customItems: [
      {
        customType: 'BAG',
        description: 'Túi giấy có in logo',
        quantity: QUANTITY,
        unitPrice: 5_000,
      },
    ],
    shippingFee: 30_000,
    depositRate: 0.3,
    deliveryDate: DEADLINE,
    deliveryMethod: 'Giao tận nơi',
    validDays: 7,
    notes: 'E2E: báo giá tự động.',
  });
}

test.describe('FLOW 2 — Yêu cầu báo giá & đặt cọc', () => {
  test('trang tạo yêu cầu hiện đủ các nhóm thông tin', async ({ page }) => {
    await page.goto('/dat-so-luong-lon/yeu-cau-moi');
    await expect(page.locator('#root')).toBeVisible();

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Yêu Cầu/i);

    // Số lượng, hạn giao, người nhận, địa chỉ, bao bì, vị nhân.
    await expect(
      page.getByRole('spinbutton', { name: 'Số lượng hộp cần đặt *', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: 'Người nhận *', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: 'Số điện thoại người nhận *', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: 'Địa chỉ nhận hàng chi tiết *', exact: true }),
    ).toBeVisible();
  });

  test('gửi yêu cầu thiếu thông tin bị chặn và báo lỗi', async ({ page }) => {
    await page.goto('/dat-so-luong-lon/yeu-cau-moi');
    await expect(page.locator('#root')).toBeVisible();

    // Xoá số lượng để chắc chắn có trường thiếu dữ liệu.
    await page
      .getByRole('spinbutton', { name: 'Số lượng hộp cần đặt *', exact: true })
      .fill('');
    await page.getByRole('button', { name: /Gửi yêu cầu báo giá/i }).click();

    // Form không được submit thành công khi thiếu thông tin bắt buộc.
    await expect(page.getByRole('alert').first()).toBeVisible();
    await expect(page).toHaveURL(/\/dat-so-luong-lon\/yeu-cau-moi/);
  });

  test('điền đủ thông tin thì nút gửi không bị khóa', async ({ page }) => {
    await page.goto('/dat-so-luong-lon/yeu-cau-moi');
    await expect(page.locator('#root')).toBeVisible();

    await page
      .getByRole('spinbutton', { name: 'Số lượng hộp cần đặt *', exact: true })
      .fill('500');
    await page
      .getByRole('textbox', { name: 'Người nhận *', exact: true })
      .fill('Nguyễn Văn A');
    await page
      .getByRole('textbox', { name: 'Số điện thoại người nhận *', exact: true })
      .fill('0912345678');
    await page
      .getByRole('textbox', { name: 'Địa chỉ nhận hàng chi tiết *', exact: true })
      .fill('123 Nguyễn Huệ, Quận 1');

    const submit = page.getByRole('button', { name: /Gửi yêu cầu báo giá/i });
    await expect(submit).toBeEnabled();
  });

  test('hub đặt số lượng lớn dẫn tới form yêu cầu', async ({ page }) => {
    await page.goto('/dat-so-luong-lon');
    await expect(page.locator('#root')).toBeVisible();

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const link = page.getByRole('link', { name: /yêu cầu báo giá|tạo yêu cầu/i }).first();
    if (await link.isVisible()) {
      await link.click();
      await expect(page).toHaveURL(/\/yeu-cau-moi/);
    }
  });

  test('người mua tạo được yêu cầu báo giá mở và thấy nó trong danh sách', async ({ page }) => {
    await loginAs(page);

    const request = await createOpenRequest(page);

    expect(request.id).toBeTruthy();
    expect(request.type).toBe('OPEN');
    expect(request.status).toBe('OPEN');

    // Yêu cầu phải xuất hiện ở trang danh sách của người mua.
    await page.goto('/tai-khoan/yeu-cau');
    await expect(page.locator('#root')).toBeVisible();
    await expect(page.getByText(/500|Bánh trung thu/i).first()).toBeVisible();
  });

  test('yêu cầu báo giá không đổi trạng thái khi chưa có báo giá nào', async ({ page }) => {
    await loginAs(page);

    const request = await createOpenRequest(page);
    expect(request.quoteCount ?? 0).toBe(0);

    const quotes = await quotesOf(page, request.id);
    expect(quotes).toHaveLength(0);
  });

  test('Shop báo giá được cho yêu cầu mở', async ({ page }) => {
    await loginAs(page);
    const request = await createOpenRequest(page);

    // Shop báo giá.
    await loginAs(page, SEED_ACCOUNTS.vendor);
    const quote = await submitQuote(page, request.id);

    expect(quote.id).toBeTruthy();
    expect(quote.requestId).toBe(request.id);
    expect(quote.vendorId).toBe(SEED_VENDORS.trangVang.id);

    // Người mua thấy báo giá đó.
    await loginAs(page, SEED_ACCOUNTS.buyer);
    const quotes = await quotesOf(page, request.id);
    expect(quotes.length).toBeGreaterThan(0);
    expect(quotes.some((q) => q.id === quote.id)).toBe(true);
  });

  test('Shop khác không báo giá được cho yêu cầu mở của người mua', async ({ page }) => {
    await loginAs(page);
    const request = await createOpenRequest(page);

    // Shop thứ hai cũng báo giá được cho yêu cầu mở — đó là điểm khác biệt
    // với yêu cầu DIRECT (FLOW 3), chỉ một Shop được mời.
    await loginAs(page, SEED_ACCOUNTS.vendorSecond);
    const quote = await submitQuote(page, request.id);

    expect(quote.id).toBeTruthy();
    expect(quote.vendorId).toBe(SEED_VENDORS.nhaMay.id);
  });

  /**
   * Chuỗi đầy đủ: báo giá → chấp nhận → đặt cọc → đơn đặt riêng.
   *
   * Đây là test quan trọng nhất của FLOW 2: nó đi qua ba service
   * (quotation → payment → order) nối với nhau bằng RabbitMQ.
   */
  test('chấp nhận báo giá rồi đặt cọc tạo ra đơn đặt riêng', async ({ page }) => {
    await loginAs(page);
    const request = await createOpenRequest(page);

    // --- Bước 1: Shop báo giá.
    await loginAs(page, SEED_ACCOUNTS.vendor);
    const quote = await submitQuote(page, request.id);

    // --- Bước 2: người mua chấp nhận báo giá → sinh giao dịch cọc.
    await loginAs(page, SEED_ACCOUNTS.buyer);
    const acceptance = await apiPost<{
      acceptanceId: string;
      status: string;
      depositAmount: number;
      paymentId: string;
      paymentUrl: string;
    }>(page, gatewayUrl(`/api/quote-requests/${request.id}/quotes/${quote.id}/acceptance`), {});

    expect(acceptance.acceptanceId).toBeTruthy();
    expect(acceptance.status).toBe('PENDING_PAYMENT');
    expect(acceptance.depositAmount).toBeGreaterThan(0);
    expect(acceptance.paymentUrl).toContain('vnp_TxnRef');

    // --- Bước 3: trả tiền cọc.
    const payment = paymentFromCheckout({
      paymentId: acceptance.paymentId,
      paymentUrl: acceptance.paymentUrl,
      totalAmount: acceptance.depositAmount,
    });
    await payAndWait(page, payment);

    // --- Bước 4: đơn đặt riêng phải được tạo.
    // Định danh bằng `quoteId` của báo giá đã chấp nhận: danh sách đơn dùng
    // chung cho mọi lần chạy test, "đơn đặt riêng mới nhất" có thể là đơn của
    // lần chạy trước và sẽ khiến test đỏ ở chỗ khó hiểu.
    await waitFor(
      async () => {
        const order = await customOrderOfQuote(page, quote.id);
        return order?.status === 'DEPOSITED' ? order : null;
      },
      { timeout: 30_000 },
    );

    const customOrder = await customOrderOfQuote(page, quote.id);
    expect(customOrder, 'Trả cọc xong thì phải có đơn đặt riêng.').not.toBeNull();
    expect(customOrder!.kind).toBe('CUSTOM_ORDER');
    // Cọc đã vào sổ ⇒ đơn ở trạng thái `DEPOSITED`.
    expect(customOrder!.status).toBe('DEPOSITED');

    // --- Bước 5: yêu cầu báo giá chuyển sang `AWARDED` (đã có báo giá được chọn).
    await waitFor(
      async () => {
        const current = await latestRequest(page);
        return current?.id === request.id && current.status === 'AWARDED';
      },
      { timeout: 20_000 },
    );

    // --- Bước 6: sổ tiền của đơn phải ghi nhận khoản cọc.
    // Sổ tiền (`/api/ledgers/{orderId}`) chỉ dành cho **chủ Shop** và admin —
    // người mua không được xem (FR-43). Vì vậy test đọc bằng quyền chủ Shop.
    //
    // Sổ tiền do payment-service tạo khi nhận sự kiện `payment.succeeded`, nên
    // nó xuất hiện **sau** đơn: phải chờ, không được giả định là có ngay.
    await loginAs(page, SEED_ACCOUNTS.vendor);
    await waitFor(
      async () => {
        const ledger = await apiGet<unknown>(
          page,
          gatewayUrl(`/api/ledgers/${customOrder!.id}`),
        );
        const data = unwrapData<{ totalCollected?: number; held?: number }>(ledger);
        return (data?.totalCollected ?? 0) > 0 ? data : null;
      },
      { timeout: 30_000 },
    );

    const ledger = await apiGet<unknown>(
      page,
      gatewayUrl(`/api/ledgers/${customOrder!.id}`),
    );
    const ledgerData = unwrapData<{ totalCollected?: number; held?: number }>(ledger);
    expect(ledgerData?.totalCollected ?? 0).toBeGreaterThan(0);
  });
});
