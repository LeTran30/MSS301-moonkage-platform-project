package com.moonkage.identity.service.impl;

import com.moonkage.identity.constant.IdCardConstant;
import com.moonkage.identity.crypto.IdNumberHasher;
import com.moonkage.identity.dto.request.IdNumberCheckRequest;
import com.moonkage.identity.dto.response.IdNumberCheckResponse;
import com.moonkage.identity.dto.response.NfcStatusResponse;
import com.moonkage.identity.entity.Account;
import com.moonkage.identity.entity.LegalProfile;
import com.moonkage.identity.enums.NfcStatus;
import com.moonkage.identity.exception.AppException;
import com.moonkage.identity.exception.ErrorCode;
import com.moonkage.identity.mapper.LegalProfileMapper;
import com.moonkage.identity.repository.AccountRepository;
import com.moonkage.identity.repository.LegalProfileRepository;
import com.moonkage.identity.service.LegalProfileService;
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
        Account account = accountRepository
                .findById(accountId)
                .orElseThrow(() -> new AppException(ErrorCode.ACCOUNT_NOT_FOUND, accountId));
        Optional<LegalProfile> profile = legalProfileRepository.findById(accountId);
        if (profile.isPresent()) {
            return LegalProfileMapper.toVerifiedStatus(profile.get());
        }
        boolean locked = account.getNfcLockedUntil() != null && Instant.now().isBefore(account.getNfcLockedUntil());
        return LegalProfileMapper.toUnverifiedStatus(locked ? NfcStatus.LOCKED : NfcStatus.NOT_VERIFIED);
    }

    /** The full number only lives in memory here: never logged, never stored (NFR-03). */
    @Override
    @Transactional(readOnly = true)
    public IdNumberCheckResponse checkIdNumber(IdNumberCheckRequest request) {
        // keep digits only, so "079 123 456 789" is the same number
        String idNumber = request.idNumber().replaceAll(IdCardConstant.NON_DIGIT_PATTERN, "");
        if (idNumber.length() != IdCardConstant.ID_NUMBER_DIGITS) {
            throw new AppException(ErrorCode.ID_NUMBER_INVALID);
        }
        if (!accountRepository.existsById(request.accountId())) {
            throw new AppException(ErrorCode.ACCOUNT_NOT_FOUND, request.accountId());
        }
        String idHash = hasher.hash(idNumber);
        String idMasked = IdNumberHasher.mask(idNumber);
        LegalProfile owner =
                legalProfileRepository.findById(request.accountId()).orElse(null);
        // same pepper, same fingerprint: equal hashes mean the same ID number
        boolean matches = owner != null
                && MessageDigest.isEqual(
                        idHash.getBytes(StandardCharsets.US_ASCII),
                        owner.getIdNumberHash().getBytes(StandardCharsets.US_ASCII));
        return LegalProfileMapper.toIdNumberCheck(idHash, IdNumberHasher.KEY_VERSION, idMasked, matches, owner);
    }
}
