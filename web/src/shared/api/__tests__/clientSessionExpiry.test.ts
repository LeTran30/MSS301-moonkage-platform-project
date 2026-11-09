import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { apiClient, ApiError } from '../client';
import { onSessionExpired, type SessionExpiryReason } from '../sessionExpiry';
import { clearTokens, getAccessToken, storeTokens } from '../tokenVault';

/** An adapter that answers every request with a 401 from the server. */
const answer401: AxiosAdapter = (config: InternalAxiosRequestConfig) =>
  Promise.reject(
    new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, {
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config,
      data: { message: 'Sai email hoặc mật khẩu' },
    }),
  );

describe('apiClient — 401 không cứu được phiên', () => {
  const originalAdapter = apiClient.defaults.adapter;
  let reasons: SessionExpiryReason[];
  let unsubscribe: () => void;

  beforeEach(() => {
    clearTokens();
    vi.restoreAllMocks();
    apiClient.defaults.adapter = answer401;
    reasons = [];
    unsubscribe = onSessionExpired((reason) => reasons.push(reason));
  });

  afterEach(() => {
    unsubscribe();
    apiClient.defaults.adapter = originalAdapter;
  });

  it('401 của đăng nhập trả nguyên lỗi về form, không làm mới và không báo hết phiên', async () => {
    storeTokens('old-access', 'old-refresh');
    const refresh = vi.spyOn(axios, 'post');

    const error = await apiClient.post('/api/auth/login', {}).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe('Sai email hoặc mật khẩu');
    expect(refresh).not.toHaveBeenCalled();
    expect(reasons).toEqual([]);
  });

  it('phiên còn token nhưng không có refresh token: xoá token và báo EXPIRED', async () => {
    storeTokens('expired-access');

    await expect(apiClient.get('/api/orders')).rejects.toMatchObject({ status: 401 });

    expect(getAccessToken()).toBeNull();
    expect(reasons).toEqual(['EXPIRED']);
  });

  it('làm mới thất bại: báo EXPIRED', async () => {
    storeTokens('expired-access', 'dead-refresh');
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('refresh refused'));

    await expect(apiClient.post('/api/carts/me/items', {})).rejects.toMatchObject({ status: 401 });

    expect(getAccessToken()).toBeNull();
    expect(reasons).toEqual(['EXPIRED']);
  });

  it('làm mới xong mà request vẫn 401: báo EXPIRED, không làm mới lần nữa', async () => {
    storeTokens('expired-access', 'live-refresh');
    const refresh = vi
      .spyOn(axios, 'post')
      .mockResolvedValue({ data: { status: 200, code: 'SUCCESS', data: { token: 'new-access' } } });

    await expect(apiClient.get('/api/orders')).rejects.toMatchObject({ status: 401 });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(reasons).toEqual(['EXPIRED']);
  });

  it('khách ghi dữ liệu (POST) bị 401: báo SIGN_IN_REQUIRED', async () => {
    await expect(apiClient.post('/api/carts/me/items', {})).rejects.toMatchObject({
      status: 401,
      message: 'Vui lòng đăng nhập để tiếp tục.',
    });

    expect(reasons).toEqual(['SIGN_IN_REQUIRED']);
  });

  it('khách đọc (GET) bị 401: không đá khỏi trang đang xem', async () => {
    await expect(apiClient.get('/api/suppliers')).rejects.toMatchObject({ status: 401 });

    expect(reasons).toEqual([]);
  });
});
