import { defineConfig, devices } from '@playwright/test';

/**
 * Cấu hình Playwright cho E2E test.
 *
 * E2E chạy ứng dụng thật (vite dev server) và cần backend Moonkage đang
 * chạy (docker compose up). Không còn chế độ demo: mọi màn hình đọc dữ liệu
 * từ API Gateway.
 *
 * Chạy:
 *   `npm run e2e`            — chạy tất cả
 *   `npm run e2e:ui`         — mở giao diện Playwright Inspector
 *   `npm run e2e:report`     — xem báo cáo HTML sau lần chạy
 */

/**
 * Gateway mà **cả ứng dụng lẫn test** dùng.
 *
 * Vì sao phải là một hằng duy nhất: CSP của ứng dụng chỉ cho phép
 * `connect-src` tới đúng origin được nhúng lúc build (`VITE_API_BASE_URL`).
 * Test gọi gateway từ trong trang qua `fetch`, nên nếu test dùng một host
 * khác (ví dụ `localhost` còn app dùng `127.0.0.1`) thì trình duyệt chặn
 * request và test chết với "Failed to fetch" — một lỗi hạ tầng, không phải
 * lỗi sản phẩm.
 */
const API_BASE_URL = process.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8080';

// Test runner và web server phải dùng **cùng** một gateway: `helpers.ts` đọc
// `process.env.VITE_API_BASE_URL` để dựng URL tuyệt đối, còn CSP của app chỉ
// cho phép đúng origin được nhúng lúc build. Gán vào `process.env` ở đây để
// cả hai vế thấy cùng một giá trị — nếu lệch host, CSP chặn `fetch` của test
// và test chết với "Failed to fetch" (lỗi hạ tầng, không phải lỗi sản phẩm).
process.env.VITE_API_BASE_URL = API_BASE_URL;
export default defineConfig({
  testDir: './e2e',
  // Loại trừ file debug tạm: glob mặc định của Playwright là `**/*.@(spec|test)...`
  // nên một file tên `_tmp-debug2.spec.ts` lọt vào `web/e2e/` sẽ bị CI chạy.
  // File tạm chỉ dùng để dò lỗi cục bộ, không bao giờ được chạy trong CI.
  testIgnore: ['**/_tmp*/**', '**/_tmp-*', '**/tmp-*'],
  // Không chạy song song trên cùng một máy: các test dùng chung trạng thái
  // (giỏ hàng, phiên đăng nhập) nên chạy tuần tự cho ổn định.
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
    /*
     * LUÔN build + start preview mới; không bao giờ dùng lại server đang chạy.
     *
     * Lý do: `reuseExistingServer: true` (mặc định khi không phải CI) khiến
     * Playwright **không chạy lệnh `command`**, nên bundle cũ vẫn được phục vụ.
     * Test có thể xanh với code cũ ⇒ "pass giả", và lỗi thật chỉ lộ ra ở
     * lần chạy sau khi build lại. Đó là cách E2E trở nên không đáng tin.
     *
     * `command` đã gồm `npm run build` ⇒ mỗi lần chạy E2E đều build lại từ
     * code hiện tại.
     */
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      VITE_API_BASE_URL: API_BASE_URL,
      VITE_WS_URL: process.env.VITE_WS_URL ?? 'ws://127.0.0.1:8080/ws',
    },
  },
});
