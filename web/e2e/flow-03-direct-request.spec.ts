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

/**
 * FLOW 3 — Yêu cầu báo giá **riêng** (FR-15, FR-36, BR-22, AC-15.x).
 *
 * Khác với FLOW 2 (yêu cầu mở), ở đây người mua chọn **một** Shop và chỉ
 * Shop đó được báo giá. Đó là ranh giới nghiệp vụ quan trọng nhất của luồng
 * báo giá, và ranh giới đó nằm ở **server** (`quotation-service`), không phải
 * ở giao diện.
 *
 * Vì vậy test ở đây kiểm tra ba điều, tất cả bằng API thật:
 *
 * 1. Yêu cầu riêng mời **đúng một** Shop (`invitedCount = 1`).
 * 2. Shop **không** được mời báo giá sẽ bị chặn với `INVITATION_NOT_FOUND`
 *    (QUOTE_022) — đúng ý nghĩa của "riêng".
 * 3. Shop được mời báo giá được, và người mua thấy báo giá đó.
 *
 * Vai trò: người mua (`member1`), Shop được mời (`member4` — Trăng Vàng) và
 * Shop không được mời (`member6` — Chợ Lớn).
 */

/** Địa chỉ nhận hàng cho yêu cầu báo giá. */
const DELIVERY = {
  recipientName: 'Nguyễn Thị Lan',
  recipientPhone: '0901000011',
  provinceCode: '79',
  addressDetail: '25 Điện Biên Phủ, Phường Ba Đình',
};

/** Số lượng đặt — phải vượt `min_qty` của Shop (Trăng Vàng: 50). */
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
}

/** Yêu cầu báo giá gần nhất của người mua. */
async function latestRequest(page: Page): Promise<QuoteRequest | null> {
  const payload = await apiGet<unknown>(page, gatewayUrl('/api/quote-requests'));
  const data = unwrapData<QuoteRequest[]>(payload);
  return data?.[0] ?? null;
}

/** Báo giá của một yêu cầu (người mua thấy tất cả; Shop chỉ thấy của mình). */
async function quotesOf(page: Page, requestId: string): Promise<Quote[]> {
  const payload = await apiGet<unknown>(
    page,
    gatewayUrl(`/api/quote-requests/${requestId}/quotes`),
  );
  return unwrapData<Quote[]>(payload) ?? [];
}

/** Lời mời của một yêu cầu — người mua thấy danh sách Shop được mời. */
async function invitationsOf(
  page: Page,
  requestId: string,
): Promise<Array<{ vendorId: string; status: string; vendorName?: string }>> {
  const payload = await apiGet<unknown>(
    page,
    gatewayUrl(`/api/quote-requests/${requestId}/invitations`),
  );
  return unwrapData<Array<{ vendorId: string; status: string; vendorName?: string }>>(payload) ?? [];
}

/** Tạo một yêu cầu báo giá **riêng** cho một Shop. */
async function createDirectRequest(
  page: Page,
  targetVendorId: string,
): Promise<QuoteRequest> {
  return apiPost(page, gatewayUrl('/api/quote-requests'), {
    type: 'DIRECT',
    targetVendorId,
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
 * Giá và cọc được chọn sao cho tổng tiền cọc là con số tròn.
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

test.describe('FLOW 3 — Yêu cầu báo giá riêng', () => {
  test('người mua tạo được yêu cầu riêng và chỉ mời đúng một Shop', async ({ page }) => {
    await loginAs(page);

    const request = await createDirectRequest(page, SEED_VENDORS.trangVang.id);

    expect(request.id).toBeTruthy();
    expect(request.type).toBe('DIRECT');
    expect(request.status).toBe('OPEN');
    expect(request.targetVendorId).toBe(SEED_VENDORS.trangVang.id);

    // Điểm mấu chốt của luồng "riêng": **một** Shop duy nhất được mời.
    expect(request.invitedCount).toBe(1);

    const invitations = await invitationsOf(page, request.id);
    expect(invitations).toHaveLength(1);
    expect(invitations[0].vendorId).toBe(SEED_VENDORS.trangVang.id);
  });

  test('yêu cầu riêng hiện trong danh sách của người mua', async ({ page }) => {
    await loginAs(page);
    await createDirectRequest(page, SEED_VENDORS.trangVang.id);

    await page.goto('/tai-khoan/yeu-cau');
    await expect(page.locator('#root')).toBeVisible();
    await expect(page.getByText(/500|Bánh trung thu/i).first()).toBeVisible();
  });

  test('Shop không được mời thì không báo giá được (INVITATION_NOT_FOUND)', async ({ page }) => {
    await loginAs(page);
    const request = await createDirectRequest(page, SEED_VENDORS.trangVang.id);

    // Shop khác (Chợ Lớn) thử báo giá: server phải chặn.
    await loginAs(page, SEED_ACCOUNTS.vendorThird);

    let failed = false;
    let body = '';
    try {
      await submitQuote(page, request.id);
    } catch (error) {
      failed = true;
      body = error instanceof Error ? error.message : String(error);
    }

    expect(failed, 'Shop không được mời phải bị chặn khi báo giá.').toBe(true);
    expect(body).toContain('404');
    expect(body).toContain('QUOTE_022');
  });

  test('Shop được mời thì báo giá được và người mua thấy báo giá', async ({ page }) => {
    await loginAs(page);
    const request = await createDirectRequest(page, SEED_VENDORS.trangVang.id);

    await loginAs(page, SEED_ACCOUNTS.vendor);
    const quote = await submitQuote(page, request.id);

    expect(quote.id).toBeTruthy();
    expect(quote.requestId).toBe(request.id);
    expect(quote.vendorId).toBe(SEED_VENDORS.trangVang.id);

    // Người mua thấy báo giá đó trong bảng so sánh.
    await loginAs(page, SEED_ACCOUNTS.buyer);
    const quotes = await quotesOf(page, request.id);
    expect(quotes.some((q) => q.id === quote.id)).toBe(true);
  });

  test('người mua không tạo được yêu cầu riêng cho chính Shop của mình', async ({ page }) => {
    // Mua lẻ bằng Shop của chính mình là tự mua hàng của mình (BR-22).
    await loginAs(page, SEED_ACCOUNTS.vendor);

    let failed = false;
    let body = '';
    try {
      await createDirectRequest(page, SEED_VENDORS.trangVang.id);
    } catch (error) {
      failed = true;
      body = error instanceof Error ? error.message : String(error);
    }

    expect(failed, 'Không được gửi yêu cầu cho Shop của chính mình.').toBe(true);
    expect(body).toContain('403');
    expect(body).toContain('QUOTE_002');
  });

  test('yêu cầu riêng bị chặn khi hạn giao đã qua', async ({ page }) => {
    await loginAs(page);

    let failed = false;
    let body = '';
    try {
      await apiPost(page, gatewayUrl('/api/quote-requests'), {
        type: 'DIRECT',
        targetVendorId: SEED_VENDORS.trangVang.id,
        quantity: QUANTITY,
        customTypes: ['BAG'],
        deliveryDeadline: '2020-01-01',
        delivery: DELIVERY,
      });
    } catch (error) {
      failed = true;
      body = error instanceof Error ? error.message : String(error);
    }

    expect(failed, 'Hạn giao trong quá khứ phải bị chặn.').toBe(true);
    expect(body).toContain('400');
    expect(body).toContain('QUOTE_009');
  });

  test('sau khi có báo giá thì yêu cầu vẫn mở cho tới khi được chấp nhận', async ({ page }) => {
    await loginAs(page);
    const request = await createDirectRequest(page, SEED_VENDORS.trangVang.id);

    await loginAs(page, SEED_ACCOUNTS.vendor);
    await submitQuote(page, request.id);

    await loginAs(page, SEED_ACCOUNTS.buyer);

    // Chỉ khi người mua **chấp nhận** một báo giá thì yêu cầu mới chuyển AWARDED.
    await waitFor(
      async () => {
        const current = await latestRequest(page);
        return current?.id === request.id && current.status === 'OPEN';
      },
      { timeout: 15_000 },
    );

    const current = await latestRequest(page);
    expect(current?.status).toBe('OPEN');
    expect(current?.quoteCount ?? 0).toBe(1);
  });
});
