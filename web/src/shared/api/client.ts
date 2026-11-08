import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { ENV } from '@/shared/config/env';
import { apiCredentials, usesCookieAuth } from '@/shared/config/security';
import { captureApiError } from '@/shared/observability';
import { GATEWAY } from './gateway';
import { unwrap, type ApiEnvelope } from './envelope';
import { clearTokens, getAccessToken, getRefreshToken, updateTokens } from './tokenVault';
import { notifySessionExpired } from './sessionExpiry';

export interface ApiFieldError {
  field: string;
  message: string;
}

/** `com.moonkage.identity.auth.dto.LoginResponse`. */
interface LoginResponse {
  token: string;
  refreshToken?: string;
  accountId?: string;
  email?: string;
  phoneNumber?: string;
  fullName?: string;
  role?: string;
}

export class ApiError extends Error {
  public status: number;
  public errors?: ApiFieldError[];

  constructor(message: string, status: number, errors?: ApiFieldError[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

export const apiClient = axios.create({
  baseURL: ENV.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  // Khi backend dùng cookie `HttpOnly`, mọi request phải kèm cookie.
  ...apiCredentials(),
  timeout: 15000,
});

/**
 * The credential endpoints of identity-service (login, register, OTP, refresh).
 * A 401 there means wrong credentials, not an expired session: it goes back to
 * the form as it is, without a refresh and without leaving the page.
 */
const AUTH_ENDPOINT_PREFIX = '/api/auth/';

const SESSION_EXPIRED_MESSAGE = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
const SESSION_REFRESH_FAILED_MESSAGE = 'Không thể làm mới phiên đăng nhập. Vui lòng đăng nhập lại.';
const SIGN_IN_REQUIRED_MESSAGE = 'Vui lòng đăng nhập để tiếp tục.';

function isAuthEndpoint(config: InternalAxiosRequestConfig | undefined): boolean {
  return config?.url?.includes(AUTH_ENDPOINT_PREFIX) ?? false;
}

/**
 * A 401 the client cannot recover from: drop the tokens and, when it matters,
 * tell the app so it sends the user to the sign-in page.
 *
 * - With a session: it is gone, whatever the request was.
 * - Without one: only a write asks for sign-in. A guest's GET answered 401 is
 *   a background read of a page they may browse; moving them away would be
 *   worse than the missing data.
 */
function giveUpSession(
  config: InternalAxiosRequestConfig,
  hadSession: boolean,
  message: string,
): Promise<never> {
  clearTokens();
  const isRead = (config.method ?? 'get').toLowerCase() === 'get';
  if (hadSession) {
    notifySessionExpired('EXPIRED');
    return Promise.reject(new ApiError(message, 401));
  }
  if (!isRead) {
    notifySessionExpired('SIGN_IN_REQUIRED');
  }
  return Promise.reject(new ApiError(SIGN_IN_REQUIRED_MESSAGE, 401));
}

// Mutex chống gọi refresh token song song
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
}

// Interceptor gắn Bearer token — đọc từ token vault (memory), không từ DOM storage.
// Ở chế độ cookie, backend tự đọc cookie `HttpOnly`: không gắn header, không
// có token nào trong JS để bị đánh cắp.
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (usesCookieAuth()) return config;

  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor xử lý lỗi & Refresh Token tự động
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError<{ message?: string; errors?: ApiFieldError[] }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 của một request đã thử lại sau khi làm mới: phiên mới cũng bị từ chối.
    if (
      error.response?.status === 401 &&
      originalRequest?._retry &&
      !isAuthEndpoint(originalRequest)
    ) {
      return giveUpSession(originalRequest, true, SESSION_EXPIRED_MESSAGE);
    }

    // 401 Unauthorized & chưa thử lại
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest)
    ) {
      // Chế độ cookie: backend tự làm mới cookie và trả lại 200. Ta chỉ cần
      // gửi lại request — không có token trong JS để refresh. Lần thử lại mà
      // vẫn 401 thì nhánh `_retry` ở trên kết thúc phiên.
      if (usesCookieAuth()) {
        originalRequest._retry = true;
        return apiClient(originalRequest);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest._retry = true;
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        const hadSession = getAccessToken() !== null;
        return giveUpSession(originalRequest, hadSession, SESSION_EXPIRED_MESSAGE);
      }

      try {
        // AuthController: @PostMapping("/refresh-token") — the endpoint is "refresh-token",
        // not "refresh". Calling "/refresh" answered 404 and killed every session.
        const res = await axios.post<ApiEnvelope<LoginResponse>>(
          `${ENV.apiBaseUrl}${GATEWAY.IDENTITY.REFRESH}`,
          { refreshToken },
        );
        const payload = unwrap<LoginResponse>(res.data);
        const newAccessToken = payload?.token;
        if (!newAccessToken) {
          throw new Error('Máy chủ không trả về token mới.');
        }
        updateTokens(newAccessToken, payload.refreshToken);
        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        return giveUpSession(originalRequest, true, SESSION_REFRESH_FAILED_MESSAGE);
      } finally {
        isRefreshing = false;
      }
    }

    const message = error.response?.data?.message || error.message || 'Lỗi kết nối máy chủ';
    const status = error.response?.status || 500;
    const errors = error.response?.data?.errors;

    // Báo cáo lỗi API kèm ngữ cảnh: biết endpoint nào hỏng và mã HTTP nào
    // giúp đội vận hành xử lý nhanh hơn nhiều so với một stack trace trần.
    // Chỉ 4xx nghiệp vụ (trừ 401) và 5xx mới đáng báo — lỗi dữ liệu người
    // dùng nhập sai không phải lỗi hệ thống.
    const isReportable = status >= 500 || (status >= 400 && status < 500 && status !== 401);
    if (isReportable) {
      captureApiError(error, {
        endpoint: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        status,
      });
    }

    return Promise.reject(new ApiError(message, status, errors));
  }
);
