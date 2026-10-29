package com.moonkage.identity.kyc.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.moonkage.identity.account.AccountApi;
import com.moonkage.identity.account.AccountError;
import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.kyc.application.CheckIdNumber.IdNumberCheck;
import com.moonkage.identity.kyc.application.GetKycStatus.AccountKyc;
import com.moonkage.identity.kyc.application.port.KycAttemptStore;
import com.moonkage.identity.kyc.domain.CitizenId;
import com.moonkage.identity.kyc.domain.KycStatus;
import com.moonkage.identity.kyc.infrastructure.memory.InMemoryStores;
import com.moonkage.identity.platform.config.MovableClock;
import com.moonkage.identity.profile.LegalIdentity;
import com.moonkage.identity.profile.LegalName;
import com.moonkage.identity.profile.ProfileApi;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.Role;
import com.moonkage.identity.shared.error.AppException;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** What other services and the account itself read about KYC: status (BR-23) and the ID number check (BR-27). */
class KycQueriesTest {

    private static final AccountId OWNER = SubmitNfcCardTest.OWNER;
    private static final AccountId GHOST = SubmitNfcCardTest.OTHER;
    private static final Instant NOW = Instant.parse("2026-10-30T03:00:00Z");
    private static final CitizenId ID_NUMBER = CitizenId.parse("079123456789");
    private static final LegalIdentity IDENTITY = new LegalIdentity(
            new LegalName("NGUYEN VAN A"),
            SubmitNfcCardTest.HASHER.hash(ID_NUMBER),
            SubmitNfcCardTest.HASHER.keyVersion(),
            ID_NUMBER.masked());

    private final AccountApi accountApi = mock(AccountApi.class);
    private final ProfileApi profiles = mock(ProfileApi.class);
    private final KycAttemptStore attempts = InMemoryStores.attempts();
    private final MovableClock clock = new MovableClock(NOW);
    private final GetKycStatus getKycStatus = new GetKycStatus(accountApi, profiles, attempts, clock);
    private final CheckIdNumber checkIdNumber = new CheckIdNumber(accountApi, profiles, SubmitNfcCardTest.HASHER);

    @BeforeEach
    void setUp() {
        when(accountApi.find(OWNER))
                .thenReturn(
                        Optional.of(new AccountView(OWNER, Email.parse("lan@x.vn"), null, Role.MEMBER, true, null)));
    }

    // ───────── status ─────────

    @Test
    void verifiedAccountShowsWhatTheCardProved() {
        when(profiles.findKyc(OWNER)).thenReturn(Optional.of(IDENTITY));

        assertEquals(new AccountKyc(KycStatus.VERIFIED, IDENTITY), getKycStatus.handle(OWNER));
    }

    @Test
    void unverifiedAccountIsNotVerifiedOrLocked() {
        assertEquals(new AccountKyc(KycStatus.NOT_VERIFIED, null), getKycStatus.handle(OWNER));

        for (int i = 0; i < SubmitNfcCardTest.RULES.maxAttempts(); i++) {
            attempts.recordFailure(OWNER, SubmitNfcCardTest.RULES, NOW);
        }
        assertEquals(KycStatus.LOCKED, getKycStatus.handle(OWNER).status());

        // the lockout of 15 minutes is over
        clock.advance(Duration.ofMinutes(15));
        assertEquals(KycStatus.NOT_VERIFIED, getKycStatus.handle(OWNER).status());
    }

    @Test
    void statusOfUnknownAccountIsNotFound() {
        AppException ex = assertThrows(AppException.class, () -> getKycStatus.handle(GHOST));
        assertEquals(AccountError.NOT_FOUND, ex.getErrorCode());
    }

    // ───────── ID number check ─────────

    @Test
    void checkMatchesTheOwnersCard() {
        when(profiles.findKyc(OWNER)).thenReturn(Optional.of(IDENTITY));

        IdNumberCheck check = checkIdNumber.handle(OWNER, ID_NUMBER);

        assertTrue(check.matchesAccount());
        assertEquals(IDENTITY.idNumberHash(), check.hash());
        assertEquals(1, check.keyVersion());
        assertEquals("********6789", check.masked().value());
        assertEquals(IDENTITY, check.owner());
    }

    @Test
    void checkOfAnotherNumberDoesNotMatch() {
        when(profiles.findKyc(OWNER)).thenReturn(Optional.of(IDENTITY));

        IdNumberCheck check = checkIdNumber.handle(OWNER, CitizenId.parse("001099000111"));

        assertFalse(check.matchesAccount());
        assertEquals("********0111", check.masked().value());
        assertEquals(IDENTITY, check.owner());
    }

    @Test
    void checkForUnverifiedOwnerStillHashes() {
        IdNumberCheck check = checkIdNumber.handle(OWNER, ID_NUMBER);

        assertFalse(check.matchesAccount());
        assertEquals(IDENTITY.idNumberHash(), check.hash());
        assertNull(check.owner());
    }

    @Test
    void checkForUnknownAccountIsNotFound() {
        AppException ex = assertThrows(AppException.class, () -> checkIdNumber.handle(GHOST, ID_NUMBER));
        assertEquals(AccountError.NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void hashOfAnotherKeyVersionNeverMatches() {
        assertFalse(IDENTITY.matches(IDENTITY.idNumberHash(), 2));
        assertTrue(IDENTITY.matches(IDENTITY.idNumberHash(), 1));
    }
}
