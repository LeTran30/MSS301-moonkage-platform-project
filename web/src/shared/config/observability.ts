/**
 * Cấu hình observability (Sentry + analytics).
 *
 * Vì sao tách riêng khỏi `env.ts`: observability là thứ **bật/tắt được theo
 * môi trường** và có thể thiếu hoàn toàn (local, demo, CI) mà ứng dụng vẫn
 * phải chạy bình thường. Không có DSN thì không khởi tạo Sentry; không có
 * measurement ID thì không khởi tạo analytics.
 *
 * Quyết định quan trọng: **không gửi dữ liệu nhạy cảm**. Theo NFR-03, số định
 * danh, số điện thoại và họ tên không được rời khỏi hệ thống. Vì vậy:
 * - Sentry chỉ nhận `user.id` (mã tài khoản) và `user.role`, không nhận tên,
 *   email, số điện thoại hay địa chỉ.
 * - Analytics chỉ nhận sự kiện về hành trình (route, hành động), không nhận
 *   dữ liệu đơn hàng, dữ liệu người dùng hay nội dung form.
 *
 * Cả hai đều **opt-in**: mặc định tắt, chỉ bật khi biến môi trường có giá trị.
 */

/** Kiểu dữ liệu người dùng gửi lên Sentry. Không chứa PII. */
export interface ObservabilityUser {
  /** Mã tài khoản (`accountId`) — định danh giả, không phải PII. */
  id: string;
  /** Vai trò — hữu ích để lọc lỗi theo khu vực. */
  role?: string;
}

/** Thuộc tính môi trường gửi kèm mọi sự kiện. */
export interface ObservabilityContext {
  /** Môi trường chạy: `production` | `staging` | `development`. */
  environment: string;
  /** Phiên bản ứng dụng (git sha hoặc số build). */
  release?: string;
  /** Môi trường demo không gửi gì ra ngoài. */
  isDemoMode: boolean;
}

const env = (typeof import.meta !== 'undefined' && import.meta.env
  ? import.meta.env
  : {}) as Record<string, string | undefined>;

function readVar(name: string): string {
  return (env[name] ?? '').trim();
}

/**
 * DSN của Sentry (ví dụ `https://abc123@o456.ingest.sentry.io/789`).
 *
 * Rỗng = không khởi tạo Sentry. Sentry SDK gửi lỗi qua `fetch`/`XHR`; nếu
 * không có DSN thì bỏ qua khởi tạo là cách sạch nhất để app vẫn chạy bình
 * thường ở môi trường không cần quan sát.
 */
export const SENTRY_DSN: string = readVar('VITE_SENTRY_DSN');

/**
 * Có nên gửi sự kiện phân tích không?
 *
 * Bật khi có measurement ID. Đây là opt-in: không có ID thì không có request
 * nào đi ra ngoài.
 */
export const ANALYTICS_MEASUREMENT_ID: string = readVar('VITE_GA_MEASUREMENT_ID');

/** Tên miền GA4 để gửi `page_view`. Rỗng = dùng measurement ID mặc định. */
export const ANALYTICS_HOST: string = readVar('VITE_GA_HOST');

/** Môi trường hiển thị trong Sentry để lọc lỗi theo stage. */
export const OBSERVABILITY_ENVIRONMENT: string =
  readVar('VITE_OBSERVABILITY_ENVIRONMENT') || readVar('VITE_APP_ENV') || 'development';

/** Phiên bản ứng dụng; thường là git sha. */
export const OBSERVABILITY_RELEASE: string = readVar('VITE_APP_VERSION');

/** Bật Session Replay (chụp lại thao tác của người dùng khi có lỗi). */
export const SENTRY_REPLAYS_ENABLED: boolean = readVar('VITE_SENTRY_REPLAYS') === 'true';

/** Tỷ lệ lấy mẫu lỗi (0..1). `1` = gửi hết. */
export const SENTRY_TRACES_SAMPLE_RATE: number = readNumber('VITE_SENTRY_TRACES_SAMPLE_RATE', 0.1);

/** Tỷ lệ lấy mẫu lần phát lại phiên (0..1). */
export const SENTRY_REPLAYS_SAMPLE_RATE: number = readNumber('VITE_SENTRY_REPLAYS_SAMPLE_RATE', 0);

function readNumber(name: string, fallback: number): number {
  const raw = readVar(name);
  if (raw === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < 0 || parsed > 1) return fallback;
  return parsed;
}

/** Sentry có được bật không? */
export function isSentryEnabled(): boolean {
  return SENTRY_DSN !== '';
}

/** Analytics có được bật không? */
export function isAnalyticsEnabled(): boolean {
  return ANALYTICS_MEASUREMENT_ID !== '';
}

/** Ngữ cảnh chung gửi kèm mọi sự kiện. */
export const OBSERVABILITY_CONTEXT: ObservabilityContext = {
  environment: OBSERVABILITY_ENVIRONMENT,
  release: OBSERVABILITY_RELEASE || undefined,
  isDemoMode: readVar('VITE_DEMO_MODE') === 'true',
};
