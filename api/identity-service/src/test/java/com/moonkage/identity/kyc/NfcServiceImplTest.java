package com.moonkage.identity.kyc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moonkage.identity.account.AccountService;
import com.moonkage.identity.account.NfcLockout;
import com.moonkage.identity.common.TimeConstant;
import com.moonkage.identity.common.exception.AppException;
import com.moonkage.identity.common.exception.ErrorCode;
import com.moonkage.identity.kyc.dto.request.SubmitCardRequest;
import com.moonkage.identity.kyc.dto.response.SubmitCardResponse;
import com.moonkage.identity.outbox.OutboxService;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

class NfcServiceImplTest {

    /** AC-04.5 - AC-04.11 with real hashing and encryption; only the JWE and the database are mocked. */
    @Nested
    class CardCheck {

        private static final String ACCOUNT_ID = "acc-1";
        private static final String SESSION_ID = "session-1";

        private AccountService accountService;
        private LegalProfileRepository legalProfileRepository;
        private NfcTransportDecryptor decryptor;
        private OutboxService outboxService;
        private IdNumberHasher hasher;
        private PiiCipher piiCipher;
        private NfcServiceImpl service;
        /** What AccountService stores for ACCOUNT_ID; saveNfcLockout writes it back. */
        private NfcLockout lockout = NfcLockout.NONE;

        @BeforeEach
        void setUp() {
            accountService = mock(AccountService.class);
            legalProfileRepository = mock(LegalProfileRepository.class);
            decryptor = mock(NfcTransportDecryptor.class);
            outboxService = mock(OutboxService.class);
            hasher = new IdNumberHasher("test-pepper");
            piiCipher = new PiiCipher("AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA=");
            service = new NfcServiceImpl(
                    accountService,
                    legalProfileRepository,
                    decryptor,
                    hasher,
                    piiCipher,
                    outboxService,
                    new NfcProperties(),
                    new TransactionTemplate(mock(PlatformTransactionManager.class)));

            when(accountService.getNfcLockout(ACCOUNT_ID)).thenAnswer(inv -> lockout);
            doAnswer(inv -> lockout = inv.getArgument(1))
                    .when(accountService)
                    .saveNfcLockout(eq(ACCOUNT_ID), any(NfcLockout.class));
            when(decryptor.decrypt("jwe")).thenReturn(Optional.of(NfcCardValidatorTest.validFields()));
        }

        @Test
        void validCardSavesOnlyTheMinimumProtected() {
            lockout = new NfcLockout(3, lockout.lockedUntil());

            SubmitCardResponse response =
                    service.saveCardResult(SESSION_ID, ACCOUNT_ID, NfcCardValidatorTest.validRequest());

            assertEquals(NfcResult.VERIFIED, response.status());
            ArgumentCaptor<LegalProfile> saved = ArgumentCaptor.forClass(LegalProfile.class);
            verify(legalProfileRepository).save(saved.capture());
            LegalProfile p = saved.getValue();
            assertEquals("NGUYEN VAN A", p.getLegalName());
            assertEquals(Gender.MALE, p.getGender());
            assertEquals("VIET NAM", p.getNationality());
            assertEquals("********6789", p.getIdNumberMasked());
            assertEquals(hasher.hash(NfcCardValidatorTest.ID_NUMBER), p.getIdNumberHash());
            assertEquals(1, p.getIdHashKeyVer());
            assertEquals(1, p.getPiiKeyVer());
            // AC-04.11: ID number and date of birth stored only encrypted
            assertEquals(NfcCardValidatorTest.ID_NUMBER, piiCipher.decrypt(p.getIdNumberEnc()));
            assertEquals("1990-05-01", piiCipher.decrypt(p.getDateOfBirthEnc()));
            assertEquals(0, lockout.failedAttempts());

            NfcVerificationEvent event = publishedEvent();
            assertEquals(NfcVerificationEvent.Type.VERIFIED, event.type());
            assertEquals(SESSION_ID, event.sessionId());
            assertEquals("********6789", event.idNumberMasked());
        }

        @Test
        void undecryptableFieldsAreBadFormatAndCount() {
            when(decryptor.decrypt("jwe")).thenReturn(Optional.empty());

            SubmitCardResponse response =
                    service.saveCardResult(SESSION_ID, ACCOUNT_ID, NfcCardValidatorTest.validRequest());

            assertRejected(response, NfcReasonCode.BAD_FORMAT, 4);
            assertEquals(1, lockout.failedAttempts());
            NfcVerificationEvent event = publishedEvent();
            assertEquals(NfcVerificationEvent.Type.FAILED, event.type());
            assertEquals(4, event.attemptsLeft());
            verify(legalProfileRepository, never()).save(any());
        }

        @Test
        void invalidCardIsBadFormat() {
            SubmitCardRequest lowerCaseName =
                    NfcCardValidatorTest.request("Nguyen Van A", "MALE", "2021-01-01", "2046-01-01");

            assertRejected(service.saveCardResult(SESSION_ID, ACCOUNT_ID, lowerCaseName), NfcReasonCode.BAD_FORMAT, 4);
        }

        @Test
        void fifthFailureLocksForFifteenMinutes() {
            lockout = new NfcLockout(4, lockout.lockedUntil());
            when(decryptor.decrypt("jwe")).thenReturn(Optional.empty());
            Instant before = Instant.now();

            SubmitCardResponse response =
                    service.saveCardResult(SESSION_ID, ACCOUNT_ID, NfcCardValidatorTest.validRequest());

            assertRejected(response, NfcReasonCode.BAD_FORMAT, 0);
            assertTrue(!response.lockedUntil().isBefore(before.plus(Duration.ofMinutes(15))));
            assertEquals(response.lockedUntil(), lockout.lockedUntil());
            assertEquals(0, lockout.failedAttempts());
            NfcVerificationEvent event = publishedEvent();
            assertEquals(NfcVerificationEvent.Type.LOCKED, event.type());
            assertEquals(NfcReasonCode.BAD_FORMAT, event.reasonCode());
        }

        @Test
        void lockedAccountIsRejectedBeforeDecrypting() {
            Instant lockedUntil = Instant.now().plus(Duration.ofMinutes(10));
            lockout = new NfcLockout(lockout.failedAttempts(), lockedUntil);

            SubmitCardResponse response =
                    service.saveCardResult(SESSION_ID, ACCOUNT_ID, NfcCardValidatorTest.validRequest());

            assertRejected(response, NfcReasonCode.LOCKED, 0);
            assertEquals(lockedUntil, response.lockedUntil());
            verify(decryptor, never()).decrypt(anyString());
        }

        @Test
        void finishedLockoutStartsAFreshRound() {
            lockout = new NfcLockout(lockout.failedAttempts(), Instant.now().minusSeconds(1));
            lockout = new NfcLockout(4, lockout.lockedUntil());
            when(decryptor.decrypt("jwe")).thenReturn(Optional.empty());

            SubmitCardResponse response =
                    service.saveCardResult(SESSION_ID, ACCOUNT_ID, NfcCardValidatorTest.validRequest());

            assertRejected(response, NfcReasonCode.BAD_FORMAT, 4);
            assertNull(lockout.lockedUntil());
        }

        @Test
        void expiredCardIsRejectedButOneExpiringTodayIsNot() {
            LocalDate today = LocalDate.now(TimeConstant.VIETNAM_ZONE);
            SubmitCardRequest expired = NfcCardValidatorTest.request(
                    "NGUYEN VAN A", "MALE", "2021-01-01", today.minusDays(1).toString());
            SubmitCardRequest lastDay =
                    NfcCardValidatorTest.request("NGUYEN VAN A", "MALE", "2021-01-01", today.toString());

            assertRejected(service.saveCardResult(SESSION_ID, ACCOUNT_ID, expired), NfcReasonCode.CARD_EXPIRED, 4);
            assertEquals(
                    NfcResult.VERIFIED,
                    service.saveCardResult(SESSION_ID, ACCOUNT_ID, lastDay).status());
        }

        @Test
        void idNumberOfAnotherAccountIsRejectedAndCounts() {
            when(legalProfileRepository.existsByIdNumberHashAndIdHashKeyVer(
                            hasher.hash(NfcCardValidatorTest.ID_NUMBER), IdNumberHasher.KEY_VERSION))
                    .thenReturn(true);

            SubmitCardResponse response =
                    service.saveCardResult(SESSION_ID, ACCOUNT_ID, NfcCardValidatorTest.validRequest());

            assertRejected(response, NfcReasonCode.ID_ALREADY_LINKED, 4);
            verify(legalProfileRepository, never()).save(any());
        }

        @Test
        void alreadyVerifiedAccountCannotVerifyAgain() {
            when(legalProfileRepository.existsById(ACCOUNT_ID)).thenReturn(true);

            SubmitCardResponse response =
                    service.saveCardResult(SESSION_ID, ACCOUNT_ID, NfcCardValidatorTest.validRequest());

            assertEquals(NfcReasonCode.SESSION_USED, response.reasonCode());
            verify(legalProfileRepository, never()).existsByIdNumberHashAndIdHashKeyVer(anyString(), anyInt());
        }

        @Test
        void startIsRefusedWhenVerifiedLockedOrUnknown() {
            when(legalProfileRepository.existsById(ACCOUNT_ID)).thenReturn(true);
            assertEquals(ErrorCode.NFC_ALREADY_VERIFIED, startError(ACCOUNT_ID));

            when(legalProfileRepository.existsById(ACCOUNT_ID)).thenReturn(false);
            lockout = new NfcLockout(lockout.failedAttempts(), Instant.now().plus(Duration.ofMinutes(5)));
            assertEquals(ErrorCode.NFC_LOCKED, startError(ACCOUNT_ID));

            when(accountService.getNfcLockout("ghost"))
                    .thenThrow(new AppException(ErrorCode.ACCOUNT_NOT_FOUND, "ghost"));
            assertEquals(ErrorCode.ACCOUNT_NOT_FOUND, startError("ghost"));
        }

        @Test
        void startIsAllowedAfterTheLockoutEnds() {
            lockout = new NfcLockout(lockout.failedAttempts(), Instant.now().minusSeconds(1));

            service.validateCanStartVerification(ACCOUNT_ID);
        }

        private ErrorCode startError(String accountId) {
            return assertThrows(AppException.class, () -> service.validateCanStartVerification(accountId))
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

    /** Session lifecycle in memory: TTL, owner, one use, retry after a rejection (AC-04.1, 04.2, 04.7). */
    @Nested
    class Session {

        private static final String OWNER = "acc-owner";
        private static final String OTHER = "acc-other";

        private final SubmitCardRequest request = NfcCardValidatorTest.validRequest();

        private NfcProperties nfcProperties;
        private NfcServiceImpl service;

        @BeforeEach
        void setUp() {
            nfcProperties = new NfcProperties();
            // the card check is stubbed: these tests are about the session around it
            service = spy(new NfcServiceImpl(
                    mock(AccountService.class),
                    mock(LegalProfileRepository.class),
                    mock(NfcTransportDecryptor.class),
                    mock(IdNumberHasher.class),
                    mock(PiiCipher.class),
                    mock(OutboxService.class),
                    nfcProperties,
                    new TransactionTemplate(mock(PlatformTransactionManager.class))));
            doNothing().when(service).validateCanStartVerification(anyString());
        }

        @Test
        void createSessionReturnsLongRandomUrlSafeId() {
            String first = service.createSession(OWNER).sessionId();
            String second = service.createSession(OTHER).sessionId();

            verify(service).validateCanStartVerification(OWNER);
            // >= 128 bits, within the 16-128 characters the app accepts (Software Design 5.1)
            assertTrue(first.matches("[A-Za-z0-9_-]{22,128}"), first);
            assertNotEquals(first, second);
        }

        @Test
        void createSessionIsRefusedWhenAccountCannotStart() {
            doThrow(new AppException(ErrorCode.NFC_ALREADY_VERIFIED))
                    .when(service)
                    .validateCanStartVerification(OWNER);

            AppException ex = assertThrows(AppException.class, () -> service.createSession(OWNER));

            assertEquals(ErrorCode.NFC_ALREADY_VERIFIED, ex.getErrorCode());
            assertTrue(service.sessions.isEmpty());
        }

        @Test
        void parallelCreatesLeaveOnePendingSession() throws Exception {
            int threads = 16;
            ExecutorService pool = Executors.newFixedThreadPool(threads);
            CountDownLatch start = new CountDownLatch(1);
            List<Future<?>> futures = new ArrayList<>();
            for (int i = 0; i < threads; i++) {
                futures.add(pool.submit(() -> {
                    start.await();
                    return service.createSession(OWNER);
                }));
            }
            start.countDown();
            for (Future<?> f : futures) {
                f.get(5, TimeUnit.SECONDS);
            }
            pool.shutdownNow();

            // Q-24: only the newest QR of an account works
            assertEquals(1, service.sessions.size());
        }

        @Test
        void newSessionReplacesThePendingOne() {
            String old = service.createSession(OWNER).sessionId();
            String current = service.createSession(OWNER).sessionId();

            assertEquals(ErrorCode.NFC_SESSION_EXPIRED, getError(old, OWNER));
            assertEquals(
                    NfcSessionStatus.PENDING, service.getSession(current, OWNER).status());
        }

        @Test
        void getSessionChecksOwnerAndExpiry() {
            String sessionId = service.createSession(OWNER).sessionId();

            assertEquals(ErrorCode.NFC_SESSION_NOT_OWNED, getError(sessionId, OTHER));
            assertEquals(ErrorCode.NFC_SESSION_EXPIRED, getError("unknown-session-id-123", OWNER));

            nfcProperties.setSessionTtl(Duration.ZERO);
            String expired = service.createSession(OTHER).sessionId();
            assertEquals(ErrorCode.NFC_SESSION_EXPIRED, getError(expired, OTHER));
        }

        @Test
        void submitToUnknownOrExpiredSessionIsRejected() {
            nfcProperties.setSessionTtl(Duration.ZERO);
            String expired = service.createSession(OWNER).sessionId();

            assertEquals(
                    NfcReasonCode.SESSION_EXPIRED,
                    service.submitCard("nope", OWNER, request).reasonCode());
            assertEquals(
                    NfcReasonCode.SESSION_EXPIRED,
                    service.submitCard(expired, OWNER, request).reasonCode());
            assertEquals(
                    NfcReasonCode.SESSION_EXPIRED,
                    service.submitCard(null, OWNER, request).reasonCode());
            verify(service, never()).saveCardResult(anyString(), anyString(), any());
        }

        @Test
        void submitFromAnotherAccountIsRejected() {
            String sessionId = service.createSession(OWNER).sessionId();

            SubmitCardResponse response = service.submitCard(sessionId, OTHER, request);

            assertEquals(NfcResult.REJECTED, response.status());
            assertEquals(NfcReasonCode.SESSION_NOT_OWNED, response.reasonCode());
            verify(service, never()).saveCardResult(anyString(), anyString(), any());
        }

        @Test
        void verifiedSessionCannotBeUsedAgain() {
            String sessionId = service.createSession(OWNER).sessionId();
            doReturn(SubmitCardResponse.verified()).when(service).saveCardResult(sessionId, OWNER, request);

            assertEquals(
                    NfcResult.VERIFIED,
                    service.submitCard(sessionId, OWNER, request).status());
            assertEquals(
                    NfcSessionStatus.VERIFIED,
                    service.getSession(sessionId, OWNER).status());
            assertEquals(
                    NfcReasonCode.SESSION_USED,
                    service.submitCard(sessionId, OWNER, request).reasonCode());
            verify(service, times(1)).saveCardResult(sessionId, OWNER, request);
        }

        @Test
        void rejectedCardLeavesTheSessionOpenForAnotherTry() {
            String sessionId = service.createSession(OWNER).sessionId();
            doReturn(SubmitCardResponse.rejected(NfcReasonCode.BAD_FORMAT, 4, null))
                    .doReturn(SubmitCardResponse.verified())
                    .when(service)
                    .saveCardResult(sessionId, OWNER, request);

            assertEquals(
                    NfcReasonCode.BAD_FORMAT,
                    service.submitCard(sessionId, OWNER, request).reasonCode());
            assertEquals(
                    NfcSessionStatus.PENDING,
                    service.getSession(sessionId, OWNER).status());
            assertEquals(
                    NfcResult.VERIFIED,
                    service.submitCard(sessionId, OWNER, request).status());
        }

        @Test
        void parallelSubmitOfOneSessionIsRejected() {
            String sessionId = service.createSession(OWNER).sessionId();
            AtomicReference<SubmitCardResponse> second = new AtomicReference<>();
            doAnswer(inv -> {
                        // a second submit arrives while the first card is still being checked
                        second.set(service.submitCard(sessionId, OWNER, request));
                        return SubmitCardResponse.verified();
                    })
                    .when(service)
                    .saveCardResult(sessionId, OWNER, request);

            assertEquals(
                    NfcResult.VERIFIED,
                    service.submitCard(sessionId, OWNER, request).status());
            assertEquals(NfcReasonCode.SESSION_USED, second.get().reasonCode());
            verify(service, times(1)).saveCardResult(sessionId, OWNER, request);
        }

        @Test
        void uniqueKeyRaceIsAnsweredAsIdAlreadyLinked() {
            String sessionId = service.createSession(OWNER).sessionId();
            doThrow(new DataIntegrityViolationException("uk_legal_profiles_id_hash"))
                    .when(service)
                    .saveCardResult(sessionId, OWNER, request);

            assertEquals(
                    NfcReasonCode.ID_ALREADY_LINKED,
                    service.submitCard(sessionId, OWNER, request).reasonCode());
            assertEquals(
                    NfcSessionStatus.PENDING,
                    service.getSession(sessionId, OWNER).status());
        }

        @Test
        void serverErrorDoesNotLeaveTheSessionStuck() {
            String sessionId = service.createSession(OWNER).sessionId();
            doThrow(new IllegalStateException("PII key not configured"))
                    .doReturn(SubmitCardResponse.verified())
                    .when(service)
                    .saveCardResult(sessionId, OWNER, request);

            assertThrows(IllegalStateException.class, () -> service.submitCard(sessionId, OWNER, request));
            assertEquals(
                    NfcResult.VERIFIED,
                    service.submitCard(sessionId, OWNER, request).status());
        }

        @Test
        void purgeDropsOnlyExpiredSessions() {
            String live = service.createSession(OWNER).sessionId();
            nfcProperties.setSessionTtl(Duration.ZERO);
            String expired = service.createSession(OTHER).sessionId();

            service.purgeExpiredSessions();

            assertTrue(service.sessions.containsKey(live));
            assertTrue(!service.sessions.containsKey(expired));
        }

        private ErrorCode getError(String sessionId, String accountId) {
            return assertThrows(AppException.class, () -> service.getSession(sessionId, accountId))
                    .getErrorCode();
        }
    }
}
