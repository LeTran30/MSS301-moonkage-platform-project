/**
 * What the NFC session QR carries, read by the Moonkage Verify app
 * (`mobile/lib/features/verify/domain/session_qr.dart`). The app also takes a
 * bare `moonkage-verify:<id>`; the version keeps room for a later format.
 */
export const NFC_SESSION_QR_PREFIX = 'moonkage-verify:v1:';

/** QR text for one NFC session. */
export function nfcSessionQrValue(sessionId: string): string {
  return `${NFC_SESSION_QR_PREFIX}${sessionId}`;
}
