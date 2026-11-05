import { useEffect } from 'react';
import {
  GUEST_USER,
  enrichSessionProfile,
  markAnonymous,
  markAuthenticated,
  markRestoring,
  sessionApi,
  userStore,
} from '@/entities/user';
import { clearTokens, getAccessToken } from '@/shared/api/tokenVault';

/**
 * Khôi phục phiên khi tải lại trang.
 *
 * Token sống trong token vault (bộ nhớ rồi `sessionStorage`), nên sau một
 * lần F5 người dùng **vẫn đang đăng nhập** — nhưng hồ sơ trong
 * `userStore` thì không. Khôi phục ở đây giúp trạng thái khớp với điều mà
 * người dùng vừa làm, và các guard (`RequireAuth`, `RequireAdmin`) có đủ
 * thông tin để quyết định.
 *
 * Không có token thì không gọi API nào: một khách vãng lai không được gửi
 * request thừa.
 */
export function SessionBridge(): null {
  useEffect(() => {
    if (!getAccessToken()) {
      markAnonymous();
      return;
    }

    let cancelled = false;
    markRestoring();

    void (async () => {
      try {
        const account = await sessionApi.getMyAccount();
        const user = await enrichSessionProfile(account);
        if (cancelled) return;
        userStore.set(user);
        markAuthenticated();
      } catch {
        // Token hết hạn hoặc máy chủ từ chối: coi như khách, để guard
        // đưa người dùng tới trang đăng nhập.
        if (cancelled) return;
        // Xoá token: nếu giữ lại, `useIsRestoringSession` sẽ thấy vault còn
        // token và chờ mãi — người dùng bị treo ở màn hình loading thay vì
        // được đưa tới trang đăng nhập.
        clearTokens();
        userStore.set(GUEST_USER);
        markAnonymous();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
