import { expect, type Page } from '@playwright/test';
import { stubApi } from './apiStubs';

/**
 * Tiện ích dùng chung cho các test E2E.
 *
 * Ứng dụng chạy ở chế độ demo cho các luồng còn dữ liệu demo. Luồng 1 không
 * còn mock: nó đọc máy chủ, và `apiStubs.ts` trả lời thay máy chủ. Test tập
 * trung vào **hành trình người dùng** và **contract của giao diện** (route,
 * nhãn, trạng thái).
 */

const stubbedPages = new WeakSet<Page>();

/** Điều hướng tới một route của ứng dụng (máy chủ đã được giả lập) và chờ trang render xong. */
export async function gotoRoute(page: Page, path: string): Promise<void> {
  if (!stubbedPages.has(page)) {
    stubbedPages.add(page);
    await stubApi(page);
  }
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
