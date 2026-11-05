export interface AppConfig {
  apiBaseUrl: string;
  wsUrl: string;
}

const env =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : ({} as Record<string, string | undefined>);

export const ENV: AppConfig = {
  apiBaseUrl: (env.VITE_API_BASE_URL ?? '').trim(),
  wsUrl: (env.VITE_WS_URL ?? '').trim(),
};

/**
 * The app is usable only when the API Gateway is configured.
 *
 * There is no mock fallback: a build without `VITE_API_BASE_URL` stops at the
 * config-error screen instead of showing made-up data (README § "Cấu hình").
 */
export function isConfigValid(): boolean {
  return Boolean(ENV.apiBaseUrl);
}
