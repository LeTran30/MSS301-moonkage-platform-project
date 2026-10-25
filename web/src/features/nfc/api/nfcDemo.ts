import { demoStore } from '../../../shared/api/demo';
import type { NfcSession, NfcSessionState, NfcStatusInfo } from './nfc';

/**
 * Demo mode stand-in for the NFC endpoints: the "app" reads the card a few seconds after the QR is shown, then the
 * account is verified for the rest of the demo. State lives in the demo store under `nfc:<account>`.
 */
const APP_SCAN_AFTER_MS = 6000;
const SESSION_TTL_MS = 5 * 60 * 1000;

const accountKey = () => `nfc:${demoStore.get<string>('account', '')}`;
const delay = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 200));

export function demoStatus(): Promise<NfcStatusInfo> {
  const verified = demoStore.get<boolean>(accountKey(), false);
  return delay({
    nfcStatus: verified ? 'VERIFIED' : 'NOT_VERIFIED',
    legalName: verified ? demoStore.get<string>('name', '').toUpperCase() : null,
    idNumberMasked: verified ? '001*******234' : null,
    nfcVerifiedAt: verified ? demoStore.get<string>(`${accountKey()}:at`, '2026-10-20T03:15:00Z') : null,
  });
}

export function demoCreateSession(): Promise<NfcSession> {
  const now = Date.now();
  const session = { sessionId: `demo-${now}`, expiresAt: new Date(now + SESSION_TTL_MS).toISOString() };
  demoStore.set('nfcSession', { ...session, createdAt: now });
  return delay(session);
}

export function demoGetSession(sessionId: string): Promise<NfcSessionState> {
  const stored = demoStore.get<(NfcSession & { createdAt: number }) | null>('nfcSession', null);
  const scanned = stored?.sessionId === sessionId && Date.now() - stored.createdAt >= APP_SCAN_AFTER_MS;
  if (scanned && !demoStore.get<boolean>(accountKey(), false)) {
    demoStore.set(accountKey(), true);
    demoStore.set(`${accountKey()}:at`, new Date().toISOString());
  }
  return delay({ sessionId, expiresAt: stored?.expiresAt ?? new Date().toISOString(), status: scanned ? 'VERIFIED' : 'PENDING' });
}
