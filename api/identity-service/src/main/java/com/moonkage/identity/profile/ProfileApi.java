package com.moonkage.identity.profile;

import com.moonkage.identity.nfc.CardCheck;
import com.moonkage.identity.nfc.NfcSessionId;
import com.moonkage.identity.nfc.NfcSessionView;
import com.moonkage.identity.nfc.SubmittedCard;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.CitizenId;
import java.util.Optional;

/**
 * What other modules may ask of the profile module (plan v2, 4.3): who a person is, by the name they chose and, after
 * KYC, by law. KYC is to the profile what the confirmed email is to the account: NFC is how it is reached, as an OTP
 * is for the email. A profile shares its account's id; the caller makes sure the account exists. Commands join the
 * caller's transaction unless they say otherwise.
 */
public interface ProfileApi {

    /** FR-01: the profile of a new account. */
    void create(AccountId id, FullName fullName);

    Optional<FullName> findFullName(AccountId id);

    /** NOT_VERIFIED also for an account without a profile. */
    ProfileKyc findKyc(AccountId id);

    /** AC-04.1: a QR to start KYC. Throws KYC_ALREADY_VERIFIED, or LOCKED with the minutes left. */
    NfcSessionView startKyc(AccountId owner);

    /** Throws SESSION_EXPIRED (unknown or expired) or SESSION_NOT_OWNED. */
    NfcSessionView findKycSession(NfcSessionId id, AccountId caller);

    /**
     * FR-04: the card becomes the profile's legal identity unless its number is linked to another account (BR-23). A
     * rejected card is an answer, never an error. Runs its own transactions: a verified card is saved with its event.
     */
    CardCheck submitKycCard(NfcSessionId session, AccountId owner, SubmittedCard card);

    /** BR-27: fingerprints {@code declared} with the pepper, which never leaves identity-service (D-07). */
    IdNumberCheck checkIdNumber(AccountId id, CitizenId declared);
}
