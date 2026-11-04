import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  migrateLegacyTokens,
  storeTokens,
  updateTokens,
  subscribeToToken,
} from '../tokenVault';

const STORAGE_KEY = 'moonkage_session_tokens';
const LEGACY_ACCESS = 'moonkage_access_token';
const LEGACY_REFRESH = 'moonkage_refresh_token';

describe('Token vault — token không nằm lâu trong localStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearTokens();
  });

  it('lưu token vào sessionStorage, không lưu vào localStorage', () => {
    storeTokens('access-1', 'refresh-1');

    expect(getAccessToken()).toBe('access-1');
    expect(getRefreshToken()).toBe('refresh-1');

    // Token phải sống theo tab, không sống lâu trên máy.
    expect(sessionStorage.getItem(STORAGE_KEY)).toContain('access-1');
    expect(localStorage.getItem(LEGACY_ACCESS)).toBeNull();
    expect(localStorage.getItem(LEGACY_REFRESH)).toBeNull();
  });

  it('đọc lại được token từ sessionStorage sau khi tải lại trang', () => {
    storeTokens('access-2', 'refresh-2');

    // Mô phỏng lần tải trang mới: bộ nhớ trong module bị mất, chỉ còn
    // sessionStorage. `vi.resetModules()` + import lại là cách sát thực tế nhất.
    vi.resetModules();
    return import('../tokenVault').then(({ getAccessToken: read, getRefreshToken: readRefresh }) => {
      expect(read()).toBe('access-2');
      expect(readRefresh()).toBe('refresh-2');
    });
  });

  it('updateTokens giữ phiên sống sau khi refresh', () => {
    storeTokens('access-old', 'refresh-old');
    updateTokens('access-new');

    expect(getAccessToken()).toBe('access-new');
    // Không có refresh token mới thì giữ token cũ.
    expect(getRefreshToken()).toBe('refresh-old');
  });

  it('updateTokens nhận refresh token mới', () => {
    storeTokens('access-old', 'refresh-old');
    updateTokens('access-new', 'refresh-new');

    expect(getRefreshToken()).toBe('refresh-new');
  });

  it('clearTokens xoá cả bộ nhớ và sessionStorage', () => {
    storeTokens('access-1', 'refresh-1');
    clearTokens();

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('migrateLegacyTokens chuyển token cũ khỏi localStorage và xoá nó đi', () => {
    localStorage.setItem(LEGACY_ACCESS, 'legacy-access');
    localStorage.setItem(LEGACY_REFRESH, 'legacy-refresh');

    migrateLegacyTokens();

    // Token đã vào vault...
    expect(getAccessToken()).toBe('legacy-access');
    expect(getRefreshToken()).toBe('legacy-refresh');
    // ...và không còn nằm trong localStorage.
    expect(localStorage.getItem(LEGACY_ACCESS)).toBeNull();
    expect(localStorage.getItem(LEGACY_REFRESH)).toBeNull();
  });

  it('migrateLegacyTokens không ghi đè phiên đang hoạt động', () => {
    storeTokens('current-access', 'current-refresh');
    localStorage.setItem(LEGACY_ACCESS, 'legacy-access');

    migrateLegacyTokens();

    expect(getAccessToken()).toBe('current-access');
    expect(localStorage.getItem(LEGACY_ACCESS)).toBeNull();
  });

  it('migrateLegacyTokens không làm gì khi không có token cũ', () => {
    migrateLegacyTokens();

    expect(getAccessToken()).toBeNull();
  });

  it('subscribeToToken báo khi phiên bắt đầu và khi kết thúc', () => {
    const seen: (string | null)[] = [];
    const unsubscribe = subscribeToToken((token) => seen.push(token));

    storeTokens('access-1', 'refresh-1');
    clearTokens();
    unsubscribe();

    expect(seen).toEqual([null, 'access-1', null]);
  });

  it('subscribeToToken báo ngay khi đăng ký', () => {
    const seen: (string | null)[] = [];
    const unsubscribe = subscribeToToken((token) => seen.push(token));
    unsubscribe();

    expect(seen).toEqual([null]);
  });
});
