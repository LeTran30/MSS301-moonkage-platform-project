import { expect, type Page } from '@playwright/test';

/**
 * Tiện ích dùng chung cho các test E2E.
 *
 * Ứng dụng chạy ở chế độ demo, nên không có backend thật: dữ liệu đến từ
 * `MOCK_PRODUCTS`. Test vì vậy tập trung vào **hành trình người dùng** và
 * **contract của giao diện** (route, nhãn, trạng thái), không phụ thuộc vào
 * dữ liệu server.
 */

/** Điều hướng tới một route của ứng dụng và chờ trang render xong. */
export async function gotoRoute(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page.locator('#root')).toBeVisible();
}

/**
 * Chờ ứng dụng sẵn sàng (React đã render xong lần đầu).
 *
 * `data-app-ready` được đặt trong `AppProviders` khi effect chạy.
 */
export async function waitForAppReady(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
}

/** Đăng nhập bằng form (chế độ demo chấp nhận mọi thông tin hợp lệ). */
export async function login(page: Page, phone = '0912345678', password = 'Password@123'): Promise<void> {
  await gotoRoute(page, '/dang-nhap');
  await waitForAppReady(page);

  await page.getByLabel('Số điện thoại').fill(phone);
  await page.getByLabel('Mật khẩu').fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
}

/** Kiểm tra không có lỗi trong console — bắt lỗi runtime mà test khác bỏ sót. */
export function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  return errors;
}

/** Bỏ qua các lỗi console đã biết là không liên quan (vd: font bị chặn). */
export function isIgnorableConsoleError(message: string): boolean {
  return (
    message.includes('Failed to load resource') &&
    (message.includes('fonts.googleapis.com') || message.includes('favicon'))
  );
}
