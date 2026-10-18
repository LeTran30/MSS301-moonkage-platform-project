package com.moonkage.identity.service.impl;

import com.moonkage.identity.config.NfcProperties;
import com.moonkage.identity.dto.request.SubmitCardRequest;
import com.moonkage.identity.dto.response.NfcSessionCreateResponse;
import com.moonkage.identity.dto.response.NfcSessionStatusResponse;
import com.moonkage.identity.dto.response.SubmitCardResponse;
import com.moonkage.identity.enums.NfcReasonCode;
import com.moonkage.identity.enums.NfcResult;
import com.moonkage.identity.enums.NfcSessionStatus;
import com.moonkage.identity.exception.AppException;
import com.moonkage.identity.exception.ErrorCode;
import com.moonkage.identity.service.NfcCardService;
import com.moonkage.identity.service.NfcSessionService;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Sessions live in a {@link ConcurrentHashMap} with a short TTL (Requirement 7.1 NfcSession): no database rows to
 * clean up, and a restart only means the user scans a new QR. One pending session per account bounds the memory.
 *
 * <p>A card first claims its session inside {@link Map#compute} ({@code inFlight}), so two parallel submits cannot
 * both run; the database work then happens outside the map lock. A rejected card frees the session for another try
 * (until the lockout); a verified one marks it used. A used session is kept until it expires so the web can still
 * read VERIFIED from GET (fallback when the WebSocket push is missed).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NfcSessionServiceImpl implements NfcSessionService {

    /** 192 bits, 32 base64url characters: within the 16-128 the app accepts (Software Design 5.1). */
    private static final int SESSION_ID_BYTES = 24;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Base64.Encoder SESSION_ID_ENCODER =
            Base64.getUrlEncoder().withoutPadding();

    record NfcSessionEntry(
            String sessionId, String accountId, Instant expiresAt, NfcSessionStatus status, boolean inFlight) {

        boolean isExpired(Instant now) {
            return !now.isBefore(expiresAt);
        }

        NfcSessionEntry claimed() {
            return new NfcSessionEntry(sessionId, accountId, expiresAt, status, true);
        }

        NfcSessionEntry released(boolean verified) {
            return new NfcSessionEntry(
                    sessionId, accountId, expiresAt, verified ? NfcSessionStatus.VERIFIED : status, false);
        }
    }

    private final NfcCardService nfcCardService;
    private final NfcProperties nfcProperties;

    final Map<String, NfcSessionEntry> storageMap = new ConcurrentHashMap<>();

    @Override
    public NfcSessionCreateResponse createSession(String accountId) {
        nfcCardService.requireCanStartVerification(accountId);
        Instant expiresAt = Instant.now().plus(nfcProperties.getSessionTtl());
        NfcSessionEntry entry =
                new NfcSessionEntry(newSessionId(), accountId, expiresAt, NfcSessionStatus.PENDING, false);
        replacePending(entry);
        return new NfcSessionCreateResponse(entry.sessionId(), expiresAt);
    }

    /**
     * An older QR of the same account stops working; a card already being checked still finishes. Synchronized so
     * two parallel creates cannot both survive (Q-24): remove-then-put is not atomic on its own. Creates are rare,
     * and card submits do not take this lock.
     */
    private synchronized void replacePending(NfcSessionEntry entry) {
        storageMap
                .values()
                .removeIf(e -> e.accountId().equals(entry.accountId()) && e.status() == NfcSessionStatus.PENDING);
        storageMap.put(entry.sessionId(), entry);
    }

    @Override
    public NfcSessionStatusResponse getSession(String sessionId, String accountId) {
        NfcSessionEntry entry = sessionId == null ? null : storageMap.get(sessionId);
        if (entry == null || entry.isExpired(Instant.now())) {
            throw new AppException(ErrorCode.NFC_SESSION_EXPIRED);
        }
        if (!entry.accountId().equals(accountId)) {
            throw new AppException(ErrorCode.NFC_SESSION_NOT_OWNED);
        }
        return new NfcSessionStatusResponse(entry.sessionId(), entry.status(), entry.expiresAt());
    }

    @Override
    public SubmitCardResponse submitCard(String sessionId, String accountId, SubmitCardRequest request) {
        if (sessionId == null) {
            return SubmitCardResponse.rejected(NfcReasonCode.SESSION_EXPIRED);
        }
        Instant now = Instant.now();
        AtomicReference<NfcReasonCode> rejection = new AtomicReference<>(NfcReasonCode.SESSION_EXPIRED);
        NfcSessionEntry claimed = storageMap.computeIfPresent(sessionId, (k, e) -> {
            // Software Design 4.2 order: exists and not expired, owned by the caller, not used yet
            if (e.isExpired(now)) {
                return e;
            }
            if (!e.accountId().equals(accountId)) {
                rejection.set(NfcReasonCode.SESSION_NOT_OWNED);
                return e;
            }
            if (e.status() != NfcSessionStatus.PENDING || e.inFlight()) {
                rejection.set(NfcReasonCode.SESSION_USED);
                return e;
            }
            rejection.set(null);
            return e.claimed();
        });
        if (claimed == null || rejection.get() != null) {
            return SubmitCardResponse.rejected(rejection.get());
        }

        SubmitCardResponse response = null;
        try {
            response = nfcCardService.verifyCard(sessionId, accountId, request);
            return response;
        } catch (DataIntegrityViolationException e) {
            // another account saved the same ID number in the same instant: the unique key caught it (BR-23)
            log.warn("NFC verification of account {} hit the ID number unique key", accountId);
            return SubmitCardResponse.rejected(NfcReasonCode.ID_ALREADY_LINKED);
        } finally {
            boolean verified = response != null && response.status() == NfcResult.VERIFIED;
            storageMap.computeIfPresent(sessionId, (k, e) -> e.released(verified));
        }
    }

    @Scheduled(fixedDelayString = "${nfc.session-cleanup-interval}")
    void purgeExpiredSessions() {
        Instant now = Instant.now();
        // removeIf goes through the map's own conditional remove, so it never drops a concurrent update
        storageMap.values().removeIf(e -> e.isExpired(now) && !e.inFlight());
    }

    private static String newSessionId() {
        byte[] bytes = new byte[SESSION_ID_BYTES];
        RANDOM.nextBytes(bytes);
        return SESSION_ID_ENCODER.encodeToString(bytes);
    }
}
