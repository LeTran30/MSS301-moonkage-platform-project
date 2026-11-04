export interface AppConfig {
  apiBaseUrl: string;
  isDemoMode: boolean;
  wsUrl: string;
}

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : ({} as Record<string, string | undefined>);

export const ENV: AppConfig = {
  apiBaseUrl: (env.VITE_API_BASE_URL ?? '').trim(),
  isDemoMode: env.VITE_DEMO_MODE === 'true', // Mặc định tắt (opt-in explicit giống web/)
  wsUrl: (env.VITE_WS_URL ?? '').trim(),
};

export function isDemoMode(): boolean {
  return ENV.isDemoMode;
}

export function isConfigValid(): boolean {
  // Hợp lệ nếu bật demoMode có chủ đích hoặc đã cung cấp URL API Gateway
  return ENV.isDemoMode || Boolean(ENV.apiBaseUrl);
}
