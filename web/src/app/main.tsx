import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/tokens-dark.css';
import './styles/reset.css';
import './styles/global.css';
import { migrateLegacyTokens } from './providers';
import {
  ENV,
  applyCspMeta,
  apiConnectSources,
  cspImageSources,
  setRuntimeFlags,
  type FeatureFlag,
} from '@/shared/config';
import {
  ANALYTICS_HOST,
  ANALYTICS_MEASUREMENT_ID,
  isAnalyticsEnabled,
} from '@/shared/config/observability';
import { initAnalytics, initSentry, initWebVitals } from '@/shared/observability';
import { App } from './App';

// Observability khởi động **trước** React: càng sớm càng bắt được lỗi lúc
// khởi động. Cả ba đều no-op khi không có cấu hình, nên local và CI không
// có request nào đi ra ngoài.
initSentry();
initWebVitals();
if (isAnalyticsEnabled()) {
  initAnalytics(ANALYTICS_MEASUREMENT_ID, ANALYTICS_HOST || undefined);
}

// A token left in `localStorage` by an older release is moved into the token
// vault (session-scoped) and deleted from there. Runs before the first render
// so no request is ever sent with a stale token.
migrateLegacyTokens();

/*
 * CSP: ở development, vite dev server cần `eval` cho HMR nên không áp dụng.
 * Ở production, header HTTP ở web server vẫn là cách đúng; thẻ `<meta>` ở đây
 * chỉ là lớp phòng thủ thứ hai cho nơi không cấu hình được header.
 *
 * `connect-src` phải khai báo thêm API gateway: nếu chỉ có `'self'`, trình
 * duyệt chặn mọi request XHR/fetch tới gateway và mọi màn hình hiện "Network
 * Error" — kể cả bản build chạy qua `vite preview` (E2E).
 */
if (import.meta.env.PROD) {
  /*
   * `connect-src` phải khai báo origin của API gateway (`ENV.apiBaseUrl`) và
   * `img-src` phải khai báo origin của object storage (MinIO): nếu chỉ có
   * `'self'`, trình duyệt chặn mọi request XHR/fetch tới gateway và mọi ảnh
   * trong danh mục hiện ô trống — kể cả bản build chạy qua `vite preview`
   * (E2E).
   */
  applyCspMeta(apiConnectSources(ENV.apiBaseUrl), cspImageSources());
}

// Đường tắt tính năng không cần deploy: hệ thống config tập trung gọi
// `window.__setMoonkageFlags({...})` sau khi trang đã tải, các component đang
// dùng cờ sẽ tự cập nhật mà không cần reload.
if (typeof window !== 'undefined') {
  window.__setMoonkageFlags = (next: Partial<Record<FeatureFlag, boolean>>) => {
    setRuntimeFlags(next);
  };
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Không tìm thấy phần tử root trong index.html');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
