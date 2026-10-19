import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../../api/client';
import { realtime } from '../../api/endpoints';
import {
  createNfcSession,
  getNfcSession,
  HTTP_GONE,
  type NfcPushMessage,
  type NfcReasonCode,
  type NfcSession,
} from '../../api/nfc';
import { config } from '../../config';
import { useRealtime } from '../../realtime/useRealtime';
import { strings } from '../../strings';
import { secondsUntil } from '../../utils/format';

const HTTP_FORBIDDEN = 403;
const COUNTDOWN_TICK_MS = 1000;

/** The app's last card for this QR was refused; the QR stays usable for another try. */
export interface NfcRejection {
  reasonCode: NfcReasonCode | null;
  attemptsLeft: number | null;
}

export type NfcSessionPhase =
  | { kind: 'idle' }
  | { kind: 'creating' }
  | { kind: 'pending'; session: NfcSession; secondsLeft: number; lastRejection?: NfcRejection }
  | { kind: 'verified' }
  /** `lost`: the server no longer knows the QR (restart, replaced by a newer one). */
  | { kind: 'expired'; reason: 'timeout' | 'lost' }
  /** Too many refused cards (AC-04.9), learnt from the push. */
  | { kind: 'locked'; lockedUntil: string | null }
  | { kind: 'error'; error: ApiError };

export interface NfcSessionOptions {
  /** Poll period while the WebSocket is down. */
  pollIntervalMs?: number;
  /** Poll period while the WebSocket is up: the push does the work, the poll covers a missed message. */
  pollIntervalConnectedMs?: number;
}

function asApiError(error: unknown): ApiError {
  return error instanceof ApiError ? error : new ApiError(0, null, strings.errors.server);
}

/**
 * One QR session of FR-04 on the web: create it, count down to its expiry and follow it until the app has sent the
 * card (AC-04.5). Each card attempt is pushed over the WebSocket (orchestrator-service); polling stays as the
 * fallback, slower while the socket is up. A missed poll (network blip) is simply retried on the next tick.
 */
export function useNfcSession(onVerified: () => void, options: NfcSessionOptions = {}) {
  const pollIntervalMs = options.pollIntervalMs ?? config.nfcPollIntervalMs;
  const pollIntervalConnectedMs = options.pollIntervalConnectedMs ?? config.nfcPollIntervalConnectedMs;
  const { connected, subscribe } = useRealtime();

  const [phase, setPhase] = useState<NfcSessionPhase>({ kind: 'idle' });
  const onVerifiedRef = useRef(onVerified);
  useEffect(() => {
    onVerifiedRef.current = onVerified;
  });
  // push and poll can both see VERIFIED: report it once per QR
  const reportedSessionRef = useRef<string | null>(null);

  const session = phase.kind === 'pending' ? phase.session : null;
  const sessionId = session?.sessionId;
  const expiresAt = session?.expiresAt;

  /** Resolves to the error when the server refused a new QR, so the caller can react (already verified, locked). */
  const start = useCallback(async (): Promise<ApiError | null> => {
    setPhase({ kind: 'creating' });
    try {
      const created = await createNfcSession();
      setPhase({ kind: 'pending', session: created, secondsLeft: secondsUntil(created.expiresAt) });
      return null;
    } catch (error) {
      const apiError = asApiError(error);
      setPhase({ kind: 'error', error: apiError });
      return apiError;
    }
  }, []);

  /** Back to "no QR yet", e.g. after the account status was reloaded. */
  const reset = useCallback(() => setPhase({ kind: 'idle' }), []);

  // countdown, from the server's expiresAt so a sleeping tab does not drift
  useEffect(() => {
    if (!sessionId || !expiresAt) return;
    const timer = setInterval(() => {
      const secondsLeft = secondsUntil(expiresAt);
      setPhase((current) => {
        if (current.kind !== 'pending' || current.session.sessionId !== sessionId) return current;
        return secondsLeft > 0 ? { ...current, secondsLeft } : { kind: 'expired', reason: 'timeout' };
      });
    }, COUNTDOWN_TICK_MS);
    return () => clearInterval(timer);
  }, [sessionId, expiresAt]);

  // push and poll both end here
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    const update = (next: (current: Extract<NfcSessionPhase, { kind: 'pending' }>) => NfcSessionPhase) =>
      setPhase((current) =>
        current.kind === 'pending' && current.session.sessionId === sessionId ? next(current) : current,
      );
    const verified = () => {
      update(() => ({ kind: 'verified' }));
      if (reportedSessionRef.current === sessionId) return;
      reportedSessionRef.current = sessionId;
      onVerifiedRef.current();
    };

    const unsubscribe = subscribe<NfcPushMessage>(realtime.nfcQueue, (message) => {
      if (cancelled || message.sessionId !== sessionId) return;
      if (message.type === 'VERIFIED') verified();
      else if (message.type === 'LOCKED') update(() => ({ kind: 'locked', lockedUntil: message.lockedUntil }));
      else if (message.type === 'FAILED') {
        update((current) => ({
          ...current,
          lastRejection: { reasonCode: message.reasonCode, attemptsLeft: message.attemptsLeft },
        }));
      }
    });

    let inFlight = false;
    const poll = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const state = await getNfcSession(sessionId);
        if (!cancelled && state.status === 'VERIFIED') verified();
      } catch (error) {
        const status = asApiError(error).status;
        if (!cancelled && (status === HTTP_GONE || status === HTTP_FORBIDDEN)) {
          update(() => ({ kind: 'expired', reason: 'lost' }));
        }
      } finally {
        inFlight = false;
      }
    };
    const timer = setInterval(() => void poll(), connected ? pollIntervalConnectedMs : pollIntervalMs);

    return () => {
      cancelled = true;
      unsubscribe();
      clearInterval(timer);
    };
  }, [sessionId, connected, subscribe, pollIntervalMs, pollIntervalConnectedMs]);

  return { phase, start, reset, connected };
}
