import { useEffect, useRef } from 'react';
import { useRealtime } from '@/shared/api/realtime';
import type { NfcReasonCode } from '@/entities/user';

/** The STOMP destination the identity service pushes the NFC events to. */
export const nfcQueue = '/user/queue/nfc';

/**
 * The push the identity service sends when the card is read (AC-04.5).
 *
 * `VERIFIED` ends the session, `LOCKED` means too many refused cards
 * (AC-04.9) and `FAILED` carries the reason code of the refusal.
 */
export interface NfcPushMessage {
  sessionId: string;
  type: 'VERIFIED' | 'FAILED' | 'LOCKED';
  reasonCode?: NfcReasonCode;
  attemptsLeft?: number;
  lockedUntil?: string | null;
}

/**
 * Follow one NFC session over the realtime channel.
 *
 * The socket is the fast path; the screen keeps polling as the fallback for a
 * missed push, so the callback only has to react when it arrives.
 */
export function useNfcPush(
  sessionId: string | null,
  onMessage: (message: NfcPushMessage) => void
): void {
  const { subscribe } = useRealtime();
  const handlerRef = useRef(onMessage);
  useEffect(() => {
    handlerRef.current = onMessage;
  });

  useEffect(() => {
    if (!sessionId) return;
    return subscribe<NfcPushMessage>(nfcQueue, (message) => {
      if (message.sessionId !== sessionId) return;
      handlerRef.current(message);
    });
  }, [sessionId, subscribe]);
}
