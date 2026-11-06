import { createStore, useStore } from '@/shared/lib';
import { getAccessToken } from '@/shared/api/tokenVault';

/**
 * Trạng thái của phiên làm việc, tách khỏi `userStore`.
 *
 * Vì sao cần riêng: `userStore` giữ **hồ sơ** của tài khoản, còn
 * `sessionStatus` nói rõ ứng dụng đang ở trạng thái nào:
 *
 * - `ANONYMOUS` — chưa đăng nhập, không có token trong vault.
 * - `RESTORING` — có token nhưng chưa xác nhận được với máy chủ. Guard
 *   `RequireAuth` **chưa** chuyển hướng trong lúc này, nên người dùng không
 *   bị đá ra trang đăng nhập chỉ vì tải lại trang.
 * - `AUTHENTICATED` — hồ sơ đã nạp xong từ `GET /api/accounts/me`.
 *
 * Trước khi có store này, một lần tải lại trang làm `userStore` rỗng ngay
 * (vì không còn dữ liệu mô phỏng), nên mọi route bảo vệ đều đẩy người dùng
 * ra khỏi phiên đang có token hợp lệ.
 */
export type SessionStatus = 'ANONYMOUS' | 'RESTORING' | 'AUTHENTICATED';

export const sessionStatusStore = createStore<SessionStatus>('ANONYMOUS');

export function useSessionStatus(): SessionStatus {
  return useStore(sessionStatusStore);
}

/** Đánh dấu phiên đã xác nhận với máy chủ. */
export function markAuthenticated(): void {
  sessionStatusStore.set('AUTHENTICATED');
}

/** Đánh dấu đang khôi phục phiên (có token, chưa xác nhận được). */
export function markRestoring(): void {
  sessionStatusStore.set('RESTORING');
}

/** Đánh dấu không có phiên nào (đăng xuất, hoặc token không còn hợp lệ). */
export function markAnonymous(): void {
  sessionStatusStore.set('ANONYMOUS');
}

/**
 * Ứng dụng có đang chờ phiên được khôi phục không?
 *
 * Đây là **câu hỏi duy nhất** mà guard nên hỏi trước khi quyết định đóng
 * cửa hay chuyển hướng. Nó gộp hai trường hợp:
 *
 * 1. `RESTORING` — `SessionBridge` đã báo rằng đang gọi
 *    `GET /api/accounts/me`. Chưa có câu trả lời, nên chưa
 *    thể kết luận người dùng là ai.
 * 2. `ANONYMOUS` **nhưng vault vẫn còn token** — đây là khoảnh khắc đầu
 *    tiên của một lần tải trang: store bắt đầu ở `ANONYMOUS`, còn
 *    `SessionBridge` chỉ chuyển sang `RESTORING` trong `useEffect` (tức là
 *    *sau* lần render đầu). Guard render trong khoảnh khắc đó sẽ thấy
 *    "không có user" và đá người dùng ra trang đăng nhập — đúng cái lỗi
 *    mà báo cáo đánh giá đã ghi nhận (mỗi lần F5 lại mất phiên).
 *
 * Nếu không có token thì `ANONYMOUS` là kết luận đúng: người dùng là khách,
 * guard chuyển hướng sang trang đăng nhập là hợp lý.
 */
export function useIsRestoringSession(): boolean {
  const status = useSessionStatus();
  if (status === 'RESTORING') return true;
  if (status === 'AUTHENTICATED') return false;
  // `ANONYMOUS`: chỉ "đang khôi phục" khi vault còn giữ token.
  return getAccessToken() !== null;
}
