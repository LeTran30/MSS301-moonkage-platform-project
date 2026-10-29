package com.moonkage.identity.kyc.domain.nfc;

import com.moonkage.identity.kyc.domain.CitizenId;
import com.moonkage.identity.profile.LegalName;
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

    /** A card is valid through its expiry date, by the calendar in Vietnam. */
    public boolean isExpiredAt(Instant now) {
        return dateOfExpiry.isBefore(LocalDate.ofInstant(now, VietnamTime.ZONE));
    }
}
