package com.moonkage.identity.service;

import com.moonkage.identity.dto.request.SubmitCardRequest;
import com.moonkage.identity.dto.response.SubmitCardResponse;

/** The database side of FR-04: attempt counter and lockout, card checks, writing the LegalProfile. */
public interface NfcCardService {

    /** AC-04.1: the account must not be NFC-verified already nor locked. */
    void requireCanStartVerification(String accountId);

    /**
     * Checks a card for a session the caller already owns (Software Design 4.2, in order: lockout, decryption,
     * format, expiry, ID number not linked elsewhere) and saves the result in one transaction.
     */
    SubmitCardResponse verifyCard(String sessionId, String accountId, SubmitCardRequest request);
}
