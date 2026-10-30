package com.moonkage.identity.nfc.domain;

import com.moonkage.identity.shared.CitizenId;
import com.moonkage.identity.shared.LegalName;
import com.moonkage.identity.shared.value.ValueRejected;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.util.Optional;
import java.util.Set;

/**
 * The server's own check of the card format (A-08, Software Design 4.2); the app's check is not trusted. The expiry
 * is not checked here: an expired card is CARD_EXPIRED, not BAD_FORMAT.
 */
public final class NfcCardRules {

    /** As the app sends the card's {@code Nam} / {@code Nu} / {@code Nữ}. */
    private static final Set<String> GENDERS = Set.of("MALE", "FEMALE");

    private static final int MAX_NATIONALITY_LENGTH = 50;
    private static final int MAX_PLACE_LENGTH = 255;

    /** Strict, so 2023-02-30 is refused instead of rolled over; "uuuu" because strict needs a proleptic year. */
    private static final DateTimeFormatter DATE =
            DateTimeFormatter.ofPattern("uuuu-MM-dd").withResolverStyle(ResolverStyle.STRICT);

    private NfcCardRules() {}

    /** Empty = BAD_FORMAT: a field is missing, off its format, or the dates are out of order. */
    public static Optional<NfcCard> read(NfcCardFields fields) {
        try {
            CitizenId idNumber = CitizenId.parse(fields.idNumber());
            LegalName legalName = LegalName.parse(fields.fullName());
            LocalDate dateOfBirth = date(fields.dateOfBirth());
            LocalDate dateOfIssue = date(fields.dateOfIssue());
            LocalDate dateOfExpiry = date(fields.dateOfExpiry());
            // Set.of refuses to look up null
            boolean valid = fields.gender() != null
                    && GENDERS.contains(fields.gender())
                    && isText(fields.nationality(), MAX_NATIONALITY_LENGTH)
                    && isText(fields.placeOfBirth(), MAX_PLACE_LENGTH)
                    && isText(fields.placeOfResidence(), MAX_PLACE_LENGTH)
                    && dateOfIssue.isAfter(dateOfBirth)
                    && dateOfExpiry.isAfter(dateOfIssue);
            return valid ? Optional.of(new NfcCard(idNumber, legalName, dateOfExpiry)) : Optional.empty();
        } catch (ValueRejected | DateTimeParseException e) {
            return Optional.empty();
        }
    }

    private static LocalDate date(String value) {
        if (value == null) {
            throw ValueRejected.required();
        }
        return LocalDate.parse(value, DATE);
    }

    private static boolean isText(String value, int maxLength) {
        return value != null && !value.isBlank() && value.trim().length() <= maxLength;
    }
}
