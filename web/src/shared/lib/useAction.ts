import { useState, useCallback } from 'react';
import { ApiError } from '@/shared/api';

const ACTION_FAILED_MSG = 'Thao tác không thành công. Vui lòng kiểm tra lại kết nối và thử lại.';

/**
 * Hook useAction chống click đúp / gửi trùng (Idempotency)
 * Tuân thủ Luật L4: Mọi hành động ghi phải có busy + finally
 */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (fn: () => Promise<unknown>): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      return true;
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : ACTION_FAILED_MSG;
      setError(msg);
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, error, setError, run };
}
