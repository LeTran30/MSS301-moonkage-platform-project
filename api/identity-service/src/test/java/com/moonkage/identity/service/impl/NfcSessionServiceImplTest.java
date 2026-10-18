package com.moonkage.identity.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moonkage.identity.config.NfcProperties;
import com.moonkage.identity.dto.request.SubmitCardRequest;
import com.moonkage.identity.dto.response.SubmitCardResponse;
import com.moonkage.identity.enums.NfcReasonCode;
import com.moonkage.identity.enums.NfcResult;
import com.moonkage.identity.enums.NfcSessionStatus;
import com.moonkage.identity.exception.AppException;
import com.moonkage.identity.exception.ErrorCode;
import com.moonkage.identity.service.NfcCardService;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;

/** Session lifecycle in memory: TTL, owner, one use, retry after a rejection (AC-04.1, 04.2, 04.7). */
class NfcSessionServiceImplTest {

    private static final String OWNER = "acc-owner";
    private static final String OTHER = "acc-other";

    private final SubmitCardRequest request = NfcCardValidatorTest.validRequest();

    private NfcCardService nfcCardService;
    private NfcProperties nfcProperties;
    private NfcSessionServiceImpl service;

    @BeforeEach
    void setUp() {
        nfcCardService = mock(NfcCardService.class);
        nfcProperties = new NfcProperties();
        service = new NfcSessionServiceImpl(nfcCardService, nfcProperties);
    }

    @Test
    void createSessionReturnsLongRandomUrlSafeId() {
        String first = service.createSession(OWNER).sessionId();
        String second = service.createSession(OTHER).sessionId();

        verify(nfcCardService).requireCanStartVerification(OWNER);
        // >= 128 bits, within the 16-128 characters the app accepts (Software Design 5.1)
        assertTrue(first.matches("[A-Za-z0-9_-]{22,128}"), first);
        assertNotEquals(first, second);
    }

    @Test
    void createSessionIsRefusedWhenAccountCannotStart() {
        doThrow(new AppException(ErrorCode.NFC_ALREADY_VERIFIED))
                .when(nfcCardService)
                .requireCanStartVerification(OWNER);

        AppException ex = assertThrows(AppException.class, () -> service.createSession(OWNER));

        assertEquals(ErrorCode.NFC_ALREADY_VERIFIED, ex.getErrorCode());
        assertTrue(service.storageMap.isEmpty());
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
        assertEquals(1, service.storageMap.size());
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
        verify(nfcCardService, never()).verifyCard(anyString(), anyString(), any());
    }

    @Test
    void submitFromAnotherAccountIsRejected() {
        String sessionId = service.createSession(OWNER).sessionId();

        SubmitCardResponse response = service.submitCard(sessionId, OTHER, request);

        assertEquals(NfcResult.REJECTED, response.status());
        assertEquals(NfcReasonCode.SESSION_NOT_OWNED, response.reasonCode());
        verify(nfcCardService, never()).verifyCard(anyString(), anyString(), any());
    }

    @Test
    void verifiedSessionCannotBeUsedAgain() {
        String sessionId = service.createSession(OWNER).sessionId();
        when(nfcCardService.verifyCard(sessionId, OWNER, request)).thenReturn(SubmitCardResponse.verified());

        assertEquals(
                NfcResult.VERIFIED,
                service.submitCard(sessionId, OWNER, request).status());
        assertEquals(
                NfcSessionStatus.VERIFIED, service.getSession(sessionId, OWNER).status());
        assertEquals(
                NfcReasonCode.SESSION_USED,
                service.submitCard(sessionId, OWNER, request).reasonCode());
        verify(nfcCardService, times(1)).verifyCard(sessionId, OWNER, request);
    }

    @Test
    void rejectedCardLeavesTheSessionOpenForAnotherTry() {
        String sessionId = service.createSession(OWNER).sessionId();
        when(nfcCardService.verifyCard(sessionId, OWNER, request))
                .thenReturn(SubmitCardResponse.rejected(NfcReasonCode.BAD_FORMAT, 4, null))
                .thenReturn(SubmitCardResponse.verified());

        assertEquals(
                NfcReasonCode.BAD_FORMAT,
                service.submitCard(sessionId, OWNER, request).reasonCode());
        assertEquals(
                NfcSessionStatus.PENDING, service.getSession(sessionId, OWNER).status());
        assertEquals(
                NfcResult.VERIFIED,
                service.submitCard(sessionId, OWNER, request).status());
    }

    @Test
    void parallelSubmitOfOneSessionIsRejected() {
        String sessionId = service.createSession(OWNER).sessionId();
        AtomicReference<SubmitCardResponse> second = new AtomicReference<>();
        when(nfcCardService.verifyCard(sessionId, OWNER, request)).thenAnswer(inv -> {
            // a second submit arrives while the first card is still being checked
            second.set(service.submitCard(sessionId, OWNER, request));
            return SubmitCardResponse.verified();
        });

        assertEquals(
                NfcResult.VERIFIED,
                service.submitCard(sessionId, OWNER, request).status());
        assertEquals(NfcReasonCode.SESSION_USED, second.get().reasonCode());
        verify(nfcCardService, times(1)).verifyCard(sessionId, OWNER, request);
    }

    @Test
    void uniqueKeyRaceIsAnsweredAsIdAlreadyLinked() {
        String sessionId = service.createSession(OWNER).sessionId();
        when(nfcCardService.verifyCard(sessionId, OWNER, request))
                .thenThrow(new DataIntegrityViolationException("uk_legal_profiles_id_hash"));

        assertEquals(
                NfcReasonCode.ID_ALREADY_LINKED,
                service.submitCard(sessionId, OWNER, request).reasonCode());
        assertEquals(
                NfcSessionStatus.PENDING, service.getSession(sessionId, OWNER).status());
    }

    @Test
    void serverErrorDoesNotLeaveTheSessionStuck() {
        String sessionId = service.createSession(OWNER).sessionId();
        when(nfcCardService.verifyCard(sessionId, OWNER, request))
                .thenThrow(new IllegalStateException("PII key not configured"))
                .thenReturn(SubmitCardResponse.verified());

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

        assertTrue(service.storageMap.containsKey(live));
        assertTrue(!service.storageMap.containsKey(expired));
    }

    private ErrorCode getError(String sessionId, String accountId) {
        return assertThrows(AppException.class, () -> service.getSession(sessionId, accountId))
                .getErrorCode();
    }
}
