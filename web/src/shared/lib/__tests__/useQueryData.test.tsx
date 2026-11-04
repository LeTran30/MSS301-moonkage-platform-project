import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useQueryData } from '../useQueryData';
import { ApiError } from '@/shared/api';

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

/**
 * Cùng thiết lập với `queryClient` thật của ứng dụng: `staleTime` 60 giây là
 * điều làm cho lần mount sau đọc cache thay vì gọi lại API. Nếu `staleTime` bằng 0
 * (mặc định của React Query) thì dữ liệu luôn "stale" và mỗi lần mount đều
 * refetch — tức là mất đúng lợi ích của query cache.
 */
function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60_000 } },
  });
}

describe('Shared lib - useQueryData (query cache)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('chuyển từ loading sang loaded', async () => {
    const client = makeClient();
    const { result } = renderHook(
      () => useQueryData(['test', 'basic'], async () => 'dữ liệu'),
      { wrapper: wrapper(client) },
    );

    expect(result.current.kind).toBe('loading');
    await waitFor(() => expect(result.current.kind).toBe('loaded'));
    expect(result.current.kind === 'loaded' && result.current.data).toBe('dữ liệu');
  });

  it('chuyển từ loading sang error khi tải lỗi', async () => {
    const client = makeClient();
    const { result } = renderHook(
      () =>
        useQueryData(['test', 'error'], async () => {
          throw new ApiError('Máy chủ bận.', 500);
        }),
      { wrapper: wrapper(client) },
    );

    await waitFor(() => expect(result.current.kind).toBe('error'));
    expect(result.current.kind === 'error' && result.current.message).toBe('Máy chủ bận.');
  });

  it('reload() gọi lại hàm tải', async () => {
    const client = makeClient();
    const loader = vi.fn(async () => 'x');
    const { result } = renderHook(() => useQueryData(['test', 'reload'], loader), {
      wrapper: wrapper(client),
    });

    await waitFor(() => expect(result.current.kind).toBe('loaded'));
    expect(loader).toHaveBeenCalledTimes(1);

    result.current.reload();
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
  });

  it('giữ nguyên identity của reload giữa các lần render', async () => {
    const client = makeClient();
    const { result, rerender } = renderHook(() => useQueryData(['test', 'stable'], async () => 'x'), {
      wrapper: wrapper(client),
    });

    await waitFor(() => expect(result.current.kind).toBe('loaded'));
    const first = result.current.reload;
    rerender();
    expect(result.current.reload).toBe(first);
  });

  it('hai hook cùng queryKey chỉ gọi API một lần', async () => {
    const client = makeClient();
    const loader = vi.fn(async () => 'dữ liệu chung');

    const first = renderHook(() => useQueryData(['product', 'catalog', 'HN'], loader), {
      wrapper: wrapper(client),
    });
    const second = renderHook(() => useQueryData(['product', 'catalog', 'HN'], loader), {
      wrapper: wrapper(client),
    });

    await waitFor(() => {
      expect(first.result.current.kind).toBe('loaded');
      expect(second.result.current.kind).toBe('loaded');
    });

    // Đây là điều đã gỡ: `CatalogBootstrap` và `CatalogPage` trước đây gọi
    // `/catalog/products` hai lần cho cùng một tỉnh.
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('queryKey khác nhau thì gọi API riêng', async () => {
    const client = makeClient();
    const loader = vi.fn(async () => 'dữ liệu');

    renderHook(() => useQueryData(['product', 'catalog', 'HN'], loader), {
      wrapper: wrapper(client),
    });
    renderHook(() => useQueryData(['product', 'catalog', 'HCM'], loader), {
      wrapper: wrapper(client),
    });

    await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
  });

  it('đọc lại cache trong lần mount sau, không gọi lại API', async () => {
    const client = makeClient();
    const loader = vi.fn(async () => 'cached');

    const first = renderHook(() => useQueryData(['order', 'list'], loader), {
      wrapper: wrapper(client),
    });
    await waitFor(() => expect(first.result.current.kind).toBe('loaded'));
    first.unmount();

    const second = renderHook(() => useQueryData(['order', 'list'], loader), {
      wrapper: wrapper(client),
    });

    // Dữ liệu đã có trong cache nên hiện ngay, không phải chờ loading.
    expect(second.result.current.kind).toBe('loaded');
    expect(loader).toHaveBeenCalledTimes(1);
  });
});
