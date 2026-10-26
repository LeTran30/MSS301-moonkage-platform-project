/** Build-time settings from `.env*` (see `.env.example`). Nothing here has a hidden default URL. */

function readPositiveInt(raw: string | undefined, fallback: number): number {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

/** Poll every 2 s unless configured: well within NFR-10 (under a minute). */
const DEFAULT_NFC_POLL_INTERVAL_MS = 2000;
/** While the WebSocket is up the push does the work; the poll only covers a missed message. */
const DEFAULT_NFC_POLL_INTERVAL_CONNECTED_MS = 15000;

export const config = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? '').trim(),
  /** `npm run dev:demo` (.env.demo): every screen runs on seed data and demo accounts, nothing calls the backend. */
  demoMode: import.meta.env.VITE_DEMO_MODE === 'true',
  nfcPollIntervalMs: readPositiveInt(import.meta.env.VITE_NFC_POLL_INTERVAL_MS, DEFAULT_NFC_POLL_INTERVAL_MS),
  nfcPollIntervalConnectedMs: readPositiveInt(
    import.meta.env.VITE_NFC_POLL_INTERVAL_CONNECTED_MS,
    DEFAULT_NFC_POLL_INTERVAL_CONNECTED_MS,
  ),
};

/** False when VITE_API_BASE_URL is missing or not an http(s) URL: the app shows a configuration error. */
export function isConfigValid(): boolean {
  if (config.demoMode) return true;
  try {
    const url = new URL(config.apiBaseUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
