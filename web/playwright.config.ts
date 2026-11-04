import { defineConfig, devices } from '@playwright/test';

/**
 * Cấu hình Playwright cho E2E test.
 *
 * E2E chạy ứng dụng thật (vite dev server) ở chế độ demo, nên không cần
 * backend: dữ liệu đến từ `MOCK_PRODUCTS` trong `productStore`.
 *
 * Chạy:
 *   `npm run e2e`            — chạy tất cả
 *   `npm run e2e:ui`         — mở giao diện Playwright Inspector
 *   `npm run e2e:report`     — xem báo cáo HTML sau lần chạy
 */
export default defineConfig({
  testDir: './e2e',
  // Không chạy song song trên cùng một máy: các test dùng chung trạng thái
  // demo (giỏ hàng, phiên đăng nhập) nên chạy tuần tự cho ổn định.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    // `vite preview` chạy bản build thật — gần với production hơn `vite dev`.
    command: 'npm run build && npx vite preview --port 4173 --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_DEMO_MODE: 'true',
      VITE_API_BASE_URL: 'http://127.0.0.1:9999',
    },
  },
});
