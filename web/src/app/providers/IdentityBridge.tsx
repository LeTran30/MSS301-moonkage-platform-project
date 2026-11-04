import { useEffect } from 'react';
import { useCurrentUser } from '@/entities/user';
import { identifyUser, resetUser } from '@/shared/observability';
import { setSentryUser } from '@/shared/observability';

/**
 * Nối tài khoản đang đăng nhập với Sentry và analytics.
 *
 * Chỉ truyền **mã tài khoản** và **vai trò** — không tên, không email, không
 * số điện thoại (NFR-03). Mã tài khoản là định danh giả: nó cho phép đội vận
 * hành lọc lỗi theo tài khoản mà không cần biết ai là ai.
 *
 * Khi đăng xuất, `resetUser()` xoá định danh để sự kiện sau đó không bị gắn
 * nhầm vào tài khoản trước.
 *
 * Đặt ở tầng `app/` vì nó nối hai miền: đọc entity `user` và ghi ra
 * `shared/observability`. `shared` không được import entity (luật FSD).
 */
export function IdentityBridge(): null {
  const user = useCurrentUser();

  useEffect(() => {
    const userId = user?.id ?? null;
    const role = user?.role;

    setSentryUser(userId, role);
    if (userId) {
      identifyUser(userId, role);
    } else {
      resetUser();
    }
  }, [user?.id, user?.role]);

  return null;
}
