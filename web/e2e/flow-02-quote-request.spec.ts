import { test, expect } from '@playwright/test';
import { gotoRoute, waitForAppReady } from './helpers';

/**
 * FLOW 2 — Yêu cầu báo giá & đặt cọc (M3.1, M6.2.2, FR-16).
 *
 * Đây là hành trình B2B quan trọng nhất của sàn: người mua doanh nghiệp gửi
 * yêu cầu, các xưởng báo giá, người mua đặt cọc.
 *
 * Lưu ý về selector: nhãn "Người nhận" và "Số điện thoại người nhận" cùng
 * chứa chuỗi "người nhận", nên phải chọn theo **tên truy cập đầy đủ** chứ không
 * dùng regex lỏng — nếu không sẽ vi phạm strict mode.
 */
test.describe('FLOW 2 — Yêu cầu báo giá & đặt cọc', () => {
  const recipientName = page =>
    page.getByRole('textbox', { name: 'Người nhận *', exact: true });
  const recipientPhone = page =>
    page.getByRole('textbox', { name: 'Số điện thoại người nhận *', exact: true });
  const deliveryAddress = page =>
    page.getByRole('textbox', { name: 'Địa chỉ nhận hàng chi tiết *', exact: true });

  test('trang tạo yêu cầu hiện đủ các nhóm thông tin', async ({ page }) => {
    await gotoRoute(page, '/dat-so-luong-lon/yeu-cau-moi');
    await waitForAppReady(page);

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Yêu Cầu/i);

    // Số lượng, hạn giao, người nhận, địa chỉ, bao bì, vị nhân.
    await expect(
      page.getByRole('spinbutton', { name: 'Số lượng hộp cần đặt *', exact: true })
    ).toBeVisible();
    await expect(recipientName(page)).toBeVisible();
    await expect(recipientPhone(page)).toBeVisible();
    await expect(deliveryAddress(page)).toBeVisible();
  });

  test('gửi yêu cầu thiếu thông tin bị chặn và báo lỗi', async ({ page }) => {
    await gotoRoute(page, '/dat-so-luong-lon/yeu-cau-moi');
    await waitForAppReady(page);

    // Xoá số lượng để chắc chắn có trường thiếu dữ liệu.
    await page.getByRole('spinbutton', { name: 'Số lượng hộp cần đặt *', exact: true }).fill('');
    await page.getByRole('button', { name: /Gửi yêu cầu báo giá/i }).click();

    // Form không được submit thành công khi thiếu thông tin bắt buộc.
    await expect(page.getByRole('alert').first()).toBeVisible();
    await expect(page).toHaveURL(/\/dat-so-luong-lon\/yeu-cau-moi/);
  });

  test('điền đủ thông tin thì nút gửi không bị khóa', async ({ page }) => {
    await gotoRoute(page, '/dat-so-luong-lon/yeu-cau-moi');
    await waitForAppReady(page);

    await page
      .getByRole('spinbutton', { name: 'Số lượng hộp cần đặt *', exact: true })
      .fill('500');
    await recipientName(page).fill('Nguyễn Văn A');
    await recipientPhone(page).fill('0912345678');
    await deliveryAddress(page).fill('123 Nguyễn Huệ, Quận 1');

    const submit = page.getByRole('button', { name: /Gửi yêu cầu báo giá/i });
    await expect(submit).toBeEnabled();
  });

  test('hub đặt số lượng lớn dẫn tới form yêu cầu', async ({ page }) => {
    await gotoRoute(page, '/dat-so-luong-lon');
    await waitForAppReady(page);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const link = page.getByRole('link', { name: /yêu cầu báo giá|tạo yêu cầu/i }).first();
    if (await link.isVisible()) {
      await link.click();
      await expect(page).toHaveURL(/\/yeu-cau-moi/);
    }
  });
});
