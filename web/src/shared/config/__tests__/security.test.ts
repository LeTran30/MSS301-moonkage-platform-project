import { describe, it, expect, afterEach } from 'vitest';
import {
  apiConnectSources,
  buildCspHeader,
  applyCspMeta,
  cspConnectSources,
  cspImageSources,
  CSP_DIRECTIVES,
  SECURITY_HEADERS,
  apiCredentials,
  usesCookieAuth,
  AUTH_MODE,
} from '../security';

describe('Shared config - security', () => {
  afterEach(() => {
    document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.remove();
  });

  it('mặc định dùng chế độ bearer (hợp đồng hiện tại của backend)', () => {
    expect(AUTH_MODE).toBe('bearer');
    expect(usesCookieAuth()).toBe(false);
  });

  it('chế độ bearer không bật withCredentials', () => {
    expect(apiCredentials()).toEqual({ withCredentials: false });
  });

  it('CSP cấm inline script và eval', () => {
    const csp = buildCspHeader();
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain("script-src 'self' 'unsafe-eval'");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
  });

  it('CSP chặn plugin, iframe và base tag lạ', () => {
    const csp = buildCspHeader();
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
  });

  it('CSP cho phép Google Fonts và ảnh data/blob', () => {
    const csp = buildCspHeader();
    expect(csp).toContain('https://fonts.googleapis.com');
    expect(csp).toContain('https://fonts.gstatic.com');
    expect(csp).toContain("img-src 'self' data: blob:");
  });

  it('connect-src nhận thêm nguồn cho API gateway', () => {
    const csp = buildCspHeader(['https://api.moonkage.vn', 'wss://api.moonkage.vn']);
    expect(csp).toContain("connect-src 'self' https://api.moonkage.vn wss://api.moonkage.vn");
  });

  it('apiConnectSources lấy origin của gateway khác origin, bỏ qua URL tương đối', () => {
    expect(apiConnectSources('http://localhost:8080')).toEqual(['http://localhost:8080']);
    expect(apiConnectSources('https://api.moonkage.vn/v1/')).toEqual(['https://api.moonkage.vn']);
    expect(apiConnectSources('')).toEqual([]);
    expect(apiConnectSources('/api')).toEqual([]);
  });

  it('connect-src mặc định chỉ cho phép chính ứng dụng', () => {
    expect(buildCspHeader()).toContain("connect-src 'self'");
  });

  /*
   * `connect-src 'self'` một mình chặn mọi request XHR/fetch tới API gateway
   * (gateway khác origin vì khác cổng): trình duyệt báo "Network Error" và
   * mọi màn hình không tải được dữ liệu.
   */
  it('cspConnectSources khai báo origin của API gateway và WebSocket', () => {
    const sources = cspConnectSources();

    // `VITE_API_BASE_URL` của test là `http://gateway.test` (vite.config.ts).
    expect(sources).toContain('http://gateway.test');
    // Giao thức WebSocket phải được khai báo riêng: `http:` không mở `ws:`.
    expect(sources).toContain('ws://gateway.test');
  });

  it('cspConnectSources không sinh nguồn rỗng hay trùng lặp', () => {
    const sources = cspConnectSources();
    expect(sources.every((s) => s.length > 0)).toBe(true);
    expect(new Set(sources).size).toBe(sources.length);
  });

  it('applyCspMeta chèn nguồn API vào connect-src', () => {
    applyCspMeta(cspConnectSources());

    const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    expect(meta?.getAttribute('content')).toContain('http://gateway.test');
  });

  /*
   * Ảnh sản phẩm đến từ object storage (origin khác) nên `img-src` phải khai
   * báo thêm nguồn đó, nếu không mọi ảnh trong danh mục hiện ô trống.
   */
  it('cspImageSources khai báo origin của object storage', () => {
    expect(cspImageSources()).toContain('http://media.test');
  });

  it('buildCspHeader thêm nguồn ảnh vào img-src', () => {
    const csp = buildCspHeader([], ['http://media.test']);
    expect(csp).toContain("img-src 'self' data: blob: http://media.test");
  });

  it('applyCspMeta chèn nguồn ảnh vào img-src', () => {
    applyCspMeta([], ['http://media.test']);

    const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    expect(meta?.getAttribute('content')).toContain('http://media.test');
  });

  it('applyCspMeta chèn đúng một thẻ meta', () => {
    applyCspMeta();
    applyCspMeta();

    const metas = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
    expect(metas).toHaveLength(1);
    expect(metas[0].getAttribute('content')).toContain("default-src 'self'");
  });

  it('mọi directive đều không rỗng', () => {
    CSP_DIRECTIVES.forEach((directive) => {
      expect(directive.trim().length).toBeGreaterThan(0);
    });
  });

  it('có đủ header bảo mật chuẩn', () => {
    expect(SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff');
    expect(SECURITY_HEADERS['X-Frame-Options']).toBe('DENY');
    expect(SECURITY_HEADERS['Referrer-Policy']).toBeTruthy();
    expect(SECURITY_HEADERS['Permissions-Policy']).toBeTruthy();
    expect(SECURITY_HEADERS['Strict-Transport-Security']).toContain('max-age=');
  });
});
