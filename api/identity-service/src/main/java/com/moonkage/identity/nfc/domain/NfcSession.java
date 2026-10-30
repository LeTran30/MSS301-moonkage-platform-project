package com.moonkage.identity.nfc.domain;

import com.moonkage.identity.nfc.NfcReasonCode;
import com.moonkage.identity.nfc.NfcSessionId;
import com.moonkage.identity.nfc.NfcSessionStatus;
import com.moonkage.identity.nfc.NfcSessionView;
import com.moonkage.identity.shared.AccountId;
import java.time.Instant;
import java.util.Objects;
import java.util.Optional;

/**
 * A short session the web shows as a QR; the Moonkage Verify app, logged in to the same account, sends one card into
 * it (FR-04). A card first claims the session ({@code inFlight}), so two parallel cards cannot both be checked; a
 * rejected card frees it for another try, a verified one marks it VERIFIED until it expires, so the web can still read
 * the result when it missed the push (AC-04.5).
 */
public record NfcSession(
        NfcSessionId id, AccountId owner, Instant expiresAt, NfcSessionStatus status, boolean inFlight) {

    public NfcSession {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(owner, "owner");
        Objects.requireNonNull(expiresAt, "expiresAt");
        Objects.requireNonNull(status, "status");
    }

    /** AC-04.1: a new QR, valid until {@code expiresAt}. */
    public static NfcSession open(AccountId owner, Instant expiresAt) {
        return new NfcSession(NfcSessionId.generate(), owner, expiresAt, NfcSessionStatus.PENDING, false);
    }

    public boolean isExpired(Instant now) {
        return !now.isBefore(expiresAt);
    }

    public boolean isPending() {
        return status == NfcSessionStatus.PENDING;
    }

    /**
     * Why {@code caller} may not send a card into this session now, in Software Design 4.2 order: not expired, owned
     * by the caller, not used nor being checked. Empty when it may.
     */
    public Optional<NfcReasonCode> refusalFor(AccountId caller, Instant now) {
        if (isExpired(now)) {
            return Optional.of(NfcReasonCode.SESSION_EXPIRED);
        }
        if (!owner.equals(caller)) {
            return Optional.of(NfcReasonCode.SESSION_NOT_OWNED);
        }
        if (!isPending() || inFlight) {
            return Optional.of(NfcReasonCode.SESSION_USED);
        }
        return Optional.empty();
    }

    public NfcSessionView view() {
        return new NfcSessionView(id, expiresAt, status);
    }

    /** A card is being checked: no other card may enter. */
    public NfcSession claimed() {
        return new NfcSession(id, owner, expiresAt, status, true);
    }

    /** The check is over: VERIFIED for good, or free for another card. */
    public NfcSession released(boolean verified) {
        return new NfcSession(id, owner, expiresAt, verified ? NfcSessionStatus.VERIFIED : status, false);
    }
}
