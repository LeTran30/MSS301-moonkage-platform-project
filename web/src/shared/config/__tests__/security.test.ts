import { describe, it, expect, afterEach } from 'vitest';
import {
  buildCspHeader,
  applyCspMeta,
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

  it('connect-src mặc định chỉ cho phép chính ứng dụng', () => {
    expect(buildCspHeader()).toContain("connect-src 'self'");
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
