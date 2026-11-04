import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/tokens-dark.css';
import './styles/reset.css';
import './styles/global.css';
import { migrateLegacyTokens } from './providers';
import { applyCspMeta, setRuntimeFlags, type FeatureFlag } from '@/shared/config';
import {
  ANALYTICS_HOST,
  ANALYTICS_MEASUREMENT_ID,
  OBSERVABILITY_CONTEXT,
  isAnalyticsEnabled,
} from '@/shared/config/observability';
import { initAnalytics, initSentry, initWebVitals } from '@/shared/observability';
import { App } from './App';

// Observability khởi động **trước** React: càng sớm càng bắt được lỗi lúc
// khởi động. Cả ba đều no-op khi không có cấu hình, nên local và CI không
// có request nào đi ra ngoài.
initSentry();
initWebVitals();
if (isAnalyticsEnabled() && !OBSERVABILITY_CONTEXT.isDemoMode) {
  initAnalytics(ANALYTICS_MEASUREMENT_ID, ANALYTICS_HOST || undefined);
}

// A token left in `localStorage` by an older release is moved into the token
// vault (session-scoped) and deleted from there. Runs before the first render
// so no request is ever sent with a stale token.
migrateLegacyTokens();

// CSP: ở development, vite dev server cần `eval` cho HMR nên không áp dụng.
// Ở production, header HTTP ở web server vẫn là cách đúng; thẻ `<meta>` ở đây
// chỉ là lớp phòng thủ thứ hai cho nơi không cấu hình được header.
if (import.meta.env.PROD) {
  applyCspMeta();
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
  </React.StrictMode>
);
