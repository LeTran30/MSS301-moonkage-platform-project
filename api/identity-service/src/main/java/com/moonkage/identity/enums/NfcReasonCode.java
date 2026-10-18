package com.moonkage.identity.enums;

/**
 * Why a card was rejected (Software Design 5.1). BAD_FORMAT, CARD_EXPIRED and ID_ALREADY_LINKED count as a failed
 * attempt (AC-04.9); the session codes and LOCKED do not.
 */
public enum NfcReasonCode {
    SESSION_EXPIRED,
    SESSION_NOT_OWNED,
    SESSION_USED,
    LOCKED,
    BAD_FORMAT,
    CARD_EXPIRED,
    ID_ALREADY_LINKED
}
