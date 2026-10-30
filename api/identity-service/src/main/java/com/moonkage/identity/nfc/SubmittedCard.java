package com.moonkage.identity.nfc;

/**
 * One card as the app sent it: six fields in plain text, three sealed (D-17). Nothing is trusted yet.
 *
 * @param sealedFields the sealed idNumber, dateOfBirth and placeOfResidence
 */
public record SubmittedCard(
        String fullName,
        String gender,
        String nationality,
        String placeOfBirth,
        String dateOfIssue,
        String dateOfExpiry,
        String sealedFields) {}
