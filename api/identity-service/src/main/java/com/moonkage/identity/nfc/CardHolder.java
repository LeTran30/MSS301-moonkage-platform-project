package com.moonkage.identity.nfc;

import com.moonkage.identity.shared.CitizenId;
import com.moonkage.identity.shared.LegalName;
import java.util.Objects;

/**
 * Who a well-formed, unexpired card says its holder is. The other card fields were only checked and are dropped
 * (AC-04.11).
 */
public record CardHolder(CitizenId idNumber, LegalName legalName) {

    public CardHolder {
        Objects.requireNonNull(idNumber, "idNumber");
        Objects.requireNonNull(legalName, "legalName");
    }
}
