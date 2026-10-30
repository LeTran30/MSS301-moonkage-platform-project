import { nfcDemoAccountKey } from '@/entities/user';
import { demoStore } from '@/shared/api/demo';
import type { NfcSession, NfcSessionState } from './types';

/**
 * Demo mode stand-in for the NFC endpoints: the "app" reads the card a few seconds after the QR is shown, then the
 * account is verified for the rest of the demo. State lives in the demo store under `nfc:<account>`.
 */
const APP_SCAN_AFTER_MS = 6000;
const SESSION_TTL_MS = 5 * 60 * 1000;

const delay = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 200));

export function demoCreateSession(): Promise<NfcSession> {
  const now = Date.now();
  const session = { sessionId: `demo-${now}`, expiresAt: new Date(now + SESSION_TTL_MS).toISOString() };
  demoStore.set('nfcSession', { ...session, createdAt: now });
  return delay(session);
}

export function demoGetSession(sessionId: string): Promise<NfcSessionState> {
  const stored = demoStore.get<(NfcSession & { createdAt: number }) | null>('nfcSession', null);
  const scanned = stored?.sessionId === sessionId && Date.now() - stored.createdAt >= APP_SCAN_AFTER_MS;
  if (scanned && !demoStore.get<boolean>(nfcDemoAccountKey(), false)) {
    demoStore.set(nfcDemoAccountKey(), true);
    demoStore.set(`${nfcDemoAccountKey()}:at`, new Date().toISOString());
  }
  return delay({ sessionId, expiresAt: stored?.expiresAt ?? new Date().toISOString(), status: scanned ? 'VERIFIED' : 'PENDING' });
}
