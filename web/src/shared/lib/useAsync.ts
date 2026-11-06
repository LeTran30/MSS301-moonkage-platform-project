import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError } from '@/shared/api';
import type { AsyncStateKind } from '@/shared/ui';

/**
 * Hook useAsync nạp dữ liệu bất đồng bộ
 * Xử lý: hủy response lỗi thời (race conditions), reload, trích xuất lỗi ApiError
 */
export function useAsync<T>(
  load: () => Promise<T>,
  deps: readonly unknown[] = [],
): AsyncStateKind<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncStateKind<T>>({ kind: 'loading' });
  const [nonce, setNonce] = useState(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  const reload = useCallback(() => {
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    let current = true;
    setState({ kind: 'loading' });

    loadRef
      .current()
      .then((data) => {
        if (current) {
          setState({ kind: 'loaded', data });
        }
      })
      .catch((err: unknown) => {
        if (current) {
          const message =
            err instanceof ApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : 'Đã có sự cố xảy ra khi kết nối máy chủ.';
          setState({ kind: 'error', message });
        }
      });

    return () => {
      current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { ...state, reload };
}
