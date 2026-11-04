/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API Gateway của backend Moonkage (rỗng khi chạy demo mode). */
  readonly VITE_API_BASE_URL?: string;
  /** Bật chế độ demo (dữ liệu mock trong bộ nhớ). */
  readonly VITE_DEMO_MODE?: string;
  /** WebSocket realtime của backend (FR-27). */
  readonly VITE_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
