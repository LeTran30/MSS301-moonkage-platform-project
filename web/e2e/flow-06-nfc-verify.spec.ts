import { test, expect } from '@playwright/test';
import {
  gotoRoute,
  waitForAppReady,
  login,
  trackConsoleErrors,
  isIgnorableConsoleError,
  SEED_ACCOUNTS,
} from './helpers';

/**
 * FLOW 6 — Xác minh danh tính NFC (M6.4, FR-04, AC-04.1).
 *
 * Luồng này là cổng chặn cho mọi giao dịch B2B và cho việc mở Shop. Test
 * ở đây kiểm tra **hợp đồng của giao diện** với ứng dụng di động
 * (Moonkage Verify, V1→V5) — đúng những gì backend dựa vào để đánh dấu
 * tài khoản là đã định danh.
 *
 * Trang này chỉ mở được khi đã đăng nhập (guard `RequireAuth`), nên test
 * đăng nhập bằng tài khoản seed thật. Không còn khung giả lập điện thoại:
 * việc quét thẻ là hành động của người dùng thật ngoài ứng dụng này.
 *
 * Persona: `member2@mk.com` — tài khoản **chưa** xác minh NFC. Tài khoản đã
 * định danh (`member1`) thấy màn "xác minh thành công", không có mã QR và
 * hướng dẫn 3 bước — nên phải dùng persona chưa định danh để kiểm tra phần
 * hướng dẫn.
 */
test.describe('FLOW 6 — Xác minh danh tính NFC', () => {
  /** Đăng nhập bằng persona chưa xác minh NFC. */
  async function loginWithoutNfc(page: import('@playwright/test').Page) {
    await login(
      page,
      SEED_ACCOUNTS.buyerWithoutNfc.username,
      SEED_ACCOUNTS.buyerWithoutNfc.password,
    );
  }

  test('trang xác minh hiện QR, hướng dẫn 3 bước và trạng thái định danh', async ({ page }) => {
    await loginWithoutNfc(page);
    await gotoRoute(page, '/tai-khoan/xac-minh');
    await waitForAppReady(page);

    await expect(page.getByRole('heading', { level: 2 })).toContainText(/Xác thực căn cước/i);

    // Trạng thái định danh.
    await expect(page.getByText('CHƯA ĐỊNH DANH')).toBeVisible();

    // Hướng dẫn 3 bước.
    await expect(page.getByText(/Mở ứng dụng/i).first()).toBeVisible();
    await expect(page.getByText(/Quét mã QR/i).first()).toBeVisible();
    await expect(page.getByText(/Áp thẻ Căn cước công dân/i).first()).toBeVisible();
  });

  test('phiên xác minh có mã hiển thị và nút tạo mã QR mới', async ({ page }) => {
    await loginWithoutNfc(page);
    await gotoRoute(page, '/tai-khoan/xac-minh');
    await waitForAppReady(page);

    // Phiên được mở tự động khi tài khoản chưa định danh (AC-04.1).
    await expect(page.getByLabel('Mã phiên xác minh')).toBeVisible();
    await expect(page.getByRole('button', { name: /Tạo mã QR mới/i })).toBeVisible();
  });

  test('tài khoản đã định danh thì hiện kết quả xác minh', async ({ page }) => {
    // `member1` đã định danh: trang hiện kết quả thành công, không có mã QR.
    await login(page);
    await gotoRoute(page, '/tai-khoan/xac-minh');
    await waitForAppReady(page);

    await expect(page.getByText('ĐÃ ĐỊNH DANH')).toBeVisible();
    await expect(page.getByText(/Tài khoản đã được xác minh thành công/i)).toBeVisible();
  });

  test('không còn khung giả lập điện thoại trong môi trường thật', async ({ page }) => {
    await loginWithoutNfc(page);
    await gotoRoute(page, '/tai-khoan/xac-minh');
    await waitForAppReady(page);

    // Khung giả lập chỉ có ý nghĩa khi thiết kế, không dùng trên production.
    await expect(page.getByText(/MÀN APP V\d/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Mở popup giả lập quét NFC/i })).toHaveCount(0);
  });

  test('trang xác minh không có lỗi console', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await loginWithoutNfc(page);
    await gotoRoute(page, '/tai-khoan/xac-minh');
    await waitForAppReady(page);
    await page.waitForTimeout(500);

    const real = errors.filter((message) => !isIgnorableConsoleError(message));
    expect(real).toEqual([]);
  });
});
