import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../../shared/api/client';
import { strings } from '../../../shared/config/strings';
import { getMyNfcStatus, type NfcStatusInfo } from '../api/nfc';

export type NfcStatusState =
  | { kind: 'loading' }
  | { kind: 'loaded'; info: NfcStatusInfo }
  | { kind: 'error'; message: string };

async function loadStatusState(): Promise<NfcStatusState> {
  try {
    return { kind: 'loaded', info: await getMyNfcStatus() };
  } catch (error) {
    return { kind: 'error', message: error instanceof ApiError ? error.message : strings.errors.server };
  }
}

/** The account's NFC status (verified, locked or not yet), loaded on mount. */
export function useNfcStatus() {
  const [status, setStatus] = useState<NfcStatusState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    void loadStatusState().then((next) => {
      if (!cancelled) setStatus(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Fetches again in the background: the current status stays on screen until the answer arrives. */
  const refresh = useCallback(async () => setStatus(await loadStatusState()), []);

  /** Shows "loading" again, then fetches. */
  const reload = useCallback(() => {
    setStatus({ kind: 'loading' });
    void refresh();
  }, [refresh]);

  return { status, refresh, reload };
}
