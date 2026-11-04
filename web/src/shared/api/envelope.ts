/**
 * Unwrapping of the public API envelope.
 *
 * Every public backend endpoint answers with the same envelope
 * (`com.moonkage.<service>.common.exception.ApiResponse`):
 *
 * ```json
 * { "status": 200, "code": "SUCCESS", "message": "OK", "data": { ... }, "timestamp": "..." }
 * ```
 *
 * `apiClient` already unwraps the HTTP layer (the Axios response interceptor returns
 * `response.data`), so what reaches an entity API module is still the envelope:
 * `res.data` is the *payload*, not the list.
 *
 * Every mapper must therefore go through `unwrap` instead of guessing the shape.
 * Guessing is what made the first version of this layer return empty lists against
 * a perfectly healthy backend.
 */

/** The envelope every public endpoint answers with. */
export interface ApiEnvelope<T> {
  status: number;
  code: string;
  message: string;
  data: T;
  errors?: Array<{ field: string; message: string }>;
  path?: string;
  timestamp?: string;
}

/** Paged payload (`com.moonkage.catalog.dto.response.PageResponse`). */
export interface PageEnvelope<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/**
 * Unwrap the envelope and return the payload.
 *
 * Tolerates a bare payload (some internal endpoints answer unwrapped) so the mapper
 * stays usable against both shapes, but the envelope is what the backend really sends.
 */
export function unwrap<T>(res: unknown): T | null {
  if (res === null || res === undefined) return null;

  if (isEnvelope(res)) {
    return res.data === undefined || res.data === null ? null : (res.data as T);
  }

  return res as T;
}

/** Unwrap the envelope and return the payload, or throw when it is absent. */
export function unwrapOrThrow<T>(res: unknown, message = 'Máy chủ trả về dữ liệu rỗng.'): T {
  const payload = unwrap<T>(res);
  if (payload === null || payload === undefined) {
    throw new Error(message);
  }
  return payload;
}

/** Unwrap the envelope and return the payload as an array (empty when absent). */
export function unwrapList<T>(res: unknown): T[] {
  const payload = unwrap<T[] | { content?: T[]; data?: T[] }>(res);
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const holder = payload as { content?: T[]; data?: T[] };
    if (Array.isArray(holder.content)) return holder.content;
    if (Array.isArray(holder.data)) return holder.data;
  }
  return [];
}

/** Unwrap the envelope of a paged endpoint and return its `content`. */
export function unwrapPage<T>(res: unknown): T[] {
  const payload = unwrap<T[] | PageEnvelope<T> | { content?: T[] }>(res);
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object' && Array.isArray(payload.content)) {
    return payload.content;
  }
  return [];
}

/** True when the value looks like the public envelope. */
export function isEnvelope(res: unknown): res is ApiEnvelope<unknown> {
  return (
    typeof res === 'object' &&
    res !== null &&
    'code' in res &&
    'data' in res &&
    typeof (res as { code: unknown }).code === 'string'
  );
}
