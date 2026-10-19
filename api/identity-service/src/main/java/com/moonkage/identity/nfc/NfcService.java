package com.moonkage.identity.nfc;

import com.moonkage.identity.dto.request.SubmitCardRequest;
import com.moonkage.identity.dto.response.CreateNfcSessionResponse;
import com.moonkage.identity.dto.response.NfcSessionStatusResponse;
import com.moonkage.identity.dto.response.SubmitCardResponse;

/**
 * FR-04 NFC verification: sessions kept in memory only, and the card check that writes the attempt counter, the
 * lockout and the LegalProfile.
 */
public interface NfcService {

    /**
     * AC-04.1: the account must not be NFC-verified already nor locked. Replaces a pending session of the same
     * account, so only the newest QR works.
     */
    CreateNfcSessionResponse createSession(String accountId);

    /** Throws NFC_SESSION_EXPIRED (unknown or expired) or NFC_SESSION_NOT_OWNED. */
    NfcSessionStatusResponse getSession(String sessionId, String accountId);

    /**
     * AC-04.2 - AC-04.9. Checks the card (Software Design 4.2, in order: lockout, decryption, format, expiry, ID
     * number not linked elsewhere) and saves the result in one transaction. Never throws for a rejected card: the
     * reason is in the response.
     */
    SubmitCardResponse submitCard(String sessionId, String accountId, SubmitCardRequest request);
}
