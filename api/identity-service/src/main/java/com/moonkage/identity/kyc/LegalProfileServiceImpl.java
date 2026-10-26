package com.moonkage.identity.kyc;

import com.moonkage.identity.account.AccountService;
import com.moonkage.identity.account.NfcLockout;
import com.moonkage.identity.common.exception.AppException;
import com.moonkage.identity.common.exception.ErrorCode;
import com.moonkage.identity.kyc.dto.request.CheckIdNumberRequest;
import com.moonkage.identity.kyc.dto.response.CheckIdNumberResponse;
import com.moonkage.identity.kyc.dto.response.NfcStatusResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Answers other services about the NFC result of an account, and hashes an ID number they hold so the pepper never
 * leaves identity-service (D-07). Flow and invariants: docs/services/identity/classes/LegalProfileServiceImpl.md.
 */
@Service
@RequiredArgsConstructor
class LegalProfileServiceImpl implements LegalProfileService {

    private final AccountService accountService;
    private final LegalProfileRepository legalProfileRepository;
    private final IdNumberHasher idNumberHasher;

    @Override
    @Transactional(readOnly = true)
    public NfcStatusResponse getNfcStatus(String accountId) {
        NfcLockout lockout = accountService.getNfcLockout(accountId);
        Optional<LegalProfile> profile = legalProfileRepository.findById(accountId);
        if (profile.isPresent()) {
            return LegalProfileMapper.toVerifiedStatus(profile.get());
        }
        NfcStatus status = lockout.isLocked(Instant.now()) ? NfcStatus.LOCKED : NfcStatus.NOT_VERIFIED;
        return LegalProfileMapper.toUnverifiedStatus(status);
    }

    /** The full number only lives in memory here: never logged, never stored (NFR-03). */
    @Override
    @Transactional(readOnly = true)
    public CheckIdNumberResponse checkIdNumber(CheckIdNumberRequest request) {
        String idNumber = normalize(request.idNumber());
        accountService.requireAccountExists(request.accountId());
        String idHash = idNumberHasher.hash(idNumber);
        String idMasked = IdNumberHasher.mask(idNumber);

        Optional<LegalProfile> profile = legalProfileRepository.findById(request.accountId());
        boolean matches = profile.isPresent()
                && equalsConstantTime(profile.get().getIdNumberHash(), idHash)
                && profile.get().getIdHashKeyVer() == IdNumberHasher.KEY_VERSION;

        return LegalProfileMapper.toIdNumberCheck(
                idHash, IdNumberHasher.KEY_VERSION, idMasked, matches, profile.orElse(null));
    }

    private static String normalize(String idNumber) {
        if (idNumber == null) {
            throw new AppException(ErrorCode.ID_NUMBER_INVALID);
        }
        String digits = idNumber.replaceAll("[^0-9]", "");
        if (digits.length() != IdCardConstant.ID_NUMBER_DIGITS) {
            throw new AppException(ErrorCode.ID_NUMBER_INVALID);
        }
        return digits;
    }

    private static boolean equalsConstantTime(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }
}
