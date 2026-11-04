/**
 * Fixtures of the real backend answers, so the tests exercise the shape the server
 * really sends instead of a shape the test author invented.
 *
 * The public envelope is `com.moonkage.<service>.common.exception.ApiResponse`:
 * `{ status, code, message, data, timestamp }`.
 */

export interface EnvelopeOptions {
  status?: number;
  code?: string;
  message?: string;
  timestamp?: string;
}

/** Wrap a payload in the public envelope. */
export function envelope<T>(data: T, options: EnvelopeOptions = {}) {
  return {
    status: options.status ?? 200,
    code: options.code ?? 'SUCCESS',
    message: options.message ?? 'OK',
    data,
    timestamp: options.timestamp ?? '2026-11-02T03:00:00Z',
  };
}

/** A paged payload (`com.moonkage.catalog.dto.response.PageResponse`). */
export function page<T>(content: T[], overrides: Partial<{ page: number; size: number; totalElements: number; totalPages: number }> = {}) {
  return {
    content,
    page: overrides.page ?? 0,
    size: overrides.size ?? content.length,
    totalElements: overrides.totalElements ?? content.length,
    totalPages: overrides.totalPages ?? 1,
  };
}
