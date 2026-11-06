import { test, expect } from '@playwright/test';
import { gotoRoute, waitForAppReady, trackConsoleErrors, isIgnorableConsoleError } from './helpers';

/**
 * FLOW 7 — Quản lý sản phẩm của người bán (B4.0, B4.1, FR-29 đến FR-34, FR-54).
 *
 * Luồng này kiểm tra vòng đời sản phẩm của một Shop: thêm mới, sửa, bật/tắt
 * hiển thị. Điểm quan trọng nhất là **BR-24**: sản phẩm không được xoá vĩnh
 * viễn — chỉ ẩn (HIDDEN) hoặc bị gỡ (REMOVED) bởi quản trị.
 */
test.describe('FLOW 7 — Quản lý sản phẩm người bán', () => {
  /** Đặt persona demo là chủ Shop có `vendorId` (Anh Quân — Hiệu Bảo An). */
  async function signInAsVendorOwner(page: import('@playwright/test').Page) {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'moonkage_current_user',
        JSON.stringify({
          id: 'usr_quan',
          name: 'Anh Quân (Tiệm bánh có Shop)',
          email: 'quan.bakery@hanoi.vn',
          phone: '0933445566',
          role: 'VENDOR',
          nfcStatus: 'VERIFIED',
          idCardNumberMasked: '0010••••5566',
          vendorId: 'ven_quan',
          vendorName: 'Hiệu Bánh Gia Truyền Bảo An',
          hasShop: true,
          acceptsCustomOrders: true,
        }),
      );
    });
  }

  test('trang quản lý sản phẩm hiện tiêu đề và quy tắc không xoá vĩnh viễn', async ({ page }) => {
    await signInAsVendorOwner(page);
    await gotoRoute(page, '/kenh-ban/san-pham');
    await waitForAppReady(page);

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Quản lý sản phẩm/i);

    // BR-24 phải được nói rõ với người bán.
    await expect(page.getByText(/không thể xóa vĩnh viễn/i).first()).toBeVisible();
  });

  /** B4.0 mở form B4.1 trên trang riêng (không còn modal). */
  async function openNewProductForm(page: import('@playwright/test').Page) {
    await signInAsVendorOwner(page);
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
    await signInAsVendorOwner(page);
    await gotoRoute(page, '/kenh-ban/san-pham');
    await waitForAppReady(page);
    await page.waitForTimeout(500);

    const real = errors.filter((message) => !isIgnorableConsoleError(message));
    expect(real).toEqual([]);
  });
});
