package com.moonkage.identity.kyc.infrastructure.web;

import com.moonkage.identity.kyc.application.SubmitNfcCard;
import com.moonkage.identity.kyc.domain.KycReasonCode;
import com.moonkage.identity.kyc.domain.KycResult;
import com.moonkage.identity.kyc.domain.nfc.NfcSession;
import com.moonkage.identity.kyc.domain.nfc.NfcSessionStatus;
import java.time.Instant;

/** What the web and the app read about a session and a card. */
final class NfcSessionResponses {

    private NfcSessionResponses() {}

    /** The web shows {@code sessionId} as a QR code; it carries no personal data (AC-04.1). */
    record Created(String sessionId, Instant expiresAt) {

        static Created from(NfcSession session) {
            return new Created(session.id().value(), session.expiresAt());
        }
    }

    record Status(String sessionId, NfcSessionStatus status, Instant expiresAt) {

        static Status from(NfcSession session) {
            return new Status(session.id().value(), session.status(), session.expiresAt());
        }
    }

    /**
     * Always HTTP 200, also when rejected: the app reads {@code status}. No card data in it: the app already showed
     * the card before sending (AC-04.4).
     */
    record CardResult(KycResult status, KycReasonCode reasonCode, Integer attemptsLeft, Instant lockedUntil) {

        static CardResult from(SubmitNfcCard.Outcome outcome) {
            return new CardResult(
                    outcome.result(), outcome.reasonCode(), outcome.attemptsLeft(), outcome.lockedUntil());
        }
    }
}
