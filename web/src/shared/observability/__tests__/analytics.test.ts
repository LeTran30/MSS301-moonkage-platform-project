import { describe, it, expect, beforeEach } from 'vitest';
import {
  ANALYTICS_EVENTS,
  sanitizeProperties,
  trackEvent,
  trackPageView,
  identifyUser,
  resetUser,
  setAnalyticsConsent,
  isAnalyticsActive,
  initAnalytics,
} from '../analytics';

/**
 * Analytics phải tôn trọng ranh giới dữ liệu của NFR-03: không PII.
 *
 * Đây là bộ test cho **hàng rào cuối cùng** — `sanitizeProperties`. Kể cả khi
 * nơi gọi truyền PII, hàng rào này phải chặn lại.
 */
describe('sanitizeProperties', () => {
  it('giữ lại thuộc tính vô hại', () => {
    const result = sanitizeProperties({
      product_id: 'prod_01',
      quantity: 2,
      role: 'BUYER',
      is_demo: false,
    });

    expect(result).toEqual({
      product_id: 'prod_01',
      quantity: 2,
      role: 'BUYER',
      is_demo: false,
    });
  });

  it('bỏ thuộc tính chứa PII', () => {
    const result = sanitizeProperties({
      email: 'an@example.com',
      phone: '0901234567',
      name: 'Nguyễn Văn A',
      address: '12 Lê Lợi',
      idcard: '079012345678',
      taxcode: 'TAX001',
      product_id: 'prod_01',
    });

    expect(result).toEqual({ product_id: 'prod_01' });
  });

  it('bỏ thuộc tính PII bất kể cách viết tên', () => {
    // Tên thuộc tính thường viết camelCase hoặc có dấu gạch — so khớp phải
    // bỏ qua mọi ký tự không phải chữ cái.
    const result = sanitizeProperties({
      emailAddress: 'an@example.com',
      phoneNumber: '0901234567',
      full_name: 'Nguyễn Văn A',
      'phone-number': '0901234567',
      ACCESS_TOKEN: 'secret',
      product_id: 'prod_01',
    });

    expect(result).toEqual({ product_id: 'prod_01' });
  });

  it('bỏ giá trị undefined', () => {
    expect(sanitizeProperties({ a: undefined, b: 1 })).toEqual({ b: 1 });
  });

  it('cắt ngắn chuỗi quá dài', () => {
    const long = 'x'.repeat(500);
    const result = sanitizeProperties({ note: long });

    expect(result.note).toHaveLength(100);
  });
});

describe('analytics khi chưa bật', () => {
  beforeEach(() => {
    setAnalyticsConsent(true);
  });

  it('không gửi gì khi chưa khởi tạo', () => {
    expect(isAnalyticsActive()).toBe(false);
    // Không ném lỗi — analytics hỏng không được làm hỏng luồng nghiệp vụ.
    expect(() => trackEvent(ANALYTICS_EVENTS.addToCart, { product_id: 'p1' })).not.toThrow();
    expect(() => trackPageView('/san-pham')).not.toThrow();
    expect(() => identifyUser('acc_1')).not.toThrow();
    expect(() => resetUser()).not.toThrow();
  });
});

describe('analytics khi đã bật', () => {
  beforeEach(() => {
    // measurement id giả; `gtag` được nạp động nên không có request nào đi ra.
    initAnalytics('G-TEST123', 'https://example.invalid');
  });

  it('đẩy sự kiện vào dataLayer', () => {
    const layer = (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];

    trackEvent(ANALYTICS_EVENTS.addToCart, {
      product_id: 'prod_01',
      quantity: 2,
    });

    expect(layer.length).toBeGreaterThan(0);
    const last = layer[layer.length - 1] as unknown[];
    expect(last[0]).toBe('event');
    expect(last[1]).toBe(ANALYTICS_EVENTS.addToCart);
  });

  it('lọc PII trước khi gửi', () => {
    const layer = (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];

    trackEvent(ANALYTICS_EVENTS.login, {
      email: 'an@example.com',
      role: 'BUYER',
    });

    const last = layer[layer.length - 1] as unknown[];
    const params = last[2] as Record<string, unknown>;
    expect(params.email).toBeUndefined();
    expect(params.role).toBe('BUYER');
  });

  it('gửi page_view với mẫu route', () => {
    const layer = (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];

    trackPageView('/san-pham/:id', 'Sản phẩm');

    const last = layer[layer.length - 1] as unknown[];
    expect(last[0]).toBe('event');
    expect(last[1]).toBe(ANALYTICS_EVENTS.pageView);
    const params = last[2] as Record<string, unknown>;
    expect(params.page_path).toBe('/san-pham/:id');
  });
});

describe('setAnalyticsConsent', () => {
  it('dừng gửi khi người dùng từ chối', () => {
    initAnalytics('G-TEST123', 'https://example.invalid');
    setAnalyticsConsent(false);

    expect(isAnalyticsActive()).toBe(false);
    expect(() => trackEvent(ANALYTICS_EVENTS.addToCart)).not.toThrow();
  });
});
