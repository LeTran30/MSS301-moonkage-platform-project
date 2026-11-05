import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Sentry không có DSN thì phải là no-op hoàn toàn.
 *
 * Đây là bảo đảm quan trọng nhất của module: local và CI không có DSN, nếu
 * `captureException` vẫn chạy thì mọi lỗi nghiệp vụ bình thường sẽ bị báo
 * lên (và tệ hơn, có thể làm app chậm).
 */
const sentryMock = {
  init: vi.fn(),
  captureException: vi.fn(),
  setUser: vi.fn(),
  addBreadcrumb: vi.fn(),
  addIntegration: vi.fn(),
  lazyLoadIntegration: vi.fn(async () => vi.fn(() => ({ name: 'Replay' }))),
};

vi.mock('@sentry/browser', () => sentryMock);

const { captureApiError, captureUnexpectedError, setSentryUser, addBreadcrumb, initSentry } =
  await import('../sentry');

describe('sentry khi không có DSN', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('initSentry không gọi SDK', () => {
    initSentry();
    expect(sentryMock.init).not.toHaveBeenCalled();
  });

  it('captureApiError không gọi SDK', () => {
    captureApiError(new Error('boom'), {
      endpoint: '/api/x',
      method: 'GET',
      status: 500,
    });
    expect(sentryMock.captureException).not.toHaveBeenCalled();
  });

  it('captureUnexpectedError không gọi SDK', () => {
    captureUnexpectedError(new Error('boom'));
    expect(sentryMock.captureException).not.toHaveBeenCalled();
  });

  it('setSentryUser không gọi SDK', () => {
    setSentryUser('acc_01', 'BUYER');
    expect(sentryMock.setUser).not.toHaveBeenCalled();
  });

  it('addBreadcrumb không gọi SDK', () => {
    addBreadcrumb('một cụt');
    expect(sentryMock.addBreadcrumb).not.toHaveBeenCalled();
  });
});
