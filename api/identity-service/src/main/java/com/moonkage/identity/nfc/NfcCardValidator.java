package com.moonkage.identity.nfc;

import com.moonkage.identity.constant.IdCardConstant;
import com.moonkage.identity.dto.request.SubmitCardRequest;
import com.moonkage.identity.enums.Gender;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Server-side check of the 9 card fields (A-08, Software Design 4.2); the app's own check is not trusted. Six fields
 * come in plain JSON, three inside {@code encryptedFields}. The card's expiry is checked separately (CARD_EXPIRED).
 */
final class NfcCardValidator {

    static final String ID_NUMBER = "idNumber";
    static final String DATE_OF_BIRTH = "dateOfBirth";
    static final String PLACE_OF_RESIDENCE = "placeOfResidence";

    private static final Pattern ID_NUMBER_PATTERN = Pattern.compile(IdCardConstant.ID_NUMBER_PATTERN);
    private static final Pattern LEGAL_NAME_PATTERN = Pattern.compile(IdCardConstant.LEGAL_NAME_PATTERN);
    /** Strict: 2023-02-30 is rejected instead of rolled over. */
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern(IdCardConstant.DATE_PATTERN).withResolverStyle(ResolverStyle.STRICT);

    /** What survives the checks; place of birth / residence and the issue date are dropped here (AC-04.11). */
    record NfcCard(
            String idNumber,
            String legalName,
            Gender gender,
            String nationality,
            LocalDate dateOfBirth,
            LocalDate dateOfExpiry) {}

    private NfcCardValidator() {}

    /** Empty = BAD_FORMAT. */
    static Optional<NfcCard> validate(SubmitCardRequest request, Map<String, Object> encrypted) {
        if (request == null || encrypted == null) {
            return Optional.empty();
        }
        String idNumber = encrypted.get(ID_NUMBER) instanceof String s ? s : null;
        String placeOfResidence = encrypted.get(PLACE_OF_RESIDENCE) instanceof String s ? s : null;
        LocalDate dateOfBirth = encrypted.get(DATE_OF_BIRTH) instanceof String s ? parseDate(s) : null;
        LocalDate dateOfIssue = parseDate(request.dateOfIssue());
        LocalDate dateOfExpiry = parseDate(request.dateOfExpiry());
        Gender gender = parseGender(request.gender());

        boolean valid = idNumber != null
                && ID_NUMBER_PATTERN.matcher(idNumber).matches()
                && request.fullName() != null
                && request.fullName().length() <= IdCardConstant.MAX_LEGAL_NAME_LENGTH
                && LEGAL_NAME_PATTERN.matcher(request.fullName()).matches()
                && gender != null
                && isText(request.nationality(), IdCardConstant.MAX_NATIONALITY_LENGTH)
                && isText(request.placeOfBirth(), IdCardConstant.MAX_PLACE_LENGTH)
                && isText(placeOfResidence, IdCardConstant.MAX_PLACE_LENGTH)
                && dateOfBirth != null
                && dateOfIssue != null
                && dateOfExpiry != null
                && dateOfIssue.isAfter(dateOfBirth)
                && dateOfExpiry.isAfter(dateOfIssue);
        return valid
                ? Optional.of(new NfcCard(
                        idNumber,
                        request.fullName(),
                        gender,
                        request.nationality().trim(),
                        dateOfBirth,
                        dateOfExpiry))
                : Optional.empty();
    }

    private static LocalDate parseDate(String value) {
        if (value == null) {
            return null;
        }
        try {
            return LocalDate.parse(value, DATE_FORMATTER);
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    /** The app sends the card's "gender" field as MALE / FEMALE; anything else is BAD_FORMAT. */
    private static Gender parseGender(String value) {
        for (Gender gender : Gender.values()) {
            if (gender.name().equals(value)) {
                return gender;
            }
        }
        return null;
    }

    private static boolean isText(String value, int maxLength) {
        return value != null && !value.isBlank() && value.trim().length() <= maxLength;
    }
}
