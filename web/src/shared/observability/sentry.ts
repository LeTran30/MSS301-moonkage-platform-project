/**
 * Sentry — báo cáo lỗi production.
 *
 * Vì sao cần: bản đánh giá FE ghi rõ "không có error monitoring / observability"
 * là điểm yếu lớn nhất còn lại — lỗi xảy ra trên production mà không ai biết
 * là lỗi xảy ra ở đâu, ở người dùng nào, đã xảy ra bao nhiêu lần.
 *
 * Ranh giới dữ liệu (NFR-03): Sentry chỉ nhận `user.id` (mã tài khoản) và
 * `user.role`. Không gửi tên, email, số điện thoại, địa chỉ hay nội dung
 * form. Trong SDK v11, quyền thu thập dữ liệu được điều khiển bằng
 * `dataCollection` — ta tắt những gì có thể chứa PII (cookie, header HTTP,
 * query string, biến cục bộ trong stack frame).
 *
 * Vì sao nạp **động** (dynamic import): SDK trình duyệt nặng ~90 kB. Nếu
 * import tĩnh, mọi người dùng đều phải tải nó — kể cả khi không có DSN
 * (local, demo, CI). Nạp động giữ ngân sách bundle của phần code chạy thật
 * và chỉ tải SDK khi thực sự cần báo lỗi.
 *
 * Vì sao vẫn an toàn: `initSentry()` được gọi ở đầu `main.tsx`, tức là
 * trước lần render đầu tiên — lỗi lúc khởi động vẫn được bắt.
 *
 * Vì sao `@sentry/browser` chứ không phải `@sentry/react`: ứng dụng đã có sẵn
 * `RouteErrorBoundary` / `LayoutErrorBoundary` riêng, nên không cần
 * `ErrorBoundary` của Sentry.
 */
import {
  OBSERVABILITY_CONTEXT,
  SENTRY_DSN,
  SENTRY_REPLAYS_ENABLED,
  SENTRY_REPLAYS_SAMPLE_RATE,
  SENTRY_TRACES_SAMPLE_RATE,
  isSentryEnabled,
} from '@/shared/config/observability';

/**
 * Kiểu của module Sentry.
 *
 * Không import kiểu từ `@sentry/browser` ở đầu file: làm vậy kéo cả package vào
 * đồ thị module của bundler. Thay vào đó khai báo đúng phần API ta dùng.
 */
interface SentryModule {
  init: (options: Record<string, unknown>) => unknown;
  captureException: (error: unknown, hint?: Record<string, unknown>) => void;
  setUser: (user: { id: string; role?: string } | null) => void;
  addBreadcrumb: (breadcrumb: Record<string, unknown>) => void;
  lazyLoadIntegration?: (
    name: string,
  ) => Promise<(options?: Record<string, unknown>) => unknown>;
  addIntegration?: (integration: unknown) => void;
}

/**
 * Module Sentry đã nạp — giữ lại để các hàm gọi sau không phải await lại.
 *
 * `null` = chưa nạp (hoặc nạp lỗi). Vì SDK là optional, lỗi nạp phải **không**
 * làm hỏng ứng dụng.
 */
let sentryModule: SentryModule | null = null;
/** Lời hứa nạp đang chạy — dùng để không nạp hai lần. */
let loadingPromise: Promise<SentryModule | null> | null = null;

/** Nạp SDK (một lần). Trả về `null` nếu không bật hoặc nạp lỗi. */
async function loadSentry(): Promise<SentryModule | null> {
  if (!isSentryEnabled()) return null;
  if (sentryModule) return sentryModule;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      // KHÔNG dùng `import * as` hay spread (`...sdk`) ở đây: làm vậy bundler
      // phải giữ lại **mọi** export của `@sentry/browser`, kéo theo
      // `@sentry/replay` (~265 kB) và `@sentry/feedback` (~73 kB) vào bundle
      // dù không dùng tới. `sentrySdk.ts` khai báo lại đúng những API ta
      // gọi, nên Rollup tree-shake được phần còn lại.
      const sdk = await import('./sentrySdk');

      const module: SentryModule = {
        init: sdk.init as SentryModule['init'],
        captureException: sdk.captureException as SentryModule['captureException'],
        setUser: sdk.setUser as SentryModule['setUser'],
        addBreadcrumb: sdk.addBreadcrumb as SentryModule['addBreadcrumb'],
        lazyLoadIntegration: sdk.lazyLoadIntegration as SentryModule['lazyLoadIntegration'],
        addIntegration: sdk.addIntegration as SentryModule['addIntegration'],
      };
      sentryModule = module;
      return module;
    } catch {
      // Không có Sentry thì không có observability — nhưng ứng dụng vẫn chạy.
      return null;
    }
  })();

  return loadingPromise;
}

/**
 * Khởi tạo Sentry.
 *
 * Hàm **không ném lỗi** và là no-op khi không có DSN. Gọi nó sớm nhất có thể —
 * càng sớm càng bắt được lỗi lúc khởi động.
 */
export function initSentry(): void {
  if (!isSentryEnabled()) return;
  if (typeof window === 'undefined') return;

  void (async () => {
    const Sentry = await loadSentry();
    if (!Sentry) return;

    const integrations: unknown[] = [];

    Sentry.init({
      dsn: SENTRY_DSN,
      environment: OBSERVABILITY_CONTEXT.environment,
      release: OBSERVABILITY_CONTEXT.release,
      integrations,
      // Không bật tracing: Core Web Vitals đã được đo bằng `web-vitals`
      // (xem `webVitals.ts`), và tracing kéo theo phần tracing của SDK —
      // nặng hơn nhiều so với giá trị mang lại ở giai đoạn này.
      tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
      replaysSessionSampleRate: SENTRY_REPLAYS_SAMPLE_RATE,
      replaysOnErrorSampleRate: SENTRY_REPLAYS_SAMPLE_RATE > 0 ? 1 : 0,
      // NFR-03: chặn ở tầng SDK mọi dữ liệu có thể chứa PII.
      dataCollection: {
        // Không tự động điền thông tin người dùng từ nguồn khác — ta tự
        // đặt `user.id` (mã tài khoản) bằng `setSentryUser`.
        userInfo: false,
        cookies: false,
        httpHeaders: false,
        urlQueryParams: false,
        stackFrameVariables: false,
      },
      // Ẩn lỗi mạng tạm thời: chúng không phải lỗi của ứng dụng và sẽ làm
      // nhiễu danh sách issue.
      ignoreErrors: [
        'Failed to fetch',
        'NetworkError when attempting to fetch resource.',
        'Load failed',
        'ResizeObserver loop limit exceeded',
        'AbortError',
      ],
      beforeSend(event: unknown) {
        // Chế độ demo không gửi gì ra ngoài, kể cả khi DSN có trong cấu hình.
        if (OBSERVABILITY_CONTEXT.isDemoMode) return null;
        return event;
      },
    });

    // Session Replay chỉ bật khi được yêu cầu tường minh: nó ghi lại thao tác
    // của người dùng, nên phải là quyết định có chủ đích, không phải mặc định.
    //
    // Nạp từ **CDN của Sentry** (`lazyLoadIntegration`) thay vì đóng gói:
    // `@sentry/replay` + rrweb nặng ~265 kB, vượt hẳn phần ngân sách bundle
    // còn trống. Bản CDN chính thức của Sentry, tải lúc chạy, không vào
    // bundle — và chỉ tải khi thực sự bật Session Replay.
    //
    // Thứ tự quan trọng: phải `init` **trước**, vì `lazyLoadIntegration` cần
    // client đã có để đọc `cdnBaseUrl`; rồi thêm integration sau.
    if (SENTRY_REPLAYS_ENABLED && Sentry.lazyLoadIntegration) {
      try {
        const load = await Sentry.lazyLoadIntegration('replayIntegration');
        const replay = load({
          maskAllText: true,
          maskAllInputs: true,
          blockAllMedia: true,
        });
        Sentry.addIntegration?.(replay);
      } catch {
        /* Session Replay là tuỳ chọn: không có thì bỏ qua */
      }
    }
  })();
}

/**
 * Ghi nhận lỗi có ngữ cảnh.
 *
 * Dùng cho lỗi API: biết endpoint nào hỏng và mã HTTP nào giúp đội vận
 * hành xử lý nhanh hơn nhiều so với một stack trace không ngữ cảnh.
 */
export function captureApiError(
  error: unknown,
  context: { endpoint?: string; method?: string; status?: number; requestId?: string },
): void {
  if (!isSentryEnabled()) return;

  void (async () => {
    const Sentry = await loadSentry();
    if (!Sentry) return;

    Sentry.captureException(error, {
      tags: {
        ...(context.endpoint ? { endpoint: context.endpoint } : {}),
        ...(context.method ? { method: context.method } : {}),
        ...(context.status ? { http_status: String(context.status) } : {}),
      },
      extra: context.requestId ? { requestId: context.requestId } : undefined,
    });
  })();
}

/**
 * Ghi nhận lỗi không mong đợi (lỗi trong effect, callback ngoài promise).
 */
export function captureUnexpectedError(error: unknown, context?: Record<string, unknown>): void {
  if (!isSentryEnabled()) return;

  void (async () => {
    const Sentry = await loadSentry();
    if (!Sentry) return;

    Sentry.captureException(error, {
      ...(context ? { extra: context } : {}),
    });
  })();
}

/**
 * Đặt thông tin người dùng cho các lỗi sau này.
 *
 * Chỉ nhận mã tài khoản và vai trò — không PII.
 */
export function setSentryUser(userId: string | null, role?: string): void {
  if (!isSentryEnabled()) return;

  void (async () => {
    const Sentry = await loadSentry();
    if (!Sentry) return;

    if (!userId) {
      Sentry.setUser(null);
      return;
    }

    Sentry.setUser({ id: userId, ...(role ? { role } : {}) });
  })();
}

/**
 * Gắn breadcrumb tự do — dùng để dựng đường đi trước lỗi.
 *
 * `message` phải là mô tả ngắn, không chứa PII.
 */
export function addBreadcrumb(
  message: string,
  category = 'moonkage',
  data?: Record<string, string | number | boolean>,
): void {
  if (!isSentryEnabled()) return;

  void (async () => {
    const Sentry = await loadSentry();
    if (!Sentry) return;

    Sentry.addBreadcrumb({
      message,
      category,
      level: 'info',
      ...(data ? { data } : {}),
    });
  })();
}

/**
 * Bọc một hàm để bắt lỗi đồng bộ và bất đồng bộ.
 *
 * Dùng cho các callback không thuộc vòng đời React (event handler ngoài
 * component, hàm của thư viện bên thứ ba).
 */
export function withErrorCapture<T extends (...args: never[]) => unknown>(
  fn: T,
  context?: Record<string, unknown>,
): T {
  return function wrapped(this: unknown, ...args: never[]) {
    try {
      const result = fn.apply(this, args) as unknown;
      if (result instanceof Promise) {
        return result.catch((error: unknown) => {
          captureUnexpectedError(error, context);
          throw error;
        });
      }
      return result;
    } catch (error) {
      captureUnexpectedError(error, context);
      throw error;
    }
  } as T;
}
