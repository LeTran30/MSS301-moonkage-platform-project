import { useCallback } from 'react';
import { createNfcSession } from '../api/nfcWriteApi';
import { nfcApi } from '@/entities/user';
import type { CreateNfcSessionDto, NfcSessionStatusDto, NfcStatusDto } from '@/entities/user';

/**
 * The NFC verification flow of the customer (FR-04).
 *
 * The feature owns the three calls of the screen: open a session, read the
 * session state, and re-read the masked identity status of the account.
 */
export function useStartNfcSession() {
  return useCallback((): Promise<CreateNfcSessionDto> => createNfcSession(), []);
}

/** The state of one open NFC verification session. */
export function useGetNfcSession() {
  return useCallback(
    (sessionId: string): Promise<NfcSessionStatusDto> => nfcApi.getSession(sessionId),
    [],
  );
}

/** The masked identity status of the caller (AC-04.11: dữ liệu đã che). */
export function useGetNfcStatus() {
  return useCallback((): Promise<NfcStatusDto> => nfcApi.getMyStatus(), []);
}
