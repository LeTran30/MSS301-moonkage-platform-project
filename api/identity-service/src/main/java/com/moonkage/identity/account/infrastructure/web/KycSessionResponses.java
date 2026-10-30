package com.moonkage.identity.account.infrastructure.web;

import com.moonkage.identity.nfc.CardCheck;
import com.moonkage.identity.nfc.NfcReasonCode;
import com.moonkage.identity.nfc.NfcSessionStatus;
import com.moonkage.identity.nfc.NfcSessionView;
import java.time.Instant;

/** What the web and the app read about a session and a card. */
final class KycSessionResponses {

    private KycSessionResponses() {}

    /** The web shows {@code sessionId} as a QR code; it carries no personal data (AC-04.1). */
    record Created(String sessionId, Instant expiresAt) {

        static Created from(NfcSessionView session) {
            return new Created(session.id().value(), session.expiresAt());
        }
    }

    record Status(String sessionId, NfcSessionStatus status, Instant expiresAt) {

        static Status from(NfcSessionView session) {
            return new Status(session.id().value(), session.status(), session.expiresAt());
        }
    }

    /**
     * Always HTTP 200, also when rejected: the app reads {@code status}. No card data in it: the app already showed
     * the card before sending (AC-04.4).
     */
    record CardResult(CardCheck.Result status, NfcReasonCode reasonCode, Integer attemptsLeft, Instant lockedUntil) {

        static CardResult from(CardCheck outcome) {
            return new CardResult(
                    outcome.result(), outcome.reasonCode(), outcome.attemptsLeft(), outcome.lockedUntil());
        }
    }
}
