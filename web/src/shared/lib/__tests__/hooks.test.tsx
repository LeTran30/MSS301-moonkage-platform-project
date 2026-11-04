import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAction } from '../useAction';
import { useAsync } from '../useAsync';
import { ApiError } from '@/shared/api';

describe('Shared lib - useAction', () => {
  it('trả về true khi hành động thành công', async () => {
    const { result } = renderHook(() => useAction());
    await act(async () => {
      const ok = await result.current.run(async () => undefined);
      expect(ok).toBe(true);
    });
    expect(result.current.error).toBeNull();
    expect(result.current.busy).toBe(false);
  });

  it('bắt lỗi ApiError và hiển thị message của server', async () => {
    const { result } = renderHook(() => useAction());
    await act(async () => {
      const ok = await result.current.run(async () => {
        throw new ApiError('Không đủ hàng tồn kho.', 409);
      });
      expect(ok).toBe(false);
    });
    expect(result.current.error).toBe('Không đủ hàng tồn kho.');
    expect(result.current.busy).toBe(false);
  });

  it('báo lỗi chung khi lỗi không phải Error', async () => {
    const { result } = renderHook(() => useAction());
    await act(async () => {
      await result.current.run(async () => {
        throw 'một chuỗi lỗi lạ';
      });
    });
    expect(result.current.error).toBeTruthy();
  });

  it('busy trở lại false sau khi hành động kết thúc', async () => {
    const { result } = renderHook(() => useAction());
    await act(async () => {
      await result.current.run(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
    });
    expect(result.current.busy).toBe(false);
  });
});

describe('Shared lib - useAsync', () => {
  it('chuyển từ loading sang loaded', async () => {
    const { result } = renderHook(() => useAsync(async () => 'dữ liệu', []));
    expect(result.current.kind).toBe('loading');
    await waitFor(() => expect(result.current.kind).toBe('loaded'));
    expect(result.current.kind === 'loaded' && result.current.data).toBe('dữ liệu');
  });

  it('chuyển từ loading sang error khi tải lỗi', async () => {
    const { result } = renderHook(() =>
      useAsync(async () => {
        throw new ApiError('Máy chủ bận.', 500);
      }, []),
    );
    await waitFor(() => expect(result.current.kind).toBe('error'));
    expect(result.current.kind === 'error' && result.current.message).toBe('Máy chủ bận.');
  });

  it('reload() gọi lại hàm tải', async () => {
    const loader = vi.fn(async () => 'x');
    const { result } = renderHook(() => useAsync(loader, []));
    await waitFor(() => expect(result.current.kind).toBe('loaded'));
    expect(loader).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.reload();
    });
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
  });
});
