import { expect, test, type Page } from '@playwright/test';
import {
  apiGet,
  apiPatch,
  apiPost,
  gatewayUrl,
  loginAs,
  unwrapData,
  waitFor,
  SEED_ACCOUNTS,
  SEED_VENDORS,
} from './helpers';
import { minimalPng, uploadFile } from './storage';

/**
 * FLOW 5 — Khiếu nại & phân xử tranh chấp (FR-12, FR-49, AC-49.x).
 *
 * Đây là luồng có **hậu quả tài chính thật**: tiền của người mua bị khoá
 * trong Escrow khi khiếu nại mở, và quyết định của Admin quyết định ai nhận
 * được tiền.
 *
 * Vì vậy test ở đây đi hết chuỗi, không dừng ở màn hình:
 *
 * 1. Đơn phải **đã giao** thì người mua mới mở được khiếu nại (FR-12).
 * 2. Người mua mở khiếu nại kèm bằng chứng (ảnh thật trên MinIO).
 * 3. Shop gửi bằng chứng đối chiếu.
 * 4. Admin phân xử, và sổ tiền phản ánh quyết định đó.
 *
 * Mã đơn hàng lấy từ **API thật** (không hardcode): mỗi lần chạy, backend
 * sinh ra mã khác nhau.
 */

/** Một đơn hàng. */
interface Order {
  id: string;
  status: string;
  kind: string;
  vendorId: string;
  totalAmount: number;
  deliveredAt?: string | null;
  disputeDeadline?: string | null;
}

/**
 * Một hồ sơ khiếu nại.
 *
 * Backend gọi mã của hồ sơ là `disputeId` (không phải `id`); giữ đúng tên đó
 * để không lệch với `DisputeResponse` của order-service.
 */
interface Dispute {
  disputeId: string;
  orderId: string;
  reason?: string;
  description?: string;
  status: 'OPEN' | 'RESOLVED';
  decision?: string | null;
  refundAmount?: number | null;
  decisionReason?: string | null;
  evidences?: Array<{ party?: string; note?: string; downloadUrl?: string }>;
}

/** Sổ tiền của một đơn. */
interface Ledger {
  orderId: string;
  totalCollected: number;
  held: number;
  refunded: number;
  paidOut: number;
  toReceive: number;
  disputeOpen: boolean;
  payable: boolean;
}

/**
 * Một hồ sơ hoàn tiền của đơn.
 *
 * VNPay sandbox không chấp nhận hoàn tiền (trả mã 99) nên hồ sơ thường dừng ở
 * `MANUAL_REQUIRED` cho admin xử lý tay — đúng như AC-49.3 mô tả.
 */
interface Refund {
  refundId: string;
  orderId: string;
  disputeId?: string | null;
  reason: string;
  amount: number;
  status: 'PENDING' | 'SUCCEEDED' | 'MANUAL_REQUIRED';
  error?: string | null;
}

/** Hồ sơ khiếu nại của một đơn (404 khi chưa có). */
async function disputeOf(page: Page, orderId: string): Promise<Dispute | null> {
  const payload = await apiGet<unknown>(page, gatewayUrl(`/api/orders/${orderId}/dispute`));
  return unwrapData<Dispute | null>(payload) ?? null;
}

/** Sổ tiền của một đơn — chỉ chủ Shop và admin đọc được (FR-43). */
async function ledgerOf(page: Page, orderId: string): Promise<Ledger> {
  const payload = await apiGet<unknown>(page, gatewayUrl(`/api/ledgers/${orderId}`));
  return unwrapData<Ledger>(payload);
}

/** Các hồ sơ hoàn tiền của một đơn — chỉ chủ Shop và admin đọc được (FR-43). */
async function refundsOf(page: Page, orderId: string): Promise<Refund[]> {
  const payload = await apiGet<unknown>(page, gatewayUrl(`/api/ledgers/${orderId}/refunds`));
  return unwrapData<Refund[]>(payload) ?? [];
}

/**
 * Tạo một đơn mới bằng cách đi hết đường thanh toán thật.
 *
 * Đi hết đường thanh toán thật: checkout → IPN VNPay → đơn `PAID` → Shop xác
 * nhận → gửi hàng → báo đã giao. Chỉ khi đơn ở `DELIVERED` thì người mua mới
 * được mở khiếu nại, nên test phải đi tới đó.
 *
 * @param stopAt trạng thái dừng: `DELIVERED` (mở khiếu nại được) hay `PAID`
 *   (chưa giao — không mở khiếu nại được)
 */
async function orderOfNewPurchase(page: Page, stopAt: 'DELIVERED' | 'PAID'): Promise<Order> {
  const vendorId = SEED_VENDORS.trangVang.id;

  // Sản phẩm đang bán và còn hàng, đọc từ catalog thật.
  const productsPayload = await apiGet<unknown>(
    page,
    gatewayUrl(`/api/products?provinceCode=79&vendorId=${vendorId}&size=50`),
  );
  const products = unwrapData<{ content?: Array<{ id: string; stock: number }> }>(productsPayload);
  const product = (products?.content ?? []).find((item) => item.stock > 0);
  if (!product) {
    throw new Error(`Không có sản phẩm nào còn hàng của Shop ${vendorId}.`);
  }

  // Dọn giỏ rồi thêm đúng một món, để tổng tiền của đơn là xác định.
  const cartPayload = await apiGet<unknown>(page, gatewayUrl('/api/carts/me?provinceCode=79'));
  const cart = unwrapData<{ groups?: Array<{ items?: Array<{ itemId?: string }> }> }>(cartPayload);
  for (const group of cart?.groups ?? []) {
    for (const item of group.items ?? []) {
      if (item.itemId) {
        await apiRequestDelete(page, `/api/carts/me/items/${item.itemId}`);
      }
    }
  }
  await apiPost(page, gatewayUrl('/api/carts/me/items'), { productId: product.id, quantity: 1 });

  const checkout = await apiPost<{
    checkoutId: string;
    paymentId: string;
    paymentUrl: string;
    totalAmount: number;
  }>(page, gatewayUrl('/api/checkouts'), {
    recipientName: 'Nguyễn Thị Lan',
    recipientPhone: '0901000011',
    provinceCode: '79',
    addressDetail: '25 Điện Biên Phủ, Phường Ba Đình',
  });

  const { paymentFromCheckout, payAndWait } = await import('./payment');
  const payment = paymentFromCheckout(checkout);
  await payAndWait(page, payment);

  // Đợi đơn xuất hiện (được tạo sau khi có `payment.succeeded`).
  //
  // Chuỗi này đi qua message bus: payment-service ghi sự kiện vào outbox → relay
  // phát ra RabbitMQ → order-service nhận và tạo đơn. Trên máy CI (2 vCPU, cả
  // stack đang chạy) mỗi nhịp đó có thể mất vài giây, nên ngân sách chờ phải
  // rộng — 25s là quá chặt và làm test đỏ một cách ngẫu nhiên.
  await waitFor(
    async () => {
      const order = await orderOfCheckout(page, checkout.checkoutId);
      return order?.status === 'PAID';
    },
    { timeout: 45_000 },
  );

  const order = await orderOfCheckout(page, checkout.checkoutId);
  if (!order) {
    throw new Error('Thanh toán xong mà không có đơn hàng.');
  }

  if (stopAt === 'PAID') {
    return order;
  }

  // Shop đưa đơn tới `DELIVERED` — điều kiện để mở khiếu nại.
  await loginAs(page, SEED_ACCOUNTS.vendor);
  await apiPatch(page, gatewayUrl(`/api/orders/${order.id}`), { status: 'CONFIRMED' });
  await apiPatch(page, gatewayUrl(`/api/orders/${order.id}`), {
    status: 'SHIPPING',
    trackingCode: 'MK7000099887',
  });
  await apiPatch(page, gatewayUrl(`/api/orders/${order.id}`), { status: 'DELIVERED' });

  await loginAs(page, SEED_ACCOUNTS.buyer);
  const delivered = await orderById(page, order.id);
  if (delivered?.status !== 'DELIVERED') {
    throw new Error(`Đơn không sang DELIVERED (đang ở ${delivered?.status}).`);
  }
  return delivered;
}

/** Tạo một đơn đã giao để mở khiếu nại. */
async function deliveredOrderOfNewPurchase(page: Page): Promise<Order> {
  return orderOfNewPurchase(page, 'DELIVERED');
}

/** Xoá một dòng trong giỏ (dùng `DELETE`, không có wrapper riêng). */
async function apiRequestDelete(page: Page, path: string): Promise<void> {
  await page.evaluate(async (target) => {
    const raw = sessionStorage.getItem('moonkage_session_tokens');
    const token = raw ? (JSON.parse(raw) as { accessToken?: string }).accessToken : undefined;
    const response = await fetch(target, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      throw new Error(`DELETE ${target} -> ${response.status}`);
    }
  }, gatewayUrl(path));
}

/** Đơn sinh ra từ một checkout cụ thể. */
async function orderOfCheckout(page: Page, checkoutId: string): Promise<Order | null> {
  const payload = await apiGet<unknown>(
    page,
    gatewayUrl(`/api/orders?paymentGroupId=${checkoutId}&size=10`),
  );
  const data = unwrapData<{ content?: Order[] }>(payload);
  return data?.content?.[0] ?? null;
}

/** Đơn theo id. */
async function orderById(page: Page, orderId: string): Promise<Order | null> {
  const payload = await apiGet<unknown>(page, gatewayUrl(`/api/orders/${orderId}`));
  return unwrapData<Order | null>(payload) ?? null;
}

test.describe('FLOW 5 — Khiếu nại & phân xử tranh chấp', () => {
  test('người mua mở được khiếu nại trên đơn đã giao, kèm bằng chứng', async ({ page }) => {
    await loginAs(page, SEED_ACCOUNTS.buyer);
    const order = await deliveredOrderOfNewPurchase(page);

    // Bằng chứng là ảnh thật tải lên kho đơn hàng.
    const evidenceKey = await uploadFile(
      page,
      gatewayUrl('/api/orders/uploads'),
      minimalPng(2, 2),
      'bang-chung-e2e.png',
      'image/png',
    );

    const dispute = await apiPost<Dispute>(
      page,
      gatewayUrl(`/api/orders/${order.id}/dispute`),
      {
        reason: 'DAMAGED',
        description: 'Bánh bị méo khi nhận, E2E tự động.',
        evidences: [{ tempKey: evidenceKey, note: 'Ảnh chụp bánh bị méo' }],
      },
    );

    expect(dispute.disputeId).toBeTruthy();
    expect(dispute.status).toBe('OPEN');
    expect(dispute.reason).toBe('DAMAGED');
    expect(dispute.evidences?.length ?? 0).toBeGreaterThan(0);
    expect(dispute.evidences?.[0]?.party).toBe('BUYER');

    // Hồ sơ khiếu nại đọc lại được (người mua là bên có quyền xem).
    const reread = await disputeOf(page, order.id);
    expect(reread?.disputeId).toBe(dispute.disputeId);
  });

  test('mở khiếu nại thì tiền của đơn bị khoá trong Escrow', async ({ page }) => {
    await loginAs(page, SEED_ACCOUNTS.buyer);
    const order = await deliveredOrderOfNewPurchase(page);

    await apiPost(page, gatewayUrl(`/api/orders/${order.id}/dispute`), {
      reason: 'WRONG_ITEM',
      description: 'Nhận sai vị, E2E tự động.',
      evidences: [],
    });

    // Sổ tiền chỉ chủ Shop và admin đọc được.
    await loginAs(page, SEED_ACCOUNTS.vendor);

    // Sự kiện `dispute.opened` đi qua outbox + RabbitMQ tới payment-service,
    // nên sổ tiền cập nhật sau một nhịp — phải chờ chứ không đọc thẳng.
    await waitFor(
      async () => {
        const ledger = await ledgerOf(page, order.id);
        return ledger.disputeOpen === true;
      },
      { timeout: 30_000 },
    );

    const ledger = await ledgerOf(page, order.id);
    expect(ledger.totalCollected).toBeGreaterThan(0);
    // Đang có khiếu nại mở ⇒ tiền **không** được trả ra.
    expect(ledger.disputeOpen).toBe(true);
    expect(ledger.payable).toBe(false);
    expect(ledger.held).toBeGreaterThan(0);
  });

  test('mở hai khiếu nại cho một đơn thì lần hai bị chặn', async ({ page }) => {
    await loginAs(page, SEED_ACCOUNTS.buyer);
    const order = await deliveredOrderOfNewPurchase(page);

    await apiPost(page, gatewayUrl(`/api/orders/${order.id}/dispute`), {
      reason: 'LATE_DELIVERY',
      description: 'Giao trễ, E2E tự động.',
      evidences: [],
    });

    let failed = false;
    let body = '';
    try {
      await apiPost(page, gatewayUrl(`/api/orders/${order.id}/dispute`), {
        reason: 'DAMAGED',
        description: 'Khiếu nại thứ hai, E2E tự động.',
        evidences: [],
      });
    } catch (error) {
      failed = true;
      body = error instanceof Error ? error.message : String(error);
    }

    expect(failed, 'Một đơn chỉ có một khiếu nại mở tại một thời điểm.').toBe(true);
    expect(body).toContain('409');
    expect(body).toContain('DISPUTE_003');
  });

  test('Shop gửi được bằng chứng đối chiếu vào hồ sơ khiếu nại', async ({ page }) => {
    await loginAs(page, SEED_ACCOUNTS.buyer);
    const order = await deliveredOrderOfNewPurchase(page);

    await apiPost(page, gatewayUrl(`/api/orders/${order.id}/dispute`), {
      reason: 'OTHER',
      description: 'Cần Shop giải trình, E2E tự động.',
      evidences: [],
    });

    // Shop tải bằng chứng của mình lên và gửi vào hồ sơ.
    await loginAs(page, SEED_ACCOUNTS.vendor);
    const counterKey = await uploadFile(
      page,
      gatewayUrl('/api/orders/uploads'),
      minimalPng(3, 3),
      'giai-trinh-shop-e2e.png',
      'image/png',
    );

    const dispute = await apiPost<Dispute>(
      page,
      gatewayUrl(`/api/orders/${order.id}/dispute/evidences`),
      { tempKey: counterKey, note: 'Ảnh kho hàng trước khi giao' },
    );

    expect(dispute.status).toBe('OPEN');
    const parties = (dispute.evidences ?? []).map((evidence) => evidence.party);
    expect(parties).toContain('VENDOR');
  });

  test('admin phân xử thì hồ sơ khiếu nại đóng lại', async ({ page }) => {
    await loginAs(page, SEED_ACCOUNTS.buyer);
    const order = await deliveredOrderOfNewPurchase(page);

    await apiPost(page, gatewayUrl(`/api/orders/${order.id}/dispute`), {
      reason: 'DAMAGED',
      description: 'Bánh hỏng, E2E tự động.',
      evidences: [],
    });

    // --- Admin bác đơn: tiền về lại cho Shop.
    await loginAs(page, SEED_ACCOUNTS.admin);
    const resolved = await apiPatch<Dispute>(
      page,
      gatewayUrl(`/api/orders/${order.id}/dispute`),
      {
        decision: 'REJECTED',
        decisionReason: 'Ảnh bằng chứng không đủ căn cứ, E2E tự động.',
      },
    );

    expect(resolved.status).toBe('RESOLVED');
    expect(resolved.decision).toBe('REJECTED');
    expect(resolved.decisionReason).toContain('E2E');

    // Sổ tiền phản ánh quyết định: không còn khiếu nại mở.
    //
    // Phải **chờ**: `dispute.resolved` đi qua outbox + RabbitMQ tới payment-service,
    // và chỉ khi sự kiện đó tới nơi thì sổ tiền mới bỏ trạng thái khiếu nại mở.
    // Đọc thẳng ngay sau lệnh phân xử là đọc trước khi sự kiện tới — một cuộc đua
    // thật, và đôi khi thua (nhất là trên máy CI chậm).
    await waitFor(
      async () => {
        const current = await ledgerOf(page, order.id);
        return current.disputeOpen === false;
      },
      { timeout: 30_000 },
    );

    const ledger = await ledgerOf(page, order.id);
    expect(ledger.disputeOpen).toBe(false);
  });

  test('admin hoàn tiền một phần thì sổ tiền ghi nhận khoản hoàn', async ({ page }) => {
    // Luồng này đi qua checkout → VNPay → IPN → tạo đơn → khiếu nại → phân xử →
    // sự kiện RabbitMQ → sổ tiền: vượt mặc định 30s.
    test.setTimeout(180_000);
    await loginAs(page, SEED_ACCOUNTS.buyer);
    const order = await deliveredOrderOfNewPurchase(page);

    await apiPost(page, gatewayUrl(`/api/orders/${order.id}/dispute`), {
      reason: 'DAMAGED',
      description: 'Bánh hỏng một nửa, E2E tự động.',
      evidences: [],
    });

    await loginAs(page, SEED_ACCOUNTS.admin);
    const resolved = await apiPatch<Dispute>(
      page,
      gatewayUrl(`/api/orders/${order.id}/dispute`),
      {
        decision: 'PARTIAL_REFUND',
        refundAmount: 50_000,
        decisionReason: 'Hoàn nửa giá trị hàng hư, E2E tự động.',
      },
    );

    expect(resolved.status).toBe('RESOLVED');
    expect(resolved.decision).toBe('PARTIAL_REFUND');
    expect(resolved.refundAmount).toBe(50_000);

    // Sự kiện `dispute.resolved` đi qua RabbitMQ tới payment-service, nên hồ sơ
    // hoàn tiền xuất hiện sau một nhịp — phải chờ.
    await waitFor(
      async () => {
        const refunds = await refundsOf(page, order.id);
        return refunds.some((refund) => refund.amount === 50_000);
      },
      { timeout: 40_000 },
    );

    const refund = (await refundsOf(page, order.id)).find((item) => item.amount === 50_000);
    expect(refund).toBeTruthy();
    expect(refund?.reason).toBe('DISPUTE');

    // VNPay sandbox từ chối hoàn tiền (mã 99) ⇒ hồ sơ chờ admin xử lý tay
    // (AC-49.3). Admin đánh dấu đã hoàn bằng tay ⇒ sổ tiền mới dịch.
    //
    // Ngân sách chờ ở đây phải tính cả nhịp quét của payment-service
    // (`payment.refund-interval`, 30s): hồ sơ `PENDING` **không** được gửi ngay
    // lúc tạo, mà đợi lần quét kế tiếp rồi mới gọi VNPay (có thời hạn 10s).
    // Nên trạng thái chỉ rời `PENDING` sau khoảng 30s + thời gian gọi — và trên
    // máy CI bị tải nặng còn lâu hơn. 60s là quá chặt, và đó là lý do CI đỏ.
    await waitFor(
      async () => {
        const current = await refundsOf(page, order.id);
        const found = current.find((item) => item.refundId === refund?.refundId);
        return found?.status === 'MANUAL_REQUIRED' || found?.status === 'SUCCEEDED';
      },
      { timeout: 90_000 },
    );

    const pending = await refundsOf(page, order.id);
    const found = pending.find((item) => item.refundId === refund?.refundId);
    if (found?.status === 'MANUAL_REQUIRED') {
      const confirmed = await apiPatch<Refund>(
        page,
        gatewayUrl(`/api/refunds/${refund?.refundId}`),
        {},
      );
      expect(confirmed.status).toBe('SUCCEEDED');
    }

    await waitFor(
      async () => {
        const ledger = await ledgerOf(page, order.id);
        return ledger.refunded >= 50_000;
      },
      { timeout: 40_000 },
    );

    const ledger = await ledgerOf(page, order.id);
    expect(ledger.refunded).toBeGreaterThanOrEqual(50_000);
    // Tiền hoàn lấy từ phần Escrow đang giữ ⇒ phần giữ phải bớt đúng tương ứng.
    expect(ledger.held).toBe(ledger.totalCollected - ledger.refunded);
  });

  test('người mua không mở được khiếu nại trên đơn chưa giao', async ({ page }) => {
    await loginAs(page, SEED_ACCOUNTS.buyer);

    // Tạo một đơn **mới** và dừng ở `PAID` — chưa giao nên chưa mở khiếu nại được.
    // Không dùng lại đơn cũ của F1 vì trạng thái đơn cũ có thể đã đổi.
    const order = await orderOfNewPurchase(page, 'PAID');
    expect(order.status).toBe('PAID');

    let failed = false;
    let body = '';
    try {
      await apiPost(page, gatewayUrl(`/api/orders/${order.id}/dispute`), {
        reason: 'OTHER',
        description: 'Khiếu nại khi chưa giao, E2E tự động.',
        evidences: [],
      });
    } catch (error) {
      failed = true;
      body = error instanceof Error ? error.message : String(error);
    }

    // Đơn `COMPLETED` cũng không khiếu nại được (hạn 3 ngày đã qua).
    expect(failed, 'Chưa giao thì không được khiếu nại.').toBe(true);
    expect(body).toMatch(/DISPUTE_002|409/);
  });

  test('quản trị thấy danh sách hồ sơ khiếu nại đang chờ phân xử', async ({ page }) => {
    await loginAs(page, SEED_ACCOUNTS.admin);

    await page.goto('/quan-tri/khieu-nai');
    await expect(page.locator('#root')).toBeVisible();

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Phân xử khiếu nại/i);
    await expect(page.getByRole('tab', { name: /Cần phân xử/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Đã có phán quyết/i })).toBeVisible();
  });

  test('người mua thấy hồ sơ khiếu nại của mình trên trang đơn hàng', async ({ page }) => {
    await loginAs(page, SEED_ACCOUNTS.buyer);
    const order = await deliveredOrderOfNewPurchase(page);

    await apiPost(page, gatewayUrl(`/api/orders/${order.id}/dispute`), {
      reason: 'OTHER',
      description: 'Khiếu nại để kiểm tra giao diện, E2E tự động.',
      evidences: [],
    });

    await page.goto(`/tai-khoan/don-hang/${order.id}/khieu-nai`);
    await expect(page.locator('#root')).toBeVisible();

    await expect(page.getByText(/Mã khiếu nại #/)).toBeVisible();
    await expect(page.getByText('Đang chờ quản trị viên phân xử')).toBeVisible();
    await expect(page.getByText(/Lý do:/)).toBeVisible();
    // Người mua không đọc được sổ tiền, nên trang chỉ nêu giá trị đơn (AC-49.3).
    await expect(page.getByText(/Giá trị đơn:/)).toBeVisible();
    await expect(page.getByText('Shop chưa gửi bằng chứng.')).toBeVisible();
  });
});
