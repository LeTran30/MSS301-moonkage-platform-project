package com.moonkage.identity.dto.request;

/**
 * Body of POST /api/nfc/sessions/{sessionId}/card, sent once after the user taps Save on the phone (D-20).
 * {@code encryptedFields} is a JWE of {@code {idNumber, dateOfBirth, placeOfResidence}} (AC-04.10, D-17).
 *
 * <p>No bean validation on purpose: a malformed card is a counted attempt answered with BAD_FORMAT (AC-04.9), not a
 * 400, so the server re-checks every field itself.
 */
public record SubmitCardRequest(
        String fullName,
        String sex,
        String nationality,
        String placeOfBirth,
        String dateOfIssue,
        String dateOfExpiry,
        String encryptedFields,
        String appVersion) {}
