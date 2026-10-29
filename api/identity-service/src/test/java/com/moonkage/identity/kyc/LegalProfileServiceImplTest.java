package com.moonkage.identity.kyc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.moonkage.identity.account.AccountApi;
import com.moonkage.identity.account.AccountError;
import com.moonkage.identity.kyc.dto.request.CheckIdNumberRequest;
import com.moonkage.identity.kyc.dto.response.CheckIdNumberResponse;
import com.moonkage.identity.kyc.dto.response.NfcStatusResponse;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.LegacyError;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** Internal API for vendor-service / quotation-service: BR-23, BR-27, masked data only. */
class LegalProfileServiceImplTest {

    private static final String ACCOUNT_ID = "6f1c2a4e-8d3b-4f7a-9c21-5b0e7d9a3f10";
    private static final String ID_NUMBER = "079123456789";
    private static final Instant VERIFIED_AT = Instant.parse("2026-10-19T03:00:00Z");

    private AccountApi accountApi;
    private LegalProfileRepository legalProfileRepository;
    private IdNumberHasher hasher;
    private NfcAttemptTracker attemptTracker;
    private LegalProfileServiceImpl service;

    @BeforeEach
    void setUp() {
        accountApi = mock(AccountApi.class);
        legalProfileRepository = mock(LegalProfileRepository.class);
        hasher = new IdNumberHasher("test-pepper");
        attemptTracker = new NfcAttemptTracker(new NfcProperties());
        service = new LegalProfileServiceImpl(
                accountApi, legalProfileRepository, hasher, attemptTracker, Clock.systemUTC());

        doThrow(new AppException(AccountError.NOT_FOUND, "ghost"))
                .when(accountApi)
                .requireExists("ghost");
    }

    @Test
    void verifiedAccountShowsMaskedResult() {
        verifiedProfile();

        NfcStatusResponse status = service.getNfcStatus(ACCOUNT_ID);

        assertEquals(NfcStatus.VERIFIED, status.nfcStatus());
        assertEquals("NGUYEN VAN A", status.legalName());
        assertEquals("********6789", status.idNumberMasked());
        assertEquals(VERIFIED_AT, status.nfcVerifiedAt());
    }

    @Test
    void unverifiedAccountIsNotVerifiedOrLocked() {
        assertEquals(NfcStatus.NOT_VERIFIED, service.getNfcStatus(ACCOUNT_ID).nfcStatus());

        lockAt(Instant.now());
        assertEquals(NfcStatus.LOCKED, service.getNfcStatus(ACCOUNT_ID).nfcStatus());

        // a lockout of 15 minutes that started 16 minutes ago is over
        attemptTracker.clear(ACCOUNT_ID);
        lockAt(Instant.now().minus(Duration.ofMinutes(16)));
        assertEquals(NfcStatus.NOT_VERIFIED, service.getNfcStatus(ACCOUNT_ID).nfcStatus());
    }

    @Test
    void statusOfUnknownAccountIsNotFound() {
        AppException ex = assertThrows(AppException.class, () -> service.getNfcStatus("ghost"));
        assertEquals(AccountError.NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void checkMatchesTheOwnersCardWhateverTheSeparators() {
        verifiedProfile();

        CheckIdNumberResponse result = service.checkIdNumber(new CheckIdNumberRequest(ACCOUNT_ID, "079 123-456 789"));

        assertTrue(result.matchesAccount());
        assertEquals(hasher.hash(ID_NUMBER), result.idHash());
        assertEquals(1, result.idHashKeyVer());
        assertEquals("********6789", result.idMasked());
        assertEquals("NGUYEN VAN A", result.ownerLegalName());
        assertEquals("********6789", result.ownerIdMasked());
        assertEquals(VERIFIED_AT, result.nfcVerifiedAt());
    }

    @Test
    void checkOfAnotherNumberDoesNotMatch() {
        verifiedProfile();

        CheckIdNumberResponse result = service.checkIdNumber(new CheckIdNumberRequest(ACCOUNT_ID, "001099000111"));

        assertFalse(result.matchesAccount());
        assertEquals("********0111", result.idMasked());
        assertEquals("********6789", result.ownerIdMasked());
    }

    @Test
    void checkForUnverifiedOwnerStillHashes() {
        CheckIdNumberResponse result = service.checkIdNumber(new CheckIdNumberRequest(ACCOUNT_ID, ID_NUMBER));

        assertFalse(result.matchesAccount());
        assertEquals(hasher.hash(ID_NUMBER), result.idHash());
        assertNull(result.ownerLegalName());
        assertNull(result.ownerIdMasked());
        assertNull(result.nfcVerifiedAt());
    }

    @Test
    void checkRejectsWrongLengthAndUnknownAccount() {
        AppException tooShort = assertThrows(
                AppException.class, () -> service.checkIdNumber(new CheckIdNumberRequest(ACCOUNT_ID, "07912345678")));
        assertEquals(LegacyError.ID_NUMBER_INVALID, tooShort.getErrorCode());

        AppException unknown = assertThrows(
                AppException.class, () -> service.checkIdNumber(new CheckIdNumberRequest("ghost", ID_NUMBER)));
        assertEquals(AccountError.NOT_FOUND, unknown.getErrorCode());
    }

    /** As many failed cards as nfc.max-attempts allows, all at {@code at}. */
    private void lockAt(Instant at) {
        for (int i = 0; i < new NfcProperties().getMaxAttempts(); i++) {
            attemptTracker.recordFailure(ACCOUNT_ID, at);
        }
    }

    private void verifiedProfile() {
        when(legalProfileRepository.findById(ACCOUNT_ID))
                .thenReturn(Optional.of(LegalProfile.builder()
                        .accountId(ACCOUNT_ID)
                        .legalName("NGUYEN VAN A")
                        .idNumberHash(hasher.hash(ID_NUMBER))
                        .idHashKeyVer(1)
                        .idNumberMasked(IdNumberHasher.mask(ID_NUMBER))
                        .nfcVerifiedAt(VERIFIED_AT)
                        .build()));
    }
}
