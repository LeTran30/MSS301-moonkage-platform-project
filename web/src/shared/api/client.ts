import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { config } from '../config/env';
import { strings } from '../config/strings';
import { HTTP_UNAUTHORIZED } from './httpStatus';

export interface ApiFieldError {
  field: string;
  message: string;
}

/** Body of every public service answer (Software Design 5.1 rule 8). */
export interface ApiResponse<T> {
  status: number;
  code: string;
  message: string;
  data: T;
  errors?: ApiFieldError[];
  path?: string;
  timestamp?: string;
}

/** A failed call, with the server's code, Vietnamese message and optional field validation errors. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly errors: ApiFieldError[];

  constructor(status: number, code: string | null, message: string, errors: ApiFieldError[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }

  fieldError(field: string): string | undefined {
    return this.errors.find((e) => e.field === field)?.message;
  }
}

export const apiClient = axios.create({ baseURL: config.apiBaseUrl });

let currentToken: string | null = null;
let onUnauthorized: (() => void) | null = null;
let onRefreshToken: (() => Promise<string | null>) | null = null;
let refreshPromise: Promise<string | null> | null = null;

/** Set by the auth provider: the token to send, how to refresh it, and what to do when the server rejects it. */
export function configureAuth(
  token: string | null,
  unauthorized: (() => void) | null,
  refresh: (() => Promise<string | null>) | null = null,
) {
  currentToken = token;
  onUnauthorized = unauthorized;
  onRefreshToken = refresh;
}

apiClient.interceptors.request.use((request) => {
  if (currentToken) request.headers.Authorization = `Bearer ${currentToken}`;
  return request;
});

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const apiError = toApiError(error);
    if (apiError.status === HTTP_UNAUTHORIZED && currentToken) {
      const original = error instanceof AxiosError ? (error.config as RetryableConfig | undefined) : undefined;
      const isAuthEndpoint = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh-token');
      if (original && !original._retried && !isAuthEndpoint && onRefreshToken) {
        original._retried = true;
        refreshPromise ??= onRefreshToken().finally(() => {
          refreshPromise = null;
        });
        const nextToken = await refreshPromise;
        if (nextToken) {
          currentToken = nextToken;
          original.headers.Authorization = `Bearer ${nextToken}`;
          return apiClient(original);
        }
      }
      onUnauthorized?.();
    }
    return Promise.reject(apiError);
  },
);

function toApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const response = error.response;
    if (!response) return new ApiError(0, null, strings.errors.network);
    const body = response.data as Partial<ApiResponse<unknown>> | undefined;
    const errors = Array.isArray(body?.errors)
      ? body.errors.filter((e): e is ApiFieldError => Boolean(e && typeof e.field === 'string' && typeof e.message === 'string'))
      : [];
    const fallbackMessage = errors[0]?.message || strings.errors.server;
    return new ApiError(
      response.status,
      typeof body?.code === 'string' ? body.code : null,
      typeof body?.message === 'string' && body.message ? body.message : fallbackMessage,
      errors,
    );
  }
  return new ApiError(0, null, strings.errors.server);
}
