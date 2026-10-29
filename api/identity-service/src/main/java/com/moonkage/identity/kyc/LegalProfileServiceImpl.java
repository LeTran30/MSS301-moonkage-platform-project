package com.moonkage.identity.kyc;

import com.moonkage.identity.account.AccountService;
import com.moonkage.identity.kyc.dto.request.CheckIdNumberRequest;
import com.moonkage.identity.kyc.dto.response.CheckIdNumberResponse;
import com.moonkage.identity.kyc.dto.response.NfcStatusResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
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
    private final NfcAttemptTracker attemptTracker;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public NfcStatusResponse getNfcStatus(String accountId) {
        accountService.requireAccountExists(accountId);
        Optional<LegalProfile> profile = legalProfileRepository.findById(accountId);
        if (profile.isPresent()) {
            return LegalProfileMapper.toVerifiedStatus(profile.get());
        }
        boolean locked = attemptTracker.lockoutOf(accountId).isLocked(Instant.now(clock));
        NfcStatus status = locked ? NfcStatus.LOCKED : NfcStatus.NOT_VERIFIED;
        return LegalProfileMapper.toUnverifiedStatus(status);
    }

    /** The full number only lives in memory here: never logged, never stored (NFR-03). */
    @Override
    @Transactional(readOnly = true)
    public CheckIdNumberResponse checkIdNumber(CheckIdNumberRequest request) {
        // ID_NUMBER_INVALID unless exactly 12 digits remain after the request dropped the separators
        CitizenId idNumber = CitizenId.of(request.idNumber());
        accountService.requireAccountExists(request.accountId());
        String idHash = idNumberHasher.hash(idNumber.value());
        String idMasked = IdNumberHasher.mask(idNumber.value());

        Optional<LegalProfile> profile = legalProfileRepository.findById(request.accountId());
        boolean matches = profile.isPresent()
                && equalsConstantTime(profile.get().getIdNumberHash(), idHash)
                && profile.get().getIdHashKeyVer() == IdNumberHasher.KEY_VERSION;

        return LegalProfileMapper.toIdNumberCheck(
                idHash, IdNumberHasher.KEY_VERSION, idMasked, matches, profile.orElse(null));
    }

    private static boolean equalsConstantTime(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }
}
