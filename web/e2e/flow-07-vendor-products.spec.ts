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
  async function useVendorOwner(page: import('@playwright/test').Page) {
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
    await useVendorOwner(page);
    await gotoRoute(page, '/kenh-ban/san-pham');
    await waitForAppReady(page);

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Quản lý sản phẩm/i);

    // BR-24 phải được nói rõ với người bán.
    await expect(page.getByText(/không thể xóa vĩnh viễn/i).first()).toBeVisible();
  });

  test('mở được modal thêm sản phẩm mới', async ({ page }) => {
    await useVendorOwner(page);
    await gotoRoute(page, '/kenh-ban/san-pham');
    await waitForAppReady(page);

    await page.getByRole('button', { name: /Thêm sản phẩm mới/i }).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.getByText(/Thêm sản phẩm mới/i).first()).toBeVisible();

    // Các trường của form (FR-29, FR-54).
    await expect(modal.getByLabel(/Tên sản phẩm/i)).toBeVisible();
    await expect(modal.getByLabel(/Giá bán niêm yết/i)).toBeVisible();
    await expect(modal.getByLabel(/Số lượng tồn kho/i)).toBeVisible();
    await expect(modal.getByLabel(/Mô tả chi tiết/i)).toBeVisible();
  });

  test('FR-54: sản phẩm bắt buộc có ít nhất 1 vỏ và 1 nhân', async ({ page }) => {
    await useVendorOwner(page);
    await gotoRoute(page, '/kenh-ban/san-pham');
    await waitForAppReady(page);

    await page.getByRole('button', { name: /Thêm sản phẩm mới/i }).click();

    const modal = page.getByRole('dialog');
    await modal.getByLabel(/Tên sản phẩm/i).fill('Bánh nướng thử nghiệm');

    // Bấm lưu mà chưa chọn vỏ / nhân.
    await modal.getByRole('button', { name: /Lưu sản phẩm/i }).click();

    // Phải báo lỗi về vỏ trước.
    await expect(modal.getByText(/ít nhất 1 loại Vỏ bánh/i)).toBeVisible();

    // Chọn vỏ rồi bấm lưu — lần này phải báo về nhân.
    await modal.getByRole('button', { name: /Bánh nướng/i }).first().click();
    await modal.getByRole('button', { name: /Lưu sản phẩm/i }).click();
    await expect(modal.getByText(/ít nhất 1 loại Nhân bánh/i)).toBeVisible();
  });

  test('chọn được vỏ và nhân bằng chip, chip được đánh dấu đã chọn', async ({ page }) => {
    await useVendorOwner(page);
    await gotoRoute(page, '/kenh-ban/san-pham');
    await waitForAppReady(page);

    await page.getByRole('button', { name: /Thêm sản phẩm mới/i }).click();

    const modal = page.getByRole('dialog');
    const crust = modal.getByRole('button', { name: /Bánh nướng/i }).first();
    const filling = modal.getByRole('button', { name: /Thập cẩm/i }).first();

    await crust.click();
    await filling.click();

    await expect(crust).toHaveAttribute('aria-pressed', 'true');
    await expect(filling).toHaveAttribute('aria-pressed', 'true');
  });

  test('tên sản phẩm rỗng thì bị chặn, không tạo được sản phẩm', async ({ page }) => {
    await useVendorOwner(page);
    await gotoRoute(page, '/kenh-ban/san-pham');
    await waitForAppReady(page);

    await page.getByRole('button', { name: /Thêm sản phẩm mới/i }).click();

    const modal = page.getByRole('dialog');
    await modal.getByRole('button', { name: /Lưu sản phẩm/i }).click();

    await expect(modal.getByText(/Vui lòng nhập tên sản phẩm/i)).toBeVisible();
  });

  test('nút đóng modal đưa người dùng về lại danh sách', async ({ page }) => {
    await useVendorOwner(page);
    await gotoRoute(page, '/kenh-ban/san-pham');
    await waitForAppReady(page);

    await page.getByRole('button', { name: /Thêm sản phẩm mới/i }).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    await modal.getByRole('button', { name: /^Hủy$/ }).click();
    await expect(modal).toBeHidden();
  });

  test('trang quản lý sản phẩm không có lỗi console', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await useVendorOwner(page);
    await gotoRoute(page, '/kenh-ban/san-pham');
    await waitForAppReady(page);
    await page.waitForTimeout(500);

    const real = errors.filter((message) => !isIgnorableConsoleError(message));
    expect(real).toEqual([]);
  });
});
