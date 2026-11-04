import { test, expect } from '@playwright/test';
import { gotoRoute, waitForAppReady, login } from './helpers';

/**
 * FLOW 3 — Đăng nhập & phân quyền (M5.1, Q2.0).
 *
 * Kiểm tra ranh giới giữa khu vực người mua và khu vực quản trị: người mua
 * đã đăng nhập không được thấy màn hình quản trị.
 */
test.describe('FLOW 3 — Đăng nhập & phân quyền', () => {
  test('form đăng nhập có nhãn và ô nhập đầy đủ', async ({ page }) => {
    await gotoRoute(page, '/dang-nhap');
    await waitForAppReady(page);

    await expect(page.getByLabel('Số điện thoại')).toBeVisible();
    await expect(page.getByLabel('Mật khẩu')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible();
  });

  test('bỏ trống thông tin thì báo lỗi, không vào được tài khoản', async ({ page }) => {
    await gotoRoute(page, '/dang-nhap');
    await waitForAppReady(page);

    // Form đăng nhập có sẵn dữ liệu mẫu để demo, nên phải xoá trước khi kiểm tra.
    await page.getByLabel('Số điện thoại').fill('');
    await page.getByLabel('Mật khẩu').fill('');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    await expect(page.getByRole('alert').first()).toBeVisible();
    await expect(page).toHaveURL(/\/dang-nhap/);
  });

  test('số điện thoại sai định dạng thì báo lỗi, không vào được tài khoản', async ({ page }) => {
    await gotoRoute(page, '/dang-nhap');
    await waitForAppReady(page);

    await page.getByLabel('Số điện thoại').fill('123');
    await page.getByLabel('Mật khẩu').fill('Password@123');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    await expect(page.getByRole('alert').first()).toBeVisible();
    await expect(page).toHaveURL(/\/dang-nhap/);
  });

  test('đăng nhập thành công chuyển tới trang tài khoản', async ({ page }) => {
    await login(page);

    await expect(page).toHaveURL(/\/tai-khoan/);
  });

  test('trang đăng nhập có link quên mật khẩu', async ({ page }) => {
    await gotoRoute(page, '/dang-nhap');
    await waitForAppReady(page);

    await page.getByRole('link', { name: /Quên mật khẩu/i }).click();
    await expect(page).toHaveURL(/\/quen-mat-khau/);
  });

  test('người dùng không được phân quyền vào khu vực quản trị', async ({ page }) => {
    await login(page);

    // Đi thẳng vào URL quản trị: ứng dụng phải chặn lại.
    await gotoRoute(page, '/quan-tri');
    await waitForAppReady(page);

    // Khu vực quản trị bị chặn ở tầng route (guard `RequireAdmin`), nên nội dung
    // quản trị không được render — chỉ có thông báo từ chối quyền.
    await expect(page.getByRole('heading', { name: /Từ chối quyền truy cập/i })).toBeVisible();
    await expect(page.getByText(/chỉ dành cho người dùng có vai trò/i)).toBeVisible();

    // Nội dung quản trị thật sự không được phép hiện ra.
    await expect(page.getByRole('link', { name: /người bán/i }).first()).toHaveCount(0);
  });
});
