package com.moonkage.identity.nfc.domain;

/**
 * The nine fields the app read from the chip, as text and not trusted (A-08). Six came in plain JSON; {@code idNumber},
 * {@code dateOfBirth} and {@code placeOfResidence} came sealed and are null when the seal did not hold them as text.
 */
public record NfcCardFields(
        String idNumber,
        String fullName,
        String gender,
        String nationality,
        String dateOfBirth,
        String placeOfBirth,
        String placeOfResidence,
        String dateOfIssue,
        String dateOfExpiry) {

    /** The ID number and birth date stay out of logs (NFR-03). */
    @Override
    public String toString() {
        return "NfcCardFields[fullName=" + fullName + "]";
    }
}
