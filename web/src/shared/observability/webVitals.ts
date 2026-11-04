/**
 * Core Web Vitals — đo performance thực tế của người dùng.
 *
 * Vì sao cần: bản đánh giá FE khuyến nghị thêm `web-vitals` để đo
 * LCP/CLS/INP **trước khi** tối ưu. Không có số liệu thì mọi thứ "tối ưu"
 * chỉ là cảm tính.
 *
 * Vì sao gửi sang Sentry: cùng một nơi để đội vận hành nhìn thấy "lỗi này
 * xảy ra ở trang nào và trang đó chậm bao nhiêu". Nếu có analytics riêng thì
 * phải đối chiếu hai bảng báo cáo — vướng.
 *
 * Ngưỡng đánh giá (theo Core Web Vitals của Google):
 * - LCP ≤ 2500 ms: tải nhanh
 * - INP ≤ 200 ms: tương tác nhanh
 * - CLS ≤ 0.1: không dịch layout đột ngột
 */
import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';
import { addBreadcrumb } from './sentry';

/** Ngưỡng "tốt" của từng chỉ số. */
const GOOD_THRESHOLDS: Record<string, number> = {
  LCP: 2500,
  INP: 200,
  CLS: 0.1,
  FCP: 1800,
  TTFB: 800,
};

/**
 * Chỉ số có vượt ngưỡng "tốt" không?
 *
 * CLS dùng đơn vị không phải mili giây nên không so trực tiếp với bảng trên;
 * ta xử lý riêng.
 */
export function isPoorMetric(metric: Metric): boolean {
  if (metric.name === 'CLS') {
    return metric.value > GOOD_THRESHOLDS.CLS;
  }
  const threshold = GOOD_THRESHOLDS[metric.name];
  if (threshold === undefined) return false;
  return metric.value > threshold;
}

/**
 * Ghi một chỉ số.
 *
 * Chỉ số tốt thì không ghi — chỉ số xấu mới đáng báo để điều tra. Ghi mọi
 * chỉ số sẽ làm ngập breadcrumb và không giúp ích gì.
 */
function report(metric: Metric): void {
  if (!isPoorMetric(metric)) return;

  // `CLS` là đơn vị không phải ms — ghi rõ để không gây hiểu nhầm.
  const unit = metric.name === 'CLS' ? '' : 'ms';
  const rating = metric.name === 'CLS' ? metric.value.toFixed(3) : Math.round(metric.value);

  addBreadcrumb(`Web vital ${metric.name}=${rating}${unit}`, 'web-vitals', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    route: metric.navigationType,
  });
}

/**
 * Bắt đầu đo Core Web Vitals.
 *
 * Gọi một lần lúc khởi động ứng dụng. Hàm an toàn khi gọi nhiều lần: `web-vitals`
 * tự bỏ qua lần gọi sau.
 */
export function initWebVitals(): void {
  if (typeof window === 'undefined') return;

  try {
    onLCP(report);
    onINP(report);
    onCLS(report);
    onFCP(report);
    onTTFB(report);
  } catch {
    /* trình duyệt không hỗ trợ PerformanceObserver thì bỏ qua */
  }
}
