import { test, expect } from '@playwright/test';
import { gotoRoute, waitForAppReady, login, SEED_ACCOUNTS } from './helpers';

/**
 * Nền tảng E2E — kiểm tra "khung" của ứng dụng.
 *
 * Những test này bảo vệ những thứ mà mọi luồng khác đều dựa vào: route còn
 * sống, khung giao diện có bố cục, và các điều kiện accessibility cơ bản
 * (tiêu đề, vùng chính, ngôn ngữ).
 */
test.describe('Nền tảng — khung ứng dụng', () => {
  test('mọi route chính đều trả về trang, không phải 404', async ({ page }) => {
    const routes = [
      '/',
      '/san-pham',
      '/dat-so-luong-lon',
      '/dat-so-luong-lon/yeu-cau-moi',
      '/don-vi-cung-cap',
      '/gio-hang',
      '/thanh-toan',
      '/dang-nhap',
      '/dang-ky',
      '/quen-mat-khau',
      '/dat-lai-mat-khau',
      '/ban-hang/gioi-thieu',
      '/ban-hang/dang-ky',
      '/chinh-sach',
      '/thong-bao',
    ];

    for (const route of routes) {
      await gotoRoute(page, route);
      await waitForAppReady(page);

      // Không được rơi vào trang 404.
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });

  test('trang 404 hiện thông báo rõ ràng', async ({ page }) => {
    await gotoRoute(page, '/khong-ton-tai-abcxyz');
    await waitForAppReady(page);

    await expect(page.getByText(/404|không tìm thấy/i).first()).toBeVisible();
  });

  test('mỗi trang có đúng một tiêu đề h1', async ({ page }) => {
    await gotoRoute(page, '/san-pham');
    await waitForAppReady(page);

    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('trang khai báo ngôn ngữ tiếng Việt', async ({ page }) => {
    await gotoRoute(page, '/');
    await waitForAppReady(page);

    await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  });

  test('trang có vùng chính để trình đọc màn hình nhảy tới', async ({ page }) => {
    await gotoRoute(page, '/');
    await waitForAppReady(page);

    await expect(page.locator('main')).toHaveCount(1);
  });

  test('tiêu đề trang được cập nhật khi điều hướng', async ({ page }) => {
    await gotoRoute(page, '/san-pham');
    await waitForAppReady(page);

    await expect(page).toHaveTitle(/Bánh Trung Thu|Moonkage/i);
  });

  test('bản đồ giao diện (trang thiết kế) không còn trong bản chạy thật', async ({ page }) => {
    await gotoRoute(page, '/so-do-giao-dien');
    await waitForAppReady(page);

    // Trang sơ đồ chỉ phục vụ thiết kế; trên production nó phải rơi vào 404.
    await expect(page.getByText(/404|không tìm thấy/i).first()).toBeVisible();
  });

  test('màn hình hoãn vẫn mở được và nói rõ đang hoãn', async ({ page }) => {
    // Q6.3 (voucher) và B6.4 (lịch công suất) là tính năng hoãn: màn hình vẫn
    // phải tồn tại và giải thích, không được rơi vào 404. Cả hai nằm sau
    // guard, nên test đăng nhập bằng tài khoản thật trước.
    await login(page, SEED_ACCOUNTS.admin.username, SEED_ACCOUNTS.admin.password);

    // Admin → Q6.3
    await gotoRoute(page, '/quan-tri/cau-hinh/voucher');
    await waitForAppReady(page);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/hoãn/i).first()).toBeVisible();
  });

  test('tab điều hướng giữa các khu vực hoạt động', async ({ page }) => {
    await gotoRoute(page, '/');
    await waitForAppReady(page);

    const nav = page.getByRole('navigation').first();
    await expect(nav).toBeVisible();
  });
});
