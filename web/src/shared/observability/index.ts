/**
 * Observability — lớp vận hành của frontend.
 *
 * Gồm ba phần, tất cả đều **opt-in** (không có cấu hình thì không gửi gì):
 * - `sentry.ts` — báo cáo lỗi production.
 * - `analytics.ts` — sự kiện hành trình người dùng để dựng funnel.
 * - `webVitals.ts` — đo LCP/INP/CLS để tối ưu dựa trên số liệu.
 *
 * Cả ba đều tôn trọng ranh giới dữ liệu của NFR-03: không PII.
 */
export {
  initSentry,
  captureApiError,
  captureUnexpectedError,
  setSentryUser,
  addBreadcrumb,
  withErrorCapture,
} from './sentry';

export {
  ANALYTICS_EVENTS,
  initAnalytics,
  trackEvent,
  trackPageView,
  identifyUser,
  resetUser,
  setAnalyticsConsent,
  isAnalyticsActive,
  sanitizeProperties,
  type AnalyticsEventName,
  type AnalyticsProperties,
} from './analytics';

export { initWebVitals, isPoorMetric } from './webVitals';
