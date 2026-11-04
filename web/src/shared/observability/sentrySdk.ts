/**
 * "Cửa" hẹp của Sentry — chỉ export đúng những API observability dùng.
 *
 * Vì sao cần file này: `await import('@sentry/browser')` tạo ra **namespace
 * object**, nên bundler buộc phải giữ lại *mọi* export của package — kéo theo
 * `@sentry/replay` (265 kB) và `@sentry/feedback` (73 kB) dù không dùng tới.
 *
 * Ở đây ta khai báo lại từng API một cách tường minh. Rollup khi đó chỉ cần
 * giữ đúng những symbol này, phần còn lại của Sentry bị tree-shake sạch.
 *
 * Vì sao `@sentry/browser` chứ không phải `@sentry/react`: ứng dụng đã có sẵn
 * `RouteErrorBoundary` / `LayoutErrorBoundary` riêng, nên không cần
 * `ErrorBoundary` của Sentry. `@sentry/react` chỉ là lớp bọc mỏng quanh
 * `@sentry/browser` — bỏ đi là mất ~37 kB mà không mất tính năng nào.
 *
 * File này **chỉ** được import động (xem `sentry.ts`).
 */

/** Khởi tạo SDK. */
export { init } from '@sentry/browser';
/** Báo lỗi kèm ngữ cảnh. */
export { captureException } from '@sentry/browser';
/** Đặt/thoát thông tin người dùng (chỉ mã tài khoản + vai trò). */
export { setUser } from '@sentry/browser';
/** Ghi breadcrumb (đường đi trước lỗi). */
export { addBreadcrumb } from '@sentry/browser';
/**
 * Nạp integration từ CDN của Sentry thay vì đóng gói vào bundle.
 *
 * `lazyLoadIntegration` tải script từ `browser.sentry-cdn.com` **lúc chạy**,
 * nên `@sentry/replay` + rrweb (~265 kB) không nằm trong bundle của ta.
 */
export { lazyLoadIntegration } from '@sentry/browser';
/** Thêm integration vào client đã khởi tạo. */
export { addIntegration } from '@sentry/browser';
