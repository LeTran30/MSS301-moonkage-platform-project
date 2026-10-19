package com.moonkage.identity.nfc;

import com.moonkage.identity.constant.IdCardConstant;
import com.moonkage.identity.dto.request.CheckIdNumberRequest;
import com.moonkage.identity.dto.response.CheckIdNumberResponse;
import com.moonkage.identity.dto.response.NfcStatusResponse;
import com.moonkage.identity.entity.Account;
import com.moonkage.identity.entity.LegalProfile;
import com.moonkage.identity.enums.NfcStatus;
import com.moonkage.identity.exception.AppException;
import com.moonkage.identity.exception.ErrorCode;
import com.moonkage.identity.mapper.LegalProfileMapper;
import com.moonkage.identity.repository.AccountRepository;
import com.moonkage.identity.repository.LegalProfileRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LegalProfileServiceImpl implements LegalProfileService {

    private final AccountRepository accountRepository;
    private final LegalProfileRepository legalProfileRepository;
    private final IdNumberHasher hasher;

    @Override
    @Transactional(readOnly = true)
    public NfcStatusResponse getNfcStatus(String accountId) {
        Account account = getAccount(accountId);
        Optional<LegalProfile> profile = legalProfileRepository.findById(accountId);
        if (profile.isPresent()) {
            return LegalProfileMapper.toVerifiedStatus(profile.get());
        }
        NfcStatus status = account.isNfcLocked(Instant.now()) ? NfcStatus.LOCKED : NfcStatus.NOT_VERIFIED;
        return LegalProfileMapper.toUnverifiedStatus(status);
    }

    /** The full number only lives in memory here: never logged, never stored (NFR-03). */
    @Override
    @Transactional(readOnly = true)
    public CheckIdNumberResponse checkIdNumber(CheckIdNumberRequest request) {
        String idNumber = normalizeIdNumber(request.idNumber());
        if (!accountRepository.existsById(request.accountId())) {
            throw new AppException(ErrorCode.ACCOUNT_NOT_FOUND, request.accountId());
        }

        String idHash = hasher.hash(idNumber);
        Optional<LegalProfile> owner = legalProfileRepository.findById(request.accountId());
        boolean matches = owner.isPresent() && hashEquals(idHash, owner.get().getIdNumberHash());

        return LegalProfileMapper.toIdNumberCheck(
                idHash, IdNumberHasher.KEY_VERSION, IdNumberHasher.mask(idNumber), matches, owner.orElse(null));
    }

    private Account getAccount(String accountId) {
        return accountRepository
                .findById(accountId)
                .orElseThrow(() -> new AppException(ErrorCode.ACCOUNT_NOT_FOUND, accountId));
    }

    /** Digits only, so "079 123 456 789" is the same number; anything but 12 digits is ID_NUMBER_INVALID. */
    private static String normalizeIdNumber(String idNumber) {
        String digits = idNumber.replaceAll(IdCardConstant.NON_DIGIT_PATTERN, "");
        if (digits.length() != IdCardConstant.ID_NUMBER_DIGITS) {
            throw new AppException(ErrorCode.ID_NUMBER_INVALID);
        }
        return digits;
    }

    /** Same pepper, same fingerprint: equal hashes mean the same ID number. Constant time, no timing leak. */
    private static boolean hashEquals(String hash, String otherHash) {
        return MessageDigest.isEqual(
                hash.getBytes(StandardCharsets.US_ASCII), otherHash.getBytes(StandardCharsets.US_ASCII));
    }
}
