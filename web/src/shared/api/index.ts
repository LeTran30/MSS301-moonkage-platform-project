export { apiClient, ApiError, type ApiFieldError } from './client';
export { queryClient, queryKeys } from './queryClient';
export {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  migrateLegacyTokens,
  storeTokens,
  updateTokens,
} from './tokenVault';
export { GATEWAY, NOT_IMPLEMENTED_YET, realtimePath, websocketUrl } from './gateway';
export {
  unwrap,
  unwrapOrThrow,
  unwrapList,
  unwrapPage,
  isEnvelope,
  type ApiEnvelope,
  type PageEnvelope,
} from './envelope';
export { RealtimeProvider, useRealtime } from './realtime';
// Chỉ còn phần **vận chuyển thuần** của việc tải tệp lên: xin link có chữ ký
// và gửi bytes. Quy tắc nghiệp vụ ("tệp này vào kho nào", "báo tiến độ thế
// nào") thuộc feature `file-upload` — `shared/` không được chứa logic feature.
export { createUploadLink, uploadFileToLink, type UploadLink } from './upload';
