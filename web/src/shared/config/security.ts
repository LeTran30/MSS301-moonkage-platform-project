/**
 * Cấu hình bảo mật phía trình duyệt.
 *
 * Gói này gom những cài đặt bảo mật mà trình duyệt phải tuân thủ:
 * 1. `withCredentials` + cookie `HttpOnly` (hợp đồng với backend)
 * 2. Chính sách CSP (Content-Security-Policy)
 *
 * Vì sao cần `withCredentials`: khi backend chuyển sang cookie
 * `HttpOnly; Secure; SameSite=Strict`, trình duyệt **không** gửi cookie khi
 * `fetch`/`XHR` không có `withCredentials`. Đó là lý do `sameSite: 'strict'`
 * vẫn dùng được: cookie đi cùng origin nên không cần `SameSite=None`.
 */

/** Chế độ xác thực của ứng dụng. */
export type AuthMode =
  /** Bearer token trong header (mặc định, hợp đồng hiện tại của backend). */
  | 'bearer'
  /** Cookie `HttpOnly` do backend quản lý (khuyến nghị cho production). */
  | 'cookie';

const env = (typeof import.meta !== 'undefined' && import.meta.env
  ? import.meta.env
  : {}) as Record<string, string | undefined>;

/**
 * Chế độ xác thực, đọc từ `VITE_AUTH_MODE`.
 *
 * - `bearer` (mặc định): token trong header `Authorization`.
 * - `cookie`: không đụng tới token; mọi request đi kèm cookie của backend.
 */
export const AUTH_MODE: AuthMode = env.VITE_AUTH_MODE === 'cookie' ? 'cookie' : 'bearer';

/** Có dùng cookie `HttpOnly` không? */
export function usesCookieAuth(): boolean {
  return AUTH_MODE === 'cookie';
}

/**
 * `withCredentials` cho mọi request tới API Gateway.
 *
 * Chỉ bật khi dùng cookie: bật vô điều kiện sẽ khiến CORS phải trả
 * `Access-Control-Allow-Credentials: true` và `Access-Control-Allow-Origin`
 * không được là `*` — một ràng buộc server chặt hơn, không cần thiết khi
 * vẫn dùng Bearer token.
 */
export function apiCredentials(): { withCredentials: boolean } {
  return { withCredentials: usesCookieAuth() };
}

/**
 * Chính sách CSP của ứng dụng.
 *
 * Đây là nội dung của header `Content-Security-Policy` mà web server / CDN nên
 * gửi. Vite không thể tự gắn header HTTP cho file tĩnh, nên:
 * - Ở **development**: không áp dụng (vite dev server cần `eval` cho HMR).
 * - Ở **production**: đặt header này ở nginx / Cloudflare / Netlify.
 *
 * Các nguồn được phép:
 * - `default-src 'self'` — chỉ chính ứng dụng.
 * - `script-src 'self'` — không cho inline script, không cho `unsafe-eval`.
 *   Đây là hàng rào quan trọng nhất chống XSS.
 * - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` — React
 *   set inline style, và Google Fonts cấp CSS.
 * - `font-src 'self' https://fonts.gstatic.com` — font tải từ Google.
 * - `img-src 'self' data: blob:` — ảnh sản phẩm có thể là data URI/blob.
 * - `connect-src 'self'` + API gateway + WebSocket — kết nối realtime.
 * - `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'` —
 *   chặn plugin, chặn nhúng, chặn iframe.
 *
 * Lưu ý: `upgrade-insecure-requests` **không** nằm trong danh sách này — xem
 * `UPGRADE_INSECURE_REQUESTS` để hiểu vì sao.
 */
export const CSP_DIRECTIVES: readonly string[] = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
];

/**
 * Directive `upgrade-insecure-requests`, tách riêng khỏi `CSP_DIRECTIVES`.
 *
 * **Vì sao tách riêng — điểm dễ tái phát nhất của toàn bộ chính sách CSP:**
 *
 * `upgrade-insecure-requests` bảo trình duyệt nâng mọi request `http://`
 * lên `https://`. Điều đó chỉ đúng khi **trang** được phục vụ qua HTTPS và
 * mọi backend đã sẵn sàng phục vụ HTTPS.
 *
 * Ở môi trường local / CI / E2E, trang được phục vụ bằng `vite preview` tại
 * `http://127.0.0.1:4173`. Origin đó là "potentially trustworthy" (127.0.0.1
 * là loopback) nên vẫn là secure context ⇒ trình duyệt **vẫn áp dụng**
 * directive này ⇒ mọi request `http://127.0.0.1:8080` (API gateway, chạy
 * HTTP trong docker compose) bị nâng thành `https://127.0.0.1:8080`.
 *
 * Nếu `connect-src` chỉ khai báo `http://...`, trình duyệt chặn request ⇒
 * danh mục rỗng, màn hình trắng, và log console đầy lỗi CSP. Đó chính là
 * lỗi đã gặp ở E2E.
 *
 * Vì vậy:
 * - `buildCspHeader()` (header HTTP ở nginx/CDN, luôn là production) **giữ**
 *   directive này — đó là chuẩn production.
 * - `applyCspMeta()` (thẻ `<meta>`, chỉ bổ sung) **chỉ thêm** directive này
 *   khi trang đang chạy trên origin HTTPS (`window.location.protocol ===
 *   'https:'`). Ở origin HTTP thì thêm vào chỉ gây hỏng.
 *
 * **Không bao giờ** thêm `upgrade-insecure-requests` trực tiếp vào
 * `CSP_DIRECTIVES` — hãy dùng `applyCspMeta()`/`buildCspHeader()`.
 */
export const UPGRADE_INSECURE_REQUESTS = 'upgrade-insecure-requests';

/**
 * Trang hiện tại có đang chạy trên origin HTTPS không?
 *
 * Dùng để quyết định có thêm `upgrade-insecure-requests` vào CSP meta hay
 * không. Trả về `false` khi không có `window` (SSR/test) hoặc khi origin là
 * HTTP.
 *
 * Tham số `protocol` cho phép kiểm thử các nhánh khác nhau mà không phải
 * giả lập `window.location`.
 */
export function isSecureOrigin(protocol?: string): boolean {
  const value =
    protocol ??
    (typeof window !== 'undefined' && window.location ? window.location.protocol : undefined);
  return value === 'https:';
}

/**
 * Directive **chỉ dùng được ở header HTTP**, không dùng được trong thẻ `<meta>`.
 *
 * `frame-ancestors` bị trình duyệt bỏ qua khi đặt trong `<meta>` (và trình duyệt
 * còn báo lỗi console). Những directive này buộc phải cấu hình ở web server.
 */
export const HEADER_ONLY_DIRECTIVES: readonly string[] = ['frame-ancestors \'none\''];

/**
 * Các nguồn `connect-src` phải khai báo cho CSP.
 *
 * `connect-src 'self'` một mình chặn mọi request XHR/fetch tới API gateway:
 * trình duyệt báo "Network Error" và mọi màn hình không tải được dữ liệu.
 * Gateway là nguồn khác origin (khác cổng), nên phải nêu tường minh.
 *
 * Lấy từ `VITE_API_BASE_URL` / `VITE_WS_URL` — cùng nguồn với phần cấu hình
 * mà `apiClient` dùng, nên CSP không bao giờ lệch với nơi app thực sự gọi.
 */
export function cspConnectSources(): string[] {
  const sources = new Set<string>();

  const apiBase = env.VITE_API_BASE_URL?.trim();
  if (apiBase) {
    try {
      const url = new URL(apiBase);
      sources.add(url.origin);
      // `http://host:8080` không cho phép `ws://host:8080/ws`; phải khai báo
      // riêng giao thức WebSocket.
      if (url.protocol === 'http:') sources.add(`ws://${url.host}`);
      if (url.protocol === 'https:') sources.add(`wss://${url.host}`);
    } catch {
      // `VITE_API_BASE_URL` không phải URL hợp lệ: bỏ qua, CSP sẽ chặn và báo lỗi.
    }
  }

  const wsUrl = env.VITE_WS_URL?.trim();
  if (wsUrl) {
    try {
      sources.add(new URL(wsUrl).origin);
    } catch {
      // Bỏ qua URL WebSocket không hợp lệ.
    }
  }

  /*
   * Khai báo **cả hai** biến thể `http://`/`https://` (và `ws://`/`wss://`)
   * cho cùng host.
   *
   * Khi trang được phục vụ qua HTTPS, `upgrade-insecure-requests` (trong header
   * HTTP production) nâng request `http://api` thành `https://api` — nếu
   * `connect-src` chỉ có `http://api` thì CSP chặn chính request đó. Ngược
   * lại, khi trang chạy ở origin HTTP (local/CI/E2E) và gateway chỉ phục vụ
   * HTTP thì `https://api` không dùng được.
   *
   * Khai báo cả hai ⇒ CSP không bao giờ lệch với giao thức thực tế, dù
   * trang/gateway chạy HTTP hay HTTPS.
   */
  for (const source of [...sources]) {
    if (source.startsWith('http://')) {
      sources.add(`https://${source.slice('http://'.length)}`);
    } else if (source.startsWith('https://')) {
      sources.add(`http://${source.slice('https://'.length)}`);
    }
    if (source.startsWith('ws://')) {
      sources.add(`wss://${source.slice('ws://'.length)}`);
    } else if (source.startsWith('wss://')) {
      sources.add(`ws://${source.slice('wss://'.length)}`);
    }
  }

  return [...sources];
}

/**
 * Các nguồn `img-src` phải khai báo cho CSP.
 *
 * Ảnh sản phẩm / ảnh báo giá được backend trả về từ MinIO (object storage),
 * tức là một origin khác — `img-src 'self' data: blob:` chặn chúng và mọi
 * ảnh trong danh mục hiện ô trống.
 *
 * `VITE_MEDIA_BASE_URL` khai báo origin đó. Nếu backend trả ảnh từ nhiều host
 * khác nhau (CDN riêng, domain khác), liệt kê từng origin, phân tách bằng dấu
 * phẩy.
 */
export function cspImageSources(): string[] {
  const raw = env.VITE_MEDIA_BASE_URL?.trim();
  if (!raw) return [];

  const sources = new Set<string>();
  for (const candidate of raw.split(',')) {
    const value = candidate.trim();
    if (!value) continue;
    try {
      sources.add(new URL(value).origin);
    } catch {
      // Bỏ qua origin không hợp lệ.
    }
  }
  return [...sources];
}

/**
 * Chuỗi header CSP đầy đủ, dùng khi cấu hình web server.
 *
 * Header HTTP là nơi **duy nhất** `upgrade-insecure-requests` được phép xuất
 * hiện: nó chỉ có nghĩa khi trang được phục vụ qua HTTPS (production), và
 * đó là chuẩn production. Xem `UPGRADE_INSECURE_REQUESTS` để hiểu vì sao
 * không bỏ directive này khỏi header.
 */
export function buildCspHeader(
  extraConnectSources: readonly string[] = [],
  extraImageSources: readonly string[] = [],
): string {
  const connect = ["'self'", ...extraConnectSources];
  const images = ["'self'", 'data:', 'blob:', ...extraImageSources];
  const directives = [...CSP_DIRECTIVES, UPGRADE_INSECURE_REQUESTS, ...HEADER_ONLY_DIRECTIVES];
  return directives.map((directive) => {
    if (directive.startsWith('connect-src')) {
      return `connect-src ${connect.join(' ')}`;
    }
    if (directive.startsWith('img-src')) {
      return `img-src ${images.join(' ')}`;
    }
    return directive;
  }).join('; ');
}

/**
 * Áp dụng CSP qua thẻ `<meta>`.
 *
 * Chỉ là **bổ sung**, không thay thế header HTTP: thẻ `<meta>` không hỗ trợ
 * `frame-ancestors`, `report-uri` và `sandbox`, và nhiều trình duyệt bỏ qua nó.
 * Cách đúng vẫn là header ở server. Hàm này giúp ứng dụng không trần khi
 * deploy ở nơi không cấu hình được header (ví dụ hosting tĩnh đơn giản).
 *
 * `upgrade-insecure-requests` chỉ được thêm khi trang đang chạy trên origin
 * **HTTPS**. Ở origin HTTP (local/CI/E2E) directive này sẽ nâng request
 * `http://` của backend lên `https://` và chặn chính request đó — xem
 * `UPGRADE_INSECURE_REQUESTS`.
 */
export function applyCspMeta(
  extraConnectSources: readonly string[] = [],
  extraImageSources: readonly string[] = [],
  originProtocol?: string,
): void {
  if (typeof document === 'undefined') return;
  if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) return;

  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  // Chỉ dùng directive hợp lệ với thẻ `<meta>`.
  const directives = [...CSP_DIRECTIVES];
  if (isSecureOrigin(originProtocol)) directives.push(UPGRADE_INSECURE_REQUESTS);
  meta.content = directives.map((directive) => {
    if (directive.startsWith('connect-src')) {
      return `connect-src 'self' ${extraConnectSources.join(' ')}`.trim();
    }
    if (directive.startsWith('img-src')) {
      return `img-src 'self' data: blob: ${extraImageSources.join(' ')}`.trim();
    }
    return directive;
  }).join('; ');
  document.head.appendChild(meta);
}

/**
 * Header bảo mật khác nên gửi kèm ở production.
 *
 * Ghi ra đây để cấu hình server không bị bỏ sót, và để tài liệu đánh giá
 * đối chiếu được.
 */
export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(self), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};
