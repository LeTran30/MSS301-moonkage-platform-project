package com.moonkage.identity.kyc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.moonkage.identity.account.AccountService;
import com.moonkage.identity.account.NfcLockout;
import com.moonkage.identity.common.exception.AppException;
import com.moonkage.identity.common.exception.ErrorCode;
import com.moonkage.identity.kyc.dto.request.CheckIdNumberRequest;
import com.moonkage.identity.kyc.dto.response.CheckIdNumberResponse;
import com.moonkage.identity.kyc.dto.response.NfcStatusResponse;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** Internal API for vendor-service / quotation-service: BR-23, BR-27, masked data only. */
class LegalProfileServiceImplTest {

    private static final String ACCOUNT_ID = "acc-1";
    private static final String ID_NUMBER = "079123456789";
    private static final Instant VERIFIED_AT = Instant.parse("2026-10-19T03:00:00Z");

    private AccountService accountService;
    private LegalProfileRepository legalProfileRepository;
    private IdNumberHasher hasher;
    private LegalProfileServiceImpl service;
    private NfcLockout lockout = NfcLockout.NONE;

    @BeforeEach
    void setUp() {
        accountService = mock(AccountService.class);
        legalProfileRepository = mock(LegalProfileRepository.class);
        hasher = new IdNumberHasher("test-pepper");
        service = new LegalProfileServiceImpl(accountService, legalProfileRepository, hasher);

        when(accountService.getNfcLockout(ACCOUNT_ID)).thenAnswer(inv -> lockout);
        when(accountService.getNfcLockout("ghost")).thenThrow(new AppException(ErrorCode.ACCOUNT_NOT_FOUND, "ghost"));
        doThrow(new AppException(ErrorCode.ACCOUNT_NOT_FOUND, "ghost"))
                .when(accountService)
                .requireAccountExists("ghost");
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

        lockout = new NfcLockout(0, Instant.now().plusSeconds(60));
        assertEquals(NfcStatus.LOCKED, service.getNfcStatus(ACCOUNT_ID).nfcStatus());

        lockout = new NfcLockout(0, Instant.now().minusSeconds(60));
        assertEquals(NfcStatus.NOT_VERIFIED, service.getNfcStatus(ACCOUNT_ID).nfcStatus());
    }

    @Test
    void statusOfUnknownAccountIsNotFound() {
        AppException ex = assertThrows(AppException.class, () -> service.getNfcStatus("ghost"));
        assertEquals(ErrorCode.ACCOUNT_NOT_FOUND, ex.getErrorCode());
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
        assertEquals(ErrorCode.ID_NUMBER_INVALID, tooShort.getErrorCode());

        AppException unknown = assertThrows(
                AppException.class, () -> service.checkIdNumber(new CheckIdNumberRequest("ghost", ID_NUMBER)));
        assertEquals(ErrorCode.ACCOUNT_NOT_FOUND, unknown.getErrorCode());
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
