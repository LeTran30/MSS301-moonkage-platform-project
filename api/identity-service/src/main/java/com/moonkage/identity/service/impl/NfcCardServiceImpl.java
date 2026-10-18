package com.moonkage.identity.service.impl;

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
import com.moonkage.identity.exception.AppException;
import com.moonkage.identity.exception.ErrorCode;
import com.moonkage.identity.messaging.NfcVerificationEvent;
import com.moonkage.identity.repository.AccountRepository;
import com.moonkage.identity.repository.LegalProfileRepository;
import com.moonkage.identity.service.NfcCardService;
import com.moonkage.identity.service.OutboxService;
import com.moonkage.identity.service.impl.NfcCardValidator.NfcCard;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Lockout state lives on the account row (D-21), taken with a row lock, so parallel cards of one account cannot both
 * pass the counter. A rejected card commits too: the counted attempt must stick.
 */
@Service
@RequiredArgsConstructor
public class NfcCardServiceImpl implements NfcCardService {

    private final AccountRepository accountRepository;
    private final LegalProfileRepository legalProfileRepository;
    private final NfcTransportDecryptor decryptor;
    private final IdNumberHasher hasher;
    private final PiiCipher piiCipher;
    private final OutboxService outboxService;
    private final NfcProperties nfcProperties;

    @Override
    @Transactional(readOnly = true)
    public void requireCanStartVerification(String accountId) {
        Account account = accountRepository
                .findById(accountId)
                .orElseThrow(() -> new AppException(ErrorCode.ACCOUNT_NOT_FOUND, accountId));
        if (legalProfileRepository.existsById(accountId)) {
            throw new AppException(ErrorCode.NFC_ALREADY_VERIFIED);
        }
        Instant now = Instant.now();
        if (isLocked(account, now)) {
            long minutes = Math.max(
                    1, Duration.between(now, account.getNfcLockedUntil()).toMinutes() + 1);
            throw new AppException(ErrorCode.NFC_LOCKED, minutes);
        }
    }

    @Override
    @Transactional
    public SubmitCardResponse verifyCard(String sessionId, String accountId, SubmitCardRequest request) {
        Account account = accountRepository
                .findByIdForUpdate(accountId)
                .orElseThrow(() -> new AppException(ErrorCode.ACCOUNT_NOT_FOUND, accountId));
        if (legalProfileRepository.existsById(accountId)) {
            return SubmitCardResponse.rejected(NfcReasonCode.SESSION_USED);
        }
        Instant now = Instant.now();
        if (account.getNfcLockedUntil() != null && !isLocked(account, now)) {
            // a finished lockout starts a fresh round of attempts
            account.setNfcLockedUntil(null);
            account.setNfcFailedAttempts(0);
        }
        if (isLocked(account, now)) {
            return SubmitCardResponse.rejected(NfcReasonCode.LOCKED, 0, account.getNfcLockedUntil());
        }

        Optional<Map<String, Object>> encrypted = decryptor.decrypt(request.encryptedFields());
        Optional<NfcCard> parsed = encrypted.flatMap(fields -> NfcCardValidator.validate(request, fields));
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

        String masked = IdNumberHasher.mask(card.idNumber());
        legalProfileRepository.save(LegalProfile.builder()
                .account(account)
                .legalName(card.legalName())
                .sex(card.sex())
                .nationality(card.nationality())
                .idNumberHash(hasher.hash(card.idNumber()))
                .idHashKeyVer(IdNumberHasher.KEY_VERSION)
                .idNumberMasked(masked)
                .idNumberEnc(piiCipher.encrypt(card.idNumber()))
                .dateOfBirthEnc(piiCipher.encrypt(card.dateOfBirth().toString()))
                .piiKeyVer(PiiCipher.KEY_VERSION)
                .nfcVerifiedAt(now)
                .build());
        account.setNfcFailedAttempts(0);
        account.setNfcLockedUntil(null);
        record(NfcVerificationEvent.verified(accountId, sessionId, masked, now));
        return SubmitCardResponse.verified();
    }

    /** Same transaction as the LegalProfile / counter change, so the event is never lost or sent for a rollback. */
    private void record(NfcVerificationEvent event) {
        outboxService.enqueue(event.eventId(), event.type().routingKey(), event);
    }

    /** AC-04.6. This account has no LegalProfile (checked above), so any match belongs to another account. */
    private boolean isLinkedElsewhere(String idNumber) {
        return legalProfileRepository.existsByIdNumberHashAndIdHashKeyVer(
                hasher.hash(idNumber), IdNumberHasher.KEY_VERSION);
    }

    /** AC-04.9: counts the attempt; the last allowed one locks verification for nfc.lockout-duration. */
    private SubmitCardResponse fail(Account account, String sessionId, NfcReasonCode reason, Instant now) {
        int attempts = account.getNfcFailedAttempts() + 1;
        if (attempts < nfcProperties.getMaxAttempts()) {
            account.setNfcFailedAttempts(attempts);
            record(NfcVerificationEvent.failed(account.getId(), sessionId, reason, now));
            return SubmitCardResponse.rejected(reason, nfcProperties.getMaxAttempts() - attempts, null);
        }
        Instant lockedUntil = now.plus(nfcProperties.getLockoutDuration());
        account.setNfcFailedAttempts(0);
        account.setNfcLockedUntil(lockedUntil);
        record(NfcVerificationEvent.locked(account.getId(), sessionId, reason, lockedUntil, now));
        return SubmitCardResponse.rejected(reason, 0, lockedUntil);
    }

    private static boolean isLocked(Account account, Instant now) {
        return account.getNfcLockedUntil() != null && now.isBefore(account.getNfcLockedUntil());
    }
}
