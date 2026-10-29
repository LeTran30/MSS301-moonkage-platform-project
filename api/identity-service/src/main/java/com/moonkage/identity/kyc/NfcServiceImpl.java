package com.moonkage.identity.kyc;

import com.moonkage.identity.account.AccountService;
import com.moonkage.identity.kyc.NfcCardValidator.NfcCard;
import com.moonkage.identity.kyc.dto.request.SubmitCardRequest;
import com.moonkage.identity.kyc.dto.response.CreateNfcSessionResponse;
import com.moonkage.identity.kyc.dto.response.NfcSessionStatusResponse;
import com.moonkage.identity.kyc.dto.response.SubmitCardResponse;
import com.moonkage.identity.platform.messaging.outbox.Outbox;
import com.moonkage.identity.shared.VietnamTime;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.LegacyError;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * FR-04: the web opens a short session shown as a QR, the Moonkage Verify app sends the card once, and the result is
 * saved. Flow and invariants: docs/services/identity/classes/NfcServiceImpl.md.
 *
 * <p>Sessions live in a {@link ConcurrentHashMap} with a short TTL (Requirement 7.1 NfcSession): no database rows to
 * clean up, and a restart only means the user scans a new QR. One pending session per account bounds the memory.
 *
 * <p>A card first claims its session inside {@link Map#compute} ({@code inFlight}), so two parallel submits cannot
 * both run; the database work then happens outside the map lock. A rejected card frees the session for another try
 * (until the lockout); a verified one marks it used. A used session is kept until it expires so the web can still
 * read VERIFIED from GET (fallback when the WebSocket push is missed).
 *
 * <p>Attempts and lockouts live in memory too ({@link NfcAttemptTracker}, db-identify.md). The account row lock still
 * serialises the cards of one account, so two cannot both pass the counter or both save a profile.
 */
@Slf4j
@Service
@RequiredArgsConstructor
class NfcServiceImpl implements NfcService {

    /** 192 bits, 32 base64url characters: within the 16-128 the app accepts (Software Design 5.1). */
    private static final int SESSION_ID_BYTES = 24;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Base64.Encoder SESSION_ID_ENCODER =
            Base64.getUrlEncoder().withoutPadding();

    private final AccountService accountService;
    private final LegalProfileRepository legalProfileRepository;
    private final NfcTransportDecryptor transportDecryptor;
    private final IdNumberHasher idNumberHasher;
    private final PiiCipher piiCipher;
    private final Outbox outbox;
    private final NfcProperties nfcProperties;
    private final TransactionTemplate transactionTemplate;
    private final NfcAttemptTracker attemptTracker;
    private final Clock clock;

    final Map<String, NfcSessionEntry> sessions = new ConcurrentHashMap<>();

    @Override
    public CreateNfcSessionResponse createSession(String accountId) {
        validateCanStartVerification(accountId);
        Instant expiresAt = Instant.now(clock).plus(nfcProperties.getSessionTtl());
        NfcSessionEntry entry =
                new NfcSessionEntry(newSessionId(), accountId, expiresAt, NfcSessionStatus.PENDING, false);
        replacePending(entry);
        return new CreateNfcSessionResponse(entry.sessionId(), expiresAt);
    }

    @Override
    public NfcSessionStatusResponse getSession(String sessionId, String accountId) {
        NfcSessionEntry entry = sessionId == null ? null : sessions.get(sessionId);
        if (entry == null || entry.isExpired(Instant.now(clock))) {
            throw new AppException(LegacyError.NFC_SESSION_EXPIRED);
        }
        if (!entry.accountId().equals(accountId)) {
            throw new AppException(LegacyError.NFC_SESSION_NOT_OWNED);
        }
        return new NfcSessionStatusResponse(entry.sessionId(), entry.status(), entry.expiresAt());
    }

    @Override
    public SubmitCardResponse submitCard(String sessionId, String accountId, SubmitCardRequest request) {
        if (sessionId == null) {
            return SubmitCardResponse.rejected(NfcReasonCode.SESSION_EXPIRED);
        }
        Optional<NfcReasonCode> rejection = claimSession(sessionId, accountId);
        if (rejection.isPresent()) {
            return SubmitCardResponse.rejected(rejection.get());
        }

        boolean verified = false;
        try {
            // an explicit transaction: a call within this class would bypass @Transactional
            SubmitCardResponse response =
                    transactionTemplate.execute(status -> saveCardResult(sessionId, accountId, request));
            verified = response != null && response.status() == NfcResult.VERIFIED;
            return response;
        } catch (DataIntegrityViolationException e) {
            // another account saved the same ID number in the same instant: the unique key caught it (BR-23)
            log.warn("NFC verification of account {} hit the ID number unique key", accountId);
            return SubmitCardResponse.rejected(NfcReasonCode.ID_ALREADY_LINKED);
        } finally {
            releaseSession(sessionId, verified);
        }
    }

    @Scheduled(fixedDelayString = "${nfc.session-cleanup-interval}")
    void purgeExpiredSessions() {
        Instant now = Instant.now(clock);
        // removeIf goes through the map's own conditional remove, so it never drops a concurrent update
        sessions.values().removeIf(e -> e.isExpired(now) && !e.inFlight());
        attemptTracker.purgeFinished(now);
    }

    // ───────── session start ─────────

    void validateCanStartVerification(String accountId) {
        accountService.requireAccountExists(accountId);
        if (legalProfileRepository.existsById(accountId)) {
            throw new AppException(LegacyError.NFC_ALREADY_VERIFIED);
        }
        // NFC_LOCKED with the minutes left
        attemptTracker.ensureNotLocked(accountId, Instant.now(clock));
    }

    private static String newSessionId() {
        byte[] bytes = new byte[SESSION_ID_BYTES];
        RANDOM.nextBytes(bytes);
        return SESSION_ID_ENCODER.encodeToString(bytes);
    }

    /**
     * An older QR of the same account stops working; a card already being checked still finishes. Synchronized so
     * two parallel creates cannot both survive (Q-24): remove-then-put is not atomic on its own. Creates are rare,
     * and card submits do not take this lock.
     */
    private synchronized void replacePending(NfcSessionEntry entry) {
        sessions.values()
                .removeIf(e -> e.accountId().equals(entry.accountId()) && e.status() == NfcSessionStatus.PENDING);
        sessions.put(entry.sessionId(), entry);
    }

    // ───────── card submit ─────────

    /** Empty when the session is now claimed by this submit; otherwise why it was refused. */
    private Optional<NfcReasonCode> claimSession(String sessionId, String accountId) {
        Instant now = Instant.now(clock);
        AtomicReference<NfcReasonCode> rejection = new AtomicReference<>(NfcReasonCode.SESSION_EXPIRED);
        NfcSessionEntry claimed = sessions.computeIfPresent(sessionId, (k, e) -> {
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
        return claimed == null ? Optional.of(NfcReasonCode.SESSION_EXPIRED) : Optional.ofNullable(rejection.get());
    }

    /** Runs inside the transaction of submitCard: every outcome (profile or counted attempt) is saved. */
    SubmitCardResponse saveCardResult(String sessionId, String accountId, SubmitCardRequest request) {
        // row lock: two parallel submits cannot both pass the attempt counter
        accountService.lockForUpdate(accountId);
        if (legalProfileRepository.existsById(accountId)) {
            return SubmitCardResponse.rejected(NfcReasonCode.SESSION_USED);
        }
        Instant now = Instant.now(clock);
        NfcLockout lockout = attemptTracker.lockoutOf(accountId);
        if (lockout.isLocked(now)) {
            return SubmitCardResponse.rejected(NfcReasonCode.LOCKED, 0, lockout.lockedUntil());
        }

        Optional<NfcCard> card = parseCard(request);
        Optional<NfcReasonCode> rejection =
                card.isEmpty() ? Optional.of(NfcReasonCode.BAD_FORMAT) : findCardRejection(card.get(), now);
        if (rejection.isPresent()) {
            return countFailedAttempt(accountId, sessionId, rejection.get(), now);
        }

        LegalProfile profile = saveLegalProfile(accountId, card.get(), now);
        attemptTracker.clear(accountId);
        enqueueEvent(
                NfcVerificationEvent.Type.VERIFIED,
                eventId ->
                        NfcVerificationEvent.verified(eventId, accountId, sessionId, profile.getIdNumberMasked(), now));
        return SubmitCardResponse.verified();
    }

    /** Empty = BAD_FORMAT: not a JWE this key opens, or a field breaks the card format (A-08). */
    private Optional<NfcCard> parseCard(SubmitCardRequest request) {
        return transportDecryptor
                .decrypt(request.encryptedFields())
                .flatMap(fields -> NfcCardValidator.validate(request, fields));
    }

    /** The checks after the format, in Software Design 4.2 order; empty when the card passes them all. */
    private Optional<NfcReasonCode> findCardRejection(NfcCard card, Instant now) {
        if (card.dateOfExpiry().isBefore(LocalDate.ofInstant(now, VietnamTime.ZONE))) {
            return Optional.of(NfcReasonCode.CARD_EXPIRED);
        }
        if (isLinkedElsewhere(card.idNumber())) {
            return Optional.of(NfcReasonCode.ID_ALREADY_LINKED);
        }
        return Optional.empty();
    }

    /** AC-04.9: the attempt is counted; the last allowed one locks verification for nfc.lockout-duration. */
    private SubmitCardResponse countFailedAttempt(
            String accountId, String sessionId, NfcReasonCode reason, Instant now) {
        NfcLockout counted = attemptTracker.recordFailure(accountId, now);
        if (!counted.isLocked(now)) {
            int attemptsLeft = counted.attemptsLeft(nfcProperties.lockoutPolicy());
            enqueueEvent(
                    NfcVerificationEvent.Type.FAILED,
                    eventId -> NfcVerificationEvent.failed(eventId, accountId, sessionId, reason, attemptsLeft, now));
            return SubmitCardResponse.rejected(reason, attemptsLeft, null);
        }
        enqueueEvent(
                NfcVerificationEvent.Type.LOCKED,
                eventId ->
                        NfcVerificationEvent.locked(eventId, accountId, sessionId, reason, counted.lockedUntil(), now));
        return SubmitCardResponse.rejected(reason, 0, counted.lockedUntil());
    }

    /** AC-04.6. This account has no LegalProfile (checked above), so any match belongs to another account. */
    private boolean isLinkedElsewhere(String idNumber) {
        return legalProfileRepository.existsByIdNumberHashAndIdHashKeyVer(
                idNumberHasher.hash(idNumber), IdNumberHasher.KEY_VERSION);
    }

    /** AC-04.11: the ID number and date of birth are stored only hashed / encrypted. */
    private LegalProfile saveLegalProfile(String accountId, NfcCard card, Instant now) {
        LegalProfile profile = LegalProfile.builder()
                .accountId(accountId)
                .legalName(card.legalName())
                .gender(card.gender())
                .nationality(card.nationality())
                .idNumberHash(idNumberHasher.hash(card.idNumber()))
                .idHashKeyVer(IdNumberHasher.KEY_VERSION)
                .idNumberMasked(IdNumberHasher.mask(card.idNumber()))
                .idNumberEnc(piiCipher.encrypt(card.idNumber()))
                .dateOfBirthEnc(piiCipher.encrypt(card.dateOfBirth().toString()))
                .piiKeyVer(PiiCipher.KEY_VERSION)
                .nfcVerifiedAt(now)
                .build();
        legalProfileRepository.save(profile);
        return profile;
    }

    /** Same transaction as the LegalProfile / counter change, so the event is never lost or sent for a rollback. */
    private void enqueueEvent(NfcVerificationEvent.Type type, Function<String, NfcVerificationEvent> event) {
        outbox.enqueue(type.routingKey(), eventId -> event.apply(eventId.toString()));
    }

    /** A rejected card frees the session for another try; a verified one marks it used. */
    private void releaseSession(String sessionId, boolean verified) {
        sessions.computeIfPresent(sessionId, (id, entry) -> entry.released(verified));
    }

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
}
