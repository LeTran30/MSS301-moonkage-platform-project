package com.moonkage.identity.service.impl;

import com.moonkage.identity.constant.IdCardConstant;
import com.moonkage.identity.dto.request.SubmitCardRequest;
import com.moonkage.identity.enums.Sex;
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
    private static final DateTimeFormatter DATE =
            DateTimeFormatter.ofPattern(IdCardConstant.DATE_PATTERN).withResolverStyle(ResolverStyle.STRICT);

    /** What survives the checks; place of birth / residence and the issue date are dropped here (AC-04.11). */
    record NfcCard(
            String idNumber,
            String legalName,
            Sex sex,
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
        Sex sex = parseSex(request.sex());

        boolean valid = idNumber != null
                && ID_NUMBER_PATTERN.matcher(idNumber).matches()
                && request.fullName() != null
                && request.fullName().length() <= IdCardConstant.MAX_LEGAL_NAME_LENGTH
                && LEGAL_NAME_PATTERN.matcher(request.fullName()).matches()
                && sex != null
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
                        idNumber, request.fullName(), sex, request.nationality().trim(), dateOfBirth, dateOfExpiry))
                : Optional.empty();
    }

    private static boolean isText(String value, int maxLength) {
        return value != null && !value.isBlank() && value.trim().length() <= maxLength;
    }

    private static LocalDate parseDate(String value) {
        if (value == null) {
            return null;
        }
        try {
            return LocalDate.parse(value, DATE);
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    private static Sex parseSex(String value) {
        for (Sex sex : Sex.values()) {
            if (sex.name().equals(value)) {
                return sex;
            }
        }
        return null;
    }
}
