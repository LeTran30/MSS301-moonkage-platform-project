import { describe, it, expect, afterEach, vi } from 'vitest';
import { isFeatureEnabled, getActiveFlags, setRuntimeFlags, type FeatureFlag } from '../featureFlags';

describe('Shared config - feature flags', () => {
  afterEach(() => {
    delete window.__MOONKAGE_FLAGS__;
    vi.unstubAllEnvs();
  });

  it('tính năng mới mặc định tắt', () => {
    expect(isFeatureEnabled('newCheckout')).toBe(false);
    expect(isFeatureEnabled('vendorAnalytics')).toBe(false);
  });

  it('tính năng đã ổn định mặc định bật', () => {
    expect(isFeatureEnabled('realtimeUpdates')).toBe(true);
  });

  it('biến môi trường ghi đè mặc định', () => {
    vi.stubEnv('VITE_FEATURE_NEW_CHECKOUT', 'true');
    expect(isFeatureEnabled('newCheckout')).toBe(true);
  });

  it('ghi đè lúc chạy thắng biến môi trường', () => {
    vi.stubEnv('VITE_FEATURE_NEW_CHECKOUT', 'true');
    window.__MOONKAGE_FLAGS__ = { newCheckout: false };

    expect(isFeatureEnabled('newCheckout')).toBe(false);
  });

  it('ghi đè lúc chạy bật được tính năng đang tắt', () => {
    window.__MOONKAGE_FLAGS__ = { newCheckout: true };

    expect(isFeatureEnabled('newCheckout')).toBe(true);
  });

  it('giá trị không phải "true" thì coi như tắt', () => {
    vi.stubEnv('VITE_FEATURE_NEW_CHECKOUT', 'false');
    expect(isFeatureEnabled('newCheckout')).toBe(false);
  });

  it('biến môi trường rỗng thì rơi về mặc định', () => {
    vi.stubEnv('VITE_FEATURE_REALTIME_UPDATES', '');
    expect(isFeatureEnabled('realtimeUpdates')).toBe(true);
  });

  it('getActiveFlags trả về trạng thái của mọi cờ', () => {
    const flags = getActiveFlags();

    expect(Object.keys(flags).sort()).toEqual(
      ['newCheckout', 'otpViaZns', 'realtimeUpdates', 'vendorAnalytics'].sort(),
    );
  });

  it('cờ không nằm trong danh sách thì không có trạng thái', () => {
    const flags = getActiveFlags();
    expect(flags['khongTonTai' as FeatureFlag]).toBeUndefined();
  });

  it('setRuntimeFlags bật cờ và ghi ra window', () => {
    setRuntimeFlags({ newCheckout: true });

    expect(isFeatureEnabled('newCheckout')).toBe(true);
    expect(window.__MOONKAGE_FLAGS__?.newCheckout).toBe(true);
  });

  it('setRuntimeFlags xoá được cờ ghi đè', () => {
    setRuntimeFlags({ newCheckout: true });
    setRuntimeFlags(undefined);

    expect(isFeatureEnabled('newCheckout')).toBe(false);
  });
});
