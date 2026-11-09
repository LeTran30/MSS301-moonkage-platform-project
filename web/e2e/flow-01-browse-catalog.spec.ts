import { expect, test, type Page } from '@playwright/test';
import {
  apiDelete,
  apiGet,
  apiGetIfExists,
  apiPatch,
  apiPost,
  gatewayUrl,
  loginAs,
  unwrapData,
  waitFor,
  SEED_ACCOUNTS,
  SEED_VENDORS,
} from './helpers';
import { failVnpay, paymentFromCheckout, payAndWait, waitForPaymentFailed } from './payment';

/**
 * FLOW 1 — Mua lẻ: duyệt danh mục → giỏ hàng → thanh toán → giao → nhận → đánh giá.
 *
 * Đây là hành trình phổ biện nhất, và là hành trình mà mọi thay đổi về danh
 * mục / bộ lọc / thẻ sản phẩm / thanh toán đều có thể làm hỏng.
 *
 * Vì sao test phải đi hết vòng đời (không dừng ở "thêm vào giỏ"):
 *
 * - Đơn hàng **không tồn tại** cho tới khi thanh toán thành công (FR-09). Test
 *   dừng ở bước tạo checkout thì chưa chạm vào phần khó nhất: sự kiện
 *   `payment.succeeded` đi qua RabbitMQ để order-service tạo đơn.
 * - Vòng đời `PAID → CONFIRMED → SHIPPING → DELIVERED → COMPLETED` là nơi các
 *   quy tắc nghiệp vụ nằm: ai được đổi trạng thái, khi nào được đánh giá.
 *
 * Vai trò dùng trong test này: người mua (`member1`) và người bán (`member4`).
 */

/** Một sản phẩm đang bán, đọc từ catalog thật. */
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  vendorId: string;
}

/** Một đơn hàng của người mua. */
interface Order {
  id: string;
  status: string;
  kind: string;
  vendorId: string;
  totalAmount: number;
  items?: Array<{ productId: string; productName: string; quantity: number }>;
}

/** Tỉnh giao hàng dùng trong test: TP.HCM — nơi các Shop seed đang bán. */
const PROVINCE_CODE = '79';

/** Địa chỉ nhận hàng — hợp lệ với `CreateCheckoutRequest`. */
const DELIVERY = {
  recipientName: 'Nguyễn Thị Lan',
  recipientPhone: '0901000011',
  provinceCode: PROVINCE_CODE,
  addressDetail: '25 Điện Biên Phủ, Phường Ba Đình',
};

/**
 * Sản phẩm đang bán và còn hàng, **thuộc Shop** `vendorId`.
 *
 * Đọc từ catalog thật thay vì hardcode id: seed có thể đổi, sản phẩm hết hàng
 * thì luồng không test được, và người bán phải **sở hữu** Shop đó mới được
 * đổi trạng thái đơn (đây là điều kiện của `advance` trong order-service).
 */
async function availableProduct(page: Page, vendorId: string): Promise<Product> {
  const payload = await apiGet<unknown>(
    page,
    gatewayUrl(`/api/products?provinceCode=${PROVINCE_CODE}&vendorId=${vendorId}&size=50`),
  );
  const data = unwrapData<{ content?: Product[] }>(payload);
  const product = (data?.content ?? []).find((p) => p.stock > 0);
  if (!product) {
    throw new Error(`Không có sản phẩm nào còn hàng của Shop ${vendorId}.`);
  }
  return product;
}

/**
 * Tỉnh mà trang danh mục đang dùng để lọc.
 *
 * Trang danh mục đọc tỉnh giao hàng từ `localStorage` (mặc định `01` — Hà Nội),
 * và `GET /api/products` **bắt buộc** phải có `provinceCode`. Nếu hỏi sai tỉnh thì
 * danh sách trả về lệch với những gì trang đang hiện ⇒ tìm được sản phẩm "còn
 * hàng" trong API nhưng không có trên trang (hoặc ngược lại).
 */
async function catalogProvince(page: Page): Promise<string> {
  const stored = await page.evaluate(() => localStorage.getItem('moonkage_delivery_province'));
  return stored && /^\d{2}$/.test(stored) ? stored : '01';
}

/**
 * Tồn kho của mọi sản phẩm trong danh mục, đọc từ catalog thật.
 *
 * Vì sao cần: danh mục vẫn hiện sản phẩm đã **hết hàng**, và thẻ của sản
 * phẩm hết hàng không có nút "Thêm vào giỏ" (nút đổi thành "Tạm hết hàng").
 * Test nào cần bấm nút mua thì phải chọn đúng sản phẩm còn hàng, không được
 * mù quáng bấm thẻ đầu tiên — mỗi lần chạy test lại trừ tồn kho, nên thẻ
 * đầu tiên có thể hết hàng sau vài lần chạy.
 */
async function catalogStock(page: Page): Promise<Map<string, number>> {
  const provinceCode = await catalogProvince(page);
  const payload = await apiGet<unknown>(
    page,
    gatewayUrl(`/api/products?provinceCode=${provinceCode}&size=100`),
  );
  const data = unwrapData<{ content?: Array<{ id: string; stock?: number }> }>(payload);
  return new Map((data?.content ?? []).map((p) => [p.id, p.stock ?? 0]));
}

/**
 * Mở trang chi tiết của một sản phẩm **còn hàng**, bấm từ trang danh mục.
 *
 * Chọn theo tồn kho thật (đọc từ API) chứ không theo vị trí trên trang, để test
 * không phụ thuộc thứ tự sắp xếp của danh mục.
 */
async function openInStockProduct(page: Page): Promise<void> {
  const stock = await catalogStock(page);
  const provinceCode = await catalogProvince(page);

  // Danh mục tải **bất đồng bộ**: thẻ sản phẩm xuất hiện sau khi API trả lời.
  // Phải chờ thẻ đầu tiên hiện ra, nếu không `links.count()` sẽ bằng 0 và vòng
  // lặp dưới không có gì để xét.
  await expect(page.locator('article').first()).toBeVisible();

  const links = page.locator('article a[href*="/san-pham/"]');
  const total = await links.count();

  for (let index = 0; index < total; index += 1) {
    const href = await links.nth(index).getAttribute('href');
    const productId = href?.split('/san-pham/')[1]?.split(/[/?#]/)[0];
    if (!productId) continue;

    let inStock = (stock.get(productId) ?? 0) > 0;
    if (!inStock) {
      // Không có trong bản danh mục (lọc theo tỉnh khác, hoặc sản phẩm vừa lên
      // sàn): hỏi thẳng sản phẩm đó để không bỏ sót sản phẩm còn hàng.
      const detail = await apiGetIfExists<unknown>(
        page,
        gatewayUrl(`/api/products/${productId}?provinceCode=${provinceCode}`),
      );
      const data = unwrapData<{ stock?: number } | null>(detail);
      inStock = (data?.stock ?? 0) > 0;
    }
    if (!inStock) continue;

    await links.nth(index).click();
    await expect(page).toHaveURL(/\/san-pham\/.+/);
    return;
  }

  throw new Error('Danh mục không có sản phẩm nào còn hàng để thêm vào giỏ.');
}

/**
 * Đơn hàng sinh ra từ một checkout cụ thể.
 *
 * Vì sao không dùng "đơn mới nhất": danh sách đơn dùng chung cho mọi lần chạy
 * test, nên "đơn mới nhất" có thể là đơn của lần chạy trước — khi đó test sẽ
 * đổi trạng thái nhầm đơn và báo đỏ ở chỗ khó hiểu. `paymentGroupId` của đơn
 * chính là `checkoutId`, nên nó định danh chính xác đơn của lần thanh toán này.
 */
async function orderOfCheckout(page: Page, checkoutId: string): Promise<Order | null> {
  const payload = await apiGet<unknown>(
    page,
    gatewayUrl(`/api/orders?paymentGroupId=${checkoutId}&size=10`),
  );
  const data = unwrapData<{ content?: Order[] }>(payload);
  return data?.content?.[0] ?? null;
}

/** Đơn hàng theo id — luôn chính xác, không phụ thuộc thứ tự danh sách. */
async function orderById(page: Page, orderId: string): Promise<Order | null> {
  const payload = await apiGet<unknown>(page, gatewayUrl(`/api/orders/${orderId}`));
  const data = unwrapData<Order | null>(payload);
  return data ?? null;
}

/** Số đơn hàng của người mua. */
async function orderCount(page: Page): Promise<number> {
  const payload = await apiGet<unknown>(page, gatewayUrl('/api/orders?size=1'));
  return unwrapData<{ totalElements?: number }>(payload)?.totalElements ?? 0;
}

/**
 * Dọn giỏ hàng của người mua.
 *
 * Giỏ là dữ liệu dùng chung theo tài khoản: nếu test trước để lại dòng hàng,
 * tổng tiền của test sau sẽ sai và checkout sẽ tạo nhiều đơn hơn dự kiến.
 */
async function clearCart(page: Page): Promise<void> {
  const payload = await apiGet<unknown>(
    page,
    gatewayUrl(`/api/carts/me?provinceCode=${PROVINCE_CODE}`),
  );
  const data = unwrapData<{ groups?: Array<{ items?: Array<{ itemId?: string }> }> }>(payload);

  for (const group of data?.groups ?? []) {
    for (const item of group.items ?? []) {
      if (!item.itemId) continue;
      await apiDelete(page, gatewayUrl(`/api/carts/me/items/${item.itemId}`));
    }
  }
}

/** Thêm một sản phẩm vào giỏ (nhanh và ổn định hơn bấm chuột). */
async function addToCart(page: Page, productId: string, quantity: number): Promise<void> {
  await apiPost(page, gatewayUrl('/api/carts/me/items'), { productId, quantity });
}

/** Tạo checkout — tương đương bấm "Thanh toán qua VNPay" ở trang thanh toán. */
async function createCheckout(
  page: Page,
): Promise<{ checkoutId: string; paymentId: string; paymentUrl: string; totalAmount: number }> {
  return apiPost(page, gatewayUrl('/api/checkouts'), DELIVERY);
}

test.describe('FLOW 1 — Mua lẻ', () => {
  test('trang chủ hiện lời chào và lối vào danh mục', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible();

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /Mua lẻ|danh mục/i }).first()).toBeVisible();
  });

  test('điều hướng từ trang chủ sang danh mục', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible();

    await page.getByRole('link', { name: /Mua lẻ|danh mục/i }).first().click();

    await expect(page).toHaveURL(/\/san-pham/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Bánh Trung Thu/i);
  });

  test('danh mục hiện sản phẩm và lọc theo vị nhân', async ({ page }) => {
    await page.goto('/san-pham');
    await expect(page.locator('#root')).toBeVisible();

    // Danh mục đọc từ `catalog-service` — sản phẩm thật, không phải dữ liệu mô phỏng.
    await expect(page.locator('article').first()).toBeVisible();

    const before = await page.locator('article').count();

    // Bật một chip lọc vị nhân.
    const chip = page.getByRole('button', { name: /Thập Cẩm/i }).first();
    if (await chip.isVisible()) {
      await chip.click();
      await expect(page.locator('article').first()).toBeVisible();
      // Lọc không được làm trang trắng.
      expect(await page.locator('article').count()).toBeGreaterThan(0);
      expect(await page.locator('article').count()).toBeLessThanOrEqual(before);
    }
  });

  test('mở được trang chi tiết sản phẩm từ danh mục', async ({ page }) => {
    await page.goto('/san-pham');
    await expect(page.locator('#root')).toBeVisible();

    await page.locator('article a').first().click();

    await expect(page).toHaveURL(/\/san-pham\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('trang sản phẩm không có lỗi console', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/san-pham');
    await expect(page.locator('#root')).toBeVisible();
    await page.waitForTimeout(500);

    const real = errors.filter(
      (message) =>
        !(
          message.includes('Failed to load resource') &&
          (message.includes('fonts.googleapis.com') || message.includes('favicon'))
        ),
    );
    expect(real).toEqual([]);
  });

  test('chưa đăng nhập thì thêm vào giỏ phải đưa tới trang đăng nhập', async ({ page }) => {
    await page.goto('/san-pham');
    await expect(page.locator('#root')).toBeVisible();

    // Chọn sản phẩm **còn hàng**: sản phẩm hết hàng không có nút "Thêm vào giỏ".
    await openInStockProduct(page);

    const addButton = page.getByRole('button', { name: /Thêm vào giỏ/i });
    await expect(addButton).toBeVisible();
    await addButton.click();

    // Ứng dụng nhận ra chưa có phiên và đưa người dùng tới đăng nhập.
    await expect(page).toHaveURL(/\/dang-nhap/);
  });

  test('giỏ hàng của người đã đăng nhập hiện dòng hàng vừa thêm', async ({ page }) => {
    await loginAs(page);
    await clearCart(page);

    const product = await availableProduct(page, SEED_VENDORS.trangVang.id);
    await addToCart(page, product.id, 2);

    await page.goto('/gio-hang');
    await expect(page.locator('#root')).toBeVisible();

    await expect(page.getByText(product.name).first()).toBeVisible();
  });

  /**
   * Vòng đời đầy đủ của một đơn mua lẻ.
   *
   * Đây là test quan trọng nhất của FLOW 1: nó đi qua **cả** đường thanh
   * toán, từ lúc tạo checkout tới lúc người mua đánh giá sản phẩm.
   */
  test('mua lẻ hoàn chỉnh: thanh toán, giao hàng, nhận hàng, đánh giá', async ({ page }) => {
    await loginAs(page);
    await clearCart(page);

    const vendorId = SEED_VENDORS.trangVang.id;
    const product = await availableProduct(page, vendorId);
    await addToCart(page, product.id, 2);

    // --- Bước 1: tạo checkout.
    // Lý do gọi API thay vì bấm nút: nút bấm mở trang VNPay ra ngoài, không tự
    // động hoá được; phần cần kiểm là **vòng đời đơn sau khi trả tiền**, không
    // phải thao tác bấm.
    const checkout = await createCheckout(page);
    expect(checkout.checkoutId).toBeTruthy();
    expect(checkout.paymentUrl).toContain('vnp_TxnRef');

    // --- Bước 2: trả tiền (IPN đã ký) và chờ giao dịch thành công.
    const payment = paymentFromCheckout(checkout);
    await payAndWait(page, payment);

    // --- Bước 3: đơn hàng phải xuất hiện (được tạo sau khi có `payment.succeeded`).
    await waitFor(
      async () => {
        const order = await orderOfCheckout(page, checkout.checkoutId);
        return order?.status === 'PAID' ? order : null;
      },
      { timeout: 25_000 },
    );

    const order = await orderOfCheckout(page, checkout.checkoutId);
    expect(order, 'Thanh toán thành công thì phải có đơn hàng.').not.toBeNull();
    expect(order!.status).toBe('PAID');
    expect(order!.kind).toBe('BUY_NOW');
    expect(order!.vendorId).toBe(vendorId);

    // --- Bước 4: người bán xác nhận, gửi hàng và báo đã giao.
    await loginAs(page, SEED_ACCOUNTS.vendor);
    await apiPatch(page, gatewayUrl(`/api/orders/${order!.id}`), { status: 'CONFIRMED' });
    await apiPatch(page, gatewayUrl(`/api/orders/${order!.id}`), {
      status: 'SHIPPING',
      trackingCode: 'MK7000099887',
    });
    await apiPatch(page, gatewayUrl(`/api/orders/${order!.id}`), { status: 'DELIVERED' });

    // --- Bước 5: người mua đánh giá (được phép khi đã giao).
    await loginAs(page, SEED_ACCOUNTS.buyer);
    await apiPost(page, gatewayUrl(`/api/orders/${order!.id}/reviews`), {
      productId: product.id,
      rating: 5,
      content: 'Bánh đúng vị, đóng gói cẩn thận. E2E đánh giá tự động.',
    });

    const reviews = await apiGet<unknown>(
      page,
      gatewayUrl(`/api/orders/${order!.id}/reviews`),
    );
    const list = unwrapData<Array<{ rating?: number; content?: string }>>(reviews);
    expect(list?.length ?? 0).toBeGreaterThan(0);
    expect(list?.[0]?.rating).toBe(5);

    // --- Bước 6: người mua xác nhận đã nhận hàng → đơn hoàn tất.
    await apiPatch(page, gatewayUrl(`/api/orders/${order!.id}`), { receivedConfirmed: true });

    await waitFor(
      async () => {
        const current = await orderById(page, order!.id);
        return current?.status === 'COMPLETED';
      },
      { timeout: 20_000 },
    );

    // --- Bước 7: đánh giá phải hiện ra ở trang chi tiết sản phẩm.
    // Đánh giá đi tới danh mục qua sự kiện `review.created` (RabbitMQ) nên
    // trang sản phẩm phải **chờ** sự kiện tới nơi — không phải tức thì.
    await waitFor(
      async () => {
        const payload = await apiGet<unknown>(
          page,
          gatewayUrl(`/api/products/${product.id}/reviews?provinceCode=79&size=20`),
        );
        const list = unwrapData<{ content?: Array<{ content?: string }> }>(payload);
        return (list?.content ?? []).some((item) => item.content?.includes('E2E đánh giá tự động'));
      },
      { timeout: 40_000 },
    );

    await page.goto(`/san-pham/${product.id}`);
    await expect(page.locator('#root')).toBeVisible();
    await expect(page.getByText(/E2E đánh giá tự động/).first()).toBeVisible();
  });

  test('thanh toán thất bại thì không tạo đơn hàng', async ({ page }) => {
    await loginAs(page);
    await clearCart(page);

    const product = await availableProduct(page, SEED_VENDORS.trangVang.id);
    await addToCart(page, product.id, 1);

    const before = await orderCount(page);

    // Tạo checkout rồi báo cho VNPay rằng giao dịch thất bại.
    const checkout = await createCheckout(page);
    const payment = paymentFromCheckout(checkout);

    await failVnpay(page, payment);

    // Đợi giao dịch được xử lý rồi kiểm tra không có đơn mới.
    await waitForPaymentFailed(page, payment.paymentId, 20_000);

    expect(await orderCount(page)).toBe(before);
  });
});
