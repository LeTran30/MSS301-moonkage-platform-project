package com.moonkage.identity.dto.response;

import com.moonkage.identity.enums.NfcSessionStatus;
import java.time.Instant;

public record NfcSessionStatusResponse(String sessionId, NfcSessionStatus status, Instant expiresAt) {}
