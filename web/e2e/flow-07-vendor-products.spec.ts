import { test, expect, type Page } from '@playwright/test';
import {
  gotoRoute,
  waitForAppReady,
  login,
  loginAs,
  trackConsoleErrors,
  isIgnorableConsoleError,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
  gatewayUrl,
  unwrapData,
  waitFor,
  SEED_ACCOUNTS,
  SEED_VENDORS,
} from './helpers';
import { minimalPng, uploadFile } from './storage';

/**
 * FLOW 7 — Quản lý sản phẩm của người bán (B4.0, B4.1, FR-29 đến FR-34, FR-54).
 *
 * Luồng này kiểm tra vòng đời sản phẩm của một Shop: thêm mới, sửa, bật/tắt
 * hiển thị. Điểm quan trọng nhất là **BR-24**: sản phẩm không được xoá vĩnh
 * viễn — chỉ ẩn (HIDDEN) hoặc bị gỡ (REMOVED) bởi quản trị.
 *
 * Người bán đăng nhập bằng tài khoản seed thật; không còn persona mô phỏng
 * ghi trong `localStorage`.
 *
 * Persona: `member4@mk.com` — tài khoản **đã được duyệt làm người bán và đã
 * đóng phí mở bán**, nên có gian hàng để quản lý. Tài khoản mua lẻ
 * (`member1`) không có gian hàng nên không mở được kênh người bán.
 *
 * Vì sao phần vòng đời gọi **API** chứ không bấm chuột: bấm chuột cần tải ảnh
 * thật lên MinIO qua trình duyệt, mà CSP của ứng dụng chặn origin của kho
 * lưu trữ. Test tải ảnh ở tầng Node (xem `storage.ts`) rồi gọi đúng endpoint
 * mà trình duyệt gọi — cùng một đường đi qua backend, cùng một kiểm tra.
 */

/** Một sản phẩm của Shop, đúng như `ProductResponse` của vendor-service. */
interface Product {
  id: string;
  vendorId: string;
  name: string;
  description?: string;
  brand?: string;
  origin?: string | null;
  resold?: boolean;
  listPrice?: number;
  stock?: number;
  expiryDate?: string | null;
  deliveryLabel?: 'LOCAL' | 'NATIONWIDE';
  quoteThreshold?: number | null;
  images?: Array<{ key: string; url: string }>;
  crustCodes?: string[];
  fillingCodes?: string[];
  status?: 'ON_SALE' | 'HIDDEN' | 'REMOVED';
  removedReason?: string | null;
  version?: number;
}

/** Một giá trị của danh mục Vỏ / Nhân (FR-54). */
interface CakeAttribute {
  id: string;
  group: 'CRUST' | 'FILLING' | 'OTHER';
  code: string;
  label: string;
  active: boolean;
}

/** Sản phẩm của Shop đang đăng nhập, đọc từ API thật. */
async function vendorProducts(page: Page, vendorId: string): Promise<Product[]> {
  const payload = await apiGet<unknown>(page, gatewayUrl(`/api/vendors/${vendorId}/products`));
  return unwrapData<Product[]>(payload) ?? [];
}

/** Danh mục Vỏ / Nhân đang hiển thị. */
async function taxonomy(page: Page): Promise<CakeAttribute[]> {
  const payload = await apiGet<unknown>(page, gatewayUrl('/api/cake-attributes'));
  return unwrapData<CakeAttribute[]>(payload) ?? [];
}

/** Một sản phẩm cụ thể. */
async function vendorProduct(
  page: Page,
  vendorId: string,
  productId: string,
): Promise<Product | null> {
  const payload = await apiGet<unknown>(
    page,
    gatewayUrl(`/api/vendors/${vendorId}/products/${productId}`),
  );
  return unwrapData<Product | null>(payload);
}

/** Tải ảnh lên kho lưu trữ và trả về `tempKey` để gắn vào sản phẩm. */
async function uploadProductImage(page: Page, vendorId: string): Promise<string> {
  return uploadFile(
    page,
    gatewayUrl(`/api/vendors/${vendorId}/products/uploads`),
    minimalPng(8, 8),
    'anh-san-pham-e2e.png',
    'image/png',
  );
}

/**
 * Thân của một sản phẩm hợp lệ (FR-29).
 *
 * `resold: false` vì Shop Trăng Vàng có `supply_source = BOTH` (AC-29.2): khi
 * Shop bán được cả hai nguồn thì chủ Shop phải nói rõ sản phẩm này có phải
 * hàng bán lại hay không. Shop `SELF_PRODUCED` thì **không** được gửi trường
 * này (sẽ bị 400 VENDOR_113).
 */
function productBody(imageKey: string, crustCode: string, fillingCode: string) {
  return {
    resold: false,
    name: 'Bánh nướng E2E tự động',
    description: 'Sản phẩm do test E2E tạo để kiểm tra vòng đời sản phẩm (FR-29).',
    listPrice: 150000,
    stock: 20,
    expiryDate: '2026-12-31',
    deliveryLabel: 'NATIONWIDE' as const,
    quoteThreshold: 30,
    imageKeys: [imageKey],
    crustCodes: [crustCode],
    fillingCodes: [fillingCode],
  };
}

/**
 * Tạo một sản phẩm mới và trả về nó **cùng** khoá ảnh cuối cùng.
 *
 * Vì sao cần khoá ảnh cuối cùng: khi tạo sản phẩm, backend chuyển ảnh vừa
 * tải lên (`tempKey`) sang khoá thật trong kho công khai. Khi **sửa** sản
 * phẩm, `imageKeys` phải là khoá thật đó — gửi lại `tempKey` thì backend báo
 * `STORAGE_002` ("File chưa được tải lên hoặc đã hết hạn").
 */
async function createProduct(
  page: Page,
  vendorId: string,
  name: string,
  crustCode: string,
  fillingCode: string,
): Promise<{ product: Product; imageKey: string }> {
  const imageKey = await uploadProductImage(page, vendorId);
  const product = await apiPost<Product>(page, gatewayUrl(`/api/vendors/${vendorId}/products`), {
    ...productBody(imageKey, crustCode, fillingCode),
    name,
  });
  return { product, imageKey: product.images?.[0]?.key ?? imageKey };
}

test.describe('FLOW 7 — Quản lý sản phẩm người bán', () => {
  /** Đăng nhập bằng tài khoản đã có gian hàng. */
  async function loginAsVendor(page: Page) {
    await login(page, SEED_ACCOUNTS.vendor.username, SEED_ACCOUNTS.vendor.password);
  }

  test('trang quản lý sản phẩm hiện tiêu đề và quy tắc không xoá vĩnh viễn', async ({ page }) => {
    await loginAsVendor(page);
    await gotoRoute(page, '/kenh-ban/san-pham');
    await waitForAppReady(page);

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Quản lý sản phẩm/i);

    // BR-24 phải được nói rõ với người bán.
    await expect(page.getByText(/không thể xóa vĩnh viễn/i).first()).toBeVisible();
  });

  /** B4.0 mở form B4.1 trên trang riêng (không còn modal). */
  async function openNewProductForm(page: Page) {
    await loginAsVendor(page);
    await gotoRoute(page, '/kenh-ban/san-pham');
    await waitForAppReady(page);
    await page.getByRole('button', { name: /Thêm sản phẩm mới/i }).click();
    await expect(page).toHaveURL(/\/kenh-ban\/san-pham\/moi$/);
    return page.locator('form');
  }

  /** Điền các trường bắt buộc đứng trước phần vỏ / nhân trong form. */
  async function fillBasics(form: import('@playwright/test').Locator) {
    await form.getByLabel(/Tên sản phẩm/i).fill('Bánh nướng thử nghiệm');
    await form.getByLabel(/Giá bán lẻ/i).fill('150000');
    await form.getByLabel(/Tồn kho/i).fill('20');
    await form.getByLabel(/Hạn sử dụng/i).fill('2026-12-31');
  }

  test('mở được form thêm sản phẩm mới (B4.1)', async ({ page }) => {
    const form = await openNewProductForm(page);

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Đăng Sản Phẩm/i);

    // Các trường của form (FR-29, FR-54).
    await expect(form.getByLabel(/Tên sản phẩm/i)).toBeVisible();
    await expect(form.getByLabel(/Giá bán lẻ/i)).toBeVisible();
    await expect(form.getByLabel(/Tồn kho/i)).toBeVisible();
    await expect(form.getByLabel(/Thương hiệu/i)).toBeVisible();
    await expect(form.getByLabel(/Hạn sử dụng/i)).toBeVisible();
    await expect(form.getByLabel(/Ảnh sản phẩm/i)).toBeVisible();
    await expect(form.getByLabel(/Mô tả/i)).toBeVisible();
  });

  test('FR-54: sản phẩm bắt buộc có ít nhất 1 vỏ và 1 nhân', async ({ page }) => {
    const form = await openNewProductForm(page);
    await fillBasics(form);

    // Bấm đăng mà chưa chọn vỏ / nhân: phải báo lỗi về vỏ trước.
    await form.getByRole('button', { name: /Đăng Bán Ngay/i }).click();
    await expect(page.getByText(/ít nhất 1 loại Vỏ bánh/i)).toBeVisible();

    // Chọn vỏ rồi bấm lại: lần này phải báo về nhân.
    await form.getByRole('button', { name: /Bánh nướng/i }).first().click();
    await form.getByRole('button', { name: /Đăng Bán Ngay/i }).click();
    await expect(page.getByText(/ít nhất 1 loại Nhân bánh/i)).toBeVisible();
  });

  test('chọn được vỏ và nhân bằng chip, chip được đánh dấu đã chọn', async ({ page }) => {
    const form = await openNewProductForm(page);

    const crust = form.getByRole('button', { name: /Bánh nướng/i }).first();
    const filling = form.getByRole('button', { name: /Thập cẩm/i }).first();

    await crust.click();
    await filling.click();

    await expect(crust).toHaveAttribute('aria-pressed', 'true');
    await expect(filling).toHaveAttribute('aria-pressed', 'true');
  });

  test('tên sản phẩm rỗng thì bị chặn, không tạo được sản phẩm', async ({ page }) => {
    const form = await openNewProductForm(page);

    await form.getByRole('button', { name: /Đăng Bán Ngay/i }).click();

    // The name field is required: the browser stops the submit and the page stays.
    const name = form.getByLabel(/Tên sản phẩm/i);
    expect(await name.evaluate((el) => (el as HTMLInputElement).validity.valueMissing)).toBe(true);
    await expect(page).toHaveURL(/\/kenh-ban\/san-pham\/moi$/);
  });

  test('nút Hủy đưa người dùng về lại danh sách', async ({ page }) => {
    const form = await openNewProductForm(page);

    await form.getByRole('button', { name: /^Hủy$/ }).click();
    await expect(page).toHaveURL(/\/kenh-ban\/san-pham$/);
  });

  test('trang quản lý sản phẩm không có lỗi console', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await loginAsVendor(page);
    await gotoRoute(page, '/kenh-ban/san-pham');
    await waitForAppReady(page);
    await page.waitForTimeout(500);

    const real = errors.filter((message) => !isIgnorableConsoleError(message));
    expect(real).toEqual([]);
  });

  // ───────── phần server: vòng đời sản phẩm ─────────

  test('đăng sản phẩm mới thì sản phẩm xuất hiện trong danh sách của Shop', async ({ page }) => {
    await loginAsVendor(page);
    const vendorId = SEED_VENDORS.trangVang.id;

    const attributes = await taxonomy(page);
    const crust = attributes.find((item) => item.group === 'CRUST' && item.active);
    const filling = attributes.find((item) => item.group === 'FILLING' && item.active);
    expect(crust, 'Danh mục Vỏ phải có ít nhất một giá trị đang hiển thị.').toBeTruthy();
    expect(filling, 'Danh mục Nhân phải có ít nhất một giá trị đang hiển thị.').toBeTruthy();

    const imageKey = await uploadProductImage(page, vendorId);
    const before = await vendorProducts(page, vendorId);

    const created = await apiPost<Product>(page, gatewayUrl(`/api/vendors/${vendorId}/products`), {
      ...productBody(imageKey, crust!.code, filling!.code),
      name: 'Bánh nướng E2E ' + Date.now(),
    });

    expect(created.id).toBeTruthy();
    expect(created.status).toBe('ON_SALE');
    expect(created.listPrice).toBe(150000);
    expect(created.stock).toBe(20);
    expect(created.crustCodes).toContain(crust!.code);
    expect(created.fillingCodes).toContain(filling!.code);
    expect(created.images?.length ?? 0).toBe(1);

    // Sản phẩm mới nằm trong danh sách (mới nhất trước).
    const after = await vendorProducts(page, vendorId);
    expect(after.length).toBe(before.length + 1);
    expect(after[0]?.id).toBe(created.id);
  });

  test('sửa sản phẩm thì tên, giá và tồn kho được cập nhật', async ({ page }) => {
    await loginAsVendor(page);
    const vendorId = SEED_VENDORS.trangVang.id;

    const attributes = await taxonomy(page);
    const crust = attributes.find((item) => item.group === 'CRUST' && item.active)!;
    const filling = attributes.find((item) => item.group === 'FILLING' && item.active)!;

    const { product: created, imageKey } = await createProduct(
      page,
      vendorId,
      'Bánh nướng E2E sửa ' + Date.now(),
      crust.code,
      filling.code,
    );

    const updated = await apiPut<Product>(
      page,
      gatewayUrl(`/api/vendors/${vendorId}/products/${created.id}`),
      {
        ...productBody(imageKey, crust.code, filling.code),
        version: created.version,
        name: 'Bánh nướng E2E đã sửa',
        listPrice: 175000,
        stock: 7,
        description: 'Mô tả sau khi sửa, do test E2E ghi.',
      },
    );

    expect(updated.name).toBe('Bánh nướng E2E đã sửa');
    expect(updated.listPrice).toBe(175000);
    expect(updated.stock).toBe(7);
    expect(updated.description).toContain('Mô tả sau khi sửa');

    // Đọc lại từ API: thay đổi phải được ghi xuống thật.
    const reread = await vendorProduct(page, vendorId, created.id);
    expect(reread?.name).toBe('Bánh nướng E2E đã sửa');
    expect(reread?.listPrice).toBe(175000);
  });

  test('sửa sản phẩm với version cũ thì bị chặn (FR-32, FR-33)', async ({ page }) => {
    await loginAsVendor(page);
    const vendorId = SEED_VENDORS.trangVang.id;

    const attributes = await taxonomy(page);
    const crust = attributes.find((item) => item.group === 'CRUST' && item.active)!;
    const filling = attributes.find((item) => item.group === 'FILLING' && item.active)!;

    const { product: created, imageKey } = await createProduct(
      page,
      vendorId,
      'Bánh nướng E2E version ' + Date.now(),
      crust.code,
      filling.code,
    );

    const staleVersion = created.version ?? 0;

    // Một lần sửa bình thường nâng version lên.
    await apiPut<Product>(page, gatewayUrl(`/api/vendors/${vendorId}/products/${created.id}`), {
      ...productBody(imageKey, crust.code, filling.code),
      version: staleVersion,
      name: 'Bánh nướng E2E version lần 2',
    });

    // Lần hai dùng version cũ ⇒ 409 VENDOR_027 (PRODUCT_CHANGED).
    let failed = false;
    let body = '';
    try {
      await apiPut<Product>(page, gatewayUrl(`/api/vendors/${vendorId}/products/${created.id}`), {
        ...productBody(imageKey, crust.code, filling.code),
        version: staleVersion,
        name: 'Bánh nướng E2E version lần 3',
      });
    } catch (error) {
      failed = true;
      body = error instanceof Error ? error.message : String(error);
    }

    expect(failed, 'Sửa với version cũ phải bị chặn.').toBe(true);
    expect(body).toContain('VENDOR_027');
  });

  test('chủ Shop ẩn rồi bật lại hiển thị sản phẩm (FR-34)', async ({ page }) => {
    await loginAsVendor(page);
    const vendorId = SEED_VENDORS.trangVang.id;

    const attributes = await taxonomy(page);
    const crust = attributes.find((item) => item.group === 'CRUST' && item.active)!;
    const filling = attributes.find((item) => item.group === 'FILLING' && item.active)!;

    const imageKey = await uploadProductImage(page, vendorId);
    const created = await apiPost<Product>(page, gatewayUrl(`/api/vendors/${vendorId}/products`), {
      ...productBody(imageKey, crust.code, filling.code),
      name: 'Bánh nướng E2E ẩn ' + Date.now(),
    });

    const hidden = await apiPatch<Product>(
      page,
      gatewayUrl(`/api/vendors/${vendorId}/products/${created.id}`),
      { status: 'HIDDEN' },
    );
    expect(hidden.status).toBe('HIDDEN');

    const shown = await apiPatch<Product>(
      page,
      gatewayUrl(`/api/vendors/${vendorId}/products/${created.id}`),
      { status: 'ON_SALE' },
    );
    expect(shown.status).toBe('ON_SALE');
  });

  test('BR-24: chủ Shop không xoá được sản phẩm, chỉ ẩn được', async ({ page }) => {
    await loginAsVendor(page);
    const vendorId = SEED_VENDORS.trangVang.id;

    const attributes = await taxonomy(page);
    const crust = attributes.find((item) => item.group === 'CRUST' && item.active)!;
    const filling = attributes.find((item) => item.group === 'FILLING' && item.active)!;

    const imageKey = await uploadProductImage(page, vendorId);
    const created = await apiPost<Product>(page, gatewayUrl(`/api/vendors/${vendorId}/products`), {
      ...productBody(imageKey, crust.code, filling.code),
      name: 'Bánh nướng E2E không xoá ' + Date.now(),
    });

    // Chủ Shop cố gỡ vĩnh viễn: server phải từ chối (chỉ admin được gỡ).
    let failed = false;
    let body = '';
    try {
      await apiPatch<Product>(
        page,
        gatewayUrl(`/api/vendors/${vendorId}/products/${created.id}`),
        { status: 'REMOVED', removedReason: 'E2E cố xoá vĩnh viễn' },
      );
    } catch (error) {
      failed = true;
      body = error instanceof Error ? error.message : String(error);
    }

    expect(failed, 'Chủ Shop không được gỡ sản phẩm vĩnh viễn.').toBe(true);
    expect(body).toContain('403');

    // Sản phẩm vẫn còn, chưa bị gỡ.
    const reread = await vendorProduct(page, vendorId, created.id);
    expect(reread?.status).toBe('ON_SALE');
  });

  test('admin gỡ sản phẩm vĩnh viễn thì sản phẩm không quay lại được (FR-46)', async ({ page }) => {
    await loginAsVendor(page);
    const vendorId = SEED_VENDORS.trangVang.id;

    const attributes = await taxonomy(page);
    const crust = attributes.find((item) => item.group === 'CRUST' && item.active)!;
    const filling = attributes.find((item) => item.group === 'FILLING' && item.active)!;

    const imageKey = await uploadProductImage(page, vendorId);
    const created = await apiPost<Product>(page, gatewayUrl(`/api/vendors/${vendorId}/products`), {
      ...productBody(imageKey, crust.code, filling.code),
      name: 'Bánh nướng E2E bị gỡ ' + Date.now(),
    });

    // Admin gỡ vĩnh viễn, kèm lý do (BR-24: bắt buộc có lý do).
    await loginAs(page, SEED_ACCOUNTS.admin);
    const removed = await apiPatch<Product>(
      page,
      gatewayUrl(`/api/vendors/${vendorId}/products/${created.id}`),
      { status: 'REMOVED', removedReason: 'Vi phạm quy định sàn, E2E tự động.' },
    );
    expect(removed.status).toBe('REMOVED');
    expect(removed.removedReason).toContain('E2E tự động');

    // Đã gỡ thì không bật lại được nữa.
    await loginAsVendor(page);
    let failed = false;
    let body = '';
    try {
      await apiPatch<Product>(
        page,
        gatewayUrl(`/api/vendors/${vendorId}/products/${created.id}`),
        { status: 'ON_SALE' },
      );
    } catch (error) {
      failed = true;
      body = error instanceof Error ? error.message : String(error);
    }
    expect(failed, 'Sản phẩm đã gỡ không được bật lại.').toBe(true);
    expect(body).toContain('VENDOR_026');
  });

  test('admin gỡ sản phẩm mà không có lý do thì bị chặn', async ({ page }) => {
    await loginAsVendor(page);
    const vendorId = SEED_VENDORS.trangVang.id;

    const attributes = await taxonomy(page);
    const crust = attributes.find((item) => item.group === 'CRUST' && item.active)!;
    const filling = attributes.find((item) => item.group === 'FILLING' && item.active)!;

    const imageKey = await uploadProductImage(page, vendorId);
    const created = await apiPost<Product>(page, gatewayUrl(`/api/vendors/${vendorId}/products`), {
      ...productBody(imageKey, crust.code, filling.code),
      name: 'Bánh nướng E2E thiếu lý do ' + Date.now(),
    });

    await loginAs(page, SEED_ACCOUNTS.admin);
    let failed = false;
    let body = '';
    try {
      await apiPatch<Product>(
        page,
        gatewayUrl(`/api/vendors/${vendorId}/products/${created.id}`),
        { status: 'REMOVED' },
      );
    } catch (error) {
      failed = true;
      body = error instanceof Error ? error.message : String(error);
    }

    expect(failed, 'Gỡ sản phẩm mà không có lý do thì phải bị chặn.').toBe(true);
    expect(body).toContain('VENDOR_029');
  });

  test('sản phẩm thiếu vỏ hoặc nhân thì bị chặn ở server (BR-34)', async ({ page }) => {
    await loginAsVendor(page);
    const vendorId = SEED_VENDORS.trangVang.id;

    const attributes = await taxonomy(page);
    const crust = attributes.find((item) => item.group === 'CRUST' && item.active)!;
    const filling = attributes.find((item) => item.group === 'FILLING' && item.active)!;

    const imageKey = await uploadProductImage(page, vendorId);

    // Thiếu vỏ.
    let failed = false;
    let body = '';
    try {
      await apiPost<Product>(page, gatewayUrl(`/api/vendors/${vendorId}/products`), {
        ...productBody(imageKey, crust.code, filling.code),
        name: 'Bánh nướng E2E thiếu vỏ ' + Date.now(),
        crustCodes: [],
      });
    } catch (error) {
      failed = true;
      body = error instanceof Error ? error.message : String(error);
    }
    expect(failed, 'Sản phẩm thiếu vỏ phải bị chặn.').toBe(true);
    expect(body).toContain('crustCodes');

    // Thiếu nhân.
    failed = false;
    body = '';
    try {
      await apiPost<Product>(page, gatewayUrl(`/api/vendors/${vendorId}/products`), {
        ...productBody(imageKey, crust.code, filling.code),
        name: 'Bánh nướng E2E thiếu nhân ' + Date.now(),
        fillingCodes: [],
      });
    } catch (error) {
      failed = true;
      body = error instanceof Error ? error.message : String(error);
    }
    expect(failed, 'Sản phẩm thiếu nhân phải bị chặn.').toBe(true);
    expect(body).toContain('fillingCodes');
  });

  test('sản phẩm thiếu ảnh thì bị chặn (FR-29)', async ({ page }) => {
    await loginAsVendor(page);
    const vendorId = SEED_VENDORS.trangVang.id;

    const attributes = await taxonomy(page);
    const crust = attributes.find((item) => item.group === 'CRUST' && item.active)!;
    const filling = attributes.find((item) => item.group === 'FILLING' && item.active)!;

    let failed = false;
    let body = '';
    try {
      await apiPost<Product>(page, gatewayUrl(`/api/vendors/${vendorId}/products`), {
        ...productBody('tmp/khong-ton-tai.png', crust.code, filling.code),
        name: 'Bánh nướng E2E thiếu ảnh ' + Date.now(),
        imageKeys: [],
      });
    } catch (error) {
      failed = true;
      body = error instanceof Error ? error.message : String(error);
    }

    expect(failed, 'Sản phẩm thiếu ảnh phải bị chặn.').toBe(true);
    expect(body).toContain('VENDOR_112');
  });

  test('Shop của người khác thì không được đọc hay sửa sản phẩm', async ({ page }) => {
    // Người mua lẻ không sở hữu Shop nào.
    await loginAs(page, SEED_ACCOUNTS.buyer);
    const vendorId = SEED_VENDORS.trangVang.id;

    let failed = false;
    let body = '';
    try {
      await apiGet<unknown>(page, gatewayUrl(`/api/vendors/${vendorId}/products`));
    } catch (error) {
      failed = true;
      body = error instanceof Error ? error.message : String(error);
    }

    expect(failed, 'Người không phải chủ Shop không được đọc sản phẩm của Shop khác.').toBe(true);
    expect(body).toContain('403');
  });

  test('sản phẩm mới lên sàn thì người mua thấy trong danh mục', async ({ page }) => {
    await loginAsVendor(page);
    const vendorId = SEED_VENDORS.trangVang.id;

    const attributes = await taxonomy(page);
    const crust = attributes.find((item) => item.group === 'CRUST' && item.active)!;
    const filling = attributes.find((item) => item.group === 'FILLING' && item.active)!;

    const imageKey = await uploadProductImage(page, vendorId);
    const name = 'Bánh nướng E2E trong danh mục ' + Date.now();
    const created = await apiPost<Product>(page, gatewayUrl(`/api/vendors/${vendorId}/products`), {
      ...productBody(imageKey, crust.code, filling.code),
      name,
    });

    // Danh mục đọc từ `catalog-service`, cập nhật qua sự kiện RabbitMQ ⇒ chờ.
    //
    // Vì sao lọc theo `q`: mỗi lần chạy E2E lại thêm vài sản phẩm mới của Shop
    // này, nên danh sách của Shop dài hơn một trang ⇒ sản phẩm vừa tạo có thể
    // nằm ngoài trang đầu. Tìm theo tên (tên có timestamp nên là duy nhất) thì
    // không phụ thuộc vị trí.
    await loginAs(page, SEED_ACCOUNTS.buyer);
    await waitFor(
      async () => {
        const payload = await apiGet<unknown>(
          page,
          gatewayUrl(
            `/api/products?provinceCode=79&vendorId=${vendorId}&q=${encodeURIComponent(name)}`,
          ),
        );
        const data = unwrapData<{ content?: Array<{ id?: string; name?: string }> }>(payload);
        return (data?.content ?? []).some((item) => item.id === created.id) ? true : null;
      },
      { timeout: 40_000 },
    );
  });
});
