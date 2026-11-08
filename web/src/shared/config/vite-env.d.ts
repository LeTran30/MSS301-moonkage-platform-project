/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API Gateway của backend Moonkage. */
  readonly VITE_API_BASE_URL?: string;
  /** WebSocket realtime của backend (FR-27). */
  readonly VITE_WS_URL?: string;
  /**
   * Origin của object storage (MinIO/CDN) phục vụ ảnh sản phẩm, ảnh báo giá.
   * Nhiều origin thì tách bằng dấu phẩy. Dùng cho `img-src` của CSP.
   */
  readonly VITE_MEDIA_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
