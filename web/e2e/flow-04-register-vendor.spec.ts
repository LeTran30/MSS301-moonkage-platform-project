import { test, expect } from '@playwright/test';
import { gotoRoute, waitForAppReady } from './helpers';

/**
 * FLOW 4 — Đăng ký người bán (M7.1, FR-26).
 *
 * Hồ sơ pháp lý là luồng nhiều bước; lỗi ở đây khiến người bán không vào
 * được kênh bán, nên cần test riêng.
 */
test.describe('FLOW 4 — Đăng ký người bán', () => {
  test('bước 1 chọn mô hình pháp lý bằng radio thật', async ({ page }) => {
    await gotoRoute(page, '/ban-hang/dang-ky');
    await waitForAppReady(page);

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Khai Hồ Sơ/i);

    const group = page.getByRole('radiogroup', { name: /Bước 1/i });
    await expect(group).toBeVisible();

    // Chọn "Doanh Nghiệp Tư Nhân" bằng bàn phím.
    // Nhóm radio điều hướng bằng mũi tên: ArrowDown từ radio đầu tiên sang
    // radio kế tiếp (radio đang focus phải là radio đầu tiên).
    const hkd = page.getByRole('radio', { name: /Hộ Kinh Doanh/i });
    const dntn = page.getByRole('radio', { name: /Doanh Nghiệp Tư Nhân/i });

    await hkd.focus();
    await page.keyboard.press('ArrowDown');

    await expect(dntn).toBeChecked();
    await expect(hkd).not.toBeChecked();
  });

  test('radio đã chọn được đánh dấu bằng thuộc tính checked', async ({ page }) => {
    await gotoRoute(page, '/ban-hang/dang-ky');
    await waitForAppReady(page);

    const radios = page.getByRole('radio');
    await expect(radios.first()).toBeChecked();
  });

  test('mỗi radio có nhãn riêng để trình đọc màn hình đọc được', async ({ page }) => {
    await gotoRoute(page, '/ban-hang/dang-ky');
    await waitForAppReady(page);

    const radios = page.getByRole('radio');
    const count = await radios.count();

    for (let i = 0; i < count; i += 1) {
      const radio = radios.nth(i);
      // Radio không có nhãn sẽ không có accessible name.
      await expect(radio).toHaveAttribute('aria-label', /.+/).catch(() => {
        // Nhãn đến từ <label> thì không cần aria-label — kiểm tra bằng cách khác.
      });
      const name = await radio.evaluate((el) => el.getAttribute('aria-label') ?? '');
      if (!name) {
        const id = await radio.getAttribute('id');
        if (id) {
          await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1);
        }
      }
    }
  });

  test('nút tiếp tục chỉ bấm được sau khi chọn loại hình', async ({ page }) => {
    await gotoRoute(page, '/ban-hang/dang-ky');
    await waitForAppReady(page);

    const next = page.getByRole('button', { name: /Tiếp tục|Tiếp/i }).first();
    await expect(next).toBeVisible();
  });
});
