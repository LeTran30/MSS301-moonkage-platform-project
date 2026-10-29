package com.moonkage.identity.kyc.application.port;

import com.moonkage.identity.shared.value.Text;
import java.util.Optional;

/** Opens the card fields the app sealed for identity-service only (AC-04.10, D-17). */
public interface CardPayloadDecryptor {

    /**
     * The sealed fields, or empty when the value is not a sealed payload this service can open (the card is then
     * BAD_FORMAT). Throws when no valid key is configured: a server fault, not the user's.
     */
    Optional<SealedCardFields> decrypt(String sealedFields);

    /** The three card fields the app seals; each is null when the payload did not hold it as text. */
    record SealedCardFields(String idNumber, String dateOfBirth, String placeOfResidence) {

        /** The ID number and birth date stay out of logs (NFR-03). */
        @Override
        public String toString() {
            return "SealedCardFields[" + Text.HIDDEN + "]";
        }
    }
}
