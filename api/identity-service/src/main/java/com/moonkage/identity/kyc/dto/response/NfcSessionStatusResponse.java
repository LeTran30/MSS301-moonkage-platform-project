package com.moonkage.identity.kyc.dto.response;

import com.moonkage.identity.kyc.NfcSessionStatus;
import java.time.Instant;

public record NfcSessionStatusResponse(String sessionId, NfcSessionStatus status, Instant expiresAt) {}
