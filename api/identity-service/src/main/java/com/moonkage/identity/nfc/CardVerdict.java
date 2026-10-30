package com.moonkage.identity.nfc;

import java.util.Optional;

/**
 * The caller's decision on a card that passed every NFC check, e.g. whether its number is linked to another account.
 * It runs while the session is held, so no other card of the session is checked meanwhile.
 */
@FunctionalInterface
public interface CardVerdict {

    /** Empty accepts the card; otherwise why it is rejected. A reason that counts as an attempt is counted. */
    Optional<NfcReasonCode> judge(CardHolder holder);
}
