/**
 * Analytics — sự kiện hành trình người dùng (funnel, tỷ lệ chuyển đổi).
 *
 * Vì sao tự viết thay vì dùng thư viện:
 * - Bundle đang ở 948 kB / ngân sách 1100 kB; một SDK analytics nặng sẽ ăn mất
 *   phần ngân sách còn lại mà không đổi được quyết định sản phẩm nào.
 * - Ta chỉ cần `page_view` + một danh sách sự kiện nghiệp vụ; phần đó vừa đủ
 *   để dựng funnel mà không cần toàn bộ bộ tính năng của một SDK.
 *
 * Vì sao GA4 và không phải tự gửi `POST`:
 * - GA4 có sẵn báo cáo funnel, giữ chân, và cohort — thứ ta cần để ra quyết
 *   định dựa trên dữ liệu, đúng điểm yếu đã ghi trong bản đánh giá FE.
 * - `gtag.js` được nạp **động** (chỉ khi đã bật), nên app vẫn chạy bình thường
 *   khi không có analytics.
 *
 * Ranh giới dữ liệu (NFR-03):
 * - Chỉ gửi: tên route, hành động của người dùng, mã định danh giả của
 *   phiên. **Không** gửi tên, email, số điện thoại, địa chỉ, nội dung form,
 *   hay số tiền.
 * - Mọi thuộc tính đều được lọc qua `sanitizeProperties` trước khi gửi.
 */

/** Tên sự kiện analytics — dùng để thống nhất, tránh gõ sai chuỗi. */
export const ANALYTICS_EVENTS = {
  /** Người dùng xem một trang. */
  pageView: 'page_view',
  /** Người dùng thêm sản phẩm vào giỏ (FR-08). */
  addToCart: 'add_to_cart',
  /** Người dùng bắt đầu thanh toán (FR-09). */
  beginCheckout: 'begin_checkout',
  /** Thanh toán thành công (FR-09, IPN). */
  purchase: 'purchase',
  /** Người dùng đăng nhập (FR-01). */
  login: 'login',
  /** Người dùng gửi yêu cầu báo giá (FR-16). */
  submitQuoteRequest: 'submit_quote_request',
  /** Người dùng chấp nhận báo giá (FR-19). */
  acceptQuote: 'accept_quote',
  /** Người dùng mở khiếu nại (FR-12). */
  openDispute: 'open_dispute',
  /** Quản trị phân xử khiếu nại (FR-49). */
  resolveDispute: 'resolve_dispute',
  /** Người bán gửi yêu cầu giải ngân (FR-41). */
  requestDisbursement: 'request_disbursement',
  /** Quản trị duyệt giải ngân (FR-47). */
  approveDisbursement: 'approve_disbursement',
  /** Người bán đăng / sửa sản phẩm (FR-29, FR-33). */
  saveProduct: 'save_product',
  /** Người bán ẩn / hiện sản phẩm (FR-34). */
  changeProductStatus: 'change_product_status',
  /** Quản trị duyệt hồ sơ người bán (FR-45). */
  reviewVendorApplication: 'review_vendor_application',
  /** Người dùng xác minh NFC (FR-04). */
  verifyNfc: 'verify_nfc',
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/** Thuộc tính sự kiện. Chỉ giá trị vô hại (số, chuỗi ngắn, boolean). */
export type AnalyticsProperties = Record<string, string | number | boolean | undefined>;

/** Kiểu hàm của `gtag` mà ta gọi. */
type GtagFn = (command: string, target?: unknown, ...args: unknown[]) => void;

interface AnalyticsState {
  /** Measurement ID đang dùng; rỗng nghĩa là chưa bật. */
  measurementId: string;
  /** Hàm `gtag` đã nạp; null khi script chưa sẵn sàng. */
  gtag: GtagFn | null;
  /** Sự kiện gửi trước khi script nạp xong. */
  queue: Array<{ event: string; params: AnalyticsProperties }>;
  /** Người dùng đã đồng ý hay chưa. */
  consented: boolean;
  /** Id phiên giả — không gắn với tài khoản thật. */
  sessionId: string;
  /** Đã khởi tạo hay chưa (tránh nạp script hai lần). */
  initialized: boolean;
}

/**
 * Khoảng trạng của analytics.
 *
 * Không dùng `localStorage`: sự kiện analytics là dữ liệu phiên, không cần
 * sống lâu, và giữ nó trong bộ nhớ giúp nướng bánh chạy sạch khi đóng tab.
 */
const state: AnalyticsState = {
  measurementId: '',
  gtag: null,
  queue: [],
  consented: false,
  sessionId: '',
  initialized: false,
};

/**
 * Cho phép các thuộc tính được gửi đi.
 *
 * Danh sách chặn tường minh: kẻ xấu có thể gọi `trackEvent` với dữ liệu tùy ý,
 * nên ta chặn theo *tên* thuộc tính chứ không chỉ dựa vào lời gọi đúng.
 */
const BLOCKED_PROPERTY_KEYS = new Set([
  'email',
  'emailaddress',
  'name',
  'fullname',
  'firstname',
  'lastname',
  'phone',
  'phonenumber',
  'address',
  'addressline',
  'idcard',
  'idcardnumber',
  'taxcode',
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
]);

/** Giá trị quá dài bị cắt bớt — không gửi chuỗi dài lên phía server. */
const MAX_PROPERTY_LENGTH = 100;

/**
 * Lọc thuộc tính trước khi gửi.
 *
 * Bỏ mọi thuộc tính có tên trong danh sách chặn, cắt ngắn chuỗi dài, và bỏ
 * giá trị `undefined`. Đây là **hàng rào cuối cùng** — nơi gọi cũng phải tự
 * không truyền PII, nhưng nếu ai đó vô tình truyền, hàng rào này chặn lại.
 */
export function sanitizeProperties(properties: AnalyticsProperties): AnalyticsProperties {
  const clean: AnalyticsProperties = {};

  for (const [key, value] of Object.entries(properties)) {
    if (value === undefined) continue;

    const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, '');
    if (BLOCKED_PROPERTY_KEYS.has(normalizedKey)) continue;

    if (typeof value === 'string') {
      clean[key] = value.length > MAX_PROPERTY_LENGTH ? value.slice(0, MAX_PROPERTY_LENGTH) : value;
      continue;
    }

    clean[key] = value;
  }

  return clean;
}

/**
 * Tạo id phiên giả.
 *
 * Id này chỉ dùng để gom nhóm sự kiện của một phiên duyệt; nó không phải
 * mã tài khoản và không được dùng để định danh người dùng.
 */
function createSessionId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `s-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Khởi tạo analytics.
 *
 * @param measurementId GA4 measurement ID; rỗng = không làm gì.
 * @param host GA4 host (ví dụ `https://analytics.google.com`).
 * @param consent Đã có sự đồng ý của người dùng chưa.
 *
 * Hàm **không ném lỗi**: analytics hỏng không được làm hỏng ứng dụng.
 */
export function initAnalytics(
  measurementId: string,
  host?: string,
  consent = true,
): void {
  if (!measurementId || typeof window === 'undefined') return;

  state.measurementId = measurementId;
  state.consented = consent;
  state.sessionId = createSessionId();

  if (!consent) return;
  if (state.initialized) return;
  state.initialized = true;

  const origin = host || 'https://www.googletagmanager.com';
  const script = document.createElement('script');
  script.async = true;
  script.src = `${origin}/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.dataset.gtag = 'moonkage-analytics';
  document.head.appendChild(script);

  // `gtag` phải tồn tại **trước** khi script tải xong, nếu không GA4 mất
  // các sự kiện đầu tiên (page_view đầu tiên là quan trọng nhất).
  state.gtag = function gtag(...args: Parameters<GtagFn>) {
    // eslint-disable-next-line prefer-rest-params
    (window as unknown as { dataLayer?: unknown[] }).dataLayer = (
      window as unknown as { dataLayer?: unknown[] }
    ).dataLayer || [];
    (window as unknown as { dataLayer: unknown[] }).dataLayer.push(args);
  };

  state.gtag('js', new Date());
  // `client_storage: 'none'` — GA4 ở chế độ cookieless, không đặt cookie.
  state.gtag('config', measurementId, {
    client_storage: 'none',
    send_page_view: false,
  });
  // Gửi nốt những sự kiện đã xếp hàng trước khi script sẵn sàng.
  flushQueue();
}

/** Gửi các sự kiện đang xếp hàng. */
function flushQueue(): void {
  if (!state.gtag) return;
  const pending = state.queue;
  state.queue = [];
  pending.forEach(({ event, params }) => {
    state.gtag?.('event', event, params);
  });
}

/**
 * Ghi nhận (hoặc thu hồi) sự đồng ý của người dùng.
 *
 * Ứng dụng hiện chưa có banner cookie; hàm này để sẵn đường cho banner đó:
 * gọi `setAnalyticsConsent(false)` khi người dùng từ chối, và lúc đó mọi
 * sự kiện sẽ bị bỏ qua.
 */
export function setAnalyticsConsent(consented: boolean): void {
  state.consented = consented;
  if (!consented) {
    state.queue = [];
  }
}

/** Analytics đang bật hay không? */
export function isAnalyticsActive(): boolean {
  return Boolean(state.measurementId && state.consented);
}

/**
 * Gửi một sự kiện.
 *
 * Hàm không bao giờ ném lỗi — một sự kiện analytics hỏng không được phép làm
 * hỏng luồng nghiệp vụ đang chạy.
 */
export function trackEvent(event: AnalyticsEventName, properties: AnalyticsProperties = {}): void {
  if (!isAnalyticsActive()) return;

  const params = sanitizeProperties(properties);

  if (!state.gtag) {
    // Script chưa nạp xong: xếp hàng, đợi `flushQueue`.
    state.queue.push({ event, params });
    return;
  }

  try {
    state.gtag('event', event, params);
  } catch {
    /* analytics hỏng không được ảnh hưởng ứng dụng */
  }
}

/**
 * Gửi sự kiện xem trang.
 *
 * `pagePath` phải là **mẫu route** (ví dụ `/san-pham/:id`) chứ không phải URL
 * thật, để một trang có nhiều bản ghi không bị tách thành nhiều trang trong
 * báo cáo. Bản thân route được React Router cung cấp; hàm này chỉ nhận đường
 * dẫn đã đã chuẩn hóa.
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  if (!isAnalyticsActive()) return;

  trackEvent(ANALYTICS_EVENTS.pageView, {
    page_path: pagePath,
    page_title: pageTitle,
    session_id: state.sessionId,
  });
}

/**
 * Đặt thuộc tính người dùng cho các sự kiện sau.
 *
 * Chỉ nhận thông tin **không phải PII**: mã tài khoản đã băm hoặc mã giả và
 * vai trò. Không bao giờ truyền tên, email hay số điện thoại.
 */
export function identifyUser(userId: string, role?: string): void {
  if (!isAnalyticsActive()) return;
  if (!state.gtag) return;

  try {
    state.gtag('set', 'user_id', userId);
    if (role) {
      state.gtag('set', 'user_properties', { user_role: role });
    }
  } catch {
    /* bỏ qua */
  }
}

/**
 * Xoá định danh khi người dùng đăng xuất.
 *
 * Quan trọng cho quyền riêng tư: sự kiện sau khi đăng xuất không được gắn
 * với tài khoản trước đó.
 */
export function resetUser(): void {
  if (!isAnalyticsActive()) return;
  if (!state.gtag) return;

  try {
    state.gtag('set', 'user_id', undefined);
    state.gtag('set', 'user_properties', {});
  } catch {
    /* bỏ qua */
  }
}
