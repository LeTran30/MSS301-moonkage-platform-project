import axios, { AxiosError } from 'axios';
import { config } from '../config';
import { strings } from '../strings';

/** Body of every public identity-service answer (Software Design 5.1 rule 8). */
export interface ApiResponse<T> {
  status: number;
  code: string;
  message: string;
  data: T;
  path?: string;
}

/** A failed call, with the server's code and Vietnamese message when it sent one. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const HTTP_UNAUTHORIZED = 401;

export const apiClient = axios.create({ baseURL: config.apiBaseUrl });

let currentToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** Set by the auth provider: the token to send, and what to do when the server no longer accepts it. */
export function configureAuth(token: string | null, unauthorized: (() => void) | null) {
  currentToken = token;
  onUnauthorized = unauthorized;
}

apiClient.interceptors.request.use((request) => {
  if (currentToken) request.headers.Authorization = `Bearer ${currentToken}`;
  return request;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error);
    if (apiError.status === HTTP_UNAUTHORIZED && currentToken) onUnauthorized?.();
    return Promise.reject(apiError);
  },
);

function toApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const response = error.response;
    if (!response) return new ApiError(0, null, strings.errors.network);
    const body = response.data as Partial<ApiResponse<unknown>> | undefined;
    return new ApiError(
      response.status,
      typeof body?.code === 'string' ? body.code : null,
      typeof body?.message === 'string' && body.message ? body.message : strings.errors.server,
    );
  }
  return new ApiError(0, null, strings.errors.server);
}
