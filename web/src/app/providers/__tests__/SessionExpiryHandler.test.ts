import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notifySessionExpired } from '@/shared/api/sessionExpiry';
import { GUEST_USER, userStore, type User } from '@/entities/user';
import { routes } from '@/shared/config';
import { toast } from '@/shared/ui';
import { startSessionExpiryHandling, type ExpiryRouter } from '../SessionExpiryHandler';

const SIGNED_IN: User = { ...GUEST_USER, id: 'acc-1', name: 'Nguyễn Thị Lan', role: 'BUYER' };

function routerAt(pathname: string) {
  const navigate = vi.fn<ExpiryRouter['navigate']>();
  const router: ExpiryRouter = {
    state: { location: { pathname, search: '?q=1', hash: '' } },
    navigate,
  };
  return Object.assign(router, { navigate });
}

describe('SessionExpiryHandler — hết phiên thì về trang đăng nhập', () => {
  let stop: () => void;

  beforeEach(() => {
    userStore.set(SIGNED_IN);
    vi.spyOn(toast, 'info').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    stop();
    vi.restoreAllMocks();
  });

  it('đặt lại người dùng thành khách và chuyển tới đăng nhập, nhớ trang cũ', () => {
    const router = routerAt('/san-pham/p-1');
    stop = startSessionExpiryHandling(router);

    notifySessionExpired('EXPIRED');

    expect(userStore.get().id).toBe('');
    expect(router.navigate).toHaveBeenCalledWith(routes.auth.login, {
      state: { from: { pathname: '/san-pham/p-1', search: '?q=1', hash: '' } },
    });
    expect(toast.info).toHaveBeenCalledWith('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  });

  it('đang ở trang đăng nhập thì không điều hướng lại', () => {
    const router = routerAt(routes.auth.login);
    stop = startSessionExpiryHandling(router);

    notifySessionExpired('SIGN_IN_REQUIRED');

    expect(router.navigate).not.toHaveBeenCalled();
    expect(userStore.get().id).toBe('');
  });
});
