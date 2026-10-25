/** What the web encodes in the QR; the Moonkage Verify app reads `moonkage-verify[:vN]:<sessionId>`. */
export const nfcQrPayload = (sessionId: string) => `moonkage-verify:v1:${sessionId}`;
