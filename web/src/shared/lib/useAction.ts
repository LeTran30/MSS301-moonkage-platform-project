import { useCallback, useState } from 'react';
import { ApiError } from '../api/client';

const ACTION_FAILED_MSG = 'Chưa thực hiện được. Thử lại sau ít phút.';

/**
 * One user action at a time: `busy` while it runs, and the server's message when it is refused. `run` answers
 * whether the action went through.
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
      setError(e instanceof ApiError ? e.message : ACTION_FAILED_MSG);
      return false;
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, error, run };
}
