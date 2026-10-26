package com.moonkage.identity.kyc.dto.response;

import java.time.Instant;

/** The web shows {@code sessionId} as a QR code; it carries no personal data (AC-04.1). */
public record CreateNfcSessionResponse(String sessionId, Instant expiresAt) {}
