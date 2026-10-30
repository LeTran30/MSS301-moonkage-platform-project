import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api/client';

export type AsyncState<T> = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'loaded'; data: T };

const DEFAULT_LOAD_ERROR = 'Không tải được dữ liệu. Thử lại sau ít phút.';

/**
 * Runs `load` on mount and whenever `deps` change; answers that arrive after a newer request are dropped.
 * `reload` runs it again (the retry button).
 */
export function useAsync<T>(load: () => Promise<T>, deps: readonly unknown[]): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- the caller lists what `load` depends on
  const run = useCallback(load, deps);

  useEffect(() => {
    let current = true;
    setState({ kind: 'loading' });
    run().then(
      (data) => current && setState({ kind: 'loaded', data }),
      (error: unknown) =>
        current && setState({ kind: 'error', message: error instanceof ApiError ? error.message : DEFAULT_LOAD_ERROR }),
    );
    return () => {
      current = false;
    };
  }, [run, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, reload };
}
