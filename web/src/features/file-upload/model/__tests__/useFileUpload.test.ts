import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFileUpload } from '../useFileUpload';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature file-upload - useFileUpload', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('trả về tempKey khi tải thành công', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue(
      envelope({ tempKey: 'temp/1', uploadUrl: 'https://minio.local/upload' }) as never,
    );
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    const { result } = renderHook(() => useFileUpload('ORDER'));

    await act(async () => {
      const key = await result.current.upload(new File(['x'], 'a.jpg'));
      expect(key).toBe('temp/1');
    });

    expect(result.current.tempKey).toBe('temp/1');
    expect(result.current.busy).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('ném lỗi và giữ thông báo lỗi khi tải hỏng', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue(
      envelope({ tempKey: 'temp/1', uploadUrl: 'https://minio.local/upload' }) as never,
    );
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 500 }));

    const { result } = renderHook(() => useFileUpload('ORDER'));

    await act(async () => {
      await expect(result.current.upload(new File(['x'], 'a.jpg'))).rejects.toThrow(
        'Không tải được tệp lên kho lưu trữ.',
      );
    });

    expect(result.current.error).toBe('Không tải được tệp lên kho lưu trữ.');
    expect(result.current.busy).toBe(false);
  });

  it('abort() dừng lần tải đang chạy và trả về busy = false', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue(
      envelope({ tempKey: 'temp/1', uploadUrl: 'https://minio.local/upload' }) as never,
    );
    // Kho lưu trữ "treo" — chỉ hết khi bị huỷ.
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new Error('Aborted'));
          });
        }),
    );

    const { result } = renderHook(() => useFileUpload('ORDER'));

    act(() => {
      // Lần tải bị huỷ sẽ ném lỗi ra — bắt lại để không thành unhandled rejection.
      void result.current.upload(new File(['x'], 'a.jpg')).catch(() => undefined);
    });

    await waitFor(() => expect(result.current.phase).toBe('uploading'));
    expect(result.current.busy).toBe(true);

    act(() => {
      result.current.abort();
    });

    await waitFor(() => expect(result.current.busy).toBe(false));
    // Lỗi huỷ xuất hiện sau khi promise của `fetch` bị từ chối.
    await waitFor(() => expect(result.current.error).toBe('Đã huỷ tải tệp lên.'));
  });

  it('reset() xoá lỗi và tempKey cũ', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue(
      envelope({ tempKey: 'temp/1', uploadUrl: 'https://minio.local/upload' }) as never,
    );
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    const { result } = renderHook(() => useFileUpload('ORDER'));

    await act(async () => {
      await result.current.upload(new File(['x'], 'a.jpg'));
    });
    expect(result.current.tempKey).toBe('temp/1');

    act(() => {
      result.current.reset();
    });

    expect(result.current.tempKey).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
