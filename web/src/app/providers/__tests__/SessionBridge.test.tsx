import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { SessionBridge } from '../SessionBridge';
import { GUEST_USER, userStore } from '@/entities/user';
import { clearTokens, getAccessToken, storeTokens } from '@/shared/api/tokenVault';
import { sessionApi } from '@/entities/user';

vi.mock('@/entities/user', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/user')>();
  return {
    ...actual,
    enrichSessionProfile: vi.fn(async (user: unknown) => user),
    sessionApi: {
      getMyAccount: vi.fn(),
    },
  };
});

const getMyAccount = vi.mocked(sessionApi.getMyAccount);

describe('SessionBridge — khôi phục phiên', () => {
  beforeEach(() => {
    clearTokens();
    userStore.set(GUEST_USER);
    vi.clearAllMocks();
  });

  it('không gọi API khi không có token', async () => {
    render(<SessionBridge />);

    await waitFor(() => {
      expect(getMyAccount).not.toHaveBeenCalled();
    });
  });

  it('xoá token khi máy chủ từ chối, để guard không chờ mãi', async () => {
    storeTokens('token-het-han');
    getMyAccount.mockRejectedValue(new Error('401 Unauthorized'));

    render(<SessionBridge />);

    await waitFor(() => {
      // Token phải biến mất: nếu còn, `useIsRestoringSession` sẽ thấy vault còn
      // token và treo ở màn hình loading thay vì chuyển tới trang đăng nhập.
      expect(getAccessToken()).toBeNull();
    });
    expect(userStore.get().id).toBe('');
  });
});
