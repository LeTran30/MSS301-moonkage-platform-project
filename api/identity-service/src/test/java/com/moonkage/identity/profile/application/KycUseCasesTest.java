package com.moonkage.identity.profile.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.moonkage.identity.nfc.NfcApi;
import com.moonkage.identity.profile.IdNumberCheck;
import com.moonkage.identity.profile.KycStatus;
import com.moonkage.identity.profile.ProfileError;
import com.moonkage.identity.profile.ProfileKyc;
import com.moonkage.identity.profile.domain.LegalIdentity;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.CitizenId;
import com.moonkage.identity.shared.error.AppException;
import java.util.Optional;
import org.junit.jupiter.api.Test;

/** The KYC reads of a profile and the start of a KYC; the NFC mechanism is mocked. */
class KycUseCasesTest {

    private static final AccountId OWNER = SubmitKycCardTest.OWNER;
    private static final CitizenId ID_NUMBER = CitizenId.parse("079123456789");
    private static final LegalIdentity IDENTITY = SubmitKycCardTest.IDENTITY;

    private final ProfileQueries queries = mock(ProfileQueries.class);
    private final NfcApi nfcApi = mock(NfcApi.class);
    private final GetKycStatus getKycStatus = new GetKycStatus(queries, nfcApi);
    private final CheckIdNumber checkIdNumber = new CheckIdNumber(queries, getKycStatus, SubmitKycCardTest.HASHER);
    private final StartKycSession startKycSession = new StartKycSession(queries, nfcApi);

    // ───────── status ─────────

    @Test
    void verifiedProfileShowsWhatTheCardProved() {
        when(queries.findKyc(OWNER)).thenReturn(Optional.of(IDENTITY));

        assertEquals(ProfileKyc.verified(IDENTITY.legalName(), IDENTITY.idNumberMasked()), getKycStatus.handle(OWNER));
    }

    @Test
    void unverifiedProfileIsNotVerifiedOrLocked() {
        assertEquals(KycStatus.NOT_VERIFIED, getKycStatus.handle(OWNER).status());

        when(nfcApi.isLocked(OWNER)).thenReturn(true);
        assertEquals(KycStatus.LOCKED, getKycStatus.handle(OWNER).status());
    }

    // ───────── start ─────────

    @Test
    void verifiedProfileCannotStartAgain() {
        when(queries.findKyc(OWNER)).thenReturn(Optional.of(IDENTITY));

        AppException ex = assertThrows(AppException.class, () -> startKycSession.handle(OWNER));
        assertEquals(ProfileError.KYC_ALREADY_VERIFIED, ex.getErrorCode());
        verifyNoInteractions(nfcApi);
    }

    // ───────── ID number check ─────────

    @Test
    void checkMatchesTheOwnersCard() {
        when(queries.findKyc(OWNER)).thenReturn(Optional.of(IDENTITY));

        IdNumberCheck check = checkIdNumber.handle(OWNER, ID_NUMBER);

        assertTrue(check.matchesProfile());
        assertEquals(IDENTITY.idNumberHash(), check.hash());
        assertEquals(1, check.keyVersion());
        assertEquals("********6789", check.masked().value());
        assertTrue(check.owner().isVerified());
    }

    @Test
    void checkOfAnotherNumberDoesNotMatch() {
        when(queries.findKyc(OWNER)).thenReturn(Optional.of(IDENTITY));

        IdNumberCheck check = checkIdNumber.handle(OWNER, CitizenId.parse("001099000111"));

        assertFalse(check.matchesProfile());
        assertEquals("********0111", check.masked().value());
        assertTrue(check.owner().isVerified());
    }

    @Test
    void checkForUnverifiedOwnerStillHashes() {
        IdNumberCheck check = checkIdNumber.handle(OWNER, ID_NUMBER);

        assertFalse(check.matchesProfile());
        assertEquals(IDENTITY.idNumberHash(), check.hash());
        assertFalse(check.owner().isVerified());
    }

    @Test
    void hashOfAnotherKeyVersionNeverMatches() {
        assertFalse(IDENTITY.matches(IDENTITY.idNumberHash(), 2));
        assertTrue(IDENTITY.matches(IDENTITY.idNumberHash(), 1));
    }
}
