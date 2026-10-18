package com.moonkage.identity.service;

import com.moonkage.identity.dto.request.SubmitCardRequest;
import com.moonkage.identity.dto.response.NfcSessionCreateResponse;
import com.moonkage.identity.dto.response.NfcSessionStatusResponse;
import com.moonkage.identity.dto.response.SubmitCardResponse;

/** FR-04 verification sessions, kept in memory only: nothing is written to the database for a session. */
public interface NfcSessionService {

    /** AC-04.1. Replaces a pending session of the same account, so only the newest QR works. */
    NfcSessionCreateResponse createSession(String accountId);

    /** Throws NFC_SESSION_EXPIRED (unknown or expired) or NFC_SESSION_NOT_OWNED. */
    NfcSessionStatusResponse getSession(String sessionId, String accountId);

    /** AC-04.2 - AC-04.9. Never throws for a rejected card: the reason is in the response. */
    SubmitCardResponse submitCard(String sessionId, String accountId, SubmitCardRequest request);
}
