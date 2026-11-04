import { isDemoMode } from '@/shared/config/env';

export interface DemoAdapter {
  getProducts: <T = unknown>() => Promise<T[]>;
  getOrders: <T = unknown>() => Promise<T[]>;
  getQuoteRequests: <T = unknown>() => Promise<T[]>;
  getVendors: <T = unknown>() => Promise<T[]>;
  registerProvider: (key: string, provider: () => Promise<unknown[]>) => void;
}

const providers: Record<string, () => Promise<unknown[]>> = {};

export const demoAdapter: DemoAdapter = {
  registerProvider(key, provider) {
    providers[key] = provider;
  },
  async getProducts<T = unknown>() {
    return (providers.products ? await providers.products() : []) as T[];
  },
  async getOrders<T = unknown>() {
    return (providers.orders ? await providers.orders() : []) as T[];
  },
  async getQuoteRequests<T = unknown>() {
    return (providers.quoteRequests ? await providers.quoteRequests() : []) as T[];
  },
  async getVendors<T = unknown>() {
    return (providers.vendors ? await providers.vendors() : []) as T[];
  },
};

/**
 * Thực thi gọi API thật hoặc Demo theo cấu hình chủ động (isDemoMode).
 * TUYỆT ĐỐI KHÔNG nuốt lỗi API để fallback về demo (Luật L1 & L5).
 * Nếu isDemoMode=false, mọi lỗi mạng/500/404 phải nổi lên để UI xử lý (ErrorState).
 */
export function executeWithDemoMode<T>(
  apiCall: () => Promise<T>,
  demoCall: () => Promise<T>
): Promise<T> {
  if (isDemoMode()) {
    return demoCall();
  }
  return apiCall();
}

