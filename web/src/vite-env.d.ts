/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_NFC_POLL_INTERVAL_MS?: string;
  readonly VITE_NFC_POLL_INTERVAL_CONNECTED_MS?: string;
  readonly VITE_DEMO_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
