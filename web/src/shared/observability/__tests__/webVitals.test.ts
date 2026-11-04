import { describe, it, expect } from 'vitest';
import type { Metric } from 'web-vitals';
import { isPoorMetric } from '../webVitals';

/**
 * Ngưỡng "tốt" của Core Web Vitals — bộ test giữ cho bảng ngưỡng khỏi trôi
 * khỏi chỗ vô tình.
 */
function metric(name: string, value: number): Metric {
  return {
    name,
    value,
    rating: 'needs-improvement',
    delta: value,
    id: `${name}-${value}`,
    navigationType: 'navigate',
    entries: [],
  } as unknown as Metric;
}

describe('isPoorMetric', () => {
  it('LCP dưới 2500ms là tốt', () => {
    expect(isPoorMetric(metric('LCP', 1800))).toBe(false);
  });

  it('LCP trên 2500ms là xấu', () => {
    expect(isPoorMetric(metric('LCP', 3200))).toBe(true);
  });

  it('INP dưới 200ms là tốt', () => {
    expect(isPoorMetric(metric('INP', 120))).toBe(false);
  });

  it('INP trên 200ms là xấu', () => {
    expect(isPoorMetric(metric('INP', 450))).toBe(true);
  });

  it('CLS dùng đơn vị riêng, không so với mili giây', () => {
    expect(isPoorMetric(metric('CLS', 0.05))).toBe(false);
    expect(isPoorMetric(metric('CLS', 0.25))).toBe(true);
  });

  it('FCP trên 1800ms là xấu', () => {
    expect(isPoorMetric(metric('FCP', 2000))).toBe(true);
  });

  it('TTFB trên 800ms là xấu', () => {
    expect(isPoorMetric(metric('TTFB', 1200))).toBe(true);
  });

  it('chỉ số lạ không bị coi là xấu', () => {
    expect(isPoorMetric(metric('UNKNOWN', 99999))).toBe(false);
  });
});
