import { describe, expect, it } from 'vitest';
import { nfcSessionQrValue } from '../sessionQr';

/** The pattern the Verify app accepts (`session_qr.dart`, `_prefixPattern`). */
const APP_PATTERN = /^moonkage-verify(?::v\d+)?:([A-Za-z0-9_-]{16,128})$/i;

describe('nfcSessionQrValue', () => {
  it('builds the text the Verify app reads back to the same session id', () => {
    // identity-service ids are 32 base64url characters (NfcServiceImpl.newSessionId)
    const sessionId = 'Qm9vbjNrYWdlLXNlc3Npb24taWQtMDEx';
    const match = APP_PATTERN.exec(nfcSessionQrValue(sessionId));
    expect(match?.[1]).toBe(sessionId);
  });
});
