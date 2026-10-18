package com.moonkage.identity.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moonkage.identity.config.NfcProperties;
import com.moonkage.identity.constant.TimeConstant;
import com.moonkage.identity.crypto.IdNumberHasher;
import com.moonkage.identity.crypto.NfcTransportDecryptor;
import com.moonkage.identity.crypto.PiiCipher;
import com.moonkage.identity.dto.request.SubmitCardRequest;
import com.moonkage.identity.dto.response.SubmitCardResponse;
import com.moonkage.identity.entity.Account;
import com.moonkage.identity.entity.LegalProfile;
import com.moonkage.identity.enums.NfcReasonCode;
import com.moonkage.identity.enums.NfcResult;
import com.moonkage.identity.enums.Sex;
import com.moonkage.identity.exception.AppException;
import com.moonkage.identity.exception.ErrorCode;
import com.moonkage.identity.messaging.NfcVerificationEvent;
import com.moonkage.identity.repository.AccountRepository;
import com.moonkage.identity.repository.LegalProfileRepository;
import com.moonkage.identity.service.OutboxService;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/** AC-04.5 - AC-04.11 with real hashing and encryption; only the JWE and the database are mocked. */
class NfcCardServiceImplTest {

    private static final String ACCOUNT_ID = "acc-1";
    private static final String SESSION_ID = "session-1";

    private AccountRepository accountRepository;
    private LegalProfileRepository legalProfileRepository;
    private NfcTransportDecryptor decryptor;
    private OutboxService outboxService;
    private IdNumberHasher hasher;
    private PiiCipher piiCipher;
    private NfcCardServiceImpl service;
    private Account account;

    @BeforeEach
    void setUp() {
        accountRepository = mock(AccountRepository.class);
        legalProfileRepository = mock(LegalProfileRepository.class);
        decryptor = mock(NfcTransportDecryptor.class);
        outboxService = mock(OutboxService.class);
        hasher = new IdNumberHasher("test-pepper");
        piiCipher = new PiiCipher("AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA=");
        service = new NfcCardServiceImpl(
                accountRepository,
                legalProfileRepository,
                decryptor,
                hasher,
                piiCipher,
                outboxService,
                new NfcProperties());

        account = Account.builder().id(ACCOUNT_ID).email("a@x.vn").build();
        when(accountRepository.findByIdForUpdate(ACCOUNT_ID)).thenReturn(Optional.of(account));
        when(accountRepository.findById(ACCOUNT_ID)).thenReturn(Optional.of(account));
        when(decryptor.decrypt("jwe")).thenReturn(Optional.of(NfcCardValidatorTest.validFields()));
    }

    @Test
    void validCardSavesOnlyTheMinimumProtected() {
        account.setNfcFailedAttempts(3);

        SubmitCardResponse response = service.verifyCard(SESSION_ID, ACCOUNT_ID, NfcCardValidatorTest.validRequest());

        assertEquals(NfcResult.VERIFIED, response.status());
        ArgumentCaptor<LegalProfile> saved = ArgumentCaptor.forClass(LegalProfile.class);
        verify(legalProfileRepository).save(saved.capture());
        LegalProfile p = saved.getValue();
        assertEquals("NGUYEN VAN A", p.getLegalName());
        assertEquals(Sex.MALE, p.getSex());
        assertEquals("VIET NAM", p.getNationality());
        assertEquals("********6789", p.getIdNumberMasked());
        assertEquals(hasher.hash(NfcCardValidatorTest.ID_NUMBER), p.getIdNumberHash());
        assertEquals(1, p.getIdHashKeyVer());
        assertEquals(1, p.getPiiKeyVer());
        // AC-04.11: ID number and date of birth stored only encrypted
        assertEquals(NfcCardValidatorTest.ID_NUMBER, piiCipher.decrypt(p.getIdNumberEnc()));
        assertEquals("1990-05-01", piiCipher.decrypt(p.getDateOfBirthEnc()));
        assertEquals(0, account.getNfcFailedAttempts());

        NfcVerificationEvent event = publishedEvent();
        assertEquals(NfcVerificationEvent.Type.VERIFIED, event.type());
        assertEquals(SESSION_ID, event.sessionId());
        assertEquals("********6789", event.idNumberMasked());
    }

    @Test
    void undecryptableFieldsAreBadFormatAndCount() {
        when(decryptor.decrypt("jwe")).thenReturn(Optional.empty());

        SubmitCardResponse response = service.verifyCard(SESSION_ID, ACCOUNT_ID, NfcCardValidatorTest.validRequest());

        assertRejected(response, NfcReasonCode.BAD_FORMAT, 4);
        assertEquals(1, account.getNfcFailedAttempts());
        assertEquals(NfcVerificationEvent.Type.FAILED, publishedEvent().type());
        verify(legalProfileRepository, never()).save(any());
    }

    @Test
    void invalidCardIsBadFormat() {
        SubmitCardRequest lowerCaseName =
                NfcCardValidatorTest.request("Nguyen Van A", "MALE", "2021-01-01", "2046-01-01");

        assertRejected(service.verifyCard(SESSION_ID, ACCOUNT_ID, lowerCaseName), NfcReasonCode.BAD_FORMAT, 4);
    }

    @Test
    void fifthFailureLocksForFifteenMinutes() {
        account.setNfcFailedAttempts(4);
        when(decryptor.decrypt("jwe")).thenReturn(Optional.empty());
        Instant before = Instant.now();

        SubmitCardResponse response = service.verifyCard(SESSION_ID, ACCOUNT_ID, NfcCardValidatorTest.validRequest());

        assertRejected(response, NfcReasonCode.BAD_FORMAT, 0);
        assertTrue(!response.lockedUntil().isBefore(before.plus(Duration.ofMinutes(15))));
        assertEquals(response.lockedUntil(), account.getNfcLockedUntil());
        assertEquals(0, account.getNfcFailedAttempts());
        NfcVerificationEvent event = publishedEvent();
        assertEquals(NfcVerificationEvent.Type.LOCKED, event.type());
        assertEquals(NfcReasonCode.BAD_FORMAT, event.reasonCode());
    }

    @Test
    void lockedAccountIsRejectedBeforeDecrypting() {
        Instant lockedUntil = Instant.now().plus(Duration.ofMinutes(10));
        account.setNfcLockedUntil(lockedUntil);

        SubmitCardResponse response = service.verifyCard(SESSION_ID, ACCOUNT_ID, NfcCardValidatorTest.validRequest());

        assertRejected(response, NfcReasonCode.LOCKED, 0);
        assertEquals(lockedUntil, response.lockedUntil());
        verify(decryptor, never()).decrypt(anyString());
    }

    @Test
    void finishedLockoutStartsAFreshRound() {
        account.setNfcLockedUntil(Instant.now().minusSeconds(1));
        account.setNfcFailedAttempts(4);
        when(decryptor.decrypt("jwe")).thenReturn(Optional.empty());

        SubmitCardResponse response = service.verifyCard(SESSION_ID, ACCOUNT_ID, NfcCardValidatorTest.validRequest());

        assertRejected(response, NfcReasonCode.BAD_FORMAT, 4);
        assertNull(account.getNfcLockedUntil());
    }

    @Test
    void expiredCardIsRejectedButOneExpiringTodayIsNot() {
        LocalDate today = LocalDate.now(TimeConstant.VIETNAM_ZONE);
        SubmitCardRequest expired = NfcCardValidatorTest.request(
                "NGUYEN VAN A", "MALE", "2021-01-01", today.minusDays(1).toString());
        SubmitCardRequest lastDay =
                NfcCardValidatorTest.request("NGUYEN VAN A", "MALE", "2021-01-01", today.toString());

        assertRejected(service.verifyCard(SESSION_ID, ACCOUNT_ID, expired), NfcReasonCode.CARD_EXPIRED, 4);
        assertEquals(
                NfcResult.VERIFIED,
                service.verifyCard(SESSION_ID, ACCOUNT_ID, lastDay).status());
    }

    @Test
    void idNumberOfAnotherAccountIsRejectedAndCounts() {
        when(legalProfileRepository.existsByIdNumberHashAndIdHashKeyVer(
                        hasher.hash(NfcCardValidatorTest.ID_NUMBER), IdNumberHasher.KEY_VERSION))
                .thenReturn(true);

        SubmitCardResponse response = service.verifyCard(SESSION_ID, ACCOUNT_ID, NfcCardValidatorTest.validRequest());

        assertRejected(response, NfcReasonCode.ID_ALREADY_LINKED, 4);
        verify(legalProfileRepository, never()).save(any());
    }

    @Test
    void alreadyVerifiedAccountCannotVerifyAgain() {
        when(legalProfileRepository.existsById(ACCOUNT_ID)).thenReturn(true);

        SubmitCardResponse response = service.verifyCard(SESSION_ID, ACCOUNT_ID, NfcCardValidatorTest.validRequest());

        assertEquals(NfcReasonCode.SESSION_USED, response.reasonCode());
        verify(legalProfileRepository, never()).existsByIdNumberHashAndIdHashKeyVer(anyString(), anyInt());
    }

    @Test
    void startIsRefusedWhenVerifiedLockedOrUnknown() {
        when(legalProfileRepository.existsById(ACCOUNT_ID)).thenReturn(true);
        assertEquals(ErrorCode.NFC_ALREADY_VERIFIED, startError(ACCOUNT_ID));

        when(legalProfileRepository.existsById(ACCOUNT_ID)).thenReturn(false);
        account.setNfcLockedUntil(Instant.now().plus(Duration.ofMinutes(5)));
        assertEquals(ErrorCode.NFC_LOCKED, startError(ACCOUNT_ID));

        when(accountRepository.findById(eq("ghost"))).thenReturn(Optional.empty());
        assertEquals(ErrorCode.ACCOUNT_NOT_FOUND, startError("ghost"));
    }

    @Test
    void startIsAllowedAfterTheLockoutEnds() {
        account.setNfcLockedUntil(Instant.now().minusSeconds(1));

        service.requireCanStartVerification(ACCOUNT_ID);
    }

    private ErrorCode startError(String accountId) {
        return assertThrows(AppException.class, () -> service.requireCanStartVerification(accountId))
                .getErrorCode();
    }

    private static void assertRejected(SubmitCardResponse response, NfcReasonCode reason, int attemptsLeft) {
        assertEquals(NfcResult.REJECTED, response.status());
        assertEquals(reason, response.reasonCode());
        assertEquals(attemptsLeft, response.attemptsLeft());
    }

    /** The one event written to the outbox, checked to go under its own id and routing key. */
    private NfcVerificationEvent publishedEvent() {
        ArgumentCaptor<String> eventId = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> routingKey = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Object> payload = ArgumentCaptor.forClass(Object.class);
        verify(outboxService).enqueue(eventId.capture(), routingKey.capture(), payload.capture());
        NfcVerificationEvent event = (NfcVerificationEvent) payload.getValue();
        assertEquals(event.eventId(), eventId.getValue());
        assertEquals(event.type().routingKey(), routingKey.getValue());
        return event;
    }
}
