package com.moonkage.identity.nfc.domain;

import com.moonkage.identity.nfc.CardHolder;
import com.moonkage.identity.shared.CitizenId;
import com.moonkage.identity.shared.LegalName;
import com.moonkage.identity.shared.VietnamTime;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;

/**
 * What a well-formed card leaves after the format checks: the rest (birth date, places, issue date) was only checked
 * and is dropped here (AC-04.11).
 */
public record NfcCard(CitizenId idNumber, LegalName legalName, LocalDate dateOfExpiry) {

    public NfcCard {
        Objects.requireNonNull(idNumber, "idNumber");
        Objects.requireNonNull(legalName, "legalName");
        Objects.requireNonNull(dateOfExpiry, "dateOfExpiry");
    }

    public CardHolder holder() {
        return new CardHolder(idNumber, legalName);
    }

    /** A card is valid through its expiry date, by the calendar in Vietnam. */
    public boolean isExpiredAt(Instant now) {
        return dateOfExpiry.isBefore(LocalDate.ofInstant(now, VietnamTime.ZONE));
    }
}
