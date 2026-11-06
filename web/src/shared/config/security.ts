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
  'upgrade-insecure-requests',
];

/**
 * Directive **chỉ dùng được ở header HTTP**, không dùng được trong thẻ `<meta>`.
 *
 * `frame-ancestors` bị trình duyệt bỏ qua khi đặt trong `<meta>` (và trình duyệt
 * còn báo lỗi console). Những directive này buộc phải cấu hình ở web server.
 */
export const HEADER_ONLY_DIRECTIVES: readonly string[] = ['frame-ancestors \'none\''];

/**
 * The origin of the API gateway, when it is not the app's own: the CSP must let
 * the app connect to it. A relative or empty base URL needs nothing extra.
 */
export function apiConnectSources(apiBaseUrl: string): string[] {
  if (!/^https?:\/\//i.test(apiBaseUrl)) return [];
  try {
    return [new URL(apiBaseUrl).origin];
  } catch {
    return [];
  }
}

/** Chuỗi header CSP đầy đủ, dùng khi cấu hình web server. */
export function buildCspHeader(extraConnectSources: readonly string[] = []): string {
  const connect = ["'self'", ...extraConnectSources];
  const directives = [...CSP_DIRECTIVES, ...HEADER_ONLY_DIRECTIVES];
  return directives.map((directive) => {
    if (directive.startsWith('connect-src')) {
      return `connect-src ${connect.join(' ')}`;
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
 */
export function applyCspMeta(extraConnectSources: readonly string[] = []): void {
  if (typeof document === 'undefined') return;
  if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) return;

  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  // Chỉ dùng directive hợp lệ với thẻ `<meta>`.
  meta.content = CSP_DIRECTIVES.map((directive) => {
    if (directive.startsWith('connect-src')) {
      return `connect-src 'self' ${extraConnectSources.join(' ')}`.trim();
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
