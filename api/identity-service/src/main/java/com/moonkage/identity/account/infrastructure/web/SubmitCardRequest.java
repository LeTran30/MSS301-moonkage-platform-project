package com.moonkage.identity.account.infrastructure.web;

import com.moonkage.identity.nfc.SubmittedCard;

/**
 * Body of POST /api/accounts/me/profile/kyc/nfc-sessions/{sessionId}/card, sent once after the user taps Save on the
 * phone (D-20). {@code encryptedFields} is a JWE of {@code {idNumber, dateOfBirth, placeOfResidence}} (AC-04.10,
 * D-17).
 *
 * <p>Nothing is parsed here on purpose: a malformed card is a counted attempt answered BAD_FORMAT (AC-04.9), not a
 * 400, so the use case checks every field itself.
 *
 * @param appVersion sent by the app, not read
 */
public record SubmitCardRequest(
        String fullName,
        String gender,
        String nationality,
        String placeOfBirth,
        String dateOfIssue,
        String dateOfExpiry,
        String encryptedFields,
        String appVersion) {

    SubmittedCard toCard() {
        return new SubmittedCard(
                fullName, gender, nationality, placeOfBirth, dateOfIssue, dateOfExpiry, encryptedFields);
    }
}
