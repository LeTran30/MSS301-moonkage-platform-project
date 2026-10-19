package com.moonkage.identity.nfc;

import com.moonkage.identity.constant.TimeConstant;
import com.moonkage.identity.dto.request.SubmitCardRequest;
import com.moonkage.identity.dto.response.CreateNfcSessionResponse;
import com.moonkage.identity.dto.response.NfcSessionStatusResponse;
import com.moonkage.identity.dto.response.SubmitCardResponse;
import com.moonkage.identity.entity.Account;
import com.moonkage.identity.entity.LegalProfile;
import com.moonkage.identity.enums.NfcReasonCode;
import com.moonkage.identity.enums.NfcResult;
import com.moonkage.identity.enums.NfcSessionStatus;
import com.moonkage.identity.exception.AppException;
import com.moonkage.identity.exception.ErrorCode;
import com.moonkage.identity.messaging.NfcVerificationEvent;
import com.moonkage.identity.nfc.NfcCardValidator.NfcCard;
import com.moonkage.identity.repository.AccountRepository;
import com.moonkage.identity.repository.LegalProfileRepository;
import com.moonkage.identity.service.OutboxService;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Sessions live in a {@link ConcurrentHashMap} with a short TTL (Requirement 7.1 NfcSession): no database rows to
 * clean up, and a restart only means the user scans a new QR. One pending session per account bounds the memory.
 *
 * <p>A card first claims its session inside {@link Map#compute} ({@code inFlight}), so two parallel submits cannot
 * both run; the database work then happens outside the map lock. A rejected card frees the session for another try
 * (until the lockout); a verified one marks it used. A used session is kept until it expires so the web can still
 * read VERIFIED from GET (fallback when the WebSocket push is missed).
 *
 * <p>Lockout state lives on the account row (D-21), taken with a row lock, so parallel cards of one account cannot
 * both pass the counter. A rejected card commits too: the counted attempt must stick.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NfcServiceImpl implements NfcService {

    /** 192 bits, 32 base64url characters: within the 16-128 the app accepts (Software Design 5.1). */
    private static final int SESSION_ID_BYTES = 24;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Base64.Encoder SESSION_ID_ENCODER =
            Base64.getUrlEncoder().withoutPadding();

    private final AccountRepository accountRepository;
    private final LegalProfileRepository legalProfileRepository;
    private final NfcTransportDecryptor decryptor;
    private final IdNumberHasher hasher;
    private final PiiCipher piiCipher;
    private final OutboxService outboxService;
    private final NfcProperties nfcProperties;
    private final TransactionTemplate transactionTemplate;

    final Map<String, NfcSessionEntry> storageMap = new ConcurrentHashMap<>();

    @Override
    public CreateNfcSessionResponse createSession(String accountId) {
        validateCanStartVerification(accountId);
        Instant expiresAt = Instant.now().plus(nfcProperties.getSessionTtl());
        NfcSessionEntry entry =
                new NfcSessionEntry(newSessionId(), accountId, expiresAt, NfcSessionStatus.PENDING, false);
        replacePending(entry);
        return new CreateNfcSessionResponse(entry.sessionId(), expiresAt);
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
        Optional<NfcReasonCode> rejection = claimSession(sessionId, accountId);
        if (rejection.isPresent()) {
            return SubmitCardResponse.rejected(rejection.get());
        }

        SubmitCardResponse response = null;
        try {
            // an explicit transaction: a call within this class would bypass @Transactional
            response = transactionTemplate.execute(status -> saveCardResult(sessionId, accountId, request));
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

    // ───────── session start ─────────

    void validateCanStartVerification(String accountId) {
        Account account = accountRepository
                .findById(accountId)
                .orElseThrow(() -> new AppException(ErrorCode.ACCOUNT_NOT_FOUND, accountId));
        if (legalProfileRepository.existsById(accountId)) {
            throw new AppException(ErrorCode.NFC_ALREADY_VERIFIED);
        }
        Instant now = Instant.now();
        if (account.isNfcLocked(now)) {
            long minutes = Math.max(
                    1, Duration.between(now, account.getNfcLockedUntil()).toMinutes() + 1);
            throw new AppException(ErrorCode.NFC_LOCKED, minutes);
        }
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
        storageMap
                .values()
                .removeIf(e -> e.accountId().equals(entry.accountId()) && e.status() == NfcSessionStatus.PENDING);
        storageMap.put(entry.sessionId(), entry);
    }

    // ───────── card submit ─────────

    /** Empty when the session is now claimed by this submit; otherwise why it was refused. */
    private Optional<NfcReasonCode> claimSession(String sessionId, String accountId) {
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
        return claimed == null ? Optional.of(NfcReasonCode.SESSION_EXPIRED) : Optional.ofNullable(rejection.get());
    }

    /** Runs inside the transaction of submitCard: every outcome (profile or counted attempt) is saved. */
    SubmitCardResponse saveCardResult(String sessionId, String accountId, SubmitCardRequest request) {
        Account account = accountRepository
                .findByIdForUpdate(accountId)
                .orElseThrow(() -> new AppException(ErrorCode.ACCOUNT_NOT_FOUND, accountId));
        if (legalProfileRepository.existsById(accountId)) {
            return SubmitCardResponse.rejected(NfcReasonCode.SESSION_USED);
        }
        Instant now = Instant.now();
        resetFinishedLockout(account, now);
        if (account.isNfcLocked(now)) {
            return SubmitCardResponse.rejected(NfcReasonCode.LOCKED, 0, account.getNfcLockedUntil());
        }

        Optional<NfcCard> parsed = decryptor
                .decrypt(request.encryptedFields())
                .flatMap(fields -> NfcCardValidator.validate(request, fields));
        if (parsed.isEmpty()) {
            return fail(account, sessionId, NfcReasonCode.BAD_FORMAT, now);
        }
        NfcCard card = parsed.get();
        if (card.dateOfExpiry().isBefore(LocalDate.now(TimeConstant.VIETNAM_ZONE))) {
            return fail(account, sessionId, NfcReasonCode.CARD_EXPIRED, now);
        }
        if (isLinkedElsewhere(card.idNumber())) {
            return fail(account, sessionId, NfcReasonCode.ID_ALREADY_LINKED, now);
        }

        LegalProfile profile = saveLegalProfile(account, card, now);
        account.setNfcFailedAttempts(0);
        account.setNfcLockedUntil(null);
        record(NfcVerificationEvent.verified(accountId, sessionId, profile.getIdNumberMasked(), now));
        return SubmitCardResponse.verified();
    }

    /** A finished lockout starts a fresh round of attempts. */
    private static void resetFinishedLockout(Account account, Instant now) {
        if (account.getNfcLockedUntil() != null && !account.isNfcLocked(now)) {
            account.setNfcLockedUntil(null);
            account.setNfcFailedAttempts(0);
        }
    }

    /** AC-04.9: counts the attempt; the last allowed one locks verification for nfc.lockout-duration. */
    private SubmitCardResponse fail(Account account, String sessionId, NfcReasonCode reason, Instant now) {
        int attempts = account.getNfcFailedAttempts() + 1;
        if (attempts < nfcProperties.getMaxAttempts()) {
            int attemptsLeft = nfcProperties.getMaxAttempts() - attempts;
            account.setNfcFailedAttempts(attempts);
            record(NfcVerificationEvent.failed(account.getId(), sessionId, reason, attemptsLeft, now));
            return SubmitCardResponse.rejected(reason, attemptsLeft, null);
        }
        Instant lockedUntil = now.plus(nfcProperties.getLockoutDuration());
        account.setNfcFailedAttempts(0);
        account.setNfcLockedUntil(lockedUntil);
        record(NfcVerificationEvent.locked(account.getId(), sessionId, reason, lockedUntil, now));
        return SubmitCardResponse.rejected(reason, 0, lockedUntil);
    }

    /** AC-04.6. This account has no LegalProfile (checked above), so any match belongs to another account. */
    private boolean isLinkedElsewhere(String idNumber) {
        return legalProfileRepository.existsByIdNumberHashAndIdHashKeyVer(
                hasher.hash(idNumber), IdNumberHasher.KEY_VERSION);
    }

    /** AC-04.11: the ID number and date of birth are stored only hashed / encrypted. */
    private LegalProfile saveLegalProfile(Account account, NfcCard card, Instant now) {
        LegalProfile profile = LegalProfile.builder()
                .account(account)
                .legalName(card.legalName())
                .gender(card.gender())
                .nationality(card.nationality())
                .idNumberHash(hasher.hash(card.idNumber()))
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
    private void record(NfcVerificationEvent event) {
        outboxService.enqueue(event.eventId(), event.type().routingKey(), event);
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
