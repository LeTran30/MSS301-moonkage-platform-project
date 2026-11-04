import { useQueryData } from '@/shared/lib';
import { queryKeys } from '@/shared/api';
import { nfcApi } from '../api/nfcApi';

/**
 * The NFC verification status of the caller (the "xác minh" screen).
 */
export function useNfcStatus() {
  return useQueryData(queryKeys.nfc.status(), () => nfcApi.getMyStatus());
}

/** The state of one NFC verification session. */
export function useNfcSession(sessionId: string | null) {
  return useQueryData(queryKeys.nfc.session(sessionId ?? ''), () =>
    sessionId ? nfcApi.getSession(sessionId) : Promise.resolve(null),
  );
}
