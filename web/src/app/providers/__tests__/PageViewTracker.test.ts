import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TrackedRouterState } from '../PageViewTracker';

const trackPageView = vi.fn();

vi.mock('@/shared/observability', () => ({
  trackPageView: (path: string, title?: string) => trackPageView(path, title),
}));

const { buildRoutePattern, startPageViewTracking } = await import('../PageViewTracker');

describe('buildRoutePattern', () => {
  it('ghép các route cha và con thành đường dẫn đầy đủ', () => {
    const pattern = buildRoutePattern([
      { route: { path: 'tai-khoan' } },
      { route: { path: 'don-hang' } },
    ]);

    expect(pattern).toBe('/tai-khoan/don-hang');
  });

  it('giữ nguyên tham số động thay vì id thật', () => {
    const pattern = buildRoutePattern([
      { route: { path: 'san-pham' } },
      { route: { path: ':id' } },
    ]);

    // `:id` là mẫu, không phải `prod_01` — để mọi sản phẩm gộp chung một trang
    // trong báo cáo funnel.
    expect(pattern).toBe('/san-pham/:id');
  });

  it('trả "/" khi route gốc không có path con', () => {
    expect(buildRoutePattern([{ route: { path: '/' } }])).toBe('/');
  });
});

describe('startPageViewTracking', () => {
  beforeEach(() => {
    trackPageView.mockClear();
  });

  it('gửi sự kiện cho lần tải đầu tiên', () => {
    const router = {
      state: {
        location: { pathname: '/san-pham/prod_01' },
        matches: [{ route: { path: 'san-pham' } }, { route: { path: ':id' } }],
      },
      subscribe: vi.fn(() => () => undefined),
    };

    startPageViewTracking(router);

    expect(trackPageView).toHaveBeenCalledTimes(1);
    expect(trackPageView).toHaveBeenCalledWith('/san-pham/:id', expect.any(String));
  });

  it('không gửi trùng khi router báo lại cùng một đường dẫn', () => {
    const subscribers: ((state: TrackedRouterState) => void)[] = [];
    const router = {
      state: {
        location: { pathname: '/' },
        matches: [{ route: { path: '/' } }],
      },
      subscribe: vi.fn((fn: (state: TrackedRouterState) => void) => {
        subscribers.push(fn);
        return () => undefined;
      }),
    };

    startPageViewTracking(router);
    expect(trackPageView).toHaveBeenCalledTimes(1);

    const notify = (state: TrackedRouterState) => {
      subscribers.forEach((fn) => fn(state));
    };

    // Router báo lại cùng đường dẫn → không gửi thêm.
    notify(router.state);
    expect(trackPageView).toHaveBeenCalledTimes(1);

    // Điều hướng sang trang khác → gửi tiếp.
    notify({
      location: { pathname: '/gio-hang' },
      matches: [{ route: { path: 'gio-hang' } }],
    });
    expect(trackPageView).toHaveBeenCalledTimes(2);
    expect(trackPageView).toHaveBeenLastCalledWith('/gio-hang', expect.any(String));
  });
});
